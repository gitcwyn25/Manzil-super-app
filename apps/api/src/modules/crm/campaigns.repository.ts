import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { CampaignChannel, CampaignTrigger } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import type { AuthActor } from "../repositories/database.repository";
import { requireOwnedBusiness } from "./business-ownership.util";
import { CampaignsService } from "./campaigns.service";
import { SegmentsRepository, type SegmentKey } from "./segments.repository";

/** Which segment each trigger targets. Fixed, so a trigger cannot be pointed at the wrong audience. */
const TRIGGER_SEGMENT: Record<CampaignTrigger, SegmentKey> = {
  welcome: "new",
  win_back: "lapsed",
  birthday: "birthday_this_month",
  review_request: "new"
};

@Injectable()
export class CampaignsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: CampaignsService,
    private readonly segments: SegmentsRepository
  ) {}

  async listCampaigns(slug: string, actor: AuthActor) {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    const campaigns = await this.prisma.campaign.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { sends: true } },
        sends: { select: { status: true } }
      }
    });

    return campaigns.map((campaign) => {
      const byStatus = campaign.sends.reduce<Record<string, number>>((acc, send) => {
        acc[send.status] = (acc[send.status] ?? 0) + 1;
        return acc;
      }, {});

      return {
        id: campaign.id,
        name: campaign.name,
        trigger: campaign.trigger,
        channel: campaign.channel,
        template: campaign.template,
        windowDays: campaign.windowDays,
        isActive: campaign.isActive,
        // Surfaced so an owner can see the provider is missing rather than
        // wondering why an active campaign never delivers anything.
        channelConfigured: this.campaigns.isChannelConfigured(campaign.channel),
        totalSends: campaign._count.sends,
        sendsByStatus: byStatus,
        createdAt: campaign.createdAt.toISOString()
      };
    });
  }

  async createCampaign(
    slug: string,
    input: {
      name: string;
      trigger: CampaignTrigger;
      channel: CampaignChannel;
      template: string;
      windowDays?: number;
    },
    actor: AuthActor
  ) {
    const business = await requireOwnedBusiness(this.prisma, slug, actor);

    if (input.trigger === "win_back" && !input.windowDays) {
      throw new BadRequestException("win_back campaigns require windowDays");
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        businessId: business.id,
        name: input.name.trim(),
        trigger: input.trigger,
        channel: input.channel,
        template: input.template,
        windowDays: input.windowDays ?? null,
        // Never active on creation. Activating is a separate, deliberate act —
        // a campaign that starts sending the moment it is saved is how an owner
        // accidentally messages their whole customer list.
        isActive: false
      }
    });

    return { id: campaign.id, name: campaign.name, isActive: campaign.isActive };
  }

  async setCampaignActive(campaignId: string, isActive: boolean, actor: AuthActor) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { business: { select: { slug: true } } }
    });

    if (!campaign) throw new NotFoundException("Campaign not found");

    await requireOwnedBusiness(this.prisma, campaign.business.slug, actor);

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { isActive }
    });

    return { id: updated.id, isActive: updated.isActive };
  }

  /**
   * Runs one campaign now.
   *
   * Manual rather than scheduled for this milestone: a cron that messages real
   * customers should not ship before a provider is configured and the legal
   * review in CampaignsService is closed out. The evaluation, consent gate, and
   * audit trail are all exercised by this path, so wiring a scheduler later is
   * a trigger change, not a rewrite.
   */
  async runCampaign(campaignId: string, actor: AuthActor) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { business: { select: { id: true, slug: true, name: true } } }
    });

    if (!campaign) throw new NotFoundException("Campaign not found");

    await requireOwnedBusiness(this.prisma, campaign.business.slug, actor);

    if (!campaign.isActive) {
      throw new BadRequestException("Activate the campaign before running it");
    }

    const targets = await this.segments.resolveTargets(
      campaign.business.id,
      TRIGGER_SEGMENT[campaign.trigger]
    );

    const results = await this.campaigns.run(campaign, targets, campaign.business.name);

    return { campaignId, candidates: targets.length, ...results };
  }

  /** Send history for one campaign, including everything that was withheld and why. */
  async getCampaignSends(campaignId: string, actor: AuthActor) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { business: { select: { slug: true } } }
    });

    if (!campaign) throw new NotFoundException("Campaign not found");

    await requireOwnedBusiness(this.prisma, campaign.business.slug, actor);

    const sends = await this.prisma.campaignSend.findMany({
      where: { campaignId },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { customer: { select: { name: true, phone: true } } }
    });

    return sends.map((send) => ({
      id: send.id,
      customerName: send.customer.name,
      customerPhone: send.customer.phone,
      status: send.status,
      channel: send.channel,
      consentAtSend: send.consentAtSend,
      error: send.error,
      createdAt: send.createdAt.toISOString(),
      sentAt: send.sentAt?.toISOString() ?? null
    }));
  }
}
