import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Member } from "@prisma/client";

/**
 * Tenant guard. Resolves the current session and asserts that the user is a
 * member of `workspaceId`. Every Server Action / query that touches tenant data
 * MUST go through this so a user of workspace A can never mutate workspace B.
 */
export async function requireMembership(workspaceId: string): Promise<{
  userId: string;
  member: Member;
}> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");

  const member = await db.member.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId } },
  });
  if (!member) throw new Error("FORBIDDEN: not a member of this workspace");

  return { userId: session.user.id, member };
}
