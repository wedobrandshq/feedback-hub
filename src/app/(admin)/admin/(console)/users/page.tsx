import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
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
        title="Users"
        description={
          selected
            ? `People identified in ${selected.name}. This is product context, not a CRM.`
            : "People identified in every app. This is product context, not a CRM."
        }
      />
      <form method="get" className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3 md:px-6">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Name, email, or user id"
          aria-label="Search users"
          className="w-full sm:w-64"
        />
        <select
          name="plan"
          defaultValue={planFilter}
          aria-label="Plan"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
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
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">Any activity</option>
          <option value="recent">Seen in the last 30 days</option>
          <option value="quiet">Not seen in the last 30 days</option>
        </select>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      {result.truncated ? (
        <p className="px-4 pt-3 text-xs text-muted-foreground md:px-6">Showing the latest {ADMIN_LIST_LIMIT}.</p>
      ) : null}
      {result.rows.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>App</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Votes</TableHead>
              <TableHead>Conversations</TableHead>
              <TableHead>Last seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.rows.map((row) => (
              <TableRow key={row.id} className="relative">
                <TableCell className="whitespace-normal">
                  <Link href={`/admin/users/${row.id}`} className="font-medium after:absolute after:inset-0">
                    {userLabel(row)}
                  </Link>
                  {row.email && row.name ? (
                    <span className="mt-1 block text-xs text-muted-foreground">{row.email}</span>
                  ) : null}
                </TableCell>
                <TableCell>{row.appName}</TableCell>
                <TableCell>{row.plan || "—"}</TableCell>
                <TableCell>{row.feedbackCount}</TableCell>
                <TableCell>{row.voteCount}</TableCell>
                <TableCell>{row.conversationCount}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(row.lastSeenAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : result.totalInScope === 0 ? (
        <EmptyState title="No users yet" description="Users appear here after an app identifies them." />
      ) : (
        <EmptyState title="No matching users" description="Nothing matches this search. Clear it to see everyone in this app." />
      )}
    </>
  );
}
