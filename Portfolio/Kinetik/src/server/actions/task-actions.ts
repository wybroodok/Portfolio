"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import {
  getPositionBetween,
  needsRebalance,
  rebalancedPositions,
} from "@/lib/positioning";
import { TaskStatus, TaskPriority } from "@prisma/client";

// ──────────────────────────────────────────────────────────────
// moveTask — called on every drag-and-drop drop.
//
// The client sends the task's *destination*: the target column and the ids of
// the cards it was dropped between (`beforeTaskId` above, `afterTaskId` below;
// either may be null at a column edge). The server looks up those neighbours'
// positions and writes the midpoint — so a move updates ONE row.
// ──────────────────────────────────────────────────────────────

const moveSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  toStatus: z.nativeEnum(TaskStatus),
  beforeTaskId: z.string().nullable(), // card directly ABOVE the drop slot
  afterTaskId: z.string().nullable(), // card directly BELOW the drop slot
});

export type MoveTaskInput = z.infer<typeof moveSchema>;

export async function moveTask(input: MoveTaskInput) {
  const { workspaceId, taskId, toStatus, beforeTaskId, afterTaskId } =
    moveSchema.parse(input);

  // Tenant guard: the caller must belong to this workspace.
  await requireMembership(workspaceId);

  await db.$transaction(async (tx) => {
    // The task must live in this workspace (prevents cross-tenant moves).
    const task = await tx.task.findFirst({
      where: { id: taskId, workspaceId },
      select: { id: true },
    });
    if (!task) throw new Error("NOT_FOUND: task not in workspace");

    // Resolve neighbour positions. We re-read from the DB rather than trusting
    // client-sent numbers, so concurrent edits can't corrupt ordering.
    const [before, after] = await Promise.all([
      beforeTaskId
        ? tx.task.findFirst({
            where: { id: beforeTaskId, workspaceId, status: toStatus },
            select: { position: true },
          })
        : null,
      afterTaskId
        ? tx.task.findFirst({
            where: { id: afterTaskId, workspaceId, status: toStatus },
            select: { position: true },
          })
        : null,
    ]);

    const prev = before?.position ?? null;
    const next = after?.position ?? null;

    if (needsRebalance(prev, next)) {
      // Rare: the gap has collapsed below float precision. Renumber the whole
      // destination column with even spacing, inserting the moved card at slot.
      const column = await tx.task.findMany({
        where: { status: toStatus, workspaceId, id: { not: taskId } },
        orderBy: { position: "asc" },
        select: { id: true },
      });

      const insertAt = afterTaskId
        ? column.findIndex((t) => t.id === afterTaskId)
        : column.length;
      const orderedIds = [
        ...column.slice(0, insertAt).map((t) => t.id),
        taskId,
        ...column.slice(insertAt).map((t) => t.id),
      ];
      const positions = rebalancedPositions(orderedIds.length);

      await Promise.all(
        orderedIds.map((id, i) =>
          tx.task.update({
            where: { id },
            data: { position: positions[i], ...(id === taskId ? { status: toStatus } : {}) },
          }),
        ),
      );
      return;
    }

    // Fast path: one row updated.
    await tx.task.update({
      where: { id: taskId },
      data: { status: toStatus, position: getPositionBetween(prev, next) },
    });
  });

  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}

// ──────────────────────────────────────────────────────────────
// createTask — "Кнопка создания задачи"
// ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(20_000).optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.BACKLOG),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

/** Ensure every user id is a member of the workspace (else throw). */
async function assertMembers(workspaceId: string, userIds: string[]) {
  if (userIds.length === 0) return;
  const count = await db.member.count({
    where: { workspaceId, userId: { in: userIds } },
  });
  if (count !== new Set(userIds).size) {
    throw new Error("VALIDATION: an assignee is not a workspace member");
  }
}

export async function createTask(input: z.input<typeof createSchema>) {
  const data = createSchema.parse(input);
  const { userId } = await requireMembership(data.workspaceId);

  // New card goes to the bottom of its column: last position + step.
  const last = await db.task.findFirst({
    where: { workspaceId: data.workspaceId, status: data.status },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const assigneeIds = data.assigneeIds ?? [];
  await assertMembers(data.workspaceId, assigneeIds);

  const task = await db.task.create({
    data: {
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description ?? null,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      creatorId: userId,
      position: getPositionBetween(last?.position ?? null, null),
      assignees: { create: assigneeIds.map((uid) => ({ userId: uid })) },
    },
  });

  revalidatePath(`/w/${data.workspaceId}/board`);
  return task;
}

// ──────────────────────────────────────────────────────────────
// setAssignees — replace the full set of assignees on a task
// ──────────────────────────────────────────────────────────────

const setAssigneesSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  userIds: z.array(z.string()),
});

