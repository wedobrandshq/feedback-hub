import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { earnItAppSecret, willowAppSecret } from "@/domain/secrets";
import { readDemoReply } from "@/domain/demo-reply";
import { readDemoSubmission } from "@/domain/demo-submission";
import { DomainError } from "@/domain/errors";
import { attachmentRoot } from "@/server/attachments";
import { listConversationsForUser, listInbox, replyAsAdmin, replyAsUser } from "@/server/conversations";
import { prisma } from "@/server/db";
import { closeFeedback, markFeedbackReviewed } from "@/server/feedback-status";
import { listFeedback } from "@/server/feedback-queries";
import { identifyUser } from "@/server/identify-user";
import { seedDatabase } from "@/server/seed";
import { submitFeedback } from "@/server/submit-feedback";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const willowSecret = willowAppSecret();
const earnItSecret = earnItAppSecret();

async function clearFeedback() {
  await prisma.notification.deleteMany();
  await prisma.changelogEntry.deleteMany();
  await prisma.requestUpdate.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.feedbackSuggestion.deleteMany();
  await prisma.requestSummary.deleteMany();
  await prisma.feedbackRequest.deleteMany();
  await prisma.request.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.feedbackAttachment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await seedDatabase();
});

beforeEach(async () => {
  await clearFeedback();
});

afterAll(async () => {
  await clearFeedback();
  await prisma.$disconnect();
  rmSync(attachmentRoot(), { recursive: true, force: true });
});

