import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { earnItAppSecret, willowAppSecret } from "@/domain/secrets";
import { DomainError } from "@/domain/errors";
import { prisma } from "@/server/db";
import { identifyUser } from "@/server/identify-user";
import {
  changeRequestStatus,
  createChangelogEntry,
  createRequestFromFeedback,
  linkFeedbackToRequest,
  listPublicRequests,
  publishRequest,
  publishRequestUpdate,
  removeVote,
  requestMetrics,
  unlinkFeedbackFromRequest,
  voteOnRequest,
} from "@/server/requests";
import { seedDatabase } from "@/server/seed";
import { submitFeedback } from "@/server/submit-feedback";

const willowSecret = willowAppSecret();
const earnItSecret = earnItAppSecret();

async function clearProduct() {
  await prisma.notification.deleteMany();
  await prisma.changelogEntry.deleteMany();
  await prisma.requestUpdate.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.feedbackRequest.deleteMany();
  await prisma.request.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.feedbackAttachment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.user.deleteMany();
}

async function actor() {
  const admin = await prisma.adminUser.findFirstOrThrow();
  return { id: admin.id, name: admin.name, workspaceId: admin.workspaceId };
}

async function willowFeedback(body: string) {
  await identifyUser({ appSecret: willowSecret, externalUserId: "maya", name: "Maya Chen" });
  return submitFeedback({
    appSecret: willowSecret,
    externalUserId: "maya",
    type: "idea",
    body,
    context: {},
  });
}

beforeAll(async () => {
  await seedDatabase();
});

beforeEach(async () => {
  await clearProduct();
});

afterAll(async () => {
  await clearProduct();
  await prisma.$disconnect();
});

