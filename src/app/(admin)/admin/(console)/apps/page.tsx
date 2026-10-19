import Link from "next/link";
import { CreateAppForm } from "@/components/admin/app-forms";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { HatchPanel, hatchChip, hatchHead, hatchRowTitle } from "@/components/admin/hatch";
import { WithMarker } from "@/components/admin/markers";
import { MobileCard, MobileCards } from "@/components/admin/mobile-list";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appPlatformLabel } from "@/domain/app";
import { formatDateTime } from "@/domain/feedback";
import { requireAdmin } from "@/server/auth/admin";
import { listAdminApps } from "@/server/admin-apps";

export const instant = false;

export const metadata = { title: "Apps" };

export default async function AppsPage() {
  const admin = await requireAdmin();
  const apps = await listAdminApps(admin.workspaceId, admin.id);
  const owner = admin.role === "owner";

  return (
    <>
      <PageHeader
        kicker="Install"
        title="Apps"
        description="Each name opens that app’s install code. The header selector filters the rest of the console."
      />
      {owner ? (
        <div className="px-4 py-6 md:px-8">
          <CreateAppForm />
        </div>
      ) : null}
      {apps.length === 0 ? (
        <EmptyState title="No apps yet" description="No feedback yet. Connect your first app or send test feedback." />
      ) : (
        <div className="px-4 pb-8 md:px-8">
        <MobileCards>
          {apps.map((app) => (
            <MobileCard
              key={app.id}
              href={`/admin/apps/${app.slug}`}
              title={app.name}
              subtitle={appPlatformLabel(app.platform)}
              chips={
                <span className={hatchChip(app.status)}>
                  <WithMarker kind="status">{app.status}</WithMarker>
                </span>
              }
              meta={`Last event ${app.lastEventAt ? formatDateTime(app.lastEventAt) : "—"}`}
            />
          ))}
        </MobileCards>
        <HatchPanel clip className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
              <TableHead className={hatchHead}>Name</TableHead>
              <TableHead className={hatchHead}>Platform</TableHead>
              <TableHead className={hatchHead}>
                <WithMarker kind="status">Status</WithMarker>
              </TableHead>
              <TableHead className={hatchHead}>Last event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id} className="border-[#0e0e1a] hover:bg-[#fffcf2]">
                <TableCell className="px-3 py-3.5">
                  <Link href={`/admin/apps/${app.slug}`} className={hatchRowTitle}>
                    {app.name}
                  </Link>
                </TableCell>
                <TableCell className="px-3 py-3.5 text-sm">{appPlatformLabel(app.platform)}</TableCell>
                <TableCell className="px-3 py-3.5">
                  <span className={hatchChip(app.status)}>
                    <WithMarker kind="status">{app.status}</WithMarker>
                  </span>
                </TableCell>
                <TableCell className="px-3 py-3.5 text-sm text-[#5a5b70]">
                  {app.lastEventAt ? formatDateTime(app.lastEventAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </HatchPanel>
        </div>
      )}
    </>
  );
}
