"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function ConversationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Couldn’t load this conversation"
      description="Something went wrong while reading the messages. Try again."
      action={
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
      }
    />
  );
}
