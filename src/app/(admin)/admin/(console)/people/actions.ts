"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { addConsolePerson, removeConsolePerson, setConsoleRole } from "@/server/console-people";

export type PeopleState = { error: string | null; saved: boolean };

const initialError = (error: unknown): PeopleState => {
  if (error instanceof DomainError) return { error: error.message, saved: false };
  throw error;
};

function refresh() {
  revalidatePath("/admin/people");
  revalidatePath("/admin", "layout");
}

export async function addPersonAction(_previous: PeopleState, formData: FormData): Promise<PeopleState> {
  const admin = await requireAdmin();
  try {
    await addConsolePerson({
      actorRole: admin.role,
      workspaceId: admin.workspaceId,
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
      role: String(formData.get("role") ?? ""),
      appIds: formData.getAll("appIds").map(String),
    });
  } catch (error) {
    return initialError(error);
  }
  refresh();
  return { error: null, saved: true };
}

export async function setRoleAction(_previous: PeopleState, formData: FormData): Promise<PeopleState> {
  const admin = await requireAdmin();
  try {
    await setConsoleRole({
      actorRole: admin.role,
      workspaceId: admin.workspaceId,
      personId: String(formData.get("personId") ?? ""),
      role: String(formData.get("role") ?? ""),
    });
  } catch (error) {
    return initialError(error);
  }
  refresh();
  return { error: null, saved: true };
}

export async function removePersonAction(_previous: PeopleState, formData: FormData): Promise<PeopleState> {
  const admin = await requireAdmin();
  try {
    await removeConsolePerson({
      actorRole: admin.role,
      workspaceId: admin.workspaceId,
      personId: String(formData.get("personId") ?? ""),
    });
  } catch (error) {
    return initialError(error);
  }
  refresh();
  return { error: null, saved: true };
}
