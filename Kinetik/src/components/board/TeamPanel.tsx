"use client";

import { useState, useTransition } from "react";
import { Users, X, Copy, Check, Mail } from "lucide-react";
import type { TeamMember } from "@/server/queries/workspaces";
import { inviteMember } from "@/server/actions/workspace-actions";

interface Props {
  workspace: { id: string; name: string; type: string };
  currentRole: string;
  team: TeamMember[];
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Владелец",
  ADMIN: "Админ",
  MEMBER: "Участник",
};

export function TeamPanel({ workspace, currentRole, team }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const canInvite = workspace.type === "TEAM" && (currentRole === "OWNER" || currentRole === "ADMIN");

  function sendInvite() {
    if (!email.trim()) return;
    startTransition(async () => {
      const res = await inviteMember({ workspaceId: workspace.id, email: email.trim() });
      setLink(res.link);
      setEmail("");
    });
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        <Users className="h-4 w-4" />
        Команда
        <span className="rounded-full bg-neutral-200 px-1.5 text-xs tabular-nums text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          {team.length}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{workspace.name}</h2>
                <p className="text-xs text-neutral-500">
                  {workspace.type === "PERSONAL" ? "Личная доска" : "Командная доска"} · {team.length} участник(ов)
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-4 space-y-1">
              {team.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {m.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (m.name ?? m.email).slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.name ?? "Без имени"}</p>
                    <p className="truncate text-xs text-neutral-500">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {ROLE_LABEL[m.role] ?? m.role}
                  </span>
                </li>
              ))}
            </ul>

            {canInvite && (
              <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <p className="mb-2 text-xs font-medium text-neutral-500">Пригласить сотрудника</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      className="w-full rounded-lg border border-neutral-200 py-2 pl-8 pr-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                    />
                  </div>
                  <button
                    onClick={sendInvite}
                    disabled={pending || !email.trim()}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {pending ? "…" : "Пригласить"}
                  </button>
                </div>
                {link && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                    <span className="flex-1 truncate text-[11px] text-neutral-600 dark:text-neutral-300">{link}</span>
                    <button onClick={copyLink} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
