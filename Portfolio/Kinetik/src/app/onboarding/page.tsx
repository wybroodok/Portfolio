"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Users } from "lucide-react";
import { createWorkspace } from "@/server/actions/workspace-actions";

// Shown when a signed-in user has no board yet. Lets them create their first
// board — personal (just them) or team (invite others later).
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"PERSONAL" | "TEAM">("TEAM");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const { slug } = await createWorkspace({ name: name.trim(), type });
      router.push(`/w/${slug}/board`);
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Добро пожаловать в Kinetik</h1>
        <p className="mt-1 text-sm text-neutral-500">Создайте первую доску, чтобы начать.</p>

        <label className="mt-5 block text-xs font-medium text-neutral-500">Название</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, «Мои задачи» или «Маркетинг»"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType("PERSONAL")}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left ${
              type === "PERSONAL" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-neutral-200 dark:border-neutral-700"
            }`}
          >
            <User className={`h-5 w-5 ${type === "PERSONAL" ? "text-indigo-600" : "text-neutral-500"}`} />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Личная</span>
            <span className="text-xs text-neutral-500">Только вы</span>
          </button>
          <button
            type="button"
            onClick={() => setType("TEAM")}
            className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left ${
              type === "TEAM" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-neutral-200 dark:border-neutral-700"
            }`}
          >
            <Users className={`h-5 w-5 ${type === "TEAM" ? "text-indigo-600" : "text-neutral-500"}`} />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Командная</span>
            <span className="text-xs text-neutral-500">Можно приглашать людей</span>
          </button>
        </div>

        <button
          onClick={submit}
          disabled={pending || !name.trim()}
          className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Создаём…" : "Создать доску"}
        </button>
      </div>
    </main>
  );
}
