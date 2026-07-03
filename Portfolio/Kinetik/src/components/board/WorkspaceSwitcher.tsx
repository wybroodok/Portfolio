"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronsUpDown, Plus, User, Users, Check } from "lucide-react";
import type { WorkspaceListItem } from "@/server/queries/workspaces";
import { CreateWorkspaceDialog } from "./CreateWorkspaceDialog";

interface Props {
  current: { id: string; name: string; type: string };
  workspaces: WorkspaceListItem[];
}

/** Dropdown to switch between the user's boards, and create a new one. */
export function WorkspaceSwitcher({ current, workspaces }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {current.type === "PERSONAL" ? (
          <User className="h-4 w-4 text-neutral-500" />
        ) : (
          <Users className="h-4 w-4 text-neutral-500" />
        )}
        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{current.name}</span>
        <ChevronsUpDown className="h-3.5 w-3.5 text-neutral-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 z-20 w-64 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Доски</p>
            {workspaces.map((w) => (
              <Link
                key={w.id}
                href={`/w/${w.slug}/board`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                {w.type === "PERSONAL" ? <User className="h-4 w-4 text-neutral-400" /> : <Users className="h-4 w-4 text-neutral-400" />}
                <span className="flex-1 truncate">{w.name}</span>
                {w.id === current.id && <Check className="h-4 w-4 text-indigo-600" />}
              </Link>
            ))}
            <div className="my-1 h-px bg-neutral-100 dark:bg-neutral-800" />
            <button
              onClick={() => {
                setOpen(false);
                setCreating(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" /> Создать доску
            </button>
          </div>
        </>
      )}

      {creating && <CreateWorkspaceDialog onClose={() => setCreating(false)} />}
    </div>
  );
}
