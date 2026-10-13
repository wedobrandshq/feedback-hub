"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { setConsoleRole, updateOwnProfile, updateWorkspaceName } from "@/server/console-people";

export type ProfileDraft = {
  workspaceName: string;
  role: string;
  name: string;
  email: string;
  currentPassword: string;
  nextPassword: string;
  passwordConfirm: string;
};

export type ProfileState = { error: string | null; saved: boolean; fields: ProfileDraft | null };

function profileDraft(formData: FormData): ProfileDraft {
  return {
    workspaceName: String(formData.get("workspaceName") ?? ""),
    role: String(formData.get("role") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    currentPassword: String(formData.get("currentPassword") ?? ""),
    nextPassword: String(formData.get("nextPassword") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };
}

export async function updateProfileAction(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const admin = await requireAdmin();
  const fields = profileDraft(formData);
  try {
    await updateOwnProfile({
      adminId: admin.id,
      name: fields.name,
      email: fields.email,
      currentPassword: fields.currentPassword,
      nextPassword: fields.nextPassword,
      passwordConfirm: fields.passwordConfirm,
    });
    if (admin.role === "owner") {
      await updateWorkspaceName({
        actorRole: admin.role,
        workspaceId: admin.workspaceId,
        name: fields.workspaceName,
      });
      if (fields.role && fields.role !== admin.role) {
        await setConsoleRole({
          actorRole: admin.role,
          workspaceId: admin.workspaceId,
          personId: admin.id,
          role: fields.role,
        });
      }
    }
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message, saved: false, fields };
    throw error;
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  return { error: null, saved: true, fields: null };
}
