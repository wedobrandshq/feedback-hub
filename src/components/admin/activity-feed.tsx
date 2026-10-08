import { activitySentence, formatDateTime } from "@/domain/feedback";

export function ActivityFeed({
  events,
}: {
  events: { id: string; type: string; payload: unknown; createdAt: Date }[];
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="grid grid-cols-[0.5rem_1fr] gap-3">
          <span className="mt-1.5 size-2 rounded-full bg-border" aria-hidden />
          <div>
            <p className="text-sm">{activitySentence(event)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
