import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listMyWorkspaces } from "@/server/queries/workspaces";

// Landing: send authenticated users to their first board (or onboarding if they
// have none yet); anonymous users to login.
export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workspaces = await listMyWorkspaces(session.user.id);
  if (workspaces.length === 0) redirect("/onboarding");
  redirect(`/w/${workspaces[0].slug}/board`);
}
