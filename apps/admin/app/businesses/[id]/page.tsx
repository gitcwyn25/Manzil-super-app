import Link from "next/link";
import { consoleGet, getMe } from "@/lib/console";
import { Badge, PageHeader, StatusBadge, timeAgo } from "@/lib/ui";
import { AccessDenied } from "@/components/access-denied";
import { ActionButton } from "@/components/action-button";
import { BusinessEditor } from "@/components/business-editor";
import {
  approveBusiness,
  moderatePhoto,
  rejectBusiness,
  toggleBusinessFeatured
} from "@/lib/actions";

export const dynamic = "force-dynamic";

type BusinessDetail = {
  business: {
    id: string;
    slug: string;
    name: string;
    categoryName: string;
    descriptionUz: string;
    address: string;
    district: string;
    city: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    instagram: string | null;
    telegram: string | null;
    legalName: string | null;
    taxId: string | null;
    priceTier: string | null;
    status: string;
    verificationStatus: string;
    featured: boolean;
    claimedAt: string | null;
    createdAt: string;
    avgRating: number;
    reviewCount: number;
    owner: { id: string; displayName: string; email: string | null; phone: string | null } | null;
    subscription: { plan: string; status: string; renewsAt: string | null } | null;
  };
  pendingPhotos: Array<{
    id: string;
    publicUrl: string | null;
    storageKey: string;
    isReviewPhoto: boolean;
    createdAt: string;
  }>;
  legal: {
    acceptances: Array<{
      id: string;
      kind: string;
      version: string;
      locale: string;
      title: string;
      acceptedAt: string;
      acceptedBy: string;
      ipAddress: string | null;
    }>;
    contracts: Array<{
      id: string;
      contractNo: string;
      templateVersion: string;
      generatedAt: string;
      hasFile: boolean;
    }>;
  };
  activity: {
    visitCount: number;
    bookingCount: number;
    reviewCount: number;
    customerCount: number;
  };
};

