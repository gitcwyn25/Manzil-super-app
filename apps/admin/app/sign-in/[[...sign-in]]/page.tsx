import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <div className="mb-6">
          <span className="text-lg font-bold tracking-tight">Manzil</span>
          <span className="ml-2 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
            Admin
          </span>
          <p className="mt-2 text-sm text-muted">Authorized operators only.</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
