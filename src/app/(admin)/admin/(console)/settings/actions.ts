"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { updateOwnProfile } from "@/server/console-people";

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
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message, saved: false };
    throw error;
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings");
  return { error: null, saved: true };
}
