"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  DragDropContext,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import { COLUMNS, EMPTY_FILTERS, type BoardColumns, type BoardFilters, type BoardTask } from "@/types/board";
import { moveTask } from "@/server/actions/task-actions";
import { Column } from "./Column";
import { BoardFilterBar } from "./BoardFilterBar";
import { TaskDetailModal } from "./TaskDetailModal";

interface KanbanBoardProps {
  workspaceId: string;
  currentUserId: string;
  initialColumns: BoardColumns;
}

export function KanbanBoard({
  workspaceId,
  currentUserId,
  initialColumns,
}: KanbanBoardProps) {
  const router = useRouter();
  const [columns, setColumns] = useState<BoardColumns>(initialColumns);
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Stable identity so the open TaskDetailModal doesn't re-run its data load
  // (and wipe in-progress edits) on every board re-render.
  const refreshBoard = useCallback(() => router.refresh(), [router]);

  // Re-sync from the server after router.refresh() (task created/edited, etc.).
  // A fresh server render passes a new initialColumns object identity.
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Client-side filtering — instant, no page reload. All active filters AND together.
  const rendered = useMemo<BoardColumns>(() => {
    const now = Date.now();
    const soon = now + 3 * 24 * 60 * 60 * 1000; // "скоро срок" = ближайшие 3 дня
    const match = (t: BoardTask) => {
      const due = t.dueDate ? new Date(t.dueDate).getTime() : null;
      if (filters.onlyMine && !t.assignees.some((a) => a.id === currentUserId)) return false;
      if (filters.highPriority && t.priority !== "HIGH") return false;
      if (filters.unassigned && t.assignees.length > 0) return false;
      if (filters.hideDone && t.status === "DONE") return false;
      if (filters.dueSoon && !(due !== null && due <= soon && t.status !== "DONE")) return false;
      if (filters.overdue && !(due !== null && due < now && t.status !== "DONE")) return false;
      return true;
    };
    return COLUMNS.reduce((acc, { status }) => {
      acc[status] = columns[status].filter(match);
      return acc;
    }, {} as BoardColumns);
  }, [columns, filters, currentUserId]);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    // Dropped outside a column, or back onto the exact same slot → nothing to do.
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const toStatus = destination.droppableId as BoardTask["status"];
    const fromStatus = source.droppableId as BoardTask["status"];

    // The moved card, and the destination column as the USER sees it (filtered),
    // with the dragged card removed so indices line up with the drop slot.
    const moved = columns[fromStatus].find((t) => t.id === draggableId);
    if (!moved) return;
    const destVisible = rendered[toStatus].filter((t) => t.id !== draggableId);
    const beforeTaskId = destVisible[destination.index - 1]?.id ?? null;
    const afterTaskId = destVisible[destination.index]?.id ?? null;

    // ── Optimistic update: rebuild the full (unfiltered) columns immediately ──
    setColumns((prev) => {
      const next: BoardColumns = { ...prev };
      next[fromStatus] = prev[fromStatus].filter((t) => t.id !== draggableId);
      const updated = { ...moved, status: toStatus };
      const destFull = [...next[toStatus].filter((t) => t.id !== draggableId)];
      // Insert relative to the visible "after" neighbour to preserve order.
      const insertIdx = afterTaskId
        ? destFull.findIndex((t) => t.id === afterTaskId)
        : destFull.length;
      destFull.splice(insertIdx === -1 ? destFull.length : insertIdx, 0, updated);
      next[toStatus] = destFull;
      return next;
    });

    // ── Persist. On failure, resync from the server (revert optimistic move) ──
    startTransition(async () => {
      try {
        await moveTask({ workspaceId, taskId: draggableId, toStatus, beforeTaskId, afterTaskId });
      } catch {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <BoardFilterBar filters={filters} onChange={setFilters} />
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-x-auto p-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map(({ status, title }) => (
            <Droppable droppableId={status} key={status}>
              {(provided, snapshot) => (
                <Column
                  title={title}
                  count={rendered[status].length}
                  tasks={rendered[status]}
                  isDraggingOver={snapshot.isDraggingOver}
                  provided={provided}
                  onOpenTask={setOpenTaskId}
                />
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {openTaskId && (
        <TaskDetailModal
          workspaceId={workspaceId}
          taskId={openTaskId}
          onClose={() => setOpenTaskId(null)}
          onChanged={refreshBoard}
        />
      )}
    </div>
  );
}
