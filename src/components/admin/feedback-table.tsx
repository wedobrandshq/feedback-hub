import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, TypeBadge } from "@/components/admin/status-badge";
import { feedbackPreview, formatDate, userLabel } from "@/domain/feedback";
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

export function FeedbackTable({ rows }: { rows: FeedbackRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Feedback</TableHead>
          <TableHead>User</TableHead>
          <TableHead>App</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Request</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="relative">
            <TableCell className="max-w-md font-medium whitespace-normal">
              <Link href={`/admin/feedback/${row.id}`} className="after:absolute after:inset-0">
                {feedbackPreview(row.body)}
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
              <TypeBadge type={row.type} />
            </TableCell>
            <TableCell className="max-w-40 whitespace-normal text-muted-foreground">
              {row.requestLink ? row.requestLink.request.title : "—"}
            </TableCell>
            <TableCell>
              <StatusBadge status={row.status} />
            </TableCell>
            <TableCell className="text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
