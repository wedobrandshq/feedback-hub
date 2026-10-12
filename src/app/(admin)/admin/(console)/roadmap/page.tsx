import Link from "next/link";
import { EmptyState } from "@/components/admin/empty-state";
import { HatchPanel, hatchRowTitle, hatchSticker } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
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
        kicker="Public"
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
        <div className="grid gap-6 px-4 py-6 md:px-8 lg:grid-cols-3">
          {ADMIN_ROADMAP_STATUSES.map((status, index) => {
            const items = rows.filter((row) => row.status === status);
            const wash = (["lilac", "mint", "sky"] as const)[index] ?? "white";
            return (
              <HatchPanel key={status} wash={wash}>
                <section className="px-4 py-4">
                <h2 className={hatchSticker}>
                  <WithMarker kind="status">{REQUEST_STATUS_LABELS[status]}</WithMarker>
                </h2>
                {items.length === 0 ? (
                  <p className="mt-4 text-sm text-[#5a5b70]">None</p>
                ) : (
                  <ul className="mt-3">
                    {items.map((item) => (
                      <li key={item.id} className="border-t border-[#0e0e1a] py-3" data-roadmap={status}>
                        <Link href={`/admin/requests/${item.id}`} className={hatchRowTitle}>
                          {item.title}
                        </Link>
                        {!selected ? <p className="text-xs text-[#5a5b70]">{item.app.name}</p> : null}
                        <RoadmapMoveForm requestId={item.id} status={item.status} />
                      </li>
                    ))}
                  </ul>
                )}
                </section>
              </HatchPanel>
            );
          })}
        </div>
      )}
    </>
  );
}
