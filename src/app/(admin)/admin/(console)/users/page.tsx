import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { HatchPanel, hatchDataRow, hatchField, hatchHead, hatchPrimary, hatchRowTitle, hatchSelect } from "@/components/admin/hatch";
import { MobileCard, MobileCards, MobileSort } from "@/components/admin/mobile-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_LIST_LIMIT, nextUserSort, parseUserActivity, parseUserSort, type UserSort, type UserSortDir } from "@/domain/admin";
import { formatDateTime, userLabel } from "@/domain/feedback";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listAdminUsers, listUserPlans } from "@/server/admin-users";

export const instant = false;

export const metadata = { title: "Users" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const COLUMNS: { sort: UserSort; label: string }[] = [
  { sort: "user", label: "User" },
  { sort: "app", label: "App" },
  { sort: "plan", label: "Plan" },
  { sort: "feedback", label: "Feedback" },
  { sort: "votes", label: "Votes" },
  { sort: "conversations", label: "Conversations" },
  { sort: "lastSeen", label: "Last seen" },
];

function usersHref(
  filters: { q: string; plan: string; activity: string },
  sort: UserSort,
  dir: UserSortDir,
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.plan) params.set("plan", filters.plan);
  if (filters.activity) params.set("activity", filters.activity);
  if (!(sort === "lastSeen" && dir === "desc")) {
    params.set("sort", sort);
    params.set("dir", dir);
  }
  const query = params.toString();
  return query ? `/admin/users?${query}` : "/admin/users";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const [params, selected] = await Promise.all([searchParams, getSelectedApp(admin.workspaceId, admin.id)]);
  const q = first(params.q) ?? "";
  const plan = first(params.plan) ?? "";
  const activity = parseUserActivity(first(params.activity));
  const { sort, dir } = parseUserSort(first(params.sort), first(params.dir));
  const appId = selected?.id ?? null;
  const plans = await listUserPlans({ workspaceId: admin.workspaceId, appId, adminId: admin.id });
  const planFilter = plan && plans.includes(plan) ? plan : "";
  const filters = { q, plan: planFilter, activity: activity ?? "" };
  const result = await listAdminUsers({
    workspaceId: admin.workspaceId,
    appId,
    search: q,
    plan: planFilter || null,
    activity,
    sort,
    dir,
    adminId: admin.id,
  });

  return (
    <>
      <PageHeader
        kicker="People"
        title="Users"
        description={
          selected
            ? `People identified in ${selected.name}. This is product context, not a CRM.`
            : "People identified in every app. This is product context, not a CRM."
        }
      />
      <form method="get" className="flex flex-wrap items-center gap-2 px-4 py-4 md:px-8">
        {sort === "lastSeen" && dir === "desc" ? null : (
          <>
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="dir" value={dir} />
          </>
        )}
        <Input
          name="q"
          defaultValue={q}
          placeholder="Name, email, or user id"
          aria-label="Search users"
          className={`${hatchField} w-full sm:w-64`}
        />
        <select
          name="plan"
          defaultValue={planFilter}
          aria-label="Plan"
          className={`${hatchSelect} min-w-0 grow basis-[calc(50%-0.25rem)] sm:grow-0 sm:basis-auto`}
        >
          <option value="">All plans</option>
          {plans.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          name="activity"
          defaultValue={activity ?? ""}
          aria-label="Activity"
          className={`${hatchSelect} min-w-0 grow basis-[calc(50%-0.25rem)] sm:grow-0 sm:basis-auto`}
        >
          <option value="">Any activity</option>
          <option value="recent">Seen in the last 30 days</option>
          <option value="quiet">Not seen in the last 30 days</option>
        </select>
        <Button type="submit" className={hatchPrimary}>Search</Button>
      </form>
      {result.truncated ? (
        <p className="px-4 pt-3 text-xs text-muted-foreground md:px-6">Showing the latest {ADMIN_LIST_LIMIT}.</p>
      ) : null}
      {result.rows.length > 0 ? (
        <div className="px-4 pb-8 md:px-8">
        <MobileSort
          options={COLUMNS.map((column) => {
            const next = nextUserSort({ sort, dir }, column.sort);
            return { value: column.sort, label: column.label, href: usersHref(filters, next.sort, next.dir) };
          })}
          value={sort}
          dir={dir}
          flipHref={(() => {
            const next = nextUserSort({ sort, dir }, sort);
            return usersHref(filters, next.sort, next.dir);
          })()}
        />
        <MobileCards>
          {result.rows.map((row) => (
            <MobileCard
              key={row.id}
              href={`/admin/users/${row.id}`}
              title={userLabel(row)}
              subtitle={[row.email && row.name ? row.email : null, row.appName, row.plan || null].filter(Boolean).join(" · ")}
              meta={`${row.feedbackCount} feedback · ${row.voteCount} votes · ${row.conversationCount} conversations · Last seen ${formatDateTime(row.lastSeenAt)}`}
            />
          ))}
        </MobileCards>
        <HatchPanel clip className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
              {COLUMNS.map((column) => {
                const active = sort === column.sort;
                const next = nextUserSort({ sort, dir }, column.sort);
                return (
                  <TableHead
                    key={column.sort}
                    className={hatchHead}
                    aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <Link
                      href={usersHref(filters, next.sort, next.dir)}
                      className="inline-flex items-center gap-1 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#0e0e1a] uppercase no-underline [font-family:var(--font-mono)] hover:text-[#0e0e1a]"
                    >
                      {column.label}
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
            {result.rows.map((row) => (
              <TableRow key={row.id} className={hatchDataRow}>
                <TableCell className="px-3 py-3.5 whitespace-normal">
                  <Link href={`/admin/users/${row.id}`} className={`${hatchRowTitle} after:absolute after:inset-0`}>
                    {userLabel(row)}
                  </Link>
                  {row.email && row.name ? (
                    <span className="mt-1 block text-xs text-[#5a5b70]">{row.email}</span>
                  ) : null}
                </TableCell>
                <TableCell>{row.appName}</TableCell>
                <TableCell>{row.plan || "—"}</TableCell>
                <TableCell>{row.feedbackCount}</TableCell>
                <TableCell>{row.voteCount}</TableCell>
                <TableCell>{row.conversationCount}</TableCell>
                <TableCell className="px-3 py-3.5 text-sm text-[#5a5b70]">{formatDateTime(row.lastSeenAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </HatchPanel>
        </div>
      ) : result.totalInScope === 0 ? (
        <EmptyState title="No users yet" description="Users appear here after an app identifies them." />
      ) : (
        <EmptyState title="No matching users" description="Nothing matches this search. Clear it to see everyone in this app." />
      )}
    </>
  );
}
