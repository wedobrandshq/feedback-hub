import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/domain/feedback";
import { requireAdmin } from "@/server/auth/admin";
import { listAdminApps } from "@/server/admin-apps";
import { openAppAction } from "@/app/(admin)/admin/(console)/actions";

export const instant = false;

export const metadata = { title: "Apps" };

function platformLabel(platform: string) {
  if (platform === "CrossPlatform") return "Cross-platform";
  return platform;
}

export default async function AppsPage() {
  const admin = await requireAdmin();
  const apps = await listAdminApps(admin.workspaceId);

  return (
    <>
      <PageHeader
        title="Apps"
        description="Connected applications in this workspace. Open one to read its feedback, requests, and roadmap."
      />
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
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell>{platformLabel(app.platform)}</TableCell>
                <TableCell className="capitalize">{app.status}</TableCell>
                <TableCell className="text-muted-foreground">
                  {app.lastEventAt ? formatDateTime(app.lastEventAt) : "—"}
                </TableCell>
                <TableCell>
                  <form action={openAppAction}>
                    <input type="hidden" name="app" value={app.id} />
                    <Button type="submit" variant="outline" size="sm">Open</Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
