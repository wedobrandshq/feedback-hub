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
            <p className="text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
              {message.senderName}
              <span aria-hidden> · </span>
              <time dateTime={new Date(message.createdAt).toISOString()}>{timeLabel(message.createdAt)}</time>
            </p>
            <p className={`mt-2 rounded-2xl border-2 border-[#0e0e1a] px-3 py-2 text-sm leading-6 whitespace-pre-wrap text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] ${fromTeam ? "bg-[#c6ff4f]" : "bg-white"}`}>{message.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
