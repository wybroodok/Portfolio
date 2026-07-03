"use server";

import { db } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import { NotificationType } from "@prisma/client";

export interface NotificationView {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  task: { id: string; title: string; dueDate: string | null };
}

const DUE_SOON_WINDOW_MS = 24 * 60 * 60 * 1000; // remind within 24h of the deadline

/**
 * Poll endpoint for reminders. On each call it (1) generates due-date
 * notifications for the current user's tasks and (2) returns the unread ones.
 *
 * Generation is idempotent: the unique (userId, taskId, type) constraint means a
 * task produces at most one DUE_SOON and one OVERDUE notification — no spam, and
 * once you mark it read it stays read.
 */
export async function getReminders(workspaceId: string): Promise<NotificationView[]> {
  const { userId } = await requireMembership(workspaceId);

  const now = new Date();
  const soon = new Date(now.getTime() + DUE_SOON_WINDOW_MS);

  const dueTasks = await db.task.findMany({
    where: {
      workspaceId,
      assignees: { some: { userId } },
      status: { not: "DONE" },
      dueDate: { not: null, lte: soon },
    },
    select: { id: true, title: true, dueDate: true },
  });

  for (const t of dueTasks) {
    const overdue = t.dueDate! < now;
    const type = overdue ? NotificationType.OVERDUE : NotificationType.DUE_SOON;
    const message = overdue
      ? `Просрочена задача «${t.title}»`
      : `Скоро дедлайн: «${t.title}»`;
    await db.notification.upsert({
      where: { userId_taskId_type: { userId, taskId: t.id, type } },
      create: { userId, taskId: t.id, type, message },
      update: {},
    });
  }

  const unread = await db.notification.findMany({
    where: { userId, read: false, task: { workspaceId } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { task: { select: { id: true, title: true, dueDate: true } } },
  });

  return unread.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    createdAt: n.createdAt.toISOString(),
    task: { id: n.task.id, title: n.task.title, dueDate: n.task.dueDate?.toISOString() ?? null },
  }));
}

export async function markNotificationRead(workspaceId: string, notificationId: string) {
  const { userId } = await requireMembership(workspaceId);
  await db.notification.updateMany({ where: { id: notificationId, userId }, data: { read: true } });
  return { ok: true as const };
}

export async function markAllNotificationsRead(workspaceId: string) {
  const { userId } = await requireMembership(workspaceId);
  await db.notification.updateMany({
    where: { userId, read: false, task: { workspaceId } },
    data: { read: true },
  });
  return { ok: true as const };
}
