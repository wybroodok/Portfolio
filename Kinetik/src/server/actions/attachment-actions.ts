"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/tenant";
import { saveFile, deleteStoredFile, MAX_UPLOAD_BYTES } from "@/lib/storage";

/**
 * Upload a file to a task. Called from a <form> with FormData so the browser
 * streams the binary directly to the Server Action.
 * Fields: workspaceId, taskId, file.
 */
export async function uploadAttachment(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const file = formData.get("file");

  const { userId } = await requireMembership(workspaceId);
  if (!(file instanceof File) || file.size === 0) throw new Error("VALIDATION: no file");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("VALIDATION: file too large (max 10MB)");

  const task = await db.task.findFirst({ where: { id: taskId, workspaceId }, select: { id: true } });
  if (!task) throw new Error("NOT_FOUND");

  const bytes = Buffer.from(await file.arrayBuffer());
  const storageKey = await saveFile(workspaceId, file.name, bytes);

  const attachment = await db.attachment.create({
    data: {
      taskId,
      filename: file.name,
      storageKey,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      uploadedById: userId,
    },
  });
  revalidatePath(`/w/${workspaceId}/board`);
  return { id: attachment.id, filename: attachment.filename, size: attachment.size, mimeType: attachment.mimeType };
}

export async function deleteAttachment(workspaceId: string, attachmentId: string) {
  await requireMembership(workspaceId);
  const att = await db.attachment.findFirst({
    where: { id: attachmentId, task: { workspaceId } },
  });
  if (!att) throw new Error("NOT_FOUND");

  await db.attachment.delete({ where: { id: att.id } });
  await deleteStoredFile(att.storageKey);
  revalidatePath(`/w/${workspaceId}/board`);
  return { ok: true as const };
}