describe("identify user", () => {
  it("upserts by app and external user id", async () => {
    const created = await identifyUser({
      appSecret: willowSecret,
      externalUserId: "ext-1",
      email: "a@example.com",
      name: "A",
      plan: "Free",
    });
    const updated = await identifyUser({
      appSecret: willowSecret,
      externalUserId: "ext-1",
      name: "B",
      plan: "Plus",
    });

    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe("B");
    expect(updated.plan).toBe("Plus");
    expect(updated.email).toBe("a@example.com");
    expect(await prisma.user.count()).toBe(1);
  });

  it("keeps the same external id separate per app", async () => {
    const willow = await identifyUser({
      appSecret: willowSecret,
      externalUserId: "shared-id",
      name: "Willow Maya",
    });
    const earnIt = await identifyUser({
      appSecret: earnItSecret,
      externalUserId: "shared-id",
      name: "Earn It Sam",
    });

    expect(earnIt.id).not.toBe(willow.id);
    expect(earnIt.appId).not.toBe(willow.appId);
    expect(willow.name).toBe("Willow Maya");
    expect(earnIt.name).toBe("Earn It Sam");
  });

  it("rejects an unknown app credential", async () => {
    await expect(
      identifyUser({ appSecret: "not-a-real-secret", externalUserId: "ext-1", name: "Nope" }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});

describe("submit feedback", () => {
  it("stores the original message, starts as new, and records feedback.created", async () => {
    await identifyUser({
      appSecret: willowSecret,
      externalUserId: "maya",
      name: "Maya Chen",
      device: "iPhone 15",
    });

    const body = "  I would love a weekly mood summary.\nThe last week felt flat.  ";
    const feedback = await submitFeedback({
      appSecret: willowSecret,
      externalUserId: "maya",
      type: "idea",
      body,
      context: {
        appVersion: "2.4.1",
        osVersion: "iOS 18.6",
        device: "iPhone 16",
        locale: "en-US",
      },
    });

    expect(feedback.body).toBe(body);
    expect(feedback.title).toBeNull();
    expect(feedback.status).toBe("new");
    expect(feedback.type).toBe("idea");
    expect(feedback.source).toBe("in_app");
    expect(feedback.deviceAtSubmission).toBe("iPhone 16");
    expect(feedback.appVersionAtSubmission).toBe("2.4.1");

    const user = await prisma.user.findUniqueOrThrow({ where: { id: feedback.userId } });
    expect(user.device).toBe("iPhone 15");

    const events = await prisma.event.findMany({ where: { entityId: feedback.id } });
    expect(events.map((event) => event.type)).toEqual(["feedback.created"]);
    expect(events[0]?.actorType).toBe("user");
  });

  it("stores a screenshot and rejects a file that is not an image", async () => {
    await identifyUser({ appSecret: willowSecret, externalUserId: "maya", name: "Maya Chen" });
    const feedback = await submitFeedback({
      appSecret: willowSecret,
      externalUserId: "maya",
      type: "bug",
      body: "The chart disappears after I log a meal.",
      context: { device: "iPhone 16" },
      attachment: { fileName: "shot.png", bytes: PNG },
    });

    const attachment = await prisma.feedbackAttachment.findFirstOrThrow({ where: { feedbackId: feedback.id } });
    expect(attachment.contentType).toBe("image/png");
    expect(readFileSync(path.join(attachmentRoot(), attachment.storageKey)).equals(PNG)).toBe(true);

    await expect(
      submitFeedback({
        appSecret: willowSecret,
        externalUserId: "maya",
        type: "bug",
        body: "Not an image",
        context: {},
        attachment: { fileName: "notes.txt", bytes: Buffer.from("hello") },
      }),
    ).rejects.toMatchObject({ code: "validation" });
  });

  it("does not store a blank message or an unidentified user", async () => {
    await expect(
      submitFeedback({
        appSecret: willowSecret,
        externalUserId: "missing",
        type: "other",
        body: "Hello",
        context: {},
      }),
    ).rejects.toMatchObject({ code: "not_found" });

    await identifyUser({ appSecret: willowSecret, externalUserId: "maya", name: "Maya Chen" });
    await expect(
      submitFeedback({
        appSecret: willowSecret,
        externalUserId: "maya",
        type: "other",
        body: "   \n",
        context: {},
      }),
    ).rejects.toMatchObject({ code: "validation" });
    expect(await prisma.feedback.count()).toBe(0);
  });

  it("rejects a type the submit flow does not offer", async () => {
    await identifyUser({ appSecret: willowSecret, externalUserId: "maya", name: "Maya Chen" });
    await expect(
      submitFeedback({
        appSecret: willowSecret,
        externalUserId: "maya",
        type: "problem" as "idea",
        body: "Something else",
        context: {},
      }),
    ).rejects.toMatchObject({ code: "validation" });
  });
});

describe("app separation", () => {
  it("does not show Willow feedback inside Earn It", async () => {
    await identifyUser({ appSecret: willowSecret, externalUserId: "shared", name: "Willow Maya" });
    await identifyUser({ appSecret: earnItSecret, externalUserId: "shared", name: "Earn It Sam" });

    const willowFeedback = await submitFeedback({
      appSecret: willowSecret,
      externalUserId: "shared",
      type: "improvement",
      body: "Willow only: quieter reminders",
      context: { appVersion: "2.4.1" },
    });
    const earnItFeedback = await submitFeedback({
      appSecret: earnItSecret,
      externalUserId: "shared",
      type: "idea",
      body: "Earn It only: savings goals",
      context: { appVersion: "1.2.0" },
    });

    const willow = await prisma.app.findFirstOrThrow({ where: { slug: "willow" } });
    const earnIt = await prisma.app.findFirstOrThrow({ where: { slug: "earn-it" } });
    const filters = { type: null, status: null, search: null, from: null, to: null, error: null };

    const willowList = await listFeedback({ workspaceId: willow.workspaceId, appId: willow.id, filters });
    const earnItList = await listFeedback({ workspaceId: earnIt.workspaceId, appId: earnIt.id, filters });
    const all = await listFeedback({ workspaceId: willow.workspaceId, appId: null, filters });

    expect(willowList.rows.map((row) => row.id)).toEqual([willowFeedback.id]);
    expect(willowList.rows[0]?.user.name).toBe("Willow Maya");
    expect(earnItList.rows.map((row) => row.id)).toEqual([earnItFeedback.id]);
    expect(earnItList.rows[0]?.body).toBe("Earn It only: savings goals");
    expect(all.rows.map((row) => row.id).sort()).toEqual([willowFeedback.id, earnItFeedback.id].sort());
  });
});

describe("status changes", () => {
  it("marks reviewed and closes with separate events", async () => {
    await identifyUser({ appSecret: willowSecret, externalUserId: "maya", name: "Maya Chen" });
    const feedback = await submitFeedback({
      appSecret: willowSecret,
      externalUserId: "maya",
      type: "bug",
      body: "Search drops the last letter.",
      context: {},
    });
    const app = await prisma.app.findUniqueOrThrow({ where: { id: feedback.appId } });
    const actor = { workspaceId: app.workspaceId, actorId: "admin-1", actorName: "Alex Rivera", feedbackId: feedback.id };

    const reviewed = await markFeedbackReviewed(actor);
    expect(reviewed.status).toBe("reviewed");
    await expect(markFeedbackReviewed(actor)).rejects.toMatchObject({ code: "conflict" });

    const closed = await closeFeedback(actor);
    expect(closed.status).toBe("closed");
    await expect(closeFeedback(actor)).rejects.toMatchObject({ code: "conflict" });
    await expect(markFeedbackReviewed(actor)).rejects.toMatchObject({ code: "conflict" });

    const events = await prisma.event.findMany({ where: { entityId: feedback.id }, orderBy: { createdAt: "asc" } });
    expect(events.map((event) => event.type)).toEqual(["feedback.created", "feedback.reviewed", "feedback.closed"]);

    await expect(
      closeFeedback({ ...actor, workspaceId: "someone-elses-workspace", feedbackId: feedback.id }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("demo submission", () => {
  it("reads only the message fields and ignores identity or secrets", async () => {
    const formData = new FormData();
    formData.set("type", "idea");
    formData.set("body", "  Keep this spacing  ");
    formData.set("userId", "someone-else");
    formData.set("email", "evil@example.com");
    formData.set("appSecret", earnItSecret);
    formData.set("externalUserId", "usr_other");

    const submission = await readDemoSubmission(formData);
    expect(submission).toEqual({
      type: "idea",
      body: "  Keep this spacing  ",
      attachment: null,
    });

    const source = readFileSync(path.join(process.cwd(), "src/components/demo/willow-feedback.tsx"), "utf8");
    expect(source).not.toContain("willow-dev-secret");
    expect(source).not.toContain("earnit-dev-secret");
    expect(source).not.toContain("usr_maya_chen");
    expect(source).not.toContain("appSecret");
  });

  it("reads a reply without taking a client user id or app secret", () => {
    const formData = new FormData();
    formData.set("conversationId", "conv-1");
    formData.set("body", "  Still blank on Tuesday.  ");
    formData.set("userId", "someone-else");
    formData.set("externalUserId", "usr_other");
    formData.set("appSecret", earnItSecret);

    expect(readDemoReply(formData)).toEqual({
      conversationId: "conv-1",
      body: "  Still blank on Tuesday.  ",
    });
  });
});

describe("conversations", () => {
  async function willowThread(body: string) {
    await identifyUser({ appSecret: willowSecret, externalUserId: "maya", name: "Maya Chen" });
    const feedback = await submitFeedback({
      appSecret: willowSecret,
      externalUserId: "maya",
      type: "bug",
      body,
      context: {},
    });
    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { feedbackId: feedback.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    const app = await prisma.app.findUniqueOrThrow({ where: { id: feedback.appId } });
    const admin = await prisma.adminUser.findFirstOrThrow({ where: { workspaceId: app.workspaceId } });
    return { feedback, conversation, app, admin };
  }

  it("stores an admin reply on the conversation created with the feedback", async () => {
    const body = "  The weekly chart goes blank.  ";
    const { feedback, conversation, app, admin } = await willowThread(body);

    expect(conversation.status).toBe("open");
    expect(conversation.appId).toBe(feedback.appId);
    expect(conversation.userId).toBe(feedback.userId);
    expect(conversation.messages).toHaveLength(1);
    expect(conversation.messages[0]?.body).toBe(body);
    expect(conversation.messages[0]?.senderType).toBe("user");
    expect(conversation.messages[0]?.channel).toBe("in_app");
    expect(conversation.messages[0]?.readAt).toBeNull();
    expect(
      await prisma.event.count({ where: { type: "conversation.created", entityId: conversation.id } }),
    ).toBe(1);
    expect(
      await prisma.event.count({
        where: { type: "message.sent", entityId: conversation.messages[0]?.id },
      }),
    ).toBe(1);

    const before = await listInbox({ workspaceId: app.workspaceId, appId: app.id, filter: "needs_reply" });
    expect(before.rows.map((row) => row.id)).toContain(conversation.id);

    const replyBody = "  We can see the blank chart.  ";
    const reply = await replyAsAdmin({
      workspaceId: app.workspaceId,
      actorId: admin.id,
      actorName: admin.name,
      conversationId: conversation.id,
      body: replyBody,
    });
    expect(reply.body).toBe(replyBody);
    expect(reply.senderType).toBe("admin");
    expect(reply.senderId).toBe(admin.id);
    expect(reply.channel).toBe("in_app");
    expect((await prisma.event.findFirstOrThrow({ where: { entityId: reply.id } })).type).toBe("message.sent");

    const after = await listInbox({ workspaceId: app.workspaceId, appId: app.id, filter: "needs_reply" });
    expect(after.rows.map((row) => row.id)).not.toContain(conversation.id);

    await expect(
      replyAsAdmin({
        workspaceId: "someone-elses-workspace",
        actorId: admin.id,
        actorName: admin.name,
        conversationId: conversation.id,
        body: "Wrong workspace",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    expect(await prisma.message.count({ where: { conversationId: conversation.id } })).toBe(2);
  });

  it("stores a reply from the same user", async () => {
    const { conversation, app, admin } = await willowThread("The chart is blank.");
    await replyAsAdmin({
      workspaceId: app.workspaceId,
      actorId: admin.id,
      actorName: admin.name,
      conversationId: conversation.id,
      body: "Which day does it break?",
    });

    const userReply = await replyAsUser({
      appSecret: willowSecret,
      externalUserId: "maya",
      conversationId: conversation.id,
      body: "  It breaks after Tuesday.  ",
    });
    expect(userReply.senderType).toBe("user");
    expect(userReply.senderId).toBe(conversation.userId);
    expect(userReply.body).toBe("  It breaks after Tuesday.  ");
    expect(userReply.channel).toBe("in_app");
    expect((await prisma.event.findFirstOrThrow({ where: { entityId: userReply.id } })).type).toBe("message.sent");

    const inbox = await listInbox({ workspaceId: app.workspaceId, appId: null, filter: "needs_reply" });
    expect(inbox.rows.map((row) => row.id)).toContain(conversation.id);
    expect(inbox.rows.find((row) => row.id === conversation.id)?.preview).toBe("  It breaks after Tuesday.  ");
  });

  it("does not let Earn It read or write a Willow conversation", async () => {
    const { conversation, app } = await willowThread("Willow only: the chart is blank.");
    await identifyUser({ appSecret: earnItSecret, externalUserId: "maya", name: "Earn It Maya" });

    expect(
      await listConversationsForUser({ appSecret: earnItSecret, externalUserId: "maya" }),
    ).toEqual([]);

    await expect(
      replyAsUser({
        appSecret: earnItSecret,
        externalUserId: "maya",
        conversationId: conversation.id,
        body: "Earn It should not send this.",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
    expect(await prisma.message.count({ where: { conversationId: conversation.id } })).toBe(1);

    const earnIt = await prisma.app.findFirstOrThrow({ where: { slug: "earn-it" } });
    const earnItInbox = await listInbox({
      workspaceId: app.workspaceId,
      appId: earnIt.id,
      filter: "all",
    });
    expect(earnItInbox.rows).toEqual([]);

    const willowInbox = await listInbox({
      workspaceId: app.workspaceId,
      appId: app.id,
      filter: "all",
    });
    expect(willowInbox.rows.map((row) => row.id)).toEqual([conversation.id]);
  });
});
