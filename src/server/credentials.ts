import { createHash } from "node:crypto";

export function hashAppCredential(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}
