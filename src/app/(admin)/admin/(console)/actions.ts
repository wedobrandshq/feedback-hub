"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { setSelectedAppCookie } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { closeConversation, reopenConversation, replyAsAdmin } from "@/server/conversations";
import { closeFeedback, markFeedbackReviewed } from "@/server/feedback-status";

export async function setSelectedAppAction(formData: FormData) {
  const admin = await requireAdmin();
  const value = String(formData.get("app") ?? "all");
  if (value === "all") {
    await setSelectedAppCookie(null);
  } else {
    const app = await prisma.app.findFirst({
      where: { id: value, workspaceId: admin.workspaceId },
      select: { id: true },
    });
    if (!app) return;
    await setSelectedAppCookie(app.id);
  }
  revalidatePath("/admin", "layout");
}

export async function openAppAction(formData: FormData) {
  await setSelectedAppAction(formData);
  redirect("/admin");
}

export type StatusActionState = { error: string | null };

export async function markReviewedAction(
  _previous: StatusActionState,
  formData: FormData,
): Promise<StatusActionState> {
  const admin = await requireAdmin();
  const feedbackId = String(formData.get("feedbackId") ?? "");
  try {
    await markFeedbackReviewed({
      workspaceId: admin.workspaceId,
      actorId: admin.id,
      actorName: admin.name,
      feedbackId,
    });
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${feedbackId}`);
  return { error: null };
}

export async function closeFeedbackAction(
  _previous: StatusActionState,
  formData: FormData,
): Promise<StatusActionState> {
  const admin = await requireAdmin();
  const feedbackId = String(formData.get("feedbackId") ?? "");
  try {
    await closeFeedback({
      workspaceId: admin.workspaceId,
      actorId: admin.id,
      actorName: admin.name,
      feedbackId,
    });
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${feedbackId}`);
  return { error: null };
}

export type ComposerState = { error: string | null; sentAt: number | null };

export async function replyToConversationAction(
  _previous: ComposerState,
  formData: FormData,
): Promise<ComposerState> {
  const admin = await requireAdmin();
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "");
  try {
    const message = await replyAsAdmin({
      workspaceId: admin.workspaceId,
      actorId: admin.id,
      actorName: admin.name,
      conversationId,
      body,
    });
    const conversation = await prisma.conversation.findFirst({
      where: { id: message.conversationId, app: { workspaceId: admin.workspaceId } },
      select: { feedbackId: true },
    });
    revalidatePath("/admin/inbox");
    revalidatePath(`/admin/inbox/${message.conversationId}`);
    revalidatePath("/admin/feedback");
    if (conversation) revalidatePath(`/admin/feedback/${conversation.feedbackId}`);
    revalidatePath("/demo");
    return { error: null, sentAt: Date.now() };
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message, sentAt: null };
    throw error;
  }
}

async function conversationStatusAction(
  formData: FormData,
  run: typeof closeConversation,
): Promise<StatusActionState> {
  const admin = await requireAdmin();
  const conversationId = String(formData.get("conversationId") ?? "");
  try {
    const conversation = await run({
      workspaceId: admin.workspaceId,
      actorId: admin.id,
      actorName: admin.name,
      conversationId,
    });
    revalidatePath("/admin/inbox");
    revalidatePath(`/admin/inbox/${conversation.id}`);
    revalidatePath(`/admin/feedback/${conversation.feedbackId}`);
    revalidatePath("/demo");
    return { error: null };
  } catch (error) {
    if (error instanceof DomainError) return { error: error.message };
    throw error;
  }
}

export async function closeConversationAction(
  _previous: StatusActionState,
  formData: FormData,
): Promise<StatusActionState> {
  return conversationStatusAction(formData, closeConversation);
}

export async function reopenConversationAction(
  _previous: StatusActionState,
  formData: FormData,
): Promise<StatusActionState> {
  return conversationStatusAction(formData, reopenConversation);
}
