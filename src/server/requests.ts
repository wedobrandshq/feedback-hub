import type { Prisma } from "@prisma/client";
import { DomainError } from "@/domain/errors";
import {
  assertStoredText,
  isPublicRequestStatus,
  isRequestStatus,
  notificationBody,
  type RequestSortName,
  type RequestStatusName,
} from "@/domain/request";
import { userLabel } from "@/domain/feedback";
import { resolveAppBySecret } from "@/server/identify-user";
import { prisma } from "@/server/db";

const REQUEST_LIST_LIMIT = 200;

type AdminActor = { id: string; name: string; workspaceId: string };

async function requestInWorkspace(workspaceId: string, requestId: string) {
  const request = await prisma.request.findFirst({
    where: { id: requestId, app: { workspaceId } },
    include: { app: true },
  });
  if (!request) throw new DomainError("Request was not found.", "not_found");
  return request;
}

async function feedbackInWorkspace(workspaceId: string, feedbackId: string) {
  const feedback = await prisma.feedback.findFirst({
    where: { id: feedbackId, deletedAt: null, app: { workspaceId } },
    include: { requestLink: true, app: true, user: true },
  });
  if (!feedback) throw new DomainError("Feedback was not found.", "not_found");
  return feedback;
}

async function writeEvent(
  tx: Prisma.TransactionClient,
  input: {
    workspaceId: string;
    appId: string;
    actorType: string;
    actorId: string | null;
    actorName: string | null;
    type: string;
    entityType: string;
    entityId: string;
    extra?: Prisma.InputJsonValue;
  },
) {
  await tx.event.create({
    data: {
      workspaceId: input.workspaceId,
      appId: input.appId,
      actorType: input.actorType,
      actorId: input.actorId,
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      payload: {
        actorName: input.actorName,
        ...(input.extra && typeof input.extra === "object" ? input.extra : {}),
      },
    },
  });
}

export async function createRequestFromFeedback(input: AdminActor & {
  feedbackId: string;
  title: string;
  description: string;
  status: string;
}) {
  if (!isRequestStatus(input.status)) {
    throw new DomainError("That status is not available.", "validation");
  }
  const status = input.status;
  const title = assertStoredText(input.title, "Title");
  const description = assertStoredText(input.description, "Description");
  const feedback = await feedbackInWorkspace(input.workspaceId, input.feedbackId);
  if (feedback.requestLink) {
    throw new DomainError("This feedback is already linked to a request.", "conflict");
  }

  return prisma.$transaction(async (tx) => {
    const request = await tx.request.create({
      data: {
        appId: feedback.appId,
        title,
        description,
        status,
        visibility: "private",
      },
    });
    await tx.feedbackRequest.create({
      data: { requestId: request.id, feedbackId: feedback.id },
    });
    if (feedback.status === "new" || feedback.status === "reviewed") {
      await tx.feedback.update({ where: { id: feedback.id }, data: { status: "linked" } });
    }
    await writeEvent(tx, {
      workspaceId: input.workspaceId,
      appId: feedback.appId,
      actorType: "admin",
      actorId: input.id,
      actorName: input.name,
      type: "request.created",
      entityType: "request",
      entityId: request.id,
      extra: { status, visibility: "private", feedbackId: feedback.id },
    });
    await writeEvent(tx, {
      workspaceId: input.workspaceId,
      appId: feedback.appId,
      actorType: "admin",
      actorId: input.id,
      actorName: input.name,
      type: "feedback.linked",
      entityType: "feedback",
      entityId: feedback.id,
      extra: { requestId: request.id, requestTitle: title },
    });
    await tx.feedbackSuggestion.updateMany({
      where: { feedbackId: feedback.id, status: "pending" },
      data: { status: "linked" },
    });
    return request;
  });
}

