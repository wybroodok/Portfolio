import type { TaskStatus, TaskPriority } from "@prisma/client";

export type { TaskStatus, TaskPriority };

/** A user as shown on a card / in an assignee picker. */
export interface MemberSummary {
  id: string;
  name: string | null;
  image: string | null;
}

/** A tag/label chip. */
export interface LabelSummary {
  id: string;
  name: string;
  color: string;
}

/** Task shape the board renders (server -> client serialisable). */
export interface BoardTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // ISO string
  position: number;
  assignees: MemberSummary[];
  labels: LabelSummary[];
  commentCount: number;
  attachmentCount: number;
  checklistTotal: number;
  checklistDone: number;
}

/** Full task detail loaded when a card is opened. */
export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeIds: string[];
  labels: LabelSummary[];
  checklist: { id: string; content: string; done: boolean }[];
  attachments: { id: string; filename: string; size: number; mimeType: string }[];
  comments: {
    id: string;
    body: string;
    createdAt: string;
    author: MemberSummary;
  }[];
}

/** The board grouped into its four columns, tasks pre-sorted by position. */
export type BoardColumns = Record<TaskStatus, BoardTask[]>;

/** Ordered column metadata — single source of truth for the UI columns. */
export const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: "BACKLOG", title: "К изучению" },
  { status: "IN_PROGRESS", title: "В работе" },
  { status: "IN_REVIEW", title: "На проверке" },
  { status: "DONE", title: "Готово" },
];

export type FilterKey =
  | "onlyMine"
  | "highPriority"
  | "dueSoon"
  | "overdue"
  | "unassigned"
  | "hideDone";

export type BoardFilters = Record<FilterKey, boolean>;

export const EMPTY_FILTERS: BoardFilters = {
  onlyMine: false,
  highPriority: false,
  dueSoon: false,
  overdue: false,
  unassigned: false,
  hideDone: false,
};

/** Filter chips shown in the top bar (label + short description). */
export const FILTER_DEFS: { key: FilterKey; label: string }[] = [
  { key: "onlyMine", label: "Только мои" },
  { key: "highPriority", label: "Высокий приоритет" },
  { key: "dueSoon", label: "Скоро срок" },
  { key: "overdue", label: "Просроченные" },
  { key: "unassigned", label: "Без исполнителя" },
  { key: "hideDone", label: "Скрыть готовые" },
];
