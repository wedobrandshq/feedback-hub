"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { createWorkspaceApp, updateWorkspaceApp } from "@/server/workspace-apps";

export type AppDraft = { name: string; platform: string };

export type AppFormState = { error: string | null; saved: boolean; fields: AppDraft | null };

function fail(error: unknown, fields: AppDraft | null = null): AppFormState {
  if (error instanceof DomainError) return { error: error.message, saved: false, fields };
  throw error;
}

export async function createAppAction(_previous: AppFormState, formData: FormData): Promise<AppFormState> {
  const admin = await requireAdmin();
  const fields = {
    name: String(formData.get("name") ?? ""),
    platform: String(formData.get("platform") ?? ""),
  };
  let slug = "";
  try {
    const app = await createWorkspaceApp({
      actorRole: admin.role,
      actorId: admin.id,
      workspaceId: admin.workspaceId,
      name: fields.name,
      platform: fields.platform,
    });
    slug = app.slug;
  } catch (error) {
    return fail(error, fields);
  }
  revalidatePath("/admin/apps");
  revalidatePath("/admin", "layout");
  redirect(`/admin/apps/${slug}`);
}

export async function updateAppAction(_previous: AppFormState, formData: FormData): Promise<AppFormState> {
  const admin = await requireAdmin();
  const slug = String(formData.get("slug") ?? "");
  try {
    await updateWorkspaceApp({
      actorRole: admin.role,
      workspaceId: admin.workspaceId,
      slug,
      name: String(formData.get("name") ?? ""),
      platform: String(formData.get("platform") ?? ""),
      status: String(formData.get("status") ?? ""),
    });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/admin/apps");
  revalidatePath(`/admin/apps/${slug}`);
  revalidatePath("/admin", "layout");
  return { error: null, saved: true, fields: null };
}