export async function linkFeedbackToRequest(input: AdminActor & { requestId: string; feedbackId: string }) {
  const [request, feedback] = await Promise.all([
    requestInWorkspace(input.workspaceId, input.requestId),
    feedbackInWorkspace(input.workspaceId, input.feedbackId),
  ]);
  if (feedback.appId !== request.appId) {
    throw new DomainError("Feedback and the request must belong to the same app.", "conflict");
  }
  if (feedback.requestLink?.requestId === request.id) {
    throw new DomainError("This feedback is already linked to that request.", "conflict");
  }
  if (feedback.requestLink) {
    throw new DomainError("This feedback is already linked to a request. Unlink it first.", "conflict");
  }
  const before = feedback.body;

  await prisma.$transaction(async (tx) => {
    await tx.feedbackRequest.create({
      data: { requestId: request.id, feedbackId: feedback.id },
    });
    if (feedback.status === "new" || feedback.status === "reviewed") {
      await tx.feedback.update({ where: { id: feedback.id }, data: { status: "linked" } });
    }
    const after = await tx.feedback.findUniqueOrThrow({ where: { id: feedback.id }, select: { body: true } });
    if (after.body !== before) {
      throw new DomainError("Linking must not change the original feedback.", "conflict");
    }
    await tx.request.update({ where: { id: request.id }, data: { updatedAt: new Date() } });
    await writeEvent(tx, {
      workspaceId: input.workspaceId,
      appId: request.appId,
      actorType: "admin",
      actorId: input.id,
      actorName: input.name,
      type: "feedback.linked",
      entityType: "feedback",
      entityId: feedback.id,
      extra: { requestId: request.id, requestTitle: request.title },
    });
    await tx.feedbackSuggestion.updateMany({
      where: { feedbackId: feedback.id, status: "pending" },
      data: { status: "linked" },
    });
  });
}

export async function unlinkFeedbackFromRequest(input: AdminActor & { feedbackId: string }) {
  const feedback = await feedbackInWorkspace(input.workspaceId, input.feedbackId);
  if (!feedback.requestLink) {
    throw new DomainError("This feedback is not linked to a request.", "conflict");
  }
  const requestId = feedback.requestLink.requestId;
  const before = feedback.body;

  await prisma.$transaction(async (tx) => {
    await tx.feedbackRequest.delete({ where: { feedbackId: feedback.id } });
    if (feedback.status === "linked") {
      await tx.feedback.update({ where: { id: feedback.id }, data: { status: "reviewed" } });
    }
    const after = await tx.feedback.findUniqueOrThrow({ where: { id: feedback.id }, select: { body: true } });
    if (after.body !== before) {
      throw new DomainError("Unlinking must not change the original feedback.", "conflict");
    }
    await tx.request.update({ where: { id: requestId }, data: { updatedAt: new Date() } });
    await writeEvent(tx, {
      workspaceId: input.workspaceId,
      appId: feedback.appId,
      actorType: "admin",
      actorId: input.id,
      actorName: input.name,
      type: "feedback.unlinked",
      entityType: "feedback",
      entityId: feedback.id,
      extra: { requestId },
    });
  });
}

export async function publishRequest(input: AdminActor & { requestId: string }) {
  const request = await requestInWorkspace(input.workspaceId, input.requestId);
  if (request.visibility === "public") {
    throw new DomainError("This request is already public.", "conflict");
  }
  await prisma.$transaction(async (tx) => {
    await tx.request.update({ where: { id: request.id }, data: { visibility: "public" } });
    await writeEvent(tx, {
      workspaceId: input.workspaceId,
      appId: request.appId,
      actorType: "admin",
      actorId: input.id,
      actorName: input.name,
      type: "request.published",
      entityType: "request",
      entityId: request.id,
    });
  });
}

export async function linkedRequestForFeedback(workspaceId: string, feedbackId: string) {
  const link = await prisma.feedbackRequest.findFirst({
    where: { feedbackId, feedback: { app: { workspaceId }, deletedAt: null } },
    include: { request: { select: { id: true, title: true, visibility: true, status: true } } },
  });
  return link?.request ?? null;
}

