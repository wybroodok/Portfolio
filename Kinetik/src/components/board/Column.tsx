"use client";

import { Draggable, type DroppableProvided } from "@hello-pangea/dnd";
import type { BoardTask } from "@/types/board";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  title: string;
  count: number;
  tasks: BoardTask[];
  isDraggingOver: boolean;
  provided: DroppableProvided;
  onOpenTask: (id: string) => void;
}

export function Column({ title, count, tasks, isDraggingOver, provided, onOpenTask }: ColumnProps) {
  return (
    <section className="flex min-h-[12rem] flex-col rounded-xl border border-neutral-200 bg-neutral-50/60 dark:border-neutral-800 dark:bg-neutral-900/40">
      <header className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
          {title}
        </h2>
        <span className="rounded-full bg-neutral-200 px-2 text-xs tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {count}
        </span>
      </header>

      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`flex flex-1 flex-col gap-2 px-2 pb-2 transition-colors ${
          isDraggingOver ? "bg-neutral-100 dark:bg-neutral-800/40" : ""
        }`}
      >
        {tasks.map((task, index) => (
          <Draggable draggableId={task.id} index={index} key={task.id}>
            {(dragProvided, dragSnapshot) => (
              <TaskCard
                task={task}
                isDragging={dragSnapshot.isDragging}
                provided={dragProvided}
                onOpen={onOpenTask}
              />
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    </section>
  );
}
