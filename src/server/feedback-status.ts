import type { FeedbackStatus } from "@prisma/client";
import { DomainError } from "@/domain/errors";
import { prisma } from "@/server/db";

type StatusChange = {
  workspaceId: string;
  actorId: string;
  actorName: string;
  feedbackId: string;
};

async function changeStatus(
  input: StatusChange,
  allowed: FeedbackStatus[],
  next: FeedbackStatus,
  eventType: "feedback.reviewed" | "feedback.closed",
  blockedMessage: string,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.feedback.findFirst({
      where: {
        id: input.feedbackId,
        deletedAt: null,
        app: { workspaceId: input.workspaceId },
      },
    });
    if (!existing) {
      throw new DomainError("Feedback was not found.", "not_found");
    }
    if (existing.status === next) {
      throw new DomainError(
        next === "closed" ? "This feedback is already closed." : "This feedback was already reviewed.",
        "conflict",
      );
    }
    if (!allowed.includes(existing.status)) {
      throw new DomainError(blockedMessage, "conflict");
    }

    const updated = await tx.feedback.updateMany({
      where: { id: existing.id, status: existing.status, deletedAt: null },
      data: { status: next },
    });
    if (updated.count !== 1) {
      throw new DomainError("This feedback changed. Refresh and try again.", "conflict");
    }

    await tx.event.create({
      data: {
        workspaceId: input.workspaceId,
        appId: existing.appId,
        actorType: "admin",
        actorId: input.actorId,
        type: eventType,
        entityType: "feedback",
        entityId: existing.id,
        payload: {
          actorName: input.actorName,
          from: existing.status,
          to: next,
        },
      },
    });

    return tx.feedback.findUniqueOrThrow({ where: { id: existing.id } });
  });
}

export function markFeedbackReviewed(input: StatusChange) {
  return changeStatus(
    input,
    ["new"],
    "reviewed",
    "feedback.reviewed",
    "Only new feedback can be marked reviewed.",
  );
}

export function closeFeedback(input: StatusChange) {
  return changeStatus(
    input,
    ["new", "reviewed"],
    "closed",
    "feedback.closed",
    "This feedback can’t be closed from its current status.",
  );
}
