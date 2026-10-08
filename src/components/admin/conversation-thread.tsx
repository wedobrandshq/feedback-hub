import { formatDateTime } from "@/domain/feedback";
import type { SenderTypeName } from "@/domain/conversation";

export type ThreadItem = {
  id: string;
  senderType: SenderTypeName;
  senderName: string;
  body: string;
  createdAt: Date | string;
};

function timeLabel(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return formatDateTime(date);
}

export function ConversationThread({ messages }: { messages: ThreadItem[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No messages yet.</p>;
  }

  return (
    <ol className="space-y-5">
      {messages.map((message) => {
        const fromTeam = message.senderType === "admin";
        return (
          <li key={message.id} className={fromTeam ? "sm:pl-10" : "sm:pr-10"}>
            <p className="text-xs text-muted-foreground">
              {message.senderName}
              <span aria-hidden> · </span>
              <time dateTime={new Date(message.createdAt).toISOString()}>{timeLabel(message.createdAt)}</time>
            </p>
            <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">{message.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
