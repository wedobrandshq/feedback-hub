import type { Prisma } from "@prisma/client";
import {
  ADMIN_LIST_LIMIT,
  adminWindow,
  type UserActivityName,
  type UserSort,
  type UserSortDir,
} from "@/domain/admin";
import { visibleApps } from "@/server/app-access";
import { prisma } from "@/server/db";

function appScope(workspaceId: string, appId: string | null, adminId?: string) {
  return visibleApps({ workspaceId, appId, adminId });
}

export async function listUserPlans(input: { workspaceId: string; appId: string | null; adminId?: string }) {
  const rows = await prisma.user.findMany({
    where: { app: appScope(input.workspaceId, input.appId, input.adminId), plan: { not: null } },
    distinct: ["plan"],
    select: { plan: true },
    orderBy: { plan: "asc" },
  });
  return rows.flatMap((row) => (row.plan ? [row.plan] : []));
}

const adminUserInclude = {
  app: { select: { name: true } },
  _count: {
    select: {
      votes: true,
      conversations: true,
      feedback: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.UserInclude;

function toAdminUserRow(row: Prisma.UserGetPayload<{ include: typeof adminUserInclude }>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    externalUserId: row.externalUserId,
    plan: row.plan,
    appName: row.app.name,
    feedbackCount: row._count.feedback,
    voteCount: row._count.votes,
    conversationCount: row._count.conversations,
    lastSeenAt: row.lastSeenAt,
  };
}

function userOrder(sort: UserSort, dir: UserSortDir): Prisma.UserOrderByWithRelationInput[] {
  const tie = { id: "asc" as const };
  if (sort === "user") return [{ name: dir }, { email: dir }, { externalUserId: dir }, tie];
  if (sort === "app") return [{ app: { name: dir } }, tie];
  if (sort === "plan") return [{ plan: dir }, tie];
  if (sort === "votes") return [{ votes: { _count: dir } }, tie];
  if (sort === "conversations") return [{ conversations: { _count: dir } }, tie];
  return [{ lastSeenAt: dir }, tie];
}

export async function listAdminUsers(input: {
  workspaceId: string;
  appId: string | null;
  search: string | null;
  plan: string | null;
  activity: UserActivityName | null;
  sort?: UserSort;
  dir?: UserSortDir;
  adminId?: string;
  now?: Date;
}) {
  const { since } = adminWindow(input.now);
  const sort = input.sort ?? "lastSeen";
  const dir = input.dir ?? "desc";
  const search = input.search?.trim() ? input.search.trim().slice(0, 200) : null;
  const where = {
    app: appScope(input.workspaceId, input.appId, input.adminId),
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

  const totalInScope = await prisma.user.count({ where: { app: appScope(input.workspaceId, input.appId, input.adminId) } });
  if (sort === "feedback") {
    const rows = await prisma.user.findMany({ where, include: adminUserInclude });
    const mapped = rows.map(toAdminUserRow);
    mapped.sort((left, right) => {
      if (left.feedbackCount !== right.feedbackCount) {
        const delta = left.feedbackCount - right.feedbackCount;
        return dir === "asc" ? delta : -delta;
      }
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    });
    const limited = mapped.slice(0, ADMIN_LIST_LIMIT);
    return { totalInScope, truncated: limited.length === ADMIN_LIST_LIMIT, rows: limited };
  }

  const rows = await prisma.user.findMany({
    where,
    orderBy: userOrder(sort, dir),
    take: ADMIN_LIST_LIMIT,
    include: adminUserInclude,
  });

  return {
    totalInScope,
    truncated: rows.length === ADMIN_LIST_LIMIT,
    rows: rows.map(toAdminUserRow),
  };
}

export async function getAdminUser(input: { workspaceId: string; userId: string; adminId?: string }) {
  const user = await prisma.user.findFirst({
    where: { id: input.userId, app: visibleApps({ workspaceId: input.workspaceId, adminId: input.adminId }) },
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
