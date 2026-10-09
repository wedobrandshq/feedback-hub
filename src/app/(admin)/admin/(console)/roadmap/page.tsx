import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { RoadmapMoveForm } from "@/components/admin/request-forms";
import { ADMIN_ROADMAP_STATUSES, REQUEST_STATUS_LABELS } from "@/domain/request";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listRoadmap } from "@/server/requests";

export const instant = false;

export const metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const admin = await requireAdmin();
  const selected = await getSelectedApp(admin.workspaceId);
  const rows = await listRoadmap({ workspaceId: admin.workspaceId, appId: selected?.id ?? null });

  return (
    <>
      <PageHeader
        title="Roadmap"
        description={
          selected
            ? `Public ${selected.name} requests. Moving a status writes an event and does not notify anyone.`
            : "Public requests from every app. Moving a status writes an event and does not notify anyone."
        }
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
                  <ul className="mt-1">
                    {items.map((item) => (
                      <li key={item.id} className="border-t border-border py-3" data-roadmap={status}>
                        <Link href={`/admin/requests/${item.id}`} className="text-sm font-medium">
                          {item.title}
                        </Link>
                        {!selected ? <p className="text-xs text-muted-foreground">{item.app.name}</p> : null}
                        <RoadmapMoveForm requestId={item.id} status={item.status} />
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
