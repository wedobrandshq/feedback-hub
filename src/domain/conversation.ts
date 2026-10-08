import { BODY_MAX_LENGTH } from "@/domain/config";
import { DomainError } from "@/domain/errors";

export const INBOX_FILTERS = ["all", "unread", "needs_reply", "closed"] as const;
export type InboxFilter = (typeof INBOX_FILTERS)[number];

export const INBOX_FILTER_LABELS: Record<InboxFilter, string> = {
  all: "All",
  unread: "Unread",
  needs_reply: "Needs reply",
  closed: "Closed",
};

export type ConversationStatusName = "open" | "closed";
export type SenderTypeName = "user" | "admin" | "system";

export function parseInboxFilter(value: string | undefined): {
  filter: InboxFilter;
  error: string | null;
} {
  if (!value) return { filter: "all", error: null };
  if ((INBOX_FILTERS as readonly string[]).includes(value)) {
    return { filter: value as InboxFilter, error: null };
  }
  return { filter: "all", error: "That inbox filter is not available." };
}

export function conversationNeedsReply(input: {
  status: ConversationStatusName;
  latestSenderType: SenderTypeName | null;
}) {
  return input.status === "open" && input.latestSenderType === "user";
}

export function assertMessageBody(body: string) {
  if (body.trim().length === 0) {
    throw new DomainError("Write a reply before sending.", "validation");
  }
  if (body.length > BODY_MAX_LENGTH) {
    throw new DomainError("A reply needs to be 10,000 characters or less.", "validation");
  }
}

export type DemoMessage = {
  id: string;
  senderType: SenderTypeName;
  senderName: string;
  body: string;
  createdAt: string;
};

export type DemoConversation = {
  id: string;
  preview: string;
  closed: boolean;
  unreadCount: number;
  updatedLabel: string;
  messages: DemoMessage[];
};

export type DemoMailbox = {
  unreadCount: number;
  conversations: DemoConversation[];
};