describe("requests", () => {
  it("creates a private request from feedback without changing the feedback text", async () => {
    const body = "  Please add a night theme.  ";
    const feedback = await willowFeedback(body);
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: feedback.id,
      title: "Night theme",
      description: "A darker Willow.",
      status: "review",
    });

    expect(request.visibility).toBe("private");
    expect(request.status).toBe("review");
    const stored = await prisma.feedback.findUniqueOrThrow({ where: { id: feedback.id } });
    expect(stored.body).toBe(body);
    expect(stored.status).toBe("linked");
    expect(await prisma.event.count({ where: { type: "request.created", entityId: request.id } })).toBe(1);
    expect(await prisma.event.count({ where: { type: "feedback.linked", entityId: feedback.id } })).toBe(1);
    const metrics = await requestMetrics(request.id);
    expect(metrics.feedbackCount).toBe(1);
    expect(metrics.uniqueFeedbackUsers).toBe(1);
    expect(metrics.voteCount).toBe(0);
    expect(metrics.uniqueVoters).toBe(0);
    expect(metrics.conversationCount).toBe(1);
  });

  it("links another feedback item and unlinks it without deleting the text", async () => {
    const first = await willowFeedback("Dark mode please.");
    const second = await willowFeedback("The screen is too bright.");
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: first.id,
      title: "Night theme",
      description: "A darker Willow.",
      status: "review",
    });
    await linkFeedbackToRequest({ ...admin, requestId: request.id, feedbackId: second.id });
    expect((await requestMetrics(request.id)).feedbackCount).toBe(2);
    expect((await prisma.feedback.findUniqueOrThrow({ where: { id: second.id } })).body).toBe("The screen is too bright.");

    await unlinkFeedbackFromRequest({ ...admin, feedbackId: second.id });
    const unlinked = await prisma.feedback.findUniqueOrThrow({ where: { id: second.id } });
    expect(unlinked.body).toBe("The screen is too bright.");
    expect(unlinked.status).toBe("reviewed");
    expect(await prisma.feedbackRequest.count({ where: { feedbackId: second.id } })).toBe(0);
    expect(await prisma.event.count({ where: { type: "feedback.unlinked", entityId: second.id } })).toBe(1);
  });

  it("publishes a request and keeps a private one out of Willow", async () => {
    const feedback = await willowFeedback("Weekly mood summary.");
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: feedback.id,
      title: "Weekly mood summary",
      description: "A Sunday recap.",
      status: "review",
    });
    expect(await listPublicRequests({ appSecret: willowSecret, externalUserId: "maya" })).toEqual([]);
    await publishRequest({ ...admin, requestId: request.id });
    const visible = await listPublicRequests({ appSecret: willowSecret, externalUserId: "maya" });
    expect(visible.map((item) => item.title)).toEqual(["Weekly mood summary"]);
    expect(visible[0]?.status).toBe("review");
    expect(JSON.stringify(visible)).not.toContain("maya");
    expect(JSON.stringify(visible)).not.toContain("@");
  });

  it("allows one vote per user and a removal", async () => {
    const feedback = await willowFeedback("Weekly mood summary.");
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: feedback.id,
      title: "Weekly mood summary",
      description: "A Sunday recap.",
      status: "review",
    });
    await publishRequest({ ...admin, requestId: request.id });
    await voteOnRequest({ appSecret: willowSecret, externalUserId: "maya", requestId: request.id });
    await expect(
      voteOnRequest({ appSecret: willowSecret, externalUserId: "maya", requestId: request.id }),
    ).rejects.toMatchObject({ code: "conflict" });
    const metrics = await requestMetrics(request.id);
    expect(metrics.voteCount).toBe(1);
    expect(metrics.uniqueVoters).toBe(1);
    expect(metrics.feedbackCount).toBe(1);
    await removeVote({ appSecret: willowSecret, externalUserId: "maya", requestId: request.id });
    expect((await requestMetrics(request.id)).voteCount).toBe(0);
    expect(await prisma.event.count({ where: { type: "request.unvoted", entityId: request.id } })).toBe(1);
  });

  it("changes status without notifying, then notifies interested Willow users only", async () => {
    const feedback = await willowFeedback("Weekly mood summary.");
    await identifyUser({ appSecret: earnItSecret, externalUserId: "sam", name: "Sam" });
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: feedback.id,
      title: "Weekly mood summary",
      description: "A Sunday recap.",
      status: "review",
    });
    await publishRequest({ ...admin, requestId: request.id });
    await voteOnRequest({ appSecret: willowSecret, externalUserId: "maya", requestId: request.id });

    await changeRequestStatus({ ...admin, requestId: request.id, status: "planned", notify: false });
    expect(await prisma.notification.count()).toBe(0);
    expect(await prisma.event.count({ where: { type: "request.status_changed", entityId: request.id } })).toBe(1);

    const notified = await changeRequestStatus({ ...admin, requestId: request.id, status: "released", notify: true });
    expect(notified.notified).toBe(1);
    const notes = await prisma.notification.findMany();
    expect(notes).toHaveLength(1);
    expect(notes[0]?.channel).toBe("in_app");
    expect(notes[0]?.body).toBe("Weekly mood summary is now Released.");
    const maya = await prisma.user.findFirstOrThrow({ where: { externalUserId: "maya" } });
    expect(notes[0]?.userId).toBe(maya.id);

    await expect(
      voteOnRequest({ appSecret: earnItSecret, externalUserId: "sam", requestId: request.id }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(await listPublicRequests({ appSecret: earnItSecret, externalUserId: "sam" })).toEqual([]);
  });

  it("publishes an update and a changelog entry only after release", async () => {
    const feedback = await willowFeedback("Weekly mood summary.");
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: feedback.id,
      title: "Weekly mood summary",
      description: "A Sunday recap.",
      status: "planned",
    });
    await expect(
      createChangelogEntry({ ...admin, requestId: request.id, body: "Shipped." }),
    ).rejects.toMatchObject({ code: "conflict" });
    const update = await publishRequestUpdate({ ...admin, requestId: request.id, body: "We started the Sunday recap." });
    expect(update.visibility).toBe("public");
    await changeRequestStatus({ ...admin, requestId: request.id, status: "released", notify: false });
    const entry = await createChangelogEntry({ ...admin, requestId: request.id, body: "Sunday recap is in Willow." });
    expect(entry.title).toBe("Weekly mood summary");
    expect(await prisma.event.count({ where: { type: "request.update_published", entityId: request.id } })).toBe(1);
  });
});
