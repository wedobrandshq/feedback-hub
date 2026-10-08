"use client";

import { useActionState } from "react";
import { replyToConversationAction, type ComposerState } from "@/app/(admin)/admin/(console)/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: ComposerState = { error: null, sentAt: null };

export function MessageComposer({
  conversationId,
  submitLabel = "Send reply",
}: {
  conversationId: string;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState(replyToConversationAction, initial);

  return (
    <form key={state.sentAt ?? "new"} action={action} className="space-y-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <label htmlFor={`reply-${conversationId}`} className="text-sm font-medium">
        Reply
      </label>
      <Textarea id={`reply-${conversationId}`} name="body" className="min-h-24" placeholder="Write a reply" />
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}
