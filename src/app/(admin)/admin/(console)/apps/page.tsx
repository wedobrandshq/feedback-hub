import Link from "next/link";
import { CreateAppForm } from "@/components/admin/app-forms";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { HatchPanel, hatchChip, hatchHead, hatchRowTitle } from "@/components/admin/hatch";
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
  const apps = await listAdminApps(admin.workspaceId);
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
          <HatchPanel>
            <div className="px-5 py-5">
              <CreateAppForm />
            </div>
          </HatchPanel>
        </div>
      ) : null}
      {apps.length === 0 ? (
        <EmptyState title="No apps yet" description="No feedback yet. Connect your first app or send test feedback." />
      ) : (
        <div className="px-4 pb-8 md:px-8">
        <HatchPanel clip>
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#0e0e1a] hover:bg-transparent">
              <TableHead className={hatchHead}>Name</TableHead>
              <TableHead className={hatchHead}>Platform</TableHead>
              <TableHead className={hatchHead}>Status</TableHead>
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
                  <span className={hatchChip(app.status)}>{app.status}</span>
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