export async function requestMetrics(requestId: string) {
  const [links, votes, recentVotes] = await Promise.all([
    prisma.feedbackRequest.findMany({
      where: { requestId },
      include: { feedback: { select: { userId: true, conversation: { select: { id: true } } } } },
    }),
    prisma.vote.findMany({ where: { requestId }, select: { userId: true } }),
    prisma.vote.findMany({
      where: { requestId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: true },
    }),
  ]);
  return {
    feedbackCount: links.length,
    uniqueFeedbackUsers: new Set(links.map((link) => link.feedback.userId)).size,
    voteCount: votes.length,
    uniqueVoters: new Set(votes.map((vote) => vote.userId)).size,
    conversationCount: links.filter((link) => link.feedback.conversation).length,
    recentVotes: recentVotes.map((vote) => ({
      id: vote.id,
      createdAt: vote.createdAt,
      user: { name: vote.user.name, email: vote.user.email, externalUserId: vote.user.externalUserId },
    })),
  };
}

function sortOrder(sort: RequestSortName): Prisma.RequestOrderByWithRelationInput {
  if (sort === "created") return { createdAt: "desc" };
  if (sort === "feedback") return { links: { _count: "desc" } };
  if (sort === "votes") return { votes: { _count: "desc" } };
  return { updatedAt: "desc" };
}

