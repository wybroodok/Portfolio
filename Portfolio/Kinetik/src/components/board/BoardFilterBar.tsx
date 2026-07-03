"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { FILTER_DEFS, EMPTY_FILTERS, type BoardFilters } from "@/types/board";

interface BoardFilterBarProps {
  filters: BoardFilters;
  onChange: (next: BoardFilters) => void;
}

/** Quick filters. Toggling only updates local state → instant, no reload. */
export function BoardFilterBar({ filters, onChange }: BoardFilterBarProps) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
      <SlidersHorizontal className="h-4 w-4 shrink-0 text-neutral-400" />
      {FILTER_DEFS.map((f) => (
        <FilterChip
          key={f.key}
          active={filters[f.key]}
          onClick={() => onChange({ ...filters, [f.key]: !filters[f.key] })}
        >
          {f.label}
        </FilterChip>
      ))}
      {activeCount > 0 && (
        <button
          onClick={() => onChange({ ...EMPTY_FILTERS })}
          className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="h-3 w-3" /> Сбросить
        </button>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          : "border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}
