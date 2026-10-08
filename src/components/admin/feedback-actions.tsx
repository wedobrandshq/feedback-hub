"use client";

import { useActionState, useState } from "react";
import { closeFeedbackAction, markReviewedAction } from "@/app/(admin)/admin/(console)/actions";
import type { FeedbackStatusName } from "@/domain/config";
import type { ConversationStatusName } from "@/domain/conversation";
import { MessageComposer } from "@/components/admin/message-composer";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const initial = { error: null };

export function FeedbackActions({
  feedbackId,
  status,
  conversation,
}: {
  feedbackId: string;
  status: FeedbackStatusName;
  conversation: { id: string; status: ConversationStatusName } | null;
}) {
  const [reviewState, reviewAction, reviewPending] = useActionState(markReviewedAction, initial);
  const [closeState, closeAction, closePending] = useActionState(closeFeedbackAction, initial);
  const [replyOpen, setReplyOpen] = useState(false);
  const error = reviewState.error ?? closeState.error;
  const canReview = status === "new";
  const canClose = status === "new" || status === "reviewed";
  const canReply = conversation?.status === "open";

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <div className="flex flex-wrap gap-2">
        {canReply && conversation ? (
          <Button type="button" variant="outline" onClick={() => setReplyOpen((open) => !open)}>
            Reply
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            Reply
          </Button>
        )}
        <form action={reviewAction}>
          <input type="hidden" name="feedbackId" value={feedbackId} />
          <Button type="submit" variant="outline" disabled={!canReview || reviewPending}>
            {reviewPending ? "Saving…" : "Mark reviewed"}
          </Button>
        </form>
        <AlertDialog>
          <AlertDialogTrigger
            disabled={!canClose || closePending}
            render={<Button variant="outline" disabled={!canClose || closePending} />}
          >
            Close
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close this feedback?</AlertDialogTitle>
              <AlertDialogDescription>
                The original message stays stored. Closed feedback remains in the list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form action={closeAction}>
              <input type="hidden" name="feedbackId" value={feedbackId} />
              {closeState.error ? (
                <p className="px-0 pb-3 text-sm text-destructive" role="alert">
                  {closeState.error}
                </p>
              ) : null}
              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <Button type="submit" variant="destructive" disabled={closePending}>
                  {closePending ? "Closing…" : "Close"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {replyOpen && conversation ? (
        <div className="w-full md:w-80">
          <MessageComposer conversationId={conversation.id} />
        </div>
      ) : null}
      {!conversation ? <p className="text-sm text-muted-foreground">This feedback has no conversation.</p> : null}
      {conversation?.status === "closed" ? (
        <p className="text-sm text-muted-foreground">This conversation is closed.</p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
