import { connection } from "next/server";
import { notFound } from "next/navigation";
import { InstallCodeBlock } from "@/components/admin/install-code";
import { PageHeader } from "@/components/admin/page-header";
import { hostServerInstall, viewInstall } from "@/domain/install-code";
import { requireAdmin } from "@/server/auth/admin";
import { resolveAppSecret } from "@/server/app-install";
import { prisma } from "@/server/db";

export const instant = false;

export const metadata = { title: "Install" };

export default async function AppInstallPage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const [{ slug }, admin] = await Promise.all([params, requireAdmin()]);
  const app = await prisma.app.findFirst({
    where: { workspaceId: admin.workspaceId, slug },
    select: { id: true, name: true, credentialHash: true, issuedCredential: true },
  });
  if (!app) notFound();

  const secret = await resolveAppSecret(app);
  const serverCode = hostServerInstall(app.name, secret);
  const viewCode = viewInstall(app.name);

  return (
    <>
      <PageHeader
        title={app.name}
        description="Install code for this app. The host server sends the user it already knows. A tap on the view opens the Feedback Hub window."
      />
      <div className="space-y-10 px-4 py-6 md:px-6">
        <InstallCodeBlock
          id="server"
          title="Host server"
          description="Run this on the server that already knows the user. The bearer value is this app’s secret."
          code={serverCode}
          secret={secret}
        />
        <InstallCodeBlock
          id="view"
          title="The view"
          description="Put this on the view and attach it to your icon or button. Replace SESSION with the session from the host server. This block has no secret."
          code={viewCode}
        />
      </div>
    </>
  );
}
