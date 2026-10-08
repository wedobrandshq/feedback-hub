"use client";

import { useActionState } from "react";
import { closeConversationAction, reopenConversationAction } from "@/app/(admin)/admin/(console)/actions";
import type { ConversationStatusName } from "@/domain/conversation";
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

export function ConversationActions({
  conversationId,
  status,
}: {
  conversationId: string;
  status: ConversationStatusName;
}) {
  const [closeState, closeAction, closePending] = useActionState(closeConversationAction, initial);
  const [reopenState, reopenAction, reopenPending] = useActionState(reopenConversationAction, initial);
  const error = closeState.error ?? reopenState.error;

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <div className="flex flex-wrap gap-2">
        {status === "open" ? (
          <AlertDialog>
            <AlertDialogTrigger
              disabled={closePending}
              render={<Button variant="outline" disabled={closePending} />}
            >
              Close
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close this conversation?</AlertDialogTitle>
                <AlertDialogDescription>
                  New replies wait until the conversation is reopened. The messages stay stored.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <form action={closeAction}>
                <input type="hidden" name="conversationId" value={conversationId} />
                {closeState.error ? (
                  <p className="pb-3 text-sm text-destructive" role="alert">
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
        ) : (
          <form action={reopenAction}>
            <input type="hidden" name="conversationId" value={conversationId} />
            <Button type="submit" variant="outline" disabled={reopenPending}>
              {reopenPending ? "Reopening…" : "Reopen"}
            </Button>
          </form>
        )}
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
