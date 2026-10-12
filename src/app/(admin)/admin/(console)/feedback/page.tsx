import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { hatchPrimary, hatchSecondary } from "@/components/admin/hatch";
import { FeedbackTable } from "@/components/admin/feedback-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { PageHeader } from "@/components/admin/page-header";
import { FEEDBACK_LIST_LIMIT } from "@/domain/config";
import { parseFeedbackFilters, parseFeedbackSort } from "@/domain/feedback";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listFeedback } from "@/server/feedback-queries";

export const metadata = { title: "Feedback" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const [params, selected] = await Promise.all([searchParams, getSelectedApp(admin.workspaceId, admin.id)]);
  const raw = {
    q: first(params.q) ?? "",
    type: first(params.type) ?? "",
    status: first(params.status) ?? "",
    from: first(params.from) ?? "",
    to: first(params.to) ?? "",
  };
  const filters = parseFeedbackFilters(raw);
  const sort = parseFeedbackSort(first(params.sort), first(params.dir));
  const result = filters.error
    ? null
    : await listFeedback({
        workspaceId: admin.workspaceId,
        appId: selected?.id ?? null,
        adminId: admin.id,
        filters,
        sort: sort.sort,
        dir: sort.dir,
      });

  return (
    <>
      <PageHeader
        kicker="Feedback"
        title="Feedback"
        description={
          selected
            ? `Original messages from ${selected.name}, kept exactly as people sent them.`
            : "Original messages from every app, kept exactly as people sent them."
        }
      />
      <FilterBar q={raw.q} type={raw.type} status={raw.status} from={raw.from} to={raw.to} sort={sort.sort} dir={sort.dir} />
      {filters.error ? (
        <p className="px-4 py-3 text-sm text-destructive md:px-6" role="alert">
          {filters.error}
        </p>
      ) : null}
      {result && result.truncated ? (
        <p className="px-4 pt-3 text-xs text-muted-foreground md:px-6">
          Showing {FEEDBACK_LIST_LIMIT} of {result.matched}.
        </p>
      ) : null}
      {result && result.rows.length > 0 ? (
        <FeedbackTable rows={result.rows} sort={sort.sort} dir={sort.dir} filters={raw} />
      ) : result && result.totalInScope === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="No feedback yet. Connect your first app or send test feedback."
          action={
            <Link href="/demo" className={hatchPrimary}>
              Send test feedback
            </Link>
          }
        />
      ) : result ? (
        <EmptyState
          title="No matching feedback"
          description="Nothing matches these filters. Clear them to see every message in this app."
          action={
            <Link href="/admin/feedback" className={hatchSecondary}>
              Clear filters
            </Link>
          }
        />
      ) : null}
    </>
  );
}
