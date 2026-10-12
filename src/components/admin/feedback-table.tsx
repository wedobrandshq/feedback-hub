import Link from "next/link";
import { HatchPanel, hatchDataRow, hatchHead, hatchRowTitle } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
import { StatusBadge, TypeBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  feedbackPreview,
  formatDate,
  nextFeedbackSort,
  userLabel,
  type FeedbackSort,
  type FeedbackSortDir,
} from "@/domain/feedback";
import type { FeedbackStatusName, FeedbackTypeName } from "@/domain/config";

export type FeedbackRow = {
  id: string;
  body: string;
  type: FeedbackTypeName;
  status: FeedbackStatusName;
  createdAt: Date;
  user: { name: string | null; email: string | null; externalUserId: string };
  app: { name: string };
  requestLink: { request: { id: string; title: string } } | null;
};

const COLUMNS: { sort: FeedbackSort; label: string; marker?: "type" | "status" }[] = [
  { sort: "feedback", label: "Feedback" },
  { sort: "user", label: "User" },
  { sort: "app", label: "App" },
  { sort: "type", label: "Type", marker: "type" },
  { sort: "request", label: "Request" },
  { sort: "status", label: "Status", marker: "status" },
  { sort: "created", label: "Created" },
];

function feedbackHref(
  filters: { q: string; type: string; status: string; from: string; to: string },
  current: { sort: FeedbackSort; dir: FeedbackSortDir },
  column: FeedbackSort,
) {
  const next = nextFeedbackSort(current, column);
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (!(next.sort === "created" && next.dir === "desc")) {
    params.set("sort", next.sort);
    params.set("dir", next.dir);
  }
  const query = params.toString();
  return query ? `/admin/feedback?${query}` : "/admin/feedback";
}

export function FeedbackTable({
  rows,
  sort,
  dir,
  filters,
}: {
  rows: FeedbackRow[];
  sort: FeedbackSort;
  dir: FeedbackSortDir;
  filters: { q: string; type: string; status: string; from: string; to: string };
}) {
  return (
    <div className="px-4 py-4 md:px-8">
      <HatchPanel clip>
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
              {COLUMNS.map((column) => {
                const active = sort === column.sort;
                return (
                  <TableHead
                    key={column.sort}
                    className={hatchHead}
                    aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <Link
                      href={feedbackHref(filters, { sort, dir }, column.sort)}
                      className="inline-flex items-center gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase no-underline [font-family:var(--font-mono)] hover:text-[#0e0e1a]"
                    >
                      {column.marker ? <WithMarker kind={column.marker}>{column.label}</WithMarker> : column.label}
                      {active ? (
                        <span aria-hidden className="text-[10px] leading-none font-normal tracking-normal normal-case">
                          {dir === "asc" ? "↑" : "↓"}
                        </span>
                      ) : null}
                    </Link>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={hatchDataRow}>
                <TableCell className="max-w-md px-3 py-3.5 font-normal whitespace-normal">
                  <Link href={`/admin/feedback/${row.id}`} className={`${hatchRowTitle} after:absolute after:inset-0`}>
                    {feedbackPreview(row.body)}
                  </Link>
                </TableCell>
                <TableCell className="px-3 py-3.5 whitespace-normal">
                  <span className="block text-sm text-[#0e0e1a]">{userLabel(row.user)}</span>
                  {row.user.email && row.user.name ? (
                    <span className="block text-xs text-[#5a5b70]">{row.user.email}</span>
                  ) : null}
                </TableCell>
                <TableCell className="px-3 py-3.5 text-sm">{row.app.name}</TableCell>
                <TableCell className="px-3 py-3.5">
                  <TypeBadge type={row.type} />
                </TableCell>
                <TableCell className="max-w-40 px-3 py-3.5 whitespace-normal text-sm text-[#5a5b70]">
                  {row.requestLink ? row.requestLink.request.title : "—"}
                </TableCell>
                <TableCell className="px-3 py-3.5">
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="px-3 py-3.5 text-sm text-[#5a5b70]">{formatDate(row.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </HatchPanel>
    </div>
  );
}
