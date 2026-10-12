import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { hatchChip, hatchLift, hatchPrimary, hatchSecondary, hatchSelect } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
import { formatDateTime } from "@/domain/feedback";
import {
  isRequestStatus,
  REQUEST_SORTS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  type RequestSortName,
} from "@/domain/request";
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

function sortLabel(item: RequestSortName) {
  if (item === "feedback") return "Feedback";
  if (item === "votes") return "Votes";
  if (item === "created") return "Created";
  return "Updated";
}

function requestsHref(sort: RequestSortName, status: string) {
  const params = new URLSearchParams();
  if (sort !== "updated") params.set("sort", sort);
  if (status) params.set("status", status);
  const query = params.toString();
  return query ? `/admin/requests?${query}` : "/admin/requests";
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
      {children}
    </span>
  );
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const [params, selected] = await Promise.all([searchParams, getSelectedApp(admin.workspaceId)]);
  const sort = sortOf(first(params.sort));
  const rawStatus = first(params.status) ?? "";
  const status = isRequestStatus(rawStatus) ? rawStatus : "";
  const rows = await listAdminRequests({
    workspaceId: admin.workspaceId,
    appId: selected?.id ?? null,
    sort,
    status: status || null,
  });

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-[#fffcf2] px-4 py-8 text-[#0e0e1a] md:px-8 md:py-10">
      <p className="inline-block rounded-full border-2 border-[#0e0e1a] bg-[#c6ff4f] px-2.5 py-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase shadow-[3px_3px_0_#0e0e1a] [font-family:var(--font-mono)]">
        Product
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl leading-[0.95] font-extrabold tracking-[-0.045em] text-[#0e0e1a] [font-family:var(--font-display)] md:text-5xl">
        Requests
      </h1>
      <p className="mt-3 max-w-xl text-base leading-6 font-normal text-[#5a5b70]">
        {selected ? `Product requests from ${selected.name}.` : "Product requests across every app."}
      </p>
      <nav aria-label="Sort requests" className="mt-6 flex gap-2 overflow-x-auto pt-1 pr-2 pb-2 pl-0.5">
        {REQUEST_SORTS.map((item) => {
          const active = sort === item;
          return (
            <Link
              key={item}
              href={requestsHref(item, status)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex shrink-0 items-center rounded-full border-2 border-[#0e0e1a] px-3.5 py-1.5 text-sm leading-5 font-medium text-[#0e0e1a] shadow-[3px_3px_0_#0e0e1a] hover:shadow-[3px_3px_0_#0e0e1a] ${hatchLift} ${
                active ? "bg-[#c6ff4f]" : "bg-[#fffcf2]"
              }`}
            >
              {sortLabel(item)}
            </Link>
          );
        })}
      </nav>
      <form action="/admin/requests" method="get" className="mt-4 flex flex-wrap items-end gap-3">
        {sort !== "updated" ? <input type="hidden" name="sort" value={sort} /> : null}
        <label className="flex w-full min-w-0 flex-col gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)] sm:w-auto">
          <WithMarker kind="status">Status</WithMarker>
          <select key={status || "all"} name="status" defaultValue={status} className={`${hatchSelect} w-full sm:w-auto`}>
            <option value="">All statuses</option>
            {REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>
                {REQUEST_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className={hatchPrimary}>Apply</Button>
        {status ? (
          <Link href={requestsHref(sort, "")} className={hatchSecondary}>
            Clear
          </Link>
        ) : null}
      </form>
      {rows.length === 0 ? (
        <div className="mt-6 max-w-xl rounded-[32px] border-2 border-[#0e0e1a] bg-white px-6 py-10 shadow-[5px_5px_0_#0e0e1a]">
          <p className="inline-block rounded-full border-2 border-[#0e0e1a] bg-[#c6ff4f] px-2.5 py-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase shadow-[3px_3px_0_#0e0e1a] [font-family:var(--font-mono)]">
            Empty
          </p>
          <h2 className="mt-4 text-2xl leading-none font-extrabold tracking-[-0.04em] text-[#0e0e1a] [font-family:var(--font-display)]">
            {status ? "No matching requests" : "No requests yet"}
          </h2>
          <p className="mt-3 max-w-md text-base leading-6 font-normal text-[#5a5b70]">
            {status
              ? `Nothing matches ${REQUEST_STATUS_LABELS[status]}. Clear the status filter to see every request.`
              : "No requests yet. Create a Request from user feedback instead of creating speculative roadmap items."}
          </p>
          {status ? (
            <Link href={requestsHref(sort, "")} className={`${hatchSecondary} mt-5 inline-flex`}>
              Clear filter
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 rounded-[32px] shadow-[5px_5px_0_#0e0e1a]">
          <div className="overflow-hidden rounded-[32px] border-2 border-[#0e0e1a] bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Request
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    <WithMarker kind="status">Status</WithMarker>
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Visibility
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Feedback
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Users
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Votes
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Conversations
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Created
                  </TableHead>
                  <TableHead className="h-11 px-3 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase [font-family:var(--font-mono)]">
                    Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="relative border-[#0e0e1a] hover:bg-[#fffcf2]">
                    <TableCell className="max-w-xs px-3 py-3.5 font-normal whitespace-normal">
                      <Link
                        href={`/admin/requests/${row.id}`}
                        className="text-base leading-6 font-medium text-[#0e0e1a] after:absolute after:inset-0"
                      >
                        {row.title}
                      </Link>
                      {!selected ? (
                        <span className="mt-1 block text-xs leading-4 font-normal text-[#5a5b70]">{row.appName}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <span className={hatchChip(row.status)}>
                        <WithMarker kind="status">{REQUEST_STATUS_LABELS[row.status]}</WithMarker>
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3.5">
                      <MonoLabel>{row.visibility}</MonoLabel>
                    </TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-[#0e0e1a]">{row.feedbackCount}</TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-[#0e0e1a]">{row.uniqueFeedbackUsers}</TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-[#0e0e1a]">{row.voteCount}</TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-[#0e0e1a]">{row.conversationCount}</TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-[#5a5b70]">{formatDateTime(row.createdAt)}</TableCell>
                    <TableCell className="px-3 py-3.5 text-sm text-[#5a5b70]">{formatDateTime(row.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