export async function listAdminRequests(input: {
  workspaceId: string;
  appId: string | null;
  sort: RequestSortName;
}) {
  const where: Prisma.RequestWhereInput = {
    app: { workspaceId: input.workspaceId, ...(input.appId ? { id: input.appId } : {}) },
  };
  const rows = await prisma.request.findMany({
    where,
    orderBy: sortOrder(input.sort),
    take: REQUEST_LIST_LIMIT,
    include: {
      app: { select: { name: true } },
      _count: { select: { links: true, votes: true } },
      links: { select: { feedback: { select: { userId: true, conversation: { select: { id: true } } } } } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    visibility: row.visibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    appName: row.app.name,
    feedbackCount: row._count.links,
    uniqueFeedbackUsers: new Set(row.links.map((link) => link.feedback.userId)).size,
    voteCount: row._count.votes,
    conversationCount: row.links.filter((link) => link.feedback.conversation).length,
  }));
}

export async function searchRequests(input: { workspaceId: string; appId: string; query: string }) {
  const query = input.query.trim();
  if (!query) return [];
  return prisma.request.findMany({
    where: {
      appId: input.appId,
      app: { workspaceId: input.workspaceId },
      title: { contains: query, mode: "insensitive" },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, title: true, visibility: true, status: true },
  });
}

export async function getAdminRequest(input: { workspaceId: string; requestId: string }) {
  const request = await prisma.request.findFirst({
    where: { id: input.requestId, app: { workspaceId: input.workspaceId } },
    include: {
      app: true,
      links: {
        orderBy: { createdAt: "desc" },
        include: {
          feedback: {
            include: {
              user: true,
              conversation: { select: { id: true, status: true, updatedAt: true, user: true } },
            },
          },
        },
      },
      updates: { orderBy: { createdAt: "desc" } },
      changelog: true,
      summary: true,
    },
  });
  if (!request) return null;
  const metrics = await requestMetrics(request.id);
  const events = await prisma.event.findMany({
    where: {
      workspaceId: input.workspaceId,
      OR: [
        { entityType: "request", entityId: request.id },
        { entityType: "feedback", entityId: { in: request.links.map((link) => link.feedbackId) } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { request, metrics, events };
}

export async function changeRequestStatus(input: AdminActor & {
  requestId: string;
  status: string;
  notify: boolean;
}) {
  if (!isRequestStatus(input.status)) {
    throw new DomainError("That status is not available.", "validation");
  }
  const status = input.status;
  const request = await requestInWorkspace(input.workspaceId, input.requestId);
  if (request.status === input.status) {
    throw new DomainError("This request already has that status.", "conflict");
  }
  const notify = input.notify && isPublicRequestStatus(status);
  const recipients = notify ? await interestedUserIds(request.id) : [];

  await prisma.$transaction(async (tx) => {
    await tx.request.update({
      where: { id: request.id },
      data: {
        status,
        ...(status === "released" ? { releasedAt: new Date() } : {}),
      },
    });
    await writeEvent(tx, {
      workspaceId: input.workspaceId,
      appId: request.appId,
      actorType: "admin",
      actorId: input.id,
      actorName: input.name,
      type: "request.status_changed",
      entityType: "request",
      entityId: request.id,
      extra: { from: request.status, to: status },
    });
    if (notify && recipients.length > 0) {
      const body = notificationBody(request.title, status);
      await tx.notification.createMany({
        data: recipients.map((userId) => ({
          appId: request.appId,
          userId,
          requestId: request.id,
          body,
          channel: "in_app" as const,
        })),
      });
      await writeEvent(tx, {
        workspaceId: input.workspaceId,
        appId: request.appId,
        actorType: "admin",
        actorId: input.id,
        actorName: input.name,
        type: "notification.sent",
        entityType: "request",
        entityId: request.id,
        extra: { recipients: recipients.length, channel: "in_app", status },
      });
    }
  });

  return { notified: notify ? recipients.length : 0 };
}

async function interestedUserIds(requestId: string) {
  const [links, votes] = await Promise.all([
    prisma.feedbackRequest.findMany({
      where: { requestId },
      include: { feedback: { select: { userId: true, conversation: { select: { userId: true } } } } },
    }),
    prisma.vote.findMany({ where: { requestId }, select: { userId: true } }),
  ]);
  const ids = new Set<string>();
  for (const link of links) {
    ids.add(link.feedback.userId);
    if (link.feedback.conversation) ids.add(link.feedback.conversation.userId);
  }
  for (const vote of votes) ids.add(vote.userId);
  return [...ids];
}

export async function publishRequestUpdate(input: AdminActor & { requestId: string; body: string }) {
  const body = assertStoredText(input.body, "Update");
  const request = await requestInWorkspace(input.workspaceId, input.requestId);
  return prisma.$transaction(async (tx) => {
    const update = await tx.requestUpdate.create({
      data: {
        requestId: request.id,
        body,
        visibility: "public",
        publishedAt: new Date(),
      },
    });
    await tx.request.update({ where: { id: request.id }, data: { updatedAt: new Date() } });
    await writeEvent(tx, {
      workspaceId: input.workspaceId,
      appId: request.appId,
      actorType: "admin",
      actorId: input.id,
      actorName: input.name,
      type: "request.update_published",
      entityType: "request",
      entityId: request.id,
      extra: { updateId: update.id },
    });
    return update;
  });
}

export async function createChangelogEntry(input: AdminActor & { requestId: string; body: string }) {
  const body = assertStoredText(input.body, "Changelog");
  const request = await requestInWorkspace(input.workspaceId, input.requestId);
  if (request.status !== "released") {
    throw new DomainError("Only a released request can be added to the changelog.", "conflict");
  }
  const existing = await prisma.changelogEntry.findUnique({ where: { requestId: request.id } });
  if (existing) throw new DomainError("This request already has a changelog entry.", "conflict");
  return prisma.changelogEntry.create({
    data: {
      appId: request.appId,
      requestId: request.id,
      title: request.title,
      body,
    },
  });
}

async function publicUser(appSecret: string, externalUserId: string) {
  const app = await resolveAppBySecret(appSecret);
  const external = externalUserId.trim();
  if (!external) throw new DomainError("User id is required.", "validation");
  const user = await prisma.user.findUnique({
    where: { appId_externalUserId: { appId: app.id, externalUserId: external } },
  });
  if (!user) throw new DomainError("User was not found.", "not_found");
  return { app, user };
}

export async function listPublicRequests(input: { appSecret: string; externalUserId: string }) {
  const { app, user } = await publicUser(input.appSecret, input.externalUserId);
  const rows = await prisma.request.findMany({
    where: { appId: app.id, visibility: "public" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { votes: true } },
      votes: { where: { userId: user.id }, select: { id: true } },
      updates: {
        where: { visibility: "public" },
        orderBy: { publishedAt: "desc" },
        select: { id: true, body: true, publishedAt: true },
      },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    voteCount: row._count.votes,
    voted: row.votes.length > 0,
    updates: row.updates.map((update) => ({
      id: update.id,
      body: update.body,
      publishedAt: update.publishedAt?.toISOString() ?? null,
    })),
  }));
}

export async function voteOnRequest(input: { appSecret: string; externalUserId: string; requestId: string }) {
  const { app, user } = await publicUser(input.appSecret, input.externalUserId);
  const request = await prisma.request.findFirst({
    where: { id: input.requestId, appId: app.id, visibility: "public" },
  });
  if (!request) throw new DomainError("Request was not found.", "not_found");
  const existing = await prisma.vote.findUnique({
    where: { requestId_userId: { requestId: request.id, userId: user.id } },
  });
  if (existing) throw new DomainError("You already voted for this request.", "conflict");
  await prisma.$transaction(async (tx) => {
    await tx.vote.create({ data: { requestId: request.id, userId: user.id } });
    await writeEvent(tx, {
      workspaceId: app.workspaceId,
      appId: app.id,
      actorType: "user",
      actorId: user.id,
      actorName: userLabel(user),
      type: "request.voted",
      entityType: "request",
      entityId: request.id,
    });
  });
}

export async function removeVote(input: { appSecret: string; externalUserId: string; requestId: string }) {
  const { app, user } = await publicUser(input.appSecret, input.externalUserId);
  const request = await prisma.request.findFirst({
    where: { id: input.requestId, appId: app.id, visibility: "public" },
  });
  if (!request) throw new DomainError("Request was not found.", "not_found");
  const existing = await prisma.vote.findUnique({
    where: { requestId_userId: { requestId: request.id, userId: user.id } },
  });
  if (!existing) throw new DomainError("You have not voted for this request.", "conflict");
  await prisma.$transaction(async (tx) => {
    await tx.vote.delete({ where: { id: existing.id } });
    await writeEvent(tx, {
      workspaceId: app.workspaceId,
      appId: app.id,
      actorType: "user",
      actorId: user.id,
      actorName: userLabel(user),
      type: "request.unvoted",
      entityType: "request",
      entityId: request.id,
    });
  });
}

export async function listUserNotifications(input: { appSecret: string; externalUserId: string }) {
  const { user } = await publicUser(input.appSecret, input.externalUserId);
  const rows = await prisma.notification.findMany({
    where: { userId: user.id, channel: "in_app" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return {
    unreadCount: rows.filter((row) => row.readAt === null).length,
    notifications: rows.map((row) => ({
      id: row.id,
      body: row.body,
      requestId: row.requestId,
      createdAt: row.createdAt.toISOString(),
      unread: row.readAt === null,
    })),
  };
}

export async function markNotificationsRead(input: { appSecret: string; externalUserId: string }) {
  const { user } = await publicUser(input.appSecret, input.externalUserId);
  await prisma.notification.updateMany({
    where: { userId: user.id, channel: "in_app", readAt: null },
    data: { readAt: new Date() },
  });
}

export async function listPublicChangelog(input: { appSecret: string }) {
  const app = await resolveAppBySecret(input.appSecret);
  const rows = await prisma.changelogEntry.findMany({
    where: { appId: app.id },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    publishedAt: row.publishedAt.toISOString(),
  }));
}

export async function listAdminChangelog(input: { workspaceId: string; appId: string | null }) {
  return prisma.changelogEntry.findMany({
    where: { app: { workspaceId: input.workspaceId, ...(input.appId ? { id: input.appId } : {}) } },
    orderBy: { publishedAt: "desc" },
    include: { app: { select: { name: true } }, request: { select: { id: true, title: true } } },
  });
}

export async function listRoadmap(input: { workspaceId: string; appId: string | null }) {
  return prisma.request.findMany({
    where: {
      visibility: "public",
      status: { in: ["under_consideration", "planned", "in_progress", "released"] },
      app: { workspaceId: input.workspaceId, ...(input.appId ? { id: input.appId } : {}) },
    },
    orderBy: { updatedAt: "desc" },
    include: { app: { select: { name: true } } },
  });
}
