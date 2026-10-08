import { Prisma, type ConversationStatus, type SenderType } from "@prisma/client";
import { DEMO_CONVERSATION_LIMIT, INBOX_LIST_LIMIT } from "@/domain/config";
import {
  assertMessageBody,
  conversationNeedsReply,
  type ConversationStatusName,
  type InboxFilter,
  type SenderTypeName,
} from "@/domain/conversation";
import { DomainError } from "@/domain/errors";
import { userLabel } from "@/domain/feedback";
import { prisma } from "@/server/db";
import { resolveAppBySecret } from "@/server/identify-user";

type Actor = {
  workspaceId: string;
  actorId: string;
  actorName: string;
};

export type ThreadMessage = {
  id: string;
  senderType: SenderTypeName;
  senderName: string;
  body: string;
  channel: "in_app" | "email";
  createdAt: Date;
  readAt: Date | null;
};

export type InboxRow = {
  id: string;
  preview: string;
  updatedAt: Date;
  status: ConversationStatusName;
  needsReply: boolean;
  unread: boolean;
  user: { name: string | null; email: string | null; externalUserId: string };
  app: { name: string };
};

const conversationInclude = {
  user: true,
  app: true,
  feedback: true,
  messages: { orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }] },
};

async function senderNames(messages: { senderType: SenderType; senderId: string }[], userName: string) {
  const adminIds = [
    ...new Set(messages.filter((message) => message.senderType === "admin").map((message) => message.senderId)),
  ];
  const admins =
    adminIds.length === 0
      ? []
      : await prisma.adminUser.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true },
        });
  const adminNames = new Map(admins.map((admin) => [admin.id, admin.name]));
  return (message: { senderType: SenderType; senderId: string }) => {
    if (message.senderType === "user") return userName;
    if (message.senderType === "admin") return adminNames.get(message.senderId) ?? "Product team";
    return "System";
  };
}

function toThreadMessage(
  message: {
    id: string;
    senderType: SenderType;
    senderId: string;
    body: string;
    channel: "in_app" | "email";
    createdAt: Date;
    readAt: Date | null;
  },
  nameFor: (message: { senderType: SenderType; senderId: string }) => string,
): ThreadMessage {
  return {
    id: message.id,
    senderType: message.senderType,
    senderName: nameFor(message),
    body: message.body,
    channel: message.channel,
    createdAt: message.createdAt,
    readAt: message.readAt,
  };
}

