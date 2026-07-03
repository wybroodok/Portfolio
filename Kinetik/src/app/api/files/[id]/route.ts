import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";

/**
 * Serve an attachment only to members of the task's workspace.
 * Files are never public — every download is authorised here.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { task: { select: { workspaceId: true } } },
  });
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  const member = await db.member.findUnique({
    where: {
      userId_workspaceId: { userId: session.user.id, workspaceId: attachment.task.workspaceId },
    },
    select: { id: true },
  });
  if (!member) return new NextResponse("Forbidden", { status: 403 });

  const bytes = await readStoredFile(attachment.storageKey);

  // Отдаём inline только безопасные для просмотра типы. Всё остальное (в т.ч.
  // text/html, image/svg+xml) — форс-скачивание, иначе загруженный файл может
  // исполниться как активный контент на origin приложения (stored XSS).
  const INLINE_SAFE = new Set([
    "image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf",
  ]);
  const isInlineSafe = INLINE_SAFE.has(attachment.mimeType);
  const disposition = isInlineSafe ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": isInlineSafe ? attachment.mimeType : "application/octet-stream",
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(attachment.filename)}"`,
      "Content-Length": String(attachment.size),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
