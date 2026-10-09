"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function HomeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Couldn’t load home"
      description="Something went wrong while reading what users are saying. Try again."
      action={<Button type="button" onClick={() => reset()}>Try again</Button>}
    />
  );
}
