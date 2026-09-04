import { Megaphone } from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { SystemState } from "@/components/data-display/system-state";
import { PageHeader } from "@/lib/ui";
import { getMe } from "@/lib/console";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Campaigns" subtitle="Approve audience, consent, copy, and provider state before growth leaves the console." />
      <SystemState
        icon={Megaphone}
        title="Campaign approval lane"
        description="Campaign creation, approval, and sending are separate decisions. Every message needs a consent source, audience definition, locale, template version, and delivery outcome."
        detail="The current Campaign model supports triggers and sends but not an admin approval state machine or evidence-first send gate. This screen intentionally stays read-only until approval and delivery contracts exist."
        contract="GET /console/campaigns/review\nPOST /console/campaigns/:id/approve\nPOST /console/campaigns/:id/send"
        backHref="/"
        backLabel="Return to Today"
      />
    </div>
  );
}
