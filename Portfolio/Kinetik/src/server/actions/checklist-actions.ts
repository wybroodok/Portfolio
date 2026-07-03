"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import { POSITION_STEP } from "@/lib/positioning";

/** Assert the task belongs to the caller's workspace; returns nothing or throws. */
async function assertTaskInWorkspace(workspaceId: string, taskId: string) {
  await requireMembership(workspaceId);
  const task = await db.task.findFirst({ where: { id: taskId, workspaceId }, select: { id: true } });
  if (!task) throw new Error("NOT_FOUND");
}

const addSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  content: z.string().min(1).max(500),
});

export async function addChecklistItem(input: z.infer<typeof addSchema>) {
  const { workspaceId, taskId, content } = addSchema.parse(input);
  await assertTaskInWorkspace(workspaceId, taskId);

  const last = await db.checklistItem.findFirst({
    where: { taskId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const item = await db.checklistItem.create({
    data: { taskId, content, position: (last?.position ?? 0) + POSITION_STEP },
  });
  revalidatePath(`/w/${workspaceId}/board`);
  return item;
}

const toggleSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  itemId: z.string().min(1),
  done: z.boolean(),
});

export async function toggleChecklistItem(input: z.infer<typeof toggleSchema>) {
  const { workspaceId, taskId, itemId, done } = toggleSchema.parse(input);
  await assertTaskInWorkspace(workspaceId, taskId);
  // Привязываем к taskId (проверенному в воркспейсе), иначе можно переключить
  // чеклист-элемент чужого таска в другом воркспейсе (IDOR).
  const res = await db.checklistItem.updateMany({ where: { id: itemId, taskId }, data: { done } });
  if (res.count === 0) throw new Error("NOT_FOUND");
  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}

const deleteSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  itemId: z.string().min(1),
});

export async function deleteChecklistItem(input: z.infer<typeof deleteSchema>) {
  const { workspaceId, taskId, itemId } = deleteSchema.parse(input);
  await assertTaskInWorkspace(workspaceId, taskId);
  // deleteMany с taskId-скоупом: нельзя удалить элемент чужого таска (IDOR).
  const res = await db.checklistItem.deleteMany({ where: { id: itemId, taskId } });
  if (res.count === 0) throw new Error("NOT_FOUND");
  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}
