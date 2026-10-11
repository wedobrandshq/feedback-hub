import Link from "next/link";
import { HatchPanel, hatchChip, hatchDataRow, hatchHead, hatchRowTitle } from "@/components/admin/hatch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { feedbackPreview, formatDateTime, userLabel } from "@/domain/feedback";
import type { InboxRow } from "@/server/conversations";

function Attention({ row }: { row: InboxRow }) {
  if (row.status === "closed") return <span className={hatchChip("closed")}>Closed</span>;
  if (row.needsReply) return <span className={hatchChip("needs_reply")}>Needs reply</span>;
  return <span className={hatchChip("open")}>Open</span>;
}

export function InboxTable({ rows }: { rows: InboxRow[] }) {
  return (
    <div className="px-4 py-4 md:px-8">
      <HatchPanel clip>
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
              <TableHead className={hatchHead}>Conversation</TableHead>
              <TableHead className={hatchHead}>User</TableHead>
              <TableHead className={hatchHead}>App</TableHead>
              <TableHead className={hatchHead}>Attention</TableHead>
              <TableHead className={hatchHead}>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={hatchDataRow}>
                <TableCell className="max-w-md px-3 py-3.5 font-normal whitespace-normal">
                  <Link href={`/admin/inbox/${row.id}`} className={`${hatchRowTitle} after:absolute after:inset-0`}>
                    <span className="inline-flex items-center gap-2">
                      {row.unread ? (
                        <span className="size-2 shrink-0 rounded-full border border-[#0e0e1a] bg-[#c6ff4f]" aria-label="Unread" />
                      ) : null}
                      {feedbackPreview(row.preview)}
                    </span>
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
                  <Attention row={row} />
                </TableCell>
                <TableCell className="px-3 py-3.5 text-sm text-[#5a5b70]">{formatDateTime(row.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </HatchPanel>
    </div>
  );
}
