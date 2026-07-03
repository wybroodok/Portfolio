"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import type { WorkspaceType } from "@prisma/client";
import type { TeamMember, WorkspaceListItem } from "@/server/queries/workspaces";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { TeamPanel } from "./TeamPanel";

interface BoardHeaderProps {
  workspace: { id: string; name: string; slug: string; type: WorkspaceType };
  currentRole: string;
  team: TeamMember[];
  workspaces: WorkspaceListItem[];
}

export function BoardHeader({ workspace, currentRole, team, workspaces }: BoardHeaderProps) {
  const members = team.map((m) => ({ id: m.id, name: m.name, image: m.image }));

  return (
    <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
      <WorkspaceSwitcher
        current={{ id: workspace.id, name: workspace.name, type: workspace.type }}
        workspaces={workspaces}
      />

      <div className="ml-auto flex items-center gap-2">
        <CreateTaskDialog workspaceId={workspace.id} members={members} />
        <TeamPanel
          workspace={{ id: workspace.id, name: workspace.name, type: workspace.type }}
          currentRole={currentRole}
          team={team}
        />
        <NotificationBell workspaceId={workspace.id} />
        <ThemeToggle />
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/login" })}
          title="Выйти"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
