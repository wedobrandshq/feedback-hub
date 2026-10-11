import Link from "next/link";
import { CreateAppForm } from "@/components/admin/app-forms";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
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
        title="Apps"
        description="Each name opens that app’s install code. The header selector filters the rest of the console."
      />
      {owner ? (
        <div className="border-b border-border px-4 py-6 md:px-6">
          <CreateAppForm />
        </div>
      ) : null}
      {apps.length === 0 ? (
        <EmptyState title="No apps yet" description="No feedback yet. Connect your first app or send test feedback." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <Link href={`/admin/apps/${app.slug}`} className="font-medium underline-offset-4 hover:underline">
                    {app.name}
                  </Link>
                </TableCell>
                <TableCell>{appPlatformLabel(app.platform)}</TableCell>
                <TableCell className="capitalize">{app.status}</TableCell>
                <TableCell className="text-muted-foreground">
                  {app.lastEventAt ? formatDateTime(app.lastEventAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
