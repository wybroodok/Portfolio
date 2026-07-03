import { db } from "@/lib/db";
import { COLUMNS, type BoardColumns, type BoardTask } from "@/types/board";

/**
 * Load a workspace's board: all tasks grouped into their four columns, each
 * column sorted by `position`. One indexed query (see @@index in schema).
 * Caller is responsible for the tenant check (requireMembership).
 */
export async function getBoard(workspaceId: string): Promise<BoardColumns> {
  const tasks = await db.task.findMany({
    where: { workspaceId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      position: true,
      assignees: { select: { user: { select: { id: true, name: true, image: true } } } },
      labels: { select: { label: { select: { id: true, name: true, color: true } } } },
      checklist: { select: { done: true } },
      _count: { select: { comments: true, attachments: true } },
    },
  });

  const columns = COLUMNS.reduce((acc, { status }) => {
    acc[status] = [];
    return acc;
  }, {} as BoardColumns);

  for (const t of tasks) {
    const task: BoardTask = {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      position: t.position,
      assignees: t.assignees.map((a) => a.user),
      labels: t.labels.map((l) => l.label),
      commentCount: t._count.comments,
      attachmentCount: t._count.attachments,
      checklistTotal: t.checklist.length,
      checklistDone: t.checklist.filter((c) => c.done).length,
    };
    columns[t.status].push(task);
  }

  return columns;
}
