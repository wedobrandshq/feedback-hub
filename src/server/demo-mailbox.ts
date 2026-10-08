import { DEMO_CONVERSATION_LIMIT } from "@/domain/config";
import type { DemoMailbox } from "@/domain/conversation";
import { feedbackPreview, formatDateTime } from "@/domain/feedback";
import { willowAppSecret } from "@/domain/secrets";
import { WILLOW_DEMO_USER } from "@/domain/willow-demo";
import { listConversationsForUser } from "@/server/conversations";

export async function getDemoMailbox(): Promise<DemoMailbox> {
  const conversations = await listConversationsForUser({
    appSecret: willowAppSecret(),
    externalUserId: WILLOW_DEMO_USER.externalUserId,
  });

  const visible = conversations.slice(0, DEMO_CONVERSATION_LIMIT);
  return {
    unreadCount: visible.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    conversations: visible.map((conversation) => {
      const latest = conversation.messages.at(-1);
      return {
        id: conversation.id,
        preview: latest ? feedbackPreview(latest.body) : "",
        closed: conversation.status === "closed",
        unreadCount: conversation.unreadCount,
        updatedLabel: formatDateTime(conversation.updatedAt),
        messages: conversation.messages.map((message) => ({
          id: message.id,
          senderType: message.senderType,
          senderName: message.senderName,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
        })),
      };
    }),
  };
}
