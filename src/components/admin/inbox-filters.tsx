import Link from "next/link";
import { INBOX_FILTERS, INBOX_FILTER_LABELS, type InboxFilter } from "@/domain/conversation";

export function InboxFilters({ current }: { current: InboxFilter }) {
  return (
    <nav aria-label="Inbox filters" className="flex gap-1 overflow-x-auto border-b border-border px-4 py-3 md:px-6">
      {INBOX_FILTERS.map((filter) => {
        const active = filter === current;
        const href = filter === "all" ? "/admin/inbox" : `/admin/inbox?filter=${filter}`;
        return (
          <Link
            key={filter}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap ${
              active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            {INBOX_FILTER_LABELS[filter]}
          </Link>
        );
      })}
    </nav>
  );
}
