import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Local filesystem storage for attachments (dev default). Files live under
 * ./uploads (git-ignored) and are NEVER served statically — access goes through
 * /api/files/[id], which checks workspace membership first.
 *
 * To move to S3/R2 later, reimplement these three functions against the SDK;
 * nothing else in the app touches the filesystem.
 */
const UPLOADS_DIR = join(process.cwd(), "uploads");

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/** Persist bytes, return an opaque storage key to save on the Attachment row. */
export async function saveFile(workspaceId: string, filename: string, bytes: Buffer): Promise<string> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const key = join(workspaceId, `${randomUUID()}-${safe}`);
  const abs = join(UPLOADS_DIR, key);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, bytes);
  return key;
}

export async function readStoredFile(key: string): Promise<Buffer> {
  return readFile(join(UPLOADS_DIR, key));
}

export async function deleteStoredFile(key: string): Promise<void> {
  await unlink(join(UPLOADS_DIR, key)).catch(() => {});
}
