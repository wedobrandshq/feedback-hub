import { generateText, Output } from "ai";
import { z } from "zod";
import { DomainError } from "@/domain/errors";
import {
  SUGGESTION_CANDIDATE_LIMIT,
  SUGGESTION_MODEL,
  TYPELLM_MODEL,
  buildSuggestionQuestions,
  interpretTypeLlmResult,
  providerConfigured,
  screenshotDataPrefix,
  typeLlmConfigured,
} from "@/domain/suggestions";
import { readAttachment } from "@/server/attachments";
import { prisma } from "@/server/db";
import { linkFeedbackToRequest } from "@/server/requests";

const summarySchema = z.object({
  summary: z.string(),
});

const TYPELLM_URL = "https://api.typellm.ai/v1/generate";

async function modelObject<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  const { output } = await generateText({
    model: SUGGESTION_MODEL,
    output: Output.object({ schema }),
    reasoning: "low",
    prompt,
  });
  if (!output) throw new DomainError("The model did not return a suggestion.", "validation");
  return output;
}

async function screenshotImages(attachments: { contentType: string; storageKey: string }[]) {
  const images: string[] = [];
  for (const attachment of attachments) {
    if (images.length >= 8) break;
    const prefix = screenshotDataPrefix(attachment.contentType);
    if (!prefix) continue;
    try {
      const bytes = await readAttachment(attachment.storageKey);
      images.push(`${prefix}${bytes.toString("base64")}`);
    } catch {
      // The saved message can still be classified without this screenshot.
    }
  }
  return images;
}

async function generateWithTypeLlm(input: { context: string; images: string[]; questions: object }) {
  const key = process.env.TYPELLM_API_KEY;
  if (!key) return null;
  const response = await fetch(TYPELLM_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      context: input.context,
      ...(input.images.length > 0 ? { images: input.images } : {}),
      questions: input.questions,
      timeout: 60,
    }),
    signal: AbortSignal.timeout(65_000),
  });
  if (!response.ok) {
    const detail = (await response.json().catch(() => null)) as { error?: { type?: unknown } } | null;
    const type = typeof detail?.error?.type === "string" ? detail.error.type : "unknown";
    console.error(`TypeLLM generate failed: ${response.status} ${type}`);
    return null;
  }
  const payload = (await response.json()) as { model?: unknown; result?: unknown };
  if (!payload.result || typeof payload.result !== "object") return null;
  return {
    model: typeof payload.model === "string" && payload.model ? payload.model : TYPELLM_MODEL,
    result: payload.result as { type?: unknown; urgent?: unknown; summary?: unknown; match?: unknown },
  };
}

export async function ensureFeedbackSuggestion(feedbackId: string) {
  const existing = await prisma.feedbackSuggestion.findUnique({ where: { feedbackId } });
  if (existing || !typeLlmConfigured()) return existing;

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true,
      appId: true,
      body: true,
      attachments: { select: { contentType: true, storageKey: true } },
    },
  });
  if (!feedback) return null;

  const candidates = await prisma.request.findMany({
    where: { appId: feedback.appId },
    orderBy: { updatedAt: "desc" },
    take: SUGGESTION_CANDIDATE_LIMIT,
    select: { id: true, title: true, description: true },
  });

  try {
    const generated = await generateWithTypeLlm({
      context: feedback.body,
      images: await screenshotImages(feedback.attachments),
      questions: buildSuggestionQuestions(candidates),
    });
    if (!generated) return null;
    const interpreted = interpretTypeLlmResult(generated.result, new Set(candidates.map((request) => request.id)));
    if (!interpreted) return null;
    return await prisma.feedbackSuggestion.create({
      data: {
        feedbackId: feedback.id,
        suggestedType: interpreted.type,
        topics: [],
        urgent: interpreted.urgent,
        summary: interpreted.summary,
        requestId: interpreted.match?.requestId ?? null,
        similarity: null,
        model: generated.model,
        status: "pending",
      },
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "P2002") {
      return prisma.feedbackSuggestion.findUnique({ where: { feedbackId } });
    }
    return null;
  }
}

