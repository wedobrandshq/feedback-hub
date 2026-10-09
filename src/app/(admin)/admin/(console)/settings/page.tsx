import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/server/auth/admin";

export const instant = false;

export const metadata = { title: "Settings" };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 border-t border-border py-3 text-sm first:border-t-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const role = admin.role === "owner" ? "Owner" : admin.role;

  return (
    <>
      <PageHeader title="Settings" description="Who is signed in, and which workspace this console belongs to." />
      <dl className="max-w-lg px-4 py-6 md:px-6">
        <Row label="Workspace" value={admin.workspaceName} />
        <Row label="Name" value={admin.name} />
        <Row label="Email" value={admin.email} />
        <Row label="Role" value={role} />
      </dl>
    </>
  );
}
