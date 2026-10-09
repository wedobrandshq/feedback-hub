import { FEEDBACK_TYPES, type FeedbackTypeName } from "@/domain/config";

export const SUGGESTION_MODEL = "openai/gpt-5-mini";
export const SUGGESTION_CANDIDATE_LIMIT = 40;

export type ModelSuggestion = {
  type: FeedbackTypeName;
  topics: string[];
  match: { requestId: string; similarity: number } | null;
};

export function providerConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL === "1",
  );
}

export function interpretModelSuggestion(
  output: { type: string; topics: string[]; match: { requestId: string; similarity: number } | null },
  candidateIds: ReadonlySet<string>,
): ModelSuggestion | null {
  if (!(FEEDBACK_TYPES as readonly string[]).includes(output.type)) return null;
  const topics = output.topics
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0)
    .slice(0, 8);
  const match = output.match;
  const similarity = match?.similarity;
  const accepted =
    match &&
    candidateIds.has(match.requestId) &&
    typeof similarity === "number" &&
    Number.isFinite(similarity)
      ? { requestId: match.requestId, similarity }
      : null;
  return { type: output.type as FeedbackTypeName, topics, match: accepted };
}
