import { conversationNeedsReply } from "@/domain/conversation";
import { ADMIN_LIST_LIMIT, TRENDING_LIMIT, adminWindow } from "@/domain/admin";
import { feedbackPreview, userLabel } from "@/domain/feedback";
import { prisma } from "@/server/db";

function appScope(workspaceId: string, appId: string | null) {
  return { workspaceId, ...(appId ? { id: appId } : {}) };
}

export async function getAdminHome(input: { workspaceId: string; appId: string | null; now?: Date }) {
  const { since, prior } = adminWindow(input.now);
  const app = appScope(input.workspaceId, input.appId);
  const inApp = { app };

  const [
    feedback,
    feedbackPrior,
    newRequests,
    conversations,
    votes,
    released,
    openRows,
    voteGroups,
  ] = await Promise.all([
    prisma.feedback.count({ where: { ...inApp, deletedAt: null, createdAt: { gte: since } } }),
    prisma.feedback.count({
      where: { ...inApp, deletedAt: null, createdAt: { gte: prior, lt: since } },
    }),
    prisma.request.count({ where: { ...inApp, createdAt: { gte: since } } }),
    prisma.conversation.count({ where: { ...inApp, createdAt: { gte: since } } }),
    prisma.vote.count({ where: { createdAt: { gte: since }, request: inApp } }),
    prisma.request.count({ where: { ...inApp, releasedAt: { gte: since } } }),
    prisma.conversation.findMany({
      where: { ...inApp, status: "open" },
      orderBy: { updatedAt: "desc" },
      take: ADMIN_LIST_LIMIT,
      include: {
        user: true,
        feedback: { select: { body: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderType: true } },
      },
    }),
    prisma.vote.groupBy({
      by: ["requestId"],
      where: { createdAt: { gte: since }, request: inApp },
      _count: { _all: true },
    }),
  ]);

  const needingReply = openRows.filter((row) =>
    conversationNeedsReply({
      status: row.status,
      latestSenderType: row.messages[0]?.senderType ?? null,
    }),
  );

  const ranked = [...voteGroups].sort((left, right) => right._count._all - left._count._all).slice(0, TRENDING_LIMIT);
  const requestIds = ranked.map((row) => row.requestId);
  const requests = requestIds.length
    ? await prisma.request.findMany({
        where: { id: { in: requestIds }, ...inApp },
        include: {
          app: { select: { name: true } },
          _count: { select: { links: true } },
        },
      })
    : [];
  const byId = new Map(requests.map((request) => [request.id, request]));
  const trending = ranked.flatMap((row) => {
    const request = byId.get(row.requestId);
    if (!request) return [];
    return [
      {
        id: request.id,
        title: request.title,
        appName: request.app.name,
        votesInWindow: row._count._all,
        feedbackCount: request._count.links,
      },
    ];
  });

  return {
    since,
    signals: {
      feedback,
      feedbackPrior,
      newRequests,
      conversations,
      votes,
      released,
    },
    trending,
    attention: {
      openConversations: openRows.length,
      attentionTruncated: openRows.length === ADMIN_LIST_LIMIT,
      needsReply: needingReply.slice(0, 8).map((row) => ({
        id: row.id,
        user: userLabel(row.user),
        preview: feedbackPreview(row.feedback.body),
      })),
      needsReplyCount: needingReply.length,
    },
  };
}