export default async function BusinessDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const me = await getMe();
  if (!me) return <AccessDenied />;
  if (!me.permissions.includes("business.view")) return <AccessDenied />;

  const res = await consoleGet<BusinessDetail>(`/businesses/${id}/detail`);

  if (!res.ok) {
    return (
      <>
        <PageHeader title="Business" subtitle="Detail" />
        <p className="text-sm text-bad">{res.error}</p>
      </>
    );
  }

  const { business, pendingPhotos, legal, activity } = res.data;
  const canEdit = me.permissions.includes("business.edit");
  const canModerateMedia = me.permissions.includes("media.approve");
  const canViewLegal = me.permissions.includes("legal.view");

  return (
    <>
      <PageHeader
        title={business.name}
        subtitle={`${business.categoryName} · ${business.district}, ${business.city}`}
        actions={
          <div className="flex items-center gap-2">
            <Link className="btn-ghost btn-xs" href="/businesses">
              ← All businesses
            </Link>
            {canEdit ? (
              <ActionButton
                action={toggleBusinessFeatured}
                id={business.id}
                label={business.featured ? "Unfeature" : "Feature"}
                variant={business.featured ? "ghost" : "primary"}
                extraFields={{ featured: business.featured ? "false" : "true" }}
              />
            ) : null}
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <StatusBadge kind="business" value={business.status} />
        <Badge tone={business.verificationStatus === "verified" ? "good" : "muted"}>
          {business.verificationStatus}
        </Badge>
        {business.featured ? <Badge tone="brand">featured</Badge> : null}
        <span className="text-xs text-muted">
          {business.claimedAt ? `claimed ${timeAgo(business.claimedAt)}` : "never claimed"} · listed{" "}
          {timeAgo(business.createdAt)}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Visits", value: activity.visitCount },
          { label: "Bookings", value: activity.bookingCount },
          { label: "Reviews", value: activity.reviewCount },
          { label: "Customers", value: activity.customerCount }
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="text-3xl font-semibold tabular-nums">{stat.value}</div>
            <div className="mt-1 text-sm text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold">Contact & profile</h2>
          {canEdit ? (
            <BusinessEditor business={business} />
          ) : (
            <dl className="space-y-2 text-sm">
              {[
                ["Address", business.address],
                ["Phone", business.phone],
                ["Email", business.email],
                ["Website", business.website]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted">{label}</dt>
                  <dd>{value ?? "—"}</dd>
                </div>
              ))}
              <p className="pt-2 text-xs text-muted">
                You do not have the &apos;business.edit&apos; permission.
              </p>
            </dl>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold">Ownership & plan</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Owner</dt>
              <dd>{business.owner?.displayName ?? "Unclaimed"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Owner contact</dt>
              <dd>{business.owner?.email ?? business.owner?.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Legal name</dt>
              <dd>{business.legalName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">STIR / INN</dt>
              <dd className="tabular-nums">{business.taxId ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Plan</dt>
              <dd>
                {business.subscription
                  ? `${business.subscription.plan} (${business.subscription.status})`
                  : "free"}
              </dd>
            </div>
          </dl>

          {business.status === "pending_claim" ? (
            <div className="mt-4 flex gap-2 border-t border-border pt-4">
              {me.permissions.includes("business.approve") ? (
                <ActionButton
                  action={approveBusiness}
                  id={business.id}
                  label="Approve"
                  variant="primary"
                />
              ) : null}
              {me.permissions.includes("business.reject") ? (
                <ActionButton
                  action={rejectBusiness}
                  id={business.id}
                  label="Reject"
                  variant="danger"
                  reason
                />
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold">
            Pending photos{pendingPhotos.length > 0 ? ` (${pendingPhotos.length})` : ""}
          </h2>
          {pendingPhotos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing awaiting moderation.</p>
          ) : !canModerateMedia ? (
            <p className="text-sm text-muted">
              {pendingPhotos.length} pending — you do not have the &apos;media.approve&apos; permission.
            </p>
          ) : (
            <ul className="space-y-3">
              {pendingPhotos.map((photo) => (
                <li key={photo.id} className="flex items-center gap-3">
                  {/* Storage key rather than an inline thumbnail: pending media
                      is unmoderated by definition, so it is never rendered
                      automatically in the console — a moderator opens it
                      deliberately via the View link. */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{photo.storageKey}</p>
                    <p className="text-xs text-muted">
                      {photo.isReviewPhoto ? "review photo" : "business photo"} ·{" "}
                      {timeAgo(photo.createdAt)}
                    </p>
                  </div>
                  {photo.publicUrl ? (
                    <a
                      className="btn-ghost btn-xs"
                      href={photo.publicUrl}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      View
                    </a>
                  ) : null}
                  <ActionButton
                    action={moderatePhoto}
                    id={photo.id}
                    label="Approve"
                    variant="primary"
                    extraFields={{
                      photoId: photo.id,
                      businessId: business.id,
                      decision: "approve"
                    }}
                  />
                  <ActionButton
                    action={moderatePhoto}
                    id={photo.id}
                    label="Reject"
                    variant="danger"
                    reason
                    extraFields={{
                      photoId: photo.id,
                      businessId: business.id,
                      decision: "reject"
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 text-sm font-semibold">Legal & contracts</h2>
          {!canViewLegal ? (
            <p className="text-sm text-muted">
              You do not have the &apos;legal.view&apos; permission.
            </p>
          ) : legal.acceptances.length === 0 && legal.contracts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No accepted documents. Businesses registered before terms acceptance shipped will show
              nothing here.
            </p>
          ) : (
            <div className="space-y-4">
              {legal.acceptances.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Accepted documents
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {legal.acceptances.map((acceptance) => (
                      <li key={acceptance.id} className="flex justify-between gap-3">
                        <span>
                          {acceptance.kind.replace(/_/g, " ")} v{acceptance.version} (
                          {acceptance.locale})
                        </span>
                        <span className="text-muted">
                          {acceptance.acceptedBy} · {timeAgo(acceptance.acceptedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {legal.contracts.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                    Contracts
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {legal.contracts.map((contract) => (
                      <li key={contract.id} className="flex justify-between gap-3">
                        <span className="tabular-nums">{contract.contractNo}</span>
                        <span className="text-muted">
                          template v{contract.templateVersion} · {timeAgo(contract.generatedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
