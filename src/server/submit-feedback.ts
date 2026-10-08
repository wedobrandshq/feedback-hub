import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { BODY_MAX_LENGTH, SUBMIT_FEEDBACK_TYPES, type SubmitFeedbackType } from "@/domain/config";
import { DomainError } from "@/domain/errors";
import { safeFileName, validateScreenshot } from "@/domain/images";
import { resolveStoragePath, writeAttachment } from "@/server/attachments";
import { prisma } from "@/server/db";
import { resolveAppBySecret } from "@/server/identify-user";

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
    return await prisma.$transaction(async (tx) => {
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

      return feedback;
    });
  } catch (error) {
    await Promise.all(
      writtenKeys.map(async (key) => {
        await unlink(resolveStoragePath(key)).catch(() => undefined);
      }),
    );
    throw error;
  }
}