export async function listInbox(input: {
  workspaceId: string;
  appId: string | null;
  filter: InboxFilter;
}) {
  const appScope: Prisma.ConversationWhereInput = {
    app: {
      workspaceId: input.workspaceId,
      ...(input.appId ? { id: input.appId } : {}),
    },
  };

  let ids: string[] | null = null;
  if (input.filter === "needs_reply") {
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT c.id
      FROM conversations c
      INNER JOIN apps a ON a.id = c.app_id
      INNER JOIN LATERAL (
        SELECT m.sender_type
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
      ) latest ON true
      WHERE a.workspace_id = ${input.workspaceId}
        AND c.status = 'open'::"ConversationStatus"
        AND latest.sender_type = 'user'::"SenderType"
        ${input.appId ? Prisma.sql`AND c.app_id = ${input.appId}` : Prisma.empty}
      ORDER BY c.updated_at DESC
      LIMIT ${INBOX_LIST_LIMIT}
    `);
    ids = rows.map((row) => row.id);
  }

  const where: Prisma.ConversationWhereInput = {
    ...appScope,
    ...(ids ? { id: { in: ids } } : {}),
    ...(input.filter === "closed" ? { status: "closed" } : {}),
    ...(input.filter === "unread"
      ? { messages: { some: { senderType: "user", readAt: null } } }
      : {}),
  };

  const [totalInScope, matched, conversations] = await Promise.all([
    prisma.conversation.count({ where: appScope }),
    ids ? Promise.resolve(ids.length) : prisma.conversation.count({ where }),
    ids && ids.length === 0
      ? Promise.resolve([])
      : prisma.conversation.findMany({
          where,
          include: {
            user: true,
            app: true,
            messages: {
              orderBy: [{ createdAt: "desc" }, { id: "desc" }],
              take: 1,
            },
            _count: {
              select: {
                messages: { where: { senderType: "user", readAt: null } },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          take: INBOX_LIST_LIMIT,
        }),
  ]);

  const rows: InboxRow[] = conversations.map((conversation) => {
    const latest = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      preview: latest?.body ?? "",
      updatedAt: conversation.updatedAt,
      status: conversation.status,
      needsReply: conversationNeedsReply({
        status: conversation.status,
        latestSenderType: latest?.senderType ?? null,
      }),
      unread: conversation._count.messages > 0,
      user: conversation.user,
      app: { name: conversation.app.name },
    };
  });

  if (ids) {
    const order = new Map(ids.map((id, index) => [id, index]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  return {
    rows,
    totalInScope,
    matched: ids ? ids.length : matched,
    truncated: (ids ? ids.length : matched) > rows.length,
  };
}

async function markRead(
  conversationId: string,
  senderType: SenderType,
) {
  await prisma.message.updateMany({
    where: { conversationId, senderType, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function getAdminConversation(input: { workspaceId: string; conversationId: string }) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: input.conversationId,
      app: { workspaceId: input.workspaceId },
    },
    include: conversationInclude,
  });
  if (!conversation) return null;

  await markRead(conversation.id, "user");
  const nameFor = await senderNames(conversation.messages, userLabel(conversation.user));
  const messages = conversation.messages.map((message) => {
    const threadMessage = toThreadMessage(message, nameFor);
    if (message.senderType === "user" && message.readAt === null) {
      return { ...threadMessage, readAt: new Date() };
    }
    return threadMessage;
  });
  const latest = messages.at(-1) ?? null;

  return {
    id: conversation.id,
    status: conversation.status as ConversationStatusName,
    updatedAt: conversation.updatedAt,
    needsReply: conversationNeedsReply({
      status: conversation.status,
      latestSenderType: latest?.senderType ?? null,
    }),
    app: { id: conversation.app.id, name: conversation.app.name },
    user: conversation.user,
    feedback: conversation.feedback,
    messages,
  };
}

export async function getAdminThreadForFeedback(input: { workspaceId: string; feedbackId: string }) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      feedbackId: input.feedbackId,
      app: { workspaceId: input.workspaceId },
    },
    include: conversationInclude,
  });
  if (!conversation) return null;
  await markRead(conversation.id, "user");
  const nameFor = await senderNames(conversation.messages, userLabel(conversation.user));
  return {
    id: conversation.id,
    status: conversation.status as ConversationStatusName,
    messages: conversation.messages.map((message) => toThreadMessage(message, nameFor)),
  };
}

async function writeMessage(input: {
  conversationId: string;
  workspaceId: string;
  appId: string;
  feedbackId: string;
  actorType: "user" | "admin";
  actorId: string;
  actorName: string;
  body: string;
}) {
  return prisma.$transaction(async (tx) => {
    const open = await tx.conversation.updateMany({
      where: { id: input.conversationId, status: "open" },
      data: { updatedAt: new Date() },
    });
    if (open.count !== 1) {
      const existing = await tx.conversation.findFirst({
        where: { id: input.conversationId, app: { workspaceId: input.workspaceId } },
        select: { status: true },
      });
      if (!existing) throw new DomainError("Conversation was not found.", "not_found");
      throw new DomainError("This conversation is closed.", "conflict");
    }

    const message = await tx.message.create({
      data: {
        conversationId: input.conversationId,
        senderType: input.actorType,
        senderId: input.actorId,
        body: input.body,
        channel: "in_app",
      },
    });

    await tx.event.create({
      data: {
        workspaceId: input.workspaceId,
        appId: input.appId,
        actorType: input.actorType,
        actorId: input.actorId,
        type: "message.sent",
        entityType: "message",
        entityId: message.id,
        payload: {
          actorName: input.actorName,
          conversationId: input.conversationId,
          feedbackId: input.feedbackId,
          senderType: input.actorType,
          channel: "in_app",
        },
      },
    });

    return message;
  });
}

export async function replyAsAdmin(input: Actor & { conversationId: string; body: string }) {
  assertMessageBody(input.body);
  const conversation = await prisma.conversation.findFirst({
    where: { id: input.conversationId, app: { workspaceId: input.workspaceId } },
  });
  if (!conversation) throw new DomainError("Conversation was not found.", "not_found");
  if (conversation.status === "closed") {
    throw new DomainError("This conversation is closed.", "conflict");
  }

  return writeMessage({
    conversationId: conversation.id,
    workspaceId: input.workspaceId,
    appId: conversation.appId,
    feedbackId: conversation.feedbackId,
    actorType: "admin",
    actorId: input.actorId,
    actorName: input.actorName,
    body: input.body,
  });
}

async function ownedConversation(input: {
  appSecret: string;
  externalUserId: string;
  conversationId: string;
}) {
  const app = await resolveAppBySecret(input.appSecret);
  const externalUserId = input.externalUserId.trim();
  const user = externalUserId
    ? await prisma.user.findUnique({
        where: { appId_externalUserId: { appId: app.id, externalUserId } },
      })
    : null;
  if (!user) throw new DomainError("Conversation was not found.", "not_found");

  const conversation = await prisma.conversation.findFirst({
    where: { id: input.conversationId, appId: app.id, userId: user.id },
  });
  if (!conversation) throw new DomainError("Conversation was not found.", "not_found");
  return { app, user, conversation };
}

export async function replyAsUser(input: {
  appSecret: string;
  externalUserId: string;
  conversationId: string;
  body: string;
}) {
  assertMessageBody(input.body);
  const { app, user, conversation } = await ownedConversation(input);
  if (conversation.status === "closed") {
    throw new DomainError("This conversation is closed.", "conflict");
  }
  return writeMessage({
    conversationId: conversation.id,
    workspaceId: app.workspaceId,
    appId: app.id,
    feedbackId: conversation.feedbackId,
    actorType: "user",
    actorId: user.id,
    actorName: userLabel(user),
    body: input.body,
  });
}

export async function markConversationReadByUser(input: {
  appSecret: string;
  externalUserId: string;
  conversationId: string;
}) {
  const { conversation } = await ownedConversation(input);
  await markRead(conversation.id, "admin");
}

export async function listConversationsForUser(input: { appSecret: string; externalUserId: string }) {
  const app = await resolveAppBySecret(input.appSecret);
  const externalUserId = input.externalUserId.trim();
  if (!externalUserId) return [];
  const user = await prisma.user.findUnique({
    where: { appId_externalUserId: { appId: app.id, externalUserId } },
  });
  if (!user) return [];

  const conversations = await prisma.conversation.findMany({
    where: { appId: app.id, userId: user.id },
    include: conversationInclude,
    orderBy: { updatedAt: "desc" },
    take: DEMO_CONVERSATION_LIMIT,
  });

  const nameFor = await senderNames(
    conversations.flatMap((conversation) => conversation.messages),
    userLabel(user),
  );

  return conversations.map((conversation) => ({
    id: conversation.id,
    status: conversation.status as ConversationStatus,
    updatedAt: conversation.updatedAt,
    unreadCount: conversation.messages.filter(
      (message) => message.senderType === "admin" && message.readAt === null,
    ).length,
    messages: conversation.messages.map((message) => toThreadMessage(message, nameFor)),
  }));
}

async function setConversationStatus(
  input: Actor & { conversationId: string },
  from: ConversationStatus,
  to: ConversationStatus,
  eventType: "conversation.closed" | "conversation.reopened",
  alreadyMessage: string,
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findFirst({
      where: { id: input.conversationId, app: { workspaceId: input.workspaceId } },
    });
    if (!existing) throw new DomainError("Conversation was not found.", "not_found");
    if (existing.status === to) throw new DomainError(alreadyMessage, "conflict");
    if (existing.status !== from) {
      throw new DomainError("This conversation changed. Refresh and try again.", "conflict");
    }

    const updated = await tx.conversation.updateMany({
      where: { id: existing.id, status: from },
      data: { status: to },
    });
    if (updated.count !== 1) {
      throw new DomainError("This conversation changed. Refresh and try again.", "conflict");
    }

    await tx.event.create({
      data: {
        workspaceId: input.workspaceId,
        appId: existing.appId,
        actorType: "admin",
        actorId: input.actorId,
        type: eventType,
        entityType: "conversation",
        entityId: existing.id,
        payload: {
          actorName: input.actorName,
          feedbackId: existing.feedbackId,
          from,
          to,
        },
      },
    });

    return tx.conversation.findUniqueOrThrow({ where: { id: existing.id } });
  });
}

export function closeConversation(input: Actor & { conversationId: string }) {
  return setConversationStatus(
    input,
    "open",
    "closed",
    "conversation.closed",
    "This conversation is already closed.",
  );
}

export function reopenConversation(input: Actor & { conversationId: string }) {
  return setConversationStatus(
    input,
    "closed",
    "open",
    "conversation.reopened",
    "This conversation is already open.",
  );
}
