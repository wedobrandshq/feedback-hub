import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { hatchStrong } from "@/components/admin/hatch";
import { InboxFilters } from "@/components/admin/inbox-filters";
import { InboxTable } from "@/components/admin/inbox-table";
import { PageHeader } from "@/components/admin/page-header";
import { INBOX_LIST_LIMIT } from "@/domain/config";
import { emptyInboxCopy, parseInboxFilter } from "@/domain/conversation";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listInbox } from "@/server/conversations";

export const metadata = { title: "Inbox" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const [params, selected] = await Promise.all([searchParams, getSelectedApp(admin.workspaceId)]);
  const parsed = parseInboxFilter(first(params.filter));
  const result = parsed.error
    ? null
    : await listInbox({
        workspaceId: admin.workspaceId,
        appId: selected?.id ?? null,
        filter: parsed.filter,
      });
  const empty = emptyInboxCopy(parsed.filter, selected?.name ?? null);
  const noneYet = emptyInboxCopy("all", selected?.name ?? null);

  return (
    <>
      <PageHeader
        kicker="Messages"
        title="Inbox"
        description={
          selected
            ? `Conversations with people using ${selected.name}.`
            : "Conversations that need attention, across every app."
        }
      />
      <InboxFilters current={parsed.filter} />
      {parsed.error ? (
        <p className="px-4 py-3 text-sm text-destructive md:px-6" role="alert">
          {parsed.error}
        </p>
      ) : null}
      {result && result.truncated ? (
        <p className="px-4 pt-3 text-xs text-muted-foreground md:px-6">
          Showing the latest {INBOX_LIST_LIMIT}.
        </p>
      ) : null}
      {result && result.rows.length > 0 ? (
        <InboxTable rows={result.rows} />
      ) : result && result.totalInScope === 0 ? (
        <EmptyState
          title={noneYet.title}
          description={noneYet.description}
          action={
            <Link href="/demo" className={hatchStrong}>
              Send test feedback
            </Link>
          }
        />
      ) : result ? (
        <EmptyState title={empty.title} description={empty.description} />
      ) : null}
    </>
  );
}
