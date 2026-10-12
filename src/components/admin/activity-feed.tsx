"use client";

import { useState } from "react";
import { activitySentence, formatDateTime } from "@/domain/feedback";

const PREVIEW = 3;

export function ActivityFeed({
  events,
}: {
  events: { id: string; type: string; payload: unknown; createdAt: Date }[];
}) {
  const [open, setOpen] = useState(false);
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  const shown = open ? events : events.slice(0, PREVIEW);
  const hidden = events.length - shown.length;

  return (
    <div>
      <ol className="space-y-4">
        {shown.map((event) => (
          <li key={event.id} className="grid grid-cols-[0.5rem_1fr] gap-3">
            <span className="mt-1.5 size-2 rounded-full bg-border" aria-hidden />
            <div>
              <p className="text-sm">{activitySentence(event)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(new Date(event.createdAt))}</p>
            </div>
          </li>
        ))}
      </ol>
      {events.length > PREVIEW ? (
        <button
          type="button"
          className="mt-3 text-sm text-[#5a5b70] hover:text-[#0e0e1a]"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </div>
  );
}