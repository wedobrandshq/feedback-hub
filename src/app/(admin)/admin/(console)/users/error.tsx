"use client";

import { hatchPrimary } from "@/components/admin/hatch";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

export default function UsersError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      title="Couldn’t load users"
      description="Something went wrong while reading users. Try again."
      action={<Button type="button" className={hatchPrimary} onClick={() => reset()}>Try again</Button>}
    />
  );
}
