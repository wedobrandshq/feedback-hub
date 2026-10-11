import Link from "next/link";
import { HatchPanel, hatchDataRow, hatchHead, hatchRowTitle } from "@/components/admin/hatch";
import { StatusBadge, TypeBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="px-4 py-4 md:px-8">
      <HatchPanel>
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
              <TableHead className={hatchHead}>Feedback</TableHead>
              <TableHead className={hatchHead}>User</TableHead>
              <TableHead className={hatchHead}>App</TableHead>
              <TableHead className={hatchHead}>Type</TableHead>
              <TableHead className={hatchHead}>Request</TableHead>
              <TableHead className={hatchHead}>Status</TableHead>
              <TableHead className={hatchHead}>Created</TableHead>
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
