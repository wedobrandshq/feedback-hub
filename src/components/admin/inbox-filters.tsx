import Link from "next/link";
import { hatchPill } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
import { INBOX_FILTERS, INBOX_FILTER_LABELS, type InboxFilter } from "@/domain/conversation";

export function InboxFilters({ current }: { current: InboxFilter }) {
  return (
    <nav aria-label="Inbox filters" className="flex flex-wrap gap-2 px-4 pt-4 pb-2 md:flex-nowrap md:overflow-x-auto md:px-8">
      {INBOX_FILTERS.map((filter) => {
        const active = filter === current;
        const href = filter === "all" ? "/admin/inbox" : `/admin/inbox?filter=${filter}`;
        return (
          <Link
            key={filter}
            href={href}
            aria-current={active ? "page" : undefined}
            className={hatchPill(active)}
          >
            {filter === "needs_reply" ? (
              <WithMarker kind="attention">{INBOX_FILTER_LABELS[filter]}</WithMarker>
            ) : (
              INBOX_FILTER_LABELS[filter]
            )}
          </Link>
        );
      })}
    </nav>
  );
}
