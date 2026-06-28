import type { UserRole } from "@manzil/shared";

export type ManzilActor = {
  userId: string;
  role: UserRole;
  clerkId?: string;
};

export type ManzilRequest = {
  headers: Record<string, string | string[] | undefined>;
  manzilActor?: ManzilActor;
};
