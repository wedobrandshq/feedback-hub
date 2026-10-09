"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import {
  changeRequestStatus,
  createChangelogEntry,
  createRequestFromFeedback,
  linkFeedbackToRequest,
  publishRequest,
  publishRequestUpdate,
  unlinkFeedbackFromRequest,
} from "@/server/requests";

export type ActionState = { error: string | null };

function fail(error: unknown): ActionState {
  if (error instanceof DomainError) return { error: error.message };
  throw error;
}

function refresh(requestId?: string) {
  revalidatePath("/admin/feedback");
  revalidatePath("/admin/requests");
  revalidatePath("/admin/roadmap");
  revalidatePath("/admin/changelog");
  revalidatePath("/demo");
  if (requestId) revalidatePath(`/admin/requests/${requestId}`);
}

export async function createRequestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  let requestId = "";
  try {
    const request = await createRequestFromFeedback({
      id: admin.id,
      name: admin.name,
      workspaceId: admin.workspaceId,
      feedbackId: String(formData.get("feedbackId") ?? ""),
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      status: String(formData.get("status") ?? "review"),
    });
    requestId = request.id;
  } catch (error) {
    return fail(error);
  }
  refresh(requestId);
  redirect(`/admin/requests/${requestId}`);
}

export async function linkFeedbackAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const feedbackId = String(formData.get("feedbackId") ?? "");
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await linkFeedbackToRequest({
      id: admin.id,
      name: admin.name,
      workspaceId: admin.workspaceId,
      feedbackId,
      requestId,
    });
  } catch (error) {
    return fail(error);
  }
  refresh(requestId);
  revalidatePath(`/admin/feedback/${feedbackId}`);
  return { error: null };
}

export async function unlinkFeedbackAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const feedbackId = String(formData.get("feedbackId") ?? "");
  try {
    await unlinkFeedbackFromRequest({
      id: admin.id,
      name: admin.name,
      workspaceId: admin.workspaceId,
      feedbackId,
    });
  } catch (error) {
    return fail(error);
  }
  refresh();
  revalidatePath(`/admin/feedback/${feedbackId}`);
  return { error: null };
}

export async function publishRequestAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await publishRequest({ id: admin.id, name: admin.name, workspaceId: admin.workspaceId, requestId });
  } catch (error) {
    return fail(error);
  }
  refresh(requestId);
  return { error: null };
}

export async function changeStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await changeRequestStatus({
      id: admin.id,
      name: admin.name,
      workspaceId: admin.workspaceId,
      requestId,
      status: String(formData.get("status") ?? ""),
      notify: formData.get("notify") === "yes",
    });
  } catch (error) {
    return fail(error);
  }
  refresh(requestId);
  return { error: null };
}

export async function publishUpdateAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await publishRequestUpdate({
      id: admin.id,
      name: admin.name,
      workspaceId: admin.workspaceId,
      requestId,
      body: String(formData.get("body") ?? ""),
    });
  } catch (error) {
    return fail(error);
  }
  refresh(requestId);
  return { error: null };
}

export async function changelogAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  try {
    await createChangelogEntry({
      id: admin.id,
      name: admin.name,
      workspaceId: admin.workspaceId,
      requestId,
      body: String(formData.get("body") ?? ""),
    });
  } catch (error) {
    return fail(error);
  }
  refresh(requestId);
  return { error: null };
}
