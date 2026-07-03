"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";
import { createWorkspace } from "@/server/actions/workspace-actions";

/** Dialog to create a new board — personal (just you) or team (invite others). */
export function CreateWorkspaceDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"PERSONAL" | "TEAM">("TEAM");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const { slug } = await createWorkspace({ name: name.trim(), type });
      onClose();
      router.push(`/w/${slug}/board`);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Новая доска</h2>

        <label className="mt-4 block text-xs font-medium text-neutral-500">Название</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, «Мои задачи» или «Маркетинг»"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <TypeCard
            active={type === "PERSONAL"}
            onClick={() => setType("PERSONAL")}
            icon={<User className="h-5 w-5" />}
            title="Личная"
            desc="Только вы"
          />
          <TypeCard
            active={type === "TEAM"}
            onClick={() => setType("TEAM")}
            icon={<Users className="h-5 w-5" />}
            title="Командная"
            desc="Можно приглашать людей"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={pending || !name.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Создаём…" : "Создать доску"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
        active
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
          : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      }`}
    >
      <span className={active ? "text-indigo-600 dark:text-indigo-400" : "text-neutral-500"}>{icon}</span>
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</span>
      <span className="text-xs text-neutral-500">{desc}</span>
    </button>
  );
}
