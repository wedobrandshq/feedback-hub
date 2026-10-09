import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/domain/feedback";
import { REQUEST_SORTS, REQUEST_STATUS_LABELS, type RequestSortName } from "@/domain/request";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listAdminRequests } from "@/server/requests";

export const metadata = { title: "Requests" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function sortOf(value: string | undefined): RequestSortName {
  if (value && (REQUEST_SORTS as readonly string[]).includes(value)) return value as RequestSortName;
  return "updated";
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const [params, selected] = await Promise.all([searchParams, getSelectedApp(admin.workspaceId)]);
  const sort = sortOf(first(params.sort));
  const rows = await listAdminRequests({
    workspaceId: admin.workspaceId,
    appId: selected?.id ?? null,
    sort,
  });

  return (
    <>
      <PageHeader
        title="Requests"
        description={selected ? `Product requests from ${selected.name}.` : "Product requests across every app."}
      />
      <nav aria-label="Sort requests" className="flex gap-1 overflow-x-auto border-b border-border px-4 py-3 md:px-6">
        {REQUEST_SORTS.map((item) => (
          <Link
            key={item}
            href={item === "updated" ? "/admin/requests" : `/admin/requests?sort=${item}`}
            aria-current={sort === item ? "page" : undefined}
            className={`rounded-md px-2.5 py-1.5 text-sm capitalize ${sort === item ? "bg-muted font-medium" : "text-muted-foreground"}`}
          >
            {item === "feedback" ? "Feedback" : item === "votes" ? "Votes" : item === "created" ? "Created" : "Updated"}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <EmptyState
          title="No requests yet"
          description="No requests yet. Create a Request from user feedback instead of creating speculative roadmap items."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Conversations</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="relative">
                <TableCell className="max-w-xs font-medium whitespace-normal">
                  <Link href={`/admin/requests/${row.id}`} className="after:absolute after:inset-0">
                    {row.title}
                  </Link>
                  {!selected ? <span className="mt-1 block text-xs text-muted-foreground">{row.appName}</span> : null}
                </TableCell>
                <TableCell>{REQUEST_STATUS_LABELS[row.status]}</TableCell>
                <TableCell className="capitalize">{row.visibility}</TableCell>
                <TableCell>{row.feedbackCount}</TableCell>
                <TableCell>{row.uniqueFeedbackUsers}</TableCell>
                <TableCell>{row.voteCount}</TableCell>
                <TableCell>{row.conversationCount}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(row.createdAt)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(row.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
