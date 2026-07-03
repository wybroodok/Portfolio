"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/server/actions/task-actions";
import { COLUMNS, type MemberSummary } from "@/types/board";

interface CreateTaskDialogProps {
  workspaceId: string;
  members: MemberSummary[];
}

export function CreateTaskDialog({ workspaceId, members }: CreateTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<(typeof COLUMNS)[number]["status"]>("BACKLOG");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setStatus("BACKLOG");
    setPriority("MEDIUM");
    setAssigneeIds([]);
    setDueDate("");
  }

  function toggleAssignee(id: string) {
    setAssigneeIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function submit() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask({
        workspaceId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assigneeIds,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      reset();
      setOpen(false);
      router.refresh(); // pull the new card into the board
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
      >
        + Создать задачу
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Новая задача</h2>

            <label className="mt-4 block text-xs font-medium text-neutral-500">Название *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />

            <label className="mt-3 block text-xs font-medium text-neutral-500">Описание (Markdown)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500">Колонка</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.status} value={c.status}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500">Приоритет</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500">Дедлайн</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </div>
            </div>

            {members.length > 0 && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-neutral-500">Исполнители</label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {members.map((m) => {
                    const active = assigneeIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleAssignee(m.id)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        }`}
                      >
                        {m.name ?? m.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !title.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {pending ? "Создаём…" : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
