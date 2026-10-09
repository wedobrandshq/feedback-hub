import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { interpretModelSuggestion, providerConfigured } from "@/domain/suggestions";
import { willowAppSecret } from "@/domain/secrets";
import { DomainError } from "@/domain/errors";
import { prisma } from "@/server/db";
import { identifyUser } from "@/server/identify-user";
import { createRequestFromFeedback, listPublicRequests, publishRequest } from "@/server/requests";
import { seedDatabase } from "@/server/seed";
import { submitFeedback } from "@/server/submit-feedback";
import { acceptSuggestedRequest, ensureFeedbackSuggestion, ignoreSuggestion } from "@/server/suggestions";

const willowSecret = willowAppSecret();

async function clearProduct() {
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

describe("suggestions", () => {
  it("keeps a model similarity only for a request that was offered", () => {
    const kept = interpretModelSuggestion(
      {
        type: "idea",
        topics: [" mood ", ""],
        match: { requestId: "req_mood", similarity: 0.82 },
      },
      new Set(["req_mood"]),
    );
    expect(kept).toEqual({
      type: "idea",
      topics: ["mood"],
      match: { requestId: "req_mood", similarity: 0.82 },
    });

    const dropped = interpretModelSuggestion(
      {
        type: "idea",
        topics: ["mood"],
        match: { requestId: "req_other", similarity: 0.99 },
      },
      new Set(["req_mood"]),
    );
    expect(dropped?.match).toBeNull();

    const notANumber = interpretModelSuggestion(
      {
        type: "idea",
        topics: [],
        match: { requestId: "req_mood", similarity: Number.NaN },
      },
      new Set(["req_mood"]),
    );
    expect(notANumber?.match).toBeNull();
    expect(interpretModelSuggestion({ type: "praise", topics: [], match: null }, new Set())).toBeNull();
  });

  it("does not change type or links until the suggestion is accepted", async () => {
    expect(providerConfigured()).toBe(false);
    const original = "Please add a weekly mood chart.";
    const first = await willowFeedback(original);
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: first.id,
      title: "Weekly mood chart",
      description: "A chart of the week.",
      status: "released",
    });
    await publishRequest({ ...admin, requestId: request.id });

    const second = await willowFeedback(original);
    await prisma.feedbackSuggestion.create({
      data: {
        feedbackId: second.id,
        suggestedType: "bug",
        topics: ["mood", "chart"],
        requestId: request.id,
        similarity: 0.91,
        model: "openai/gpt-5-mini",
        status: "pending",
      },
    });

    const before = await prisma.feedback.findUniqueOrThrow({
      where: { id: second.id },
      include: { requestLink: true },
    });
    expect(before.body).toBe(original);
    expect(before.type).toBe("idea");
    expect(before.requestLink).toBeNull();
    expect(await prisma.request.count()).toBe(1);

    await acceptSuggestedRequest({ ...admin, feedbackId: second.id });

    const after = await prisma.feedback.findUniqueOrThrow({
      where: { id: second.id },
      include: { requestLink: true, suggestion: true },
    });
    expect(after.body).toBe(original);
    expect(after.type).toBe("idea");
    expect(after.requestLink?.requestId).toBe(request.id);
    expect(after.suggestion?.status).toBe("linked");
    expect(after.suggestion?.similarity).toBe(0.91);
    const storedRequest = await prisma.request.findUniqueOrThrow({ where: { id: request.id } });
    expect(storedRequest.visibility).toBe("public");
    expect(await prisma.request.count()).toBe(1);
  });

  it("leaves feedback unchanged when a suggestion is ignored", async () => {
    const body = "I want a weekly mood chart on Sunday.";
    const feedback = await willowFeedback(body);
    const admin = await actor();
    await prisma.feedbackSuggestion.create({
      data: {
        feedbackId: feedback.id,
        suggestedType: "improvement",
        topics: ["mood"],
        requestId: null,
        similarity: null,
        model: "openai/gpt-5-mini",
        status: "pending",
      },
    });

    await ignoreSuggestion({ workspaceId: admin.workspaceId, feedbackId: feedback.id });

    const stored = await prisma.feedback.findUniqueOrThrow({
      where: { id: feedback.id },
      include: { requestLink: true, suggestion: true },
    });
    expect(stored.body).toBe(body);
    expect(stored.type).toBe("idea");
    expect(stored.status).toBe("new");
    expect(stored.requestLink).toBeNull();
    expect(stored.suggestion?.status).toBe("ignored");
    await expect(ignoreSuggestion({ workspaceId: admin.workspaceId, feedbackId: feedback.id })).rejects.toBeInstanceOf(
      DomainError,
    );
  });

  it("keeps the generated summary and similarity off the demo request payload", async () => {
    const feedback = await willowFeedback("Please add a weekly mood chart.");
    const admin = await actor();
    const request = await createRequestFromFeedback({
      ...admin,
      feedbackId: feedback.id,
      title: "Weekly mood chart",
      description: "A chart of the week.",
      status: "review",
    });
    await publishRequest({ ...admin, requestId: request.id });
    await prisma.requestSummary.create({
      data: {
        requestId: request.id,
        body: "model-wrote-this-summary-9f3a",
        model: "openai/gpt-5-mini",
        feedbackCount: 1,
      },
    });
    await prisma.feedbackSuggestion.create({
      data: {
        feedbackId: feedback.id,
        suggestedType: "idea",
        topics: ["mood-topic-token"],
        requestId: request.id,
        similarity: 0.77,
        model: "openai/gpt-5-mini",
        status: "linked",
      },
    });

    const visible = await listPublicRequests({ appSecret: willowSecret, externalUserId: "maya" });
    const json = JSON.stringify(visible);
    expect(json).not.toContain("model-wrote-this-summary-9f3a");
    expect(json).not.toContain("mood-topic-token");
    expect(json).not.toContain("openai/gpt-5-mini");
    expect(json).not.toContain("0.77");
    expect(visible[0]).not.toHaveProperty("summary");
    expect(visible[0]).not.toHaveProperty("similarity");
    expect(await ensureFeedbackSuggestion(feedback.id)).not.toBeNull();
  });
});
