import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { HatchPanel, hatchRowTitle } from "@/components/admin/hatch";
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
      <PageHeader kicker="Released" title="Changelog" description="Released requests, one short entry each." />
      {rows.length === 0 ? (
        <EmptyState title="No changelog entries" description="A released request can add one entry from its page." />
      ) : (
        <div className="px-4 py-6 md:px-8">
          <HatchPanel>
            <ul>
              {rows.map((row) => (
                <li key={row.id} className="border-b border-[#0e0e1a]/15 px-5 py-4 last:border-b-0">
                  <Link href={`/admin/requests/${row.request.id}`} className={hatchRowTitle}>
                    {row.title}
                  </Link>
                  <p className="mt-1 text-sm leading-6 whitespace-pre-wrap text-[#0e0e1a]">{row.body}</p>
                  <p className="mt-1 text-xs text-[#5a5b70]">
                    {row.app.name} · {formatDateTime(row.publishedAt)}
                  </p>
                </li>
              ))}
            </ul>
          </HatchPanel>
        </div>
      )}
    </>
  );
}
