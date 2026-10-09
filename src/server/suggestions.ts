import { generateText, Output } from "ai";
import { z } from "zod";
import { FEEDBACK_TYPES } from "@/domain/config";
import { DomainError } from "@/domain/errors";
import {
  SUGGESTION_CANDIDATE_LIMIT,
  SUGGESTION_MODEL,
  interpretModelSuggestion,
  providerConfigured,
} from "@/domain/suggestions";
import { prisma } from "@/server/db";
import { linkFeedbackToRequest } from "@/server/requests";

const suggestionSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  topics: z.array(z.string()).max(8),
  match: z
    .object({
      requestId: z.string(),
      similarity: z.number(),
    })
    .nullable(),
});

const summarySchema = z.object({
  summary: z.string(),
});

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

export async function ensureFeedbackSuggestion(feedbackId: string) {
  const existing = await prisma.feedbackSuggestion.findUnique({ where: { feedbackId } });
  if (existing || !providerConfigured()) return existing;

  const feedback = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, appId: true, body: true, type: true },
  });
  if (!feedback) return null;

  const candidates = await prisma.request.findMany({
    where: { appId: feedback.appId },
    orderBy: { updatedAt: "desc" },
    take: SUGGESTION_CANDIDATE_LIMIT,
    select: { id: true, title: true, description: true, visibility: true },
  });

  const catalog = candidates
    .map(
      (request) =>
        `${request.id}\t${request.visibility}\t${request.title}\t${request.description.replace(/\s+/g, " ").slice(0, 280)}`,
    )
    .join("\n");

  try {
    const output = await modelObject(
      suggestionSchema,
      [
        "You organize product feedback. Do not rewrite the feedback.",
        "Choose a type, up to 8 short topics, and at most one request from the list.",
        "If you choose a request, similarity is your own confidence from 0 to 1 that this feedback is the same need. Do not count keywords.",
        "If none of the requests is the same need, match is null.",
        "Use a request id only from the list.",
        "",
        `Submitted type: ${feedback.type}`,
        `Feedback: ${feedback.body}`,
        "",
        "Requests (id, visibility, title, description):",
        catalog || "(none)",
      ].join("\n"),
    );
    const interpreted = interpretModelSuggestion(output, new Set(candidates.map((request) => request.id)));
    if (!interpreted) return null;
    return await prisma.feedbackSuggestion.create({
      data: {
        feedbackId: feedback.id,
        suggestedType: interpreted.type,
        topics: interpreted.topics,
        requestId: interpreted.match?.requestId ?? null,
        similarity: interpreted.match?.similarity ?? null,
        model: SUGGESTION_MODEL,
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
