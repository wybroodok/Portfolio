"use client";

import type { DraggableProvided } from "@hello-pangea/dnd";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, CheckSquare, Paperclip, MessageSquare } from "lucide-react";
import type { BoardTask, TaskPriority } from "@/types/board";
import { labelClass } from "@/lib/labels";

const PRIORITY_STYLES: Record<TaskPriority, { label: string; dot: string; className: string }> = {
  HIGH: { label: "High", dot: "bg-red-500", className: "text-red-700 dark:text-red-300" },
  MEDIUM: { label: "Medium", dot: "bg-amber-500", className: "text-amber-700 dark:text-amber-300" },
  LOW: { label: "Low", dot: "bg-neutral-400", className: "text-neutral-500 dark:text-neutral-400" },
};

interface TaskCardProps {
  task: BoardTask;
  isDragging: boolean;
  provided: DraggableProvided;
  onOpen?: (id: string) => void;
}

function dueLabel(d: Date): string {
  if (isToday(d)) return "сегодня";
  if (isTomorrow(d)) return "завтра";
  return format(d, "d MMM", { locale: ru });
}

export function TaskCard({ task, isDragging, provided, onOpen }: TaskCardProps) {
  const priority = PRIORITY_STYLES[task.priority];
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = due ? isPast(due) && !isToday(due) && task.status !== "DONE" : false;

  return (
    <article
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onOpen?.(task.id)}
      className={`group cursor-pointer rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition-shadow dark:border-neutral-800 dark:bg-neutral-900 ${
        isDragging ? "shadow-md ring-2 ring-indigo-400/50" : "hover:shadow-md"
      }`}
    >
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span key={l.id} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${labelClass(l.color)}`}>
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${priority.dot}`} />
        <span className={`text-[11px] font-medium ${priority.className}`}>{priority.label}</span>
      </div>

      <h3 className="text-sm font-medium leading-snug text-neutral-900 dark:text-neutral-100">{task.title}</h3>

      {/* Deadline — always visible on the card */}
      {due && (
        <div
          className={`mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
            overdue
              ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
          }`}
        >
          <Calendar className="h-3 w-3" />
          {overdue ? "просрочено · " : "до "}
          {dueLabel(due)}
        </div>
      )}

      {/* Footer: meta badges + assignee */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[11px] text-neutral-400">
          {task.checklistTotal > 0 && (
            <span className={`inline-flex items-center gap-0.5 ${task.checklistDone === task.checklistTotal ? "text-green-600 dark:text-green-400" : ""}`}>
              <CheckSquare className="h-3 w-3" /> {task.checklistDone}/{task.checklistTotal}
            </span>
          )}
          {task.attachmentCount > 0 && (
            <span className="inline-flex items-center gap-0.5"><Paperclip className="h-3 w-3" /> {task.attachmentCount}</span>
          )}
          {task.commentCount > 0 && (
            <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" /> {task.commentCount}</span>
          )}
        </div>

        {task.assignees.length > 0 ? (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((a) => (
              <Avatar key={a.id} name={a.name} image={a.image} ring />
            ))}
            {task.assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[9px] font-semibold text-neutral-600 dark:border-neutral-900 dark:bg-neutral-700 dark:text-neutral-200">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-neutral-300 dark:border-neutral-700" />
        )}
      </div>
    </article>
  );
}

function Avatar({ name, image, ring }: { name: string | null; image: string | null; ring?: boolean }) {
  const ringCls = ring ? "border-2 border-white dark:border-neutral-900" : "";
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name ?? ""} className={`h-6 w-6 rounded-full object-cover ${ringCls}`} title={name ?? undefined} />;
  }
  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      title={name ?? undefined}
      className={`flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 ${ringCls}`}
    >
      {initials}
    </div>
  );
}