export async function setAssignees(input: z.infer<typeof setAssigneesSchema>) {
  const { workspaceId, taskId, userIds } = setAssigneesSchema.parse(input);
  await requireMembership(workspaceId);

  const task = await db.task.findFirst({ where: { id: taskId, workspaceId }, select: { id: true } });
  if (!task) throw new Error("NOT_FOUND");
  await assertMembers(workspaceId, userIds);

  // Replace the set: clearing reminderSentAt so new assignees get reminders.
  await db.$transaction([
    db.taskAssignee.deleteMany({ where: { taskId } }),
    db.taskAssignee.createMany({ data: userIds.map((uid) => ({ taskId, userId: uid })) }),
    db.task.update({ where: { id: taskId }, data: { reminderSentAt: null } }),
  ]);

  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}

// ──────────────────────────────────────────────────────────────
// addComment — feedback inside the task modal
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// updateTask — edit fields from the card detail modal
// ──────────────────────────────────────────────────────────────

const updateSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(20_000).nullable().optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export async function updateTask(input: z.infer<typeof updateSchema>) {
  const data = updateSchema.parse(input);
  await requireMembership(data.workspaceId);

  const task = await db.task.findFirst({
    where: { id: data.taskId, workspaceId: data.workspaceId },
    select: { id: true },
  });
  if (!task) throw new Error("NOT_FOUND");

  await db.task.update({
    where: { id: data.taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null, reminderSentAt: null }
        : {}),
    },
  });

  revalidatePath(`/w/${data.workspaceId}/board`);
  return { ok: true as const };
}

// ──────────────────────────────────────────────────────────────
// deleteTask — remove a card (cascades comments/labels/checklist/files)
// ──────────────────────────────────────────────────────────────

export async function deleteTask(workspaceId: string, taskId: string) {
  await requireMembership(workspaceId);
  const task = await db.task.findFirst({
    where: { id: taskId, workspaceId },
    select: { id: true },
  });
  if (!task) throw new Error("NOT_FOUND");

  await db.task.delete({ where: { id: taskId } });
  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}

// ──────────────────────────────────────────────────────────────
// loadTaskDetail — everything the detail modal needs (called on open)
// ──────────────────────────────────────────────────────────────

export async function loadTaskDetail(workspaceId: string, taskId: string) {
  await requireMembership(workspaceId);

  const [task, allLabels, members] = await Promise.all([
    db.task.findFirst({
      where: { id: taskId, workspaceId },
      include: {
        assignees: true,
        labels: { include: { label: true } },
        checklist: { orderBy: { position: "asc" } },
        attachments: { orderBy: { createdAt: "asc" } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, image: true } } },
        },
      },
    }),
    db.label.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    db.member.findMany({
      where: { workspaceId },
      select: { user: { select: { id: true, name: true, image: true } } },
    }),
  ]);
  if (!task) throw new Error("NOT_FOUND");

  return {
    detail: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeIds: task.assignees.map((a) => a.userId),
      labels: task.labels.map((l) => ({ id: l.label.id, name: l.label.name, color: l.label.color })),
      checklist: task.checklist.map((c) => ({ id: c.id, content: c.content, done: c.done })),
      attachments: task.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        size: a.size,
        mimeType: a.mimeType,
      })),
      comments: task.comments.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt.toISOString(),
        author: c.author,
      })),
    },
    allLabels: allLabels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
    members: members.map((m) => m.user),
  };
}

const commentSchema = z.object({
  workspaceId: z.string().min(1),
  taskId: z.string().min(1),
  body: z.string().min(1).max(10_000),
});

export async function addComment(input: z.infer<typeof commentSchema>) {
  const { workspaceId, taskId, body } = commentSchema.parse(input);
  const { userId } = await requireMembership(workspaceId);

  // Ensure the task is in the caller's workspace before commenting.
  const task = await db.task.findFirst({
    where: { id: taskId, workspaceId },
    select: { id: true },
  });
  if (!task) throw new Error("NOT_FOUND");

  const comment = await db.comment.create({
    data: { taskId, authorId: userId, body },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  revalidatePath(`/w/${workspaceId}/board`);
  return comment;
}
