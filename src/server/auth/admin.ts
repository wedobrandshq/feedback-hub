import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { readSelectedAppCookie, readSessionAdminId } from "@/server/auth/session";

export type CurrentAdmin = {
  id: string;
  email: string;
  name: string;
  role: string;
  workspaceId: string;
  workspaceName: string;
};

export async function requireAdmin(): Promise<CurrentAdmin> {
  const adminId = await readSessionAdminId();
  if (!adminId) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({
    where: { id: adminId },
    include: { workspace: true },
  });
  if (!admin) redirect("/admin/login");

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    workspaceId: admin.workspaceId,
    workspaceName: admin.workspace.name,
  };
}

export async function getSelectedApp(workspaceId: string) {
  const appId = await readSelectedAppCookie();
  if (!appId) return null;
  return prisma.app.findFirst({
    where: { id: appId, workspaceId },
    select: { id: true, name: true, slug: true },
  });
}
