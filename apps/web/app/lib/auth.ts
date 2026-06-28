import { auth } from "@clerk/nextjs/server";

function usesDevAuthFallback() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.MANZIL_DEV_AUTH !== "false" &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}

export async function getServerAuthHeaders(path?: string): Promise<Record<string, string>> {
  const { getToken } = await auth();
  const token = await getToken();

  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  if (usesDevAuthFallback() && path?.startsWith("/admin")) {
    return {
      "x-manzil-role": "admin",
      "x-manzil-user-id": "dev-admin"
    };
  }

  return {};
}
