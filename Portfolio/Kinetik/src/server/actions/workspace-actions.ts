"use server";

import { z } from "zod";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireMembership } from "@/lib/tenant";
import { MemberRole, WorkspaceType } from "@prisma/client";
import { revalidatePath as revalidate } from "next/cache";

/** Create a workspace (board) and make the creator its OWNER. */
const createWsSchema = z.object({
  name: z.string().min(1).max(60),
  type: z.nativeEnum(WorkspaceType).default(WorkspaceType.TEAM),
});

export async function createWorkspace(input: z.input<typeof createWsSchema>) {
  const { name, type } = createWsSchema.parse(input);
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${randomUUID().slice(0, 6)}`;

  const workspace = await db.workspace.create({
    data: {
      name,
      slug,
      type,
      members: { create: { userId: session.user.id, role: MemberRole.OWNER } },
    },
  });
  revalidate("/w", "layout");
  return { slug: workspace.slug };
}

/**
 * "Добавить сотрудника" — create an invite and return a shareable link.
 * Only OWNER/ADMIN may invite.
 */
const inviteSchema = z.object({
  workspaceId: z.string().min(1),
  email: z.string().email(),
  role: z.nativeEnum(MemberRole).default(MemberRole.MEMBER),
});

export async function inviteMember(input: z.input<typeof inviteSchema>) {
  const { workspaceId, email, role } = inviteSchema.parse(input);
  const { userId, member } = await requireMembership(workspaceId);
  if (member.role === MemberRole.MEMBER) {
    throw new Error("FORBIDDEN: only owners/admins can invite");
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await db.invite.upsert({
    where: { workspaceId_email: { workspaceId, email } },
    create: { workspaceId, email, role, invitedById: userId, expiresAt },
    update: { role, expiresAt, acceptedAt: null, token: randomUUID() },
  });

  revalidatePath(`/w`);
  // Caller emails this link or copies it to the clipboard.
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`;
  return { link, email };
}

/** Accept an invite link → create the Member row for the current user. */
export async function acceptInvite(token: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");

  const invite = await db.invite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new Error("INVALID_INVITE");
  }

  await db.$transaction([
    db.member.upsert({
      where: { userId_workspaceId: { userId: session.user.id, workspaceId: invite.workspaceId } },
      create: { userId: session.user.id, workspaceId: invite.workspaceId, role: invite.role },
      update: {},
    }),
    db.invite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);

  const ws = await db.workspace.findUnique({ where: { id: invite.workspaceId }, select: { slug: true } });
  return { slug: ws!.slug };
}