export async function ignoreSuggestion(input: { workspaceId: string; feedbackId: string }) {
  const feedback = await prisma.feedback.findFirst({
    where: { id: input.feedbackId, deletedAt: null, app: { workspaceId: input.workspaceId } },
    include: { suggestion: true, requestLink: true },
  });
  if (!feedback) throw new DomainError("Feedback was not found.", "not_found");
  if (!feedback.suggestion || feedback.suggestion.status !== "pending") {
    throw new DomainError("There is no pending suggestion to ignore.", "conflict");
  }
  if (feedback.requestLink) {
    throw new DomainError("This feedback is already linked to a request.", "conflict");
  }
  const before = { body: feedback.body, type: feedback.type };
  await prisma.feedbackSuggestion.update({
    where: { id: feedback.suggestion.id },
    data: { status: "ignored" },
  });
  const after = await prisma.feedback.findUniqueOrThrow({
    where: { id: feedback.id },
    select: { body: true, type: true, requestLink: true },
  });
  if (after.body !== before.body || after.type !== before.type || after.requestLink) {
    throw new DomainError("Ignoring a suggestion must leave the feedback unchanged.", "conflict");
  }
}

export async function acceptSuggestedRequest(input: {
  id: string;
  name: string;
  workspaceId: string;
  feedbackId: string;
}) {
  const suggestion = await prisma.feedbackSuggestion.findFirst({
    where: {
      feedbackId: input.feedbackId,
      status: "pending",
      feedback: { deletedAt: null, app: { workspaceId: input.workspaceId } },
    },
  });
  if (!suggestion?.requestId) {
    throw new DomainError("There is no suggested request to link.", "conflict");
  }
  const before = await prisma.feedback.findUniqueOrThrow({
    where: { id: input.feedbackId },
    select: { body: true, type: true },
  });
  const requestBefore = await prisma.request.findUniqueOrThrow({
    where: { id: suggestion.requestId },
    select: { visibility: true },
  });
  await linkFeedbackToRequest({
    id: input.id,
    name: input.name,
    workspaceId: input.workspaceId,
    feedbackId: input.feedbackId,
    requestId: suggestion.requestId,
  });
  const after = await prisma.feedback.findUniqueOrThrow({
    where: { id: input.feedbackId },
    select: { body: true, type: true },
  });
  const requestAfter = await prisma.request.findUniqueOrThrow({
    where: { id: suggestion.requestId },
    select: { visibility: true },
  });
  if (after.body !== before.body || after.type !== before.type) {
    throw new DomainError("Linking a suggestion must not change the original feedback.", "conflict");
  }
  if (requestAfter.visibility !== requestBefore.visibility) {
    throw new DomainError("Linking a suggestion must not publish the request.", "conflict");
  }
  await refreshRequestSummary(suggestion.requestId).catch(() => undefined);
  return suggestion.requestId;
}

export async function refreshRequestSummary(requestId: string) {
  if (!providerConfigured()) return null;
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      links: {
        include: { feedback: { select: { body: true, deletedAt: true } } },
      },
      summary: true,
    },
  });
  if (!request) return null;
  const bodies = request.links
    .map((link) => link.feedback)
    .filter((feedback) => feedback.deletedAt === null)
    .map((feedback) => feedback.body);
  if (bodies.length === 0) return request.summary;
  if (request.summary && request.summary.feedbackCount === bodies.length) return request.summary;

  try {
    const output = await modelObject(
      summarySchema,
      [
        "Write a short summary of what these people asked for. Two or three sentences.",
        "This is generated analysis for an admin. Do not include names, emails, or devices.",
        `Request: ${request.title}`,
        request.description,
        "",
        ...bodies.map((body, index) => `${index + 1}. ${body}`),
      ].join("\n"),
    );
    const body = output.summary.trim();
    if (!body) return request.summary;
    return prisma.requestSummary.upsert({
      where: { requestId: request.id },
      create: {
        requestId: request.id,
        body,
        model: SUGGESTION_MODEL,
        feedbackCount: bodies.length,
      },
      update: {
        body,
        model: SUGGESTION_MODEL,
        feedbackCount: bodies.length,
      },
    });
  } catch {
    return request.summary;
  }
}

export async function suggestionForAdmin(workspaceId: string, feedbackId: string) {
  return prisma.feedbackSuggestion.findFirst({
    where: { feedbackId, feedback: { app: { workspaceId }, deletedAt: null } },
    include: { request: { select: { id: true, title: true, visibility: true } } },
  });
}
