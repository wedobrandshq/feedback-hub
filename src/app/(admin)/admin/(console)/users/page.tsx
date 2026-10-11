import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { HatchPanel, hatchDataRow, hatchField, hatchHead, hatchPrimary, hatchRowTitle, hatchSelect } from "@/components/admin/hatch";
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
import { ADMIN_LIST_LIMIT, parseUserActivity } from "@/domain/admin";
import { formatDateTime, userLabel } from "@/domain/feedback";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listAdminUsers, listUserPlans } from "@/server/admin-users";

export const instant = false;

export const metadata = { title: "Users" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const [params, selected] = await Promise.all([searchParams, getSelectedApp(admin.workspaceId)]);
  const q = first(params.q) ?? "";
  const plan = first(params.plan) ?? "";
  const activity = parseUserActivity(first(params.activity));
  const appId = selected?.id ?? null;
  const plans = await listUserPlans({ workspaceId: admin.workspaceId, appId });
  const planFilter = plan && plans.includes(plan) ? plan : "";
  const result = await listAdminUsers({
    workspaceId: admin.workspaceId,
    appId,
    search: q,
    plan: planFilter || null,
    activity,
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
          className={hatchSelect}
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
          className={hatchSelect}
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
        <HatchPanel>
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
              <TableHead className={hatchHead}>User</TableHead>
              <TableHead className={hatchHead}>App</TableHead>
              <TableHead className={hatchHead}>Plan</TableHead>
              <TableHead className={hatchHead}>Feedback</TableHead>
              <TableHead className={hatchHead}>Votes</TableHead>
              <TableHead className={hatchHead}>Conversations</TableHead>
              <TableHead className={hatchHead}>Last seen</TableHead>
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
