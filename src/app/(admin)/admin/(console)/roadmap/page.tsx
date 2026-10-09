import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { ADMIN_ROADMAP_STATUSES, REQUEST_STATUS_LABELS } from "@/domain/request";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listRoadmap } from "@/server/requests";

export const metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const admin = await requireAdmin();
  const selected = await getSelectedApp(admin.workspaceId);
  const rows = await listRoadmap({ workspaceId: admin.workspaceId, appId: selected?.id ?? null });

  return (
    <>
      <PageHeader
        title="Roadmap"
        description="Public requests grouped by status. Moving a request writes an event and does not notify anyone until you choose to."
      />
      {rows.length === 0 ? (
        <EmptyState title="Nothing on the roadmap" description="Publish a request and set a roadmap status to see it here." />
      ) : (
        <div className="grid gap-8 px-4 py-6 md:px-6 lg:grid-cols-4">
          {ADMIN_ROADMAP_STATUSES.map((status) => {
            const items = rows.filter((row) => row.status === status);
            return (
              <section key={status}>
                <h2 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {REQUEST_STATUS_LABELS[status]}
                </h2>
                {items.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">None</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Link href={`/admin/requests/${item.id}`} className="text-sm font-medium">
                          {item.title}
                        </Link>
                        {!selected ? <p className="text-xs text-muted-foreground">{item.app.name}</p> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
