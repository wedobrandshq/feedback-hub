"use server";

import { revalidatePath } from "next/cache";
import { DomainError } from "@/domain/errors";
import { requireAdmin } from "@/server/auth/admin";
import { setSelectedAppCookie } from "@/server/auth/session";
import { prisma } from "@/server/db";
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
