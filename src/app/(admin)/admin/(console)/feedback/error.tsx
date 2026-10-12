"use client";

import { hatchPrimary } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function FeedbackError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Couldn’t load feedback"
      description="Something went wrong while reading feedback. Try again."
      action={
        <Button type="button" className={hatchPrimary} onClick={() => reset()}>
          Try again
        </Button>
      }
    />
  );
}
