import { ADMIN_LIST_LIMIT, adminWindow, type UserActivityName } from "@/domain/admin";
import { prisma } from "@/server/db";

function appScope(workspaceId: string, appId: string | null) {
  return { workspaceId, ...(appId ? { id: appId } : {}) };
}

export async function listUserPlans(input: { workspaceId: string; appId: string | null }) {
  const rows = await prisma.user.findMany({
    where: { app: appScope(input.workspaceId, input.appId), plan: { not: null } },
    distinct: ["plan"],
    select: { plan: true },
    orderBy: { plan: "asc" },
  });
  return rows.flatMap((row) => (row.plan ? [row.plan] : []));
}

export async function listAdminUsers(input: {
  workspaceId: string;
  appId: string | null;
  search: string | null;
  plan: string | null;
  activity: UserActivityName | null;
  now?: Date;
}) {
  const { since } = adminWindow(input.now);
  const search = input.search?.trim() ? input.search.trim().slice(0, 200) : null;
  const where = {
    app: appScope(input.workspaceId, input.appId),
    ...(input.plan ? { plan: input.plan } : {}),
    ...(input.activity === "recent" ? { lastSeenAt: { gte: since } } : {}),
    ...(input.activity === "quiet" ? { lastSeenAt: { lt: since } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { externalUserId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [totalInScope, rows] = await Promise.all([
    prisma.user.count({ where: { app: appScope(input.workspaceId, input.appId) } }),
    prisma.user.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      take: ADMIN_LIST_LIMIT,
      include: {
        app: { select: { name: true } },
        _count: { select: { votes: true, conversations: true } },
        feedback: { where: { deletedAt: null }, select: { id: true } },
      },
    }),
  ]);

  return {
    totalInScope,
    truncated: rows.length === ADMIN_LIST_LIMIT,
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      externalUserId: row.externalUserId,
      plan: row.plan,
      appName: row.app.name,
      feedbackCount: row.feedback.length,
      voteCount: row._count.votes,
      conversationCount: row._count.conversations,
      lastSeenAt: row.lastSeenAt,
    })),
  };
}

export async function getAdminUser(input: { workspaceId: string; userId: string }) {
  const user = await prisma.user.findFirst({
    where: { id: input.userId, app: { workspaceId: input.workspaceId } },
    include: {
      app: { select: { id: true, name: true } },
      feedback: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      conversations: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { feedback: { select: { body: true } } },
      },
      votes: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { request: { select: { id: true, title: true } } },
      },
    },
  });
  if (!user) return null;

  const feedbackIds = user.feedback.map((item) => item.id);
  const conversationIds = user.conversations.map((item) => item.id);
  const or = [
    { actorId: user.id },
    ...(feedbackIds.length ? [{ entityType: "feedback", entityId: { in: feedbackIds } }] : []),
    ...(conversationIds.length ? [{ entityType: "conversation", entityId: { in: conversationIds } }] : []),
  ];
  const events = await prisma.event.findMany({
    where: { workspaceId: input.workspaceId, OR: or },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return { user, events };
}
