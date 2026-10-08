"use client";

import { useActionState } from "react";
import { closeFeedbackAction, markReviewedAction } from "@/app/(admin)/admin/(console)/actions";
import type { FeedbackStatusName } from "@/domain/config";
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
}: {
  feedbackId: string;
  status: FeedbackStatusName;
}) {
  const [reviewState, reviewAction, reviewPending] = useActionState(markReviewedAction, initial);
  const [closeState, closeAction, closePending] = useActionState(closeFeedbackAction, initial);
  const error = reviewState.error ?? closeState.error;
  const canReview = status === "new";
  const canClose = status === "new" || status === "reviewed";

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <div className="flex flex-wrap gap-2">
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
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
