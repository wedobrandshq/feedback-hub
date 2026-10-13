import { SUBMIT_FEEDBACK_TYPES, type SubmitFeedbackType } from "@/domain/config";

export const SUGGESTION_MODEL = "openai/gpt-5-mini";
export const TYPELLM_MODEL = "typellm-latest";
export const SUGGESTION_CANDIDATE_LIMIT = 40;
export const MATCH_CONFIDENCE = 0.8;
export const NO_REQUEST_MATCH = "none";

const SCREENSHOT_TYPES: Record<string, string> = {
  "image/png": "image/png",
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
  "image/bmp": "image/bmp",
};

export type TypeLlmSuggestion = {
  type: SubmitFeedbackType;
  urgent: boolean;
  summary: string;
  match: { requestId: string } | null;
};

export function typeLlmConfigured() {
  return Boolean(process.env.TYPELLM_API_KEY);
}

export function providerConfigured() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL === "1",
  );
}

export function screenshotDataPrefix(contentType: string) {
  const type = SCREENSHOT_TYPES[contentType.toLowerCase()];
  if (!type) return null;
  return `data:${type};base64,`;
}

export function buildSuggestionQuestions(
  candidates: { id: string; title: string; description: string }[],
) {
  return {
    type: {
      type: "string",
      enum: [...SUBMIT_FEEDBACK_TYPES],
      instructions: "What kind of feedback this is. A suggestion for the admin, not a status.",
    },
    urgent: {
      type: "boolean",
      instructions: "Whether this looks urgent. A suggestion only. Never a status.",
    },
    summary: {
      type: "string",
      instructions: "One sentence for the admin. Do not include names, emails, or devices.",
    },
    match: {
      type: "string",
      choices: [
        { value: NO_REQUEST_MATCH, description: "No existing request is the same need." },
        ...candidates.map((request) => ({
          value: request.id,
          description: `${request.title}. ${request.description.replace(/\s+/g, " ").slice(0, 180)}`,
        })),
      ],
      instructions: "An existing request only when this feedback is the same need. Otherwise none.",
      return_probabilities: true,
      permutations: false,
    },
  };
}

function confidentMatch(match: unknown, candidateIds: ReadonlySet<string>) {
  if (!match || typeof match !== "object") return null;
  const value = "value" in match ? match.value : undefined;
  const confidence = "confidence" in match ? match.confidence : undefined;
  if (typeof value !== "string" || value === NO_REQUEST_MATCH || !candidateIds.has(value)) return null;
  if (typeof confidence !== "number" || !Number.isFinite(confidence) || confidence < MATCH_CONFIDENCE) return null;
  return { requestId: value };
}

export function interpretTypeLlmResult(
  result: { type?: unknown; urgent?: unknown; summary?: unknown; match?: unknown },
  candidateIds: ReadonlySet<string>,
): TypeLlmSuggestion | null {
  if (typeof result.type !== "string" || !(SUBMIT_FEEDBACK_TYPES as readonly string[]).includes(result.type)) {
    return null;
  }
  if (typeof result.urgent !== "boolean") return null;
  if (typeof result.summary !== "string") return null;
  const summary = result.summary.replace(/\s+/g, " ").trim();
  if (!summary) return null;
  return {
    type: result.type as SubmitFeedbackType,
    urgent: result.urgent,
    summary,
    match: confidentMatch(result.match, candidateIds),
  };
}
