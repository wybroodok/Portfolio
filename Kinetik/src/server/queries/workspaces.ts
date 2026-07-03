import { db } from "@/lib/db";
import type { WorkspaceType } from "@prisma/client";

export interface WorkspaceListItem {
  id: string;
  name: string;
  slug: string;
  type: WorkspaceType;
}

/** All boards the user belongs to — powers the workspace switcher. */
export async function listMyWorkspaces(userId: string): Promise<WorkspaceListItem[]> {
  const members = await db.member.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      workspace: { select: { id: true, name: true, slug: true, type: true } },
    },
  });
  return members.map((m) => m.workspace);
}

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

/** Members of a workspace with role + email — powers the "Команда" panel. */
export async function getTeam(workspaceId: string): Promise<TeamMember[]> {
  const members = await db.member.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    image: m.user.image,
    role: m.role,
  }));
}
