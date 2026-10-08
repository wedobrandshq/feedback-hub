import { ATTACHMENT_MAX_BYTES } from "@/domain/config";
import { DomainError } from "@/domain/errors";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function sniffImage(bytes: Buffer) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6) {
    const header = bytes.toString("ascii", 0, 6);
    if (header === "GIF87a" || header === "GIF89a") return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function validateScreenshot(bytes: Buffer) {
  if (bytes.length === 0) {
    throw new DomainError("That screenshot was empty.", "validation");
  }
  if (bytes.length > ATTACHMENT_MAX_BYTES) {
    throw new DomainError("Screenshots need to be 5 MB or smaller.", "validation");
  }
  const contentType = sniffImage(bytes);
  if (!contentType) {
    throw new DomainError("Use a PNG, JPEG, WEBP, or GIF screenshot.", "validation");
  }
  return contentType;
}

export function safeFileName(name: string, contentType: string) {
  const base = name.split(/[/\\]/).pop() ?? "screenshot";
  const cleaned = base.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  if (cleaned) return cleaned;
  return `screenshot.${EXT[contentType] ?? "img"}`;
}
