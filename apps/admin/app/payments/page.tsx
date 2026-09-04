import { CreditCard } from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { SystemState } from "@/components/data-display/system-state";
import { PageHeader } from "@/lib/ui";
import { getMe } from "@/lib/console";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const me = await getMe();
  if (!me) return <AccessDenied />;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Payment exceptions" subtitle="Read provider truth and reconcile discrepancies without granting entitlement by hand." />
      <SystemState
        icon={CreditCard}
        title="Read-only reconciliation lane"
        description="Payment events should be reviewed when provider state, invoice state, and Manzil entitlement state disagree. The operator should see the evidence, not a dangerous manual override button."
        detail="The current schema has provider payment records, but the console does not yet expose a permissioned reconciliation queue, webhook event history, retry state, or an entitlement-safe transition contract. No amounts or payment statuses are invented here."
        contract="GET /console/payments/exceptions\nPOST /console/payments/:id/reconcile\nGET /console/payments/:id/events"
        backHref="/"
        backLabel="Return to Today"
      />
    </div>
  );
}
