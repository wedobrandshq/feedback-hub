import { ProfileForm } from "@/components/admin/profile-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/server/auth/admin";
import { listConsolePeople } from "@/server/console-people";

export const instant = false;

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const owner = admin.role === "owner";
  const people = owner ? await listConsolePeople(admin.workspaceId) : [];
  const onlyOwner = people.filter((person) => person.role === "owner").length <= 1;

  return (
    <>
      <PageHeader
        kicker="Account"
        title="Settings"
        description={
          owner
            ? "Your name, email, and password. You can also rename the company and change your role."
            : "Your name, email, and password. A new password needs your current one."
        }
      />
      <ProfileForm
        name={admin.name}
        email={admin.email}
        role={admin.role}
        workspaceName={admin.workspaceName}
        canManage={owner}
        onlyOwner={onlyOwner}
      />
    </>
  );
}
