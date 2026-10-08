import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

const STORAGE_KEY = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;

export function attachmentRoot() {
  return path.resolve(process.env.ATTACHMENT_DIR ?? path.join(process.cwd(), "data", "attachments"));
}

function assertStorageKey(storageKey: string) {
  if (!STORAGE_KEY.test(storageKey)) {
    throw new Error("Invalid attachment key");
  }
}

function useBlob() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BLOB_READ_WRITE_TOKEN is required in production");
  }
  return false;
}

export function resolveStoragePath(storageKey: string) {
  assertStorageKey(storageKey);
  const root = attachmentRoot();
  const full = path.resolve(root, storageKey);
  if (full !== path.join(root, storageKey)) {
    throw new Error("Invalid attachment key");
  }
  return full;
}

export async function writeAttachment(storageKey: string, bytes: Buffer) {
  assertStorageKey(storageKey);
  if (useBlob()) {
    await put(storageKey, bytes, { access: "private", addRandomSuffix: false });
    return;
  }
  const full = resolveStoragePath(storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function readAttachment(storageKey: string) {
  assertStorageKey(storageKey);
  if (useBlob()) {
    const result = await get(storageKey, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Attachment missing");
    }
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  return readFile(resolveStoragePath(storageKey));
}

export async function deleteAttachment(storageKey: string) {
  assertStorageKey(storageKey);
  if (useBlob()) {
    await del(storageKey);
    return;
  }
  await unlink(resolveStoragePath(storageKey));
}
