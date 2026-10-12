"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { setConsoleRole, updateOwnProfile, updateWorkspaceName } from "@/server/console-people";

export type ProfileState = { error: string | null; saved: boolean };

export async function updateProfileAction(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const admin = await requireAdmin();
  try {
    await updateOwnProfile({
      adminId: admin.id,
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      currentPassword: String(formData.get("currentPassword") ?? ""),
      nextPassword: String(formData.get("nextPassword") ?? ""),
    });
    if (admin.role === "owner") {
      await updateWorkspaceName({
        actorRole: admin.role,
        workspaceId: admin.workspaceId,
        name: String(formData.get("workspaceName") ?? ""),
      });
      const role = String(formData.get("role") ?? "");
      if (role && role !== admin.role) {
        await setConsoleRole({
          actorRole: admin.role,
          workspaceId: admin.workspaceId,
          personId: admin.id,
          role,
        });
      }
    }
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message, saved: false };
    throw error;
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  return { error: null, saved: true };
}
