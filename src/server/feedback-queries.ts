import type { Prisma } from "@prisma/client";
import { FEEDBACK_LIST_LIMIT } from "@/domain/config";
import type { FeedbackListFilters } from "@/domain/feedback";
import { prisma } from "@/server/db";

const listInclude = {
  user: true,
  app: true,
  requestLink: { include: { request: { select: { id: true, title: true } } } },
} satisfies Prisma.FeedbackInclude;

export async function listWorkspaceApps(workspaceId: string) {
  return prisma.app.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listFeedback(input: {
  workspaceId: string;
  appId: string | null;
  filters: FeedbackListFilters;
}) {
  const appScope: Prisma.FeedbackWhereInput = {
    deletedAt: null,
    app: {
      workspaceId: input.workspaceId,
      ...(input.appId ? { id: input.appId } : {}),
    },
  };

  const where: Prisma.FeedbackWhereInput = {
    ...appScope,
    ...(input.filters.type ? { type: input.filters.type } : {}),
    ...(input.filters.status ? { status: input.filters.status } : {}),
    ...(input.filters.from || input.filters.to
      ? {
          createdAt: {
            ...(input.filters.from ? { gte: input.filters.from } : {}),
            ...(input.filters.to ? { lte: input.filters.to } : {}),
          },
        }
      : {}),
    ...(input.filters.search
      ? {
          OR: [
            { body: { contains: input.filters.search, mode: "insensitive" } },
            { user: { name: { contains: input.filters.search, mode: "insensitive" } } },
            { user: { email: { contains: input.filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [totalInScope, matched, rows] = await Promise.all([
    prisma.feedback.count({ where: appScope }),
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where,
      include: listInclude,
      orderBy: { createdAt: "desc" },
      take: FEEDBACK_LIST_LIMIT,
    }),
  ]);

  return {
    rows,
    totalInScope,
    matched,
    truncated: matched > rows.length,
  };
}

export async function getFeedbackDetail(input: { workspaceId: string; feedbackId: string }) {
  const feedback = await prisma.feedback.findFirst({
    where: {
      id: input.feedbackId,
      deletedAt: null,
      app: { workspaceId: input.workspaceId },
    },
    include: {
      user: true,
      app: true,
      attachments: { orderBy: { createdAt: "asc" } },
      requestLink: { include: { request: { select: { id: true, title: true, visibility: true } } } },
    },
  });
  if (!feedback) return null;

  const conversation = await prisma.conversation.findFirst({
    where: { feedbackId: feedback.id },
    select: { id: true, messages: { select: { id: true } } },
  });
  const messageIds = conversation?.messages.map((message) => message.id) ?? [];

  const events = await prisma.event.findMany({
    where: {
      workspaceId: input.workspaceId,
      appId: feedback.appId,
      OR: [
        { entityType: "feedback", entityId: feedback.id },
        ...(conversation ? [{ entityType: "conversation", entityId: conversation.id }] : []),
        ...(messageIds.length > 0 ? [{ entityType: "message", entityId: { in: messageIds } }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return { feedback, events };
}

export async function getAttachmentForAdmin(input: { workspaceId: string; attachmentId: string }) {
  return prisma.feedbackAttachment.findFirst({
    where: {
      id: input.attachmentId,
      feedback: {
        deletedAt: null,
        app: { workspaceId: input.workspaceId },
      },
    },
  });
}
