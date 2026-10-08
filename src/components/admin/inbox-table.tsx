import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
  if (row.status === "closed") {
    return (
      <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
        Closed
      </Badge>
    );
  }
  if (row.needsReply) {
    return (
      <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-950">
        Needs reply
      </Badge>
    );
  }
  return <span className="text-sm text-muted-foreground">Open</span>;
}

export function InboxTable({ rows }: { rows: InboxRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Conversation</TableHead>
          <TableHead>User</TableHead>
          <TableHead>App</TableHead>
          <TableHead>Attention</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="relative">
            <TableCell className="max-w-md font-medium whitespace-normal">
              <Link href={`/admin/inbox/${row.id}`} className="after:absolute after:inset-0">
                <span className="inline-flex items-center gap-2">
                  {row.unread ? (
                    <span className="size-2 shrink-0 rounded-full bg-sky-700" aria-label="Unread" />
                  ) : null}
                  {feedbackPreview(row.preview)}
                </span>
              </Link>
            </TableCell>
            <TableCell className="whitespace-normal">
              <span className="block">{userLabel(row.user)}</span>
              {row.user.email && row.user.name ? (
                <span className="block text-xs text-muted-foreground">{row.user.email}</span>
              ) : null}
            </TableCell>
            <TableCell>{row.app.name}</TableCell>
            <TableCell>
              <Attention row={row} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDateTime(row.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
