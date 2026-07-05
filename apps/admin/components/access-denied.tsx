import { SignOutButton } from "@clerk/nextjs";

export function AccessDenied({ missing }: { missing?: string }) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <div className="card p-8">
        <h1 className="text-lg font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm text-muted">
          {missing
            ? `This page requires the '${missing}' permission, which your account does not have.`
            : "This console is available to authorized Manzil administrators only. Your account is not an active admin."}
        </p>
        <div className="mt-5">
          <SignOutButton>
            <button className="btn-ghost">Sign out</button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}
