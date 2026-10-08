import { assertMessageBody } from "@/domain/conversation";
import { DomainError } from "@/domain/errors";

export type DemoReply = {
  conversationId: string;
  body: string;
};

export function readDemoReply(formData: FormData): DemoReply {
  const conversationId = formData.get("conversationId");
  const body = formData.get("body");
  if (typeof conversationId !== "string" || conversationId.trim().length === 0) {
    throw new DomainError("Choose a conversation.", "validation");
  }
  if (typeof body !== "string") {
    throw new DomainError("Write a reply before sending.", "validation");
  }
  assertMessageBody(body);
  return { conversationId, body };
}
