"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import {
  X,
  Trash2,
  Tag,
  Calendar,
  Flag,
  UserRound,
  ListChecks,
  Paperclip,
  MessageSquare,
  Plus,
  Check,
  Send,
} from "lucide-react";
import type { MemberSummary, TaskDetail, LabelSummary, TaskPriority } from "@/types/board";
import { labelClass, LABEL_COLOR_KEYS } from "@/lib/labels";
import { updateTask, addComment, loadTaskDetail, deleteTask, setAssignees } from "@/server/actions/task-actions";
import {
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/server/actions/checklist-actions";
import { createLabel, attachLabel, detachLabel } from "@/server/actions/label-actions";
import { uploadAttachment, deleteAttachment } from "@/server/actions/attachment-actions";

interface Props {
  workspaceId: string;
  taskId: string;
  onClose: () => void;
  onChanged: () => void;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
      {icon}
      {children}
    </h3>
  );
}

export function TaskDetailModal({ workspaceId, taskId, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [allLabels, setAllLabels] = useState<LabelSummary[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [, startTransition] = useTransition();

  // Editable buffers
  const [descDraft, setDescDraft] = useState("");
  const [comment, setComment] = useState("");
  const [checkDraft, setCheckDraft] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Keep the board-refresh callback in a ref so it never re-triggers loads.
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  // `resetDrafts` is true only on the first load — later refreshes must NOT
  // overwrite what the user is currently typing (this was the description bug).
  const load = useCallback(
    async (resetDrafts: boolean) => {
      const res = await loadTaskDetail(workspaceId, taskId);
      setDetail(res.detail);
      setAllLabels(res.allLabels);
      setMembers(res.members);
      if (resetDrafts) setDescDraft(res.detail.description ?? "");
      onChangedRef.current();
    },
    [workspaceId, taskId],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      await load(false);
    });
  }

  function remove() {
    if (!confirm("Удалить задачу? Это действие необратимо.")) return;
    startTransition(async () => {
      await deleteTask(workspaceId, taskId);
      onChangedRef.current();
      onClose();
    });
  }

  if (!detail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="rounded-xl bg-white px-6 py-4 text-sm text-neutral-500 dark:bg-neutral-900">Загрузка…</div>
      </div>
    );
  }

  const attachedIds = new Set(detail.labels.map((l) => l.id));
  const available = allLabels.filter((l) => !attachedIds.has(l.id));
  const doneCount = detail.checklist.filter((c) => c.done).length;
  const progress = detail.checklist.length ? Math.round((doneCount / detail.checklist.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div
        className="my-8 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-3">
          <input
            defaultValue={detail.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== detail.title) run(() => updateTask({ workspaceId, taskId, title: v }));
            }}
            className="w-full rounded-lg border border-transparent px-1 text-lg font-semibold text-neutral-900 hover:border-neutral-200 focus:border-indigo-400 focus:outline-none dark:text-neutral-100 dark:hover:border-neutral-700"
          />
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={remove}
              title="Удалить задачу"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Закрыть"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Meta: priority / due date */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <SectionTitle icon={<Flag className="h-3.5 w-3.5" />}>Приоритет</SectionTitle>
            <select
              value={detail.priority}
              onChange={(e) => run(() => updateTask({ workspaceId, taskId, priority: e.target.value as TaskPriority }))}
              className="mt-1.5 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <SectionTitle icon={<Calendar className="h-3.5 w-3.5" />}>Дедлайн</SectionTitle>
            <input
              type="date"
              defaultValue={detail.dueDate ? detail.dueDate.slice(0, 10) : ""}
              onChange={(e) =>
                run(() =>
                  updateTask({
                    workspaceId,
                    taskId,
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }),
                )
              }
              className="mt-1.5 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </div>
        </div>

        {/* Assignees (multiple) */}
        <section className="mt-5">
          <SectionTitle icon={<UserRound className="h-3.5 w-3.5" />}>Исполнители</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {members.map((m) => {
              const active = detail.assigneeIds.includes(m.id);
              const initials = (m.name ?? "?").slice(0, 1).toUpperCase();
              return (
                <button
                  key={m.id}
                  onClick={() =>
                    run(() =>
                      setAssignees({
                        workspaceId,
                        taskId,
                        userIds: active
                          ? detail.assigneeIds.filter((id) => id !== m.id)
                          : [...detail.assigneeIds, m.id],
                      }),
                    )
                  }
                  className={`inline-flex items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-neutral-200 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-[9px] font-semibold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                    {m.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </span>
                  {m.name ?? m.id}
                  {active && <Check className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Labels */}
        <section className="mt-5">
          <SectionTitle icon={<Tag className="h-3.5 w-3.5" />}>Теги</SectionTitle>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {detail.labels.map((l) => (
              <span key={l.id} className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${labelClass(l.color)}`}>
                {l.name}
                <button onClick={() => run(() => detachLabel({ workspaceId, taskId, labelId: l.id }))} aria-label="Убрать тег" className="hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {available.length > 0 && (
              <select
                value=""
                onChange={(e) => e.target.value && run(() => attachLabel({ workspaceId, taskId, labelId: e.target.value }))}
                className="rounded border border-dashed border-neutral-300 bg-transparent px-2 py-0.5 text-xs text-neutral-500 dark:border-neutral-700"
              >
                <option value="">+ добавить</option>
                {available.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            )}
            <span className="inline-flex items-center overflow-hidden rounded border border-neutral-200 dark:border-neutral-700">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newLabel.trim()) createNewLabel();
                }}
                placeholder="Новый тег…"
                className="w-24 bg-transparent px-2 py-0.5 text-xs focus:outline-none dark:bg-neutral-950"
              />
              <button onClick={createNewLabel} className="bg-neutral-100 px-1.5 py-1 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300">
                <Plus className="h-3 w-3" />
              </button>
            </span>
          </div>
        </section>

        {/* Description */}
        <section className="mt-5">
          <SectionTitle icon={<MessageSquare className="h-3.5 w-3.5" />}>Описание</SectionTitle>
          <textarea
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            rows={4}
            placeholder="Опишите задачу (поддерживается Markdown)…"
            className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
          <button
            onClick={() => run(() => updateTask({ workspaceId, taskId, description: descDraft }))}
            disabled={descDraft === (detail.description ?? "")}
            className="mt-1 rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
          >
            Сохранить описание
          </button>
          {detail.description && (
            <div className="prose prose-sm mt-3 max-w-none rounded-lg bg-neutral-50 p-3 text-neutral-700 dark:prose-invert dark:bg-neutral-950 dark:text-neutral-300">
              <ReactMarkdown>{detail.description}</ReactMarkdown>
            </div>
          )}
        </section>

        {/* Checklist */}
        <section className="mt-5">
          <SectionTitle icon={<ListChecks className="h-3.5 w-3.5" />}>
            Чек-лист {detail.checklist.length > 0 && <span className="normal-case text-neutral-400">· {doneCount}/{detail.checklist.length}</span>}
          </SectionTitle>
          {detail.checklist.length > 0 && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <ul className="mt-2 space-y-0.5">
            {detail.checklist.map((c) => (
              <li key={c.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <button
                  onClick={() => run(() => toggleChecklistItem({ workspaceId, taskId, itemId: c.id, done: !c.done }))}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    c.done ? "border-green-500 bg-green-500 text-white" : "border-neutral-300 dark:border-neutral-600"
                  }`}
                  aria-label={c.done ? "Снять отметку" : "Отметить"}
                >
                  {c.done && <Check className="h-3 w-3" />}
                </button>
                <span className={`flex-1 text-sm ${c.done ? "text-neutral-400 line-through" : "text-neutral-700 dark:text-neutral-300"}`}>
                  {c.content}
                </span>
                <button
                  onClick={() => run(() => deleteChecklistItem({ workspaceId, taskId, itemId: c.id }))}
                  className="text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label="Удалить пункт"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <input
            value={checkDraft}
            onChange={(e) => setCheckDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && checkDraft.trim()) {
                const content = checkDraft.trim();
                setCheckDraft("");
                run(() => addChecklistItem({ workspaceId, taskId, content }));
              }
            }}
            placeholder="+ Добавить пункт и нажать Enter"
            className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          />
        </section>

        {/* Attachments */}
        <section className="mt-5">
          <SectionTitle icon={<Paperclip className="h-3.5 w-3.5" />}>Файлы</SectionTitle>
          <ul className="mt-2 space-y-1">
            {detail.attachments.map((a) => (
              <li key={a.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <Paperclip className="h-3.5 w-3.5 text-neutral-400" />
                <a href={`/api/files/${a.id}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
                  {a.filename}
                </a>
                <span className="text-xs text-neutral-400">{formatBytes(a.size)}</span>
                <button
                  onClick={() => run(() => deleteAttachment(workspaceId, a.id))}
                  className="ml-auto text-neutral-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  aria-label="Удалить файл"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <input
            ref={fileRef}
            type="file"
            className="mt-2 block text-xs text-neutral-500 file:mr-2 file:rounded file:border-0 file:bg-neutral-100 file:px-2 file:py-1 file:text-xs dark:file:bg-neutral-800 dark:file:text-neutral-300"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.set("workspaceId", workspaceId);
              fd.set("taskId", taskId);
              fd.set("file", file);
              if (fileRef.current) fileRef.current.value = "";
              run(() => uploadAttachment(fd));
            }}
          />
        </section>

        {/* Comments */}
        <section className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <SectionTitle icon={<MessageSquare className="h-3.5 w-3.5" />}>Комментарии</SectionTitle>
          <ul className="mt-3 space-y-3">
            {detail.comments.map((c) => (
              <li key={c.id} className="flex gap-2 text-sm">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {(c.author.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{c.author.name}</span>
                    <span className="text-[11px] text-neutral-400">{format(new Date(c.createdAt), "d MMM, HH:mm")}</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">{c.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && comment.trim()) sendComment();
              }}
              placeholder="Оставить фидбек…"
              className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
            <button
              onClick={sendComment}
              disabled={!comment.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white disabled:opacity-40"
              aria-label="Отправить"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );

  function createNewLabel() {
    const name = newLabel.trim();
    if (!name) return;
    const color = LABEL_COLOR_KEYS[Math.floor(Math.random() * LABEL_COLOR_KEYS.length)];
    setNewLabel("");
    run(async () => {
      const label = await createLabel({ workspaceId, name, color });
      await attachLabel({ workspaceId, taskId, labelId: label.id });
    });
  }

  function sendComment() {
    const body = comment.trim();
    if (!body) return;
    setComment("");
    run(() => addComment({ workspaceId, taskId, body }));
  }
}
