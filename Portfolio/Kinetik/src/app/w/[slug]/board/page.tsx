import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBoard } from "@/server/queries/board";
import { listMyWorkspaces, getTeam } from "@/server/queries/workspaces";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { BoardHeader } from "@/components/board/BoardHeader";

// Server Component: resolve tenant from the URL slug, authorise, load data,
// then hand the initial board to the interactive client component.
export default async function BoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspace = await db.workspace.findUnique({ where: { slug } });
  if (!workspace) notFound();

  // Authorise: must be a member of this workspace. If not (e.g. a user opened a
  // board they don't belong to), send them home rather than crashing.
  const member = await db.member.findUnique({
    where: { userId_workspaceId: { userId: session.user.id, workspaceId: workspace.id } },
  });
  if (!member) redirect("/");

  const [columns, team, workspaces] = await Promise.all([
    getBoard(workspace.id),
    getTeam(workspace.id),
    listMyWorkspaces(session.user.id),
  ]);

  return (
    <div className="flex h-screen flex-col bg-white dark:bg-neutral-950">
      <BoardHeader
        workspace={{ id: workspace.id, name: workspace.name, slug: workspace.slug, type: workspace.type }}
        currentRole={member.role}
        team={team}
        workspaces={workspaces}
      />
      <main className="min-h-0 flex-1">
        <KanbanBoard
          workspaceId={workspace.id}
          currentUserId={session.user.id}
          initialColumns={columns}
        />
      </main>
    </div>
  );
}
