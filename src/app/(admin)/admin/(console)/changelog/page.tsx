import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { formatDateTime } from "@/domain/feedback";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listAdminChangelog } from "@/server/requests";

export const metadata = { title: "Changelog" };

export default async function ChangelogPage() {
  const admin = await requireAdmin();
  const selected = await getSelectedApp(admin.workspaceId);
  const rows = await listAdminChangelog({ workspaceId: admin.workspaceId, appId: selected?.id ?? null });

  return (
    <>
      <PageHeader title="Changelog" description="Released requests, one short entry each." />
      {rows.length === 0 ? (
        <EmptyState title="No changelog entries" description="A released request can add one entry from its page." />
      ) : (
        <ul className="divide-y divide-border px-4 md:px-6">
          {rows.map((row) => (
            <li key={row.id} className="py-4">
              <Link href={`/admin/requests/${row.request.id}`} className="text-sm font-medium">
                {row.title}
              </Link>
              <p className="mt-1 text-sm whitespace-pre-wrap">{row.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.app.name} · {formatDateTime(row.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
