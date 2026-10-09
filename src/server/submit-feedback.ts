import { randomUUID } from "node:crypto";
import { BODY_MAX_LENGTH, SUBMIT_FEEDBACK_TYPES, type SubmitFeedbackType } from "@/domain/config";
import { DomainError } from "@/domain/errors";
import { safeFileName, validateScreenshot } from "@/domain/images";
import { deleteAttachment, writeAttachment } from "@/server/attachments";
import { prisma } from "@/server/db";
import { resolveAppBySecret } from "@/server/identify-user";
import { ensureFeedbackSuggestion } from "@/server/suggestions";

export type SubmitFeedbackInput = {
  appSecret: string;
  externalUserId: string;
  type: SubmitFeedbackType;
  body: string;
  context: {
    appVersion?: string | null;
    osVersion?: string | null;
    device?: string | null;
    locale?: string | null;
  };
  attachment?: {
    fileName: string;
    bytes: Buffer;
  } | null;
};

export async function submitFeedback(input: SubmitFeedbackInput) {
  if (!(SUBMIT_FEEDBACK_TYPES as readonly string[]).includes(input.type)) {
    throw new DomainError("Choose what kind of feedback this is.", "validation");
  }

  const app = await resolveAppBySecret(input.appSecret);
  const externalUserId = input.externalUserId.trim();
  if (!externalUserId) {
    throw new DomainError("A user id is required.", "validation");
  }
  if (input.body.trim().length === 0) {
    throw new DomainError("Tell us a bit more before sending.", "validation");
  }
  if (input.body.length > BODY_MAX_LENGTH) {
    throw new DomainError("Feedback needs to be 10,000 characters or less.", "validation");
  }

  const user = await prisma.user.findUnique({
    where: { appId_externalUserId: { appId: app.id, externalUserId } },
  });
  if (!user) {
    throw new DomainError("This user has not been identified for this app.", "not_found");
  }

  return createSubmittedFeedback({
    app,
    user,
    type: input.type,
    body: input.body,
    context: input.context,
    attachment: input.attachment ?? null,
  });
}

export async function submitFeedbackForActor(input: {
  appId: string;
  userId: string;
  type: SubmitFeedbackType;
  body: string;
  context: SubmitFeedbackInput["context"];
  attachment?: SubmitFeedbackInput["attachment"];
}) {
  if (!(SUBMIT_FEEDBACK_TYPES as readonly string[]).includes(input.type)) {
    throw new DomainError("Choose what kind of feedback this is.", "validation");
  }
  if (input.body.trim().length === 0) {
    throw new DomainError("Tell us a bit more before sending.", "validation");
  }
  if (input.body.length > BODY_MAX_LENGTH) {
    throw new DomainError("Feedback needs to be 10,000 characters or less.", "validation");
  }
  const app = await prisma.app.findUnique({ where: { id: input.appId } });
  const user = await prisma.user.findFirst({ where: { id: input.userId, appId: input.appId } });
  if (!app || !user) {
    throw new DomainError("This session is no longer valid.", "unauthorized");
  }
  return createSubmittedFeedback({
    app,
    user,
    type: input.type,
    body: input.body,
    context: input.context,
    attachment: input.attachment ?? null,
  });
}

async function createSubmittedFeedback(input: {
  app: { id: string; workspaceId: string };
  user: { id: string; name: string | null };
  type: SubmitFeedbackType;
  body: string;
  context: SubmitFeedbackInput["context"];
  attachment: { fileName: string; bytes: Buffer } | null;
}) {
  const { app, user } = input;
  let storedAttachment: { fileName: string; contentType: string; bytes: Buffer } | null = null;
  if (input.attachment) {
    const contentType = validateScreenshot(input.attachment.bytes);
    storedAttachment = {
      fileName: safeFileName(input.attachment.fileName, contentType),
      contentType,
      bytes: input.attachment.bytes,
    };
  }

  const writtenKeys: string[] = [];
  try {
    const feedback = await prisma.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          appId: app.id,
          userId: user.id,
          type: input.type,
          title: null,
          body: input.body,
          status: "new",
          source: "in_app",
          appVersionAtSubmission: input.context.appVersion ?? null,
          osVersionAtSubmission: input.context.osVersion ?? null,
          deviceAtSubmission: input.context.device ?? null,
          localeAtSubmission: input.context.locale ?? null,
        },
      });

      if (storedAttachment) {
        const storageKey = `${feedback.id}/${randomUUID()}`;
        await writeAttachment(storageKey, storedAttachment.bytes);
        writtenKeys.push(storageKey);
        await tx.feedbackAttachment.create({
          data: {
            feedbackId: feedback.id,
            fileName: storedAttachment.fileName,
            contentType: storedAttachment.contentType,
            sizeBytes: storedAttachment.bytes.length,
            storageKey,
          },
        });
      }

      await tx.event.create({
        data: {
          workspaceId: app.workspaceId,
          appId: app.id,
          actorType: "user",
          actorId: user.id,
          type: "feedback.created",
          entityType: "feedback",
          entityId: feedback.id,
          payload: {
            actorName: user.name,
            feedbackType: input.type,
            status: "new",
          },
        },
      });

      const conversation = await tx.conversation.create({
        data: {
          appId: app.id,
          userId: user.id,
          feedbackId: feedback.id,
          status: "open",
        },
      });

      const message = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderType: "user",
          senderId: user.id,
          body: feedback.body,
          channel: "in_app",
        },
      });

      await tx.event.create({
        data: {
          workspaceId: app.workspaceId,
          appId: app.id,
          actorType: "user",
          actorId: user.id,
          type: "conversation.created",
          entityType: "conversation",
          entityId: conversation.id,
          payload: {
            actorName: user.name,
            feedbackId: feedback.id,
          },
        },
      });

      await tx.event.create({
        data: {
          workspaceId: app.workspaceId,
          appId: app.id,
          actorType: "user",
          actorId: user.id,
          type: "message.sent",
          entityType: "message",
          entityId: message.id,
          payload: {
            actorName: user.name,
            conversationId: conversation.id,
            feedbackId: feedback.id,
            senderType: "user",
            channel: "in_app",
          },
        },
      });

      return feedback;
    });
    await ensureFeedbackSuggestion(feedback.id).catch(() => undefined);
    return feedback;
  } catch (error) {
    await Promise.all(
      writtenKeys.map(async (key) => {
        await deleteAttachment(key).catch(() => undefined);
      }),
    );
    throw error;
  }
}
