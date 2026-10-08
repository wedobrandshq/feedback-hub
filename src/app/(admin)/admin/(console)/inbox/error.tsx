"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function InboxError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Couldn’t load the inbox"
      description="Something went wrong while reading conversations. Try again."
      action={
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
      }
    />
  );
}
