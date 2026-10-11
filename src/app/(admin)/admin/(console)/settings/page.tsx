import { ProfileForm } from "@/components/admin/profile-form";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/server/auth/admin";

export const instant = false;

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your name, email, and password. A new password needs your current one."
      />
      <ProfileForm name={admin.name} email={admin.email} role={admin.role} workspaceName={admin.workspaceName} />
    </>
  );
}
