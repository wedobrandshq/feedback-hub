"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function FeedbackDetailError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Couldn’t load this feedback"
      description="Something went wrong while opening this message. Try again."
      action={
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
      }
    />
  );
}
