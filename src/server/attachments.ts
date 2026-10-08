import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export function attachmentRoot() {
  return path.resolve(process.env.ATTACHMENT_DIR ?? path.join(process.cwd(), "data", "attachments"));
}

export function resolveStoragePath(storageKey: string) {
  if (!/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(storageKey)) {
    throw new Error("Invalid attachment key");
  }
  const root = attachmentRoot();
  const full = path.resolve(root, storageKey);
  if (full !== path.join(root, storageKey)) {
    throw new Error("Invalid attachment key");
  }
  return full;
}

export async function writeAttachment(storageKey: string, bytes: Buffer) {
  const full = resolveStoragePath(storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function readAttachment(storageKey: string) {
  return readFile(resolveStoragePath(storageKey));
}
