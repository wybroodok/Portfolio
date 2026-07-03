"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import { LABEL_COLOR_KEYS } from "@/lib/labels";

const createSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1).max(40),
  color: z.enum(LABEL_COLOR_KEYS as [string, ...string[]]).default("neutral"),
});

/** Create a workspace label (or return the existing one with that name). */
export async function createLabel(input: z.infer<typeof createSchema>) {
  const { workspaceId, name, color } = createSchema.parse(input);
  await requireMembership(workspaceId);

  const label = await db.label.upsert({
    where: { workspaceId_name: { workspaceId, name } },
    create: { workspaceId, name, color },
    update: { color },
  });
  revalidatePath(`/w/${workspaceId}/board`);
  return label;
}

const attachSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  labelId: z.string().min(1),
});

export async function attachLabel(input: z.infer<typeof attachSchema>) {
  const { workspaceId, taskId, labelId } = attachSchema.parse(input);
  await requireMembership(workspaceId);

  // Both task and label must belong to this workspace (no cross-tenant linking).
  const [task, label] = await Promise.all([
    db.task.findFirst({ where: { id: taskId, workspaceId }, select: { id: true } }),
    db.label.findFirst({ where: { id: labelId, workspaceId }, select: { id: true } }),
  ]);
  if (!task || !label) throw new Error("NOT_FOUND");

  await db.taskLabel.upsert({
    where: { taskId_labelId: { taskId, labelId } },
    create: { taskId, labelId },
    update: {},
  });
  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}

export async function detachLabel(input: z.infer<typeof attachSchema>) {
  const { workspaceId, taskId, labelId } = attachSchema.parse(input);
  await requireMembership(workspaceId);
  await db.taskLabel.deleteMany({ where: { taskId, labelId, task: { workspaceId } } });
  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}
