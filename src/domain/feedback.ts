import {
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  type FeedbackStatusName,
  type FeedbackTypeName,
} from "@/domain/config";

export const TYPE_LABELS: Record<FeedbackTypeName, string> = {
  idea: "Idea",
  problem: "Problem",
  improvement: "Improvement",
  bug: "Bug",
  other: "Other",
};

export const STATUS_LABELS: Record<FeedbackStatusName, string> = {
  new: "New",
  reviewed: "Reviewed",
  linked: "Linked",
  closed: "Closed",
};

export const DEMO_KIND_OPTIONS = [
  { value: "idea", label: "I have an idea" },
  { value: "bug", label: "Something isn’t working" },
  { value: "improvement", label: "Something could be better" },
  { value: "other", label: "Other" },
] as const;

export function feedbackPreview(body: string) {
  const line = body.replace(/\s+/g, " ").trim();
  if (line.length <= 96) return line;
  return `${line.slice(0, 96)}…`;
}

export function userLabel(user: {
  name: string | null;
  email: string | null;
  externalUserId: string;
}) {
  return user.name || user.email || user.externalUserId;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export type FeedbackListFilters = {
  type: FeedbackTypeName | null;
  status: FeedbackStatusName | null;
  search: string | null;
  from: Date | null;
  to: Date | null;
  error: string | null;
};

function isType(value: string): value is FeedbackTypeName {
  return (FEEDBACK_TYPES as readonly string[]).includes(value);
}

function isStatus(value: string): value is FeedbackStatusName {
  return (FEEDBACK_STATUSES as readonly string[]).includes(value);
}

function parseDay(value: string, end: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { date: null, invalid: true };
  const iso = end ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: null, invalid: true };
  return { date, invalid: false };
}

export function parseFeedbackFilters(params: {
  type?: string;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
}): FeedbackListFilters {
  const type = params.type && isType(params.type) ? params.type : null;
  const status = params.status && isStatus(params.status) ? params.status : null;
  const search = params.q?.trim() ? params.q.trim().slice(0, 200) : null;

  const fromResult = params.from ? parseDay(params.from, false) : { date: null, invalid: false };
  const toResult = params.to ? parseDay(params.to, true) : { date: null, invalid: false };

  let error: string | null = null;
  if ((params.from && fromResult.invalid) || (params.to && toResult.invalid)) {
    error = "Use a real calendar date.";
  } else if (fromResult.date && toResult.date && fromResult.date > toResult.date) {
    error = "The start date is after the end date.";
  }

  return {
    type,
    status,
    search,
    from: error ? null : fromResult.date,
    to: error ? null : toResult.date,
    error,
  };
}

export function activitySentence(event: {
  type: string;
  payload: unknown;
}) {
  const payload =
    event.payload && typeof event.payload === "object" ? (event.payload as { actorName?: unknown }) : {};
  const name = typeof payload.actorName === "string" && payload.actorName ? payload.actorName : "Someone";

  if (event.type === "feedback.created") return `${name} submitted this feedback`;
  if (event.type === "feedback.reviewed") return `${name} marked this reviewed`;
  if (event.type === "feedback.closed") return `${name} closed this feedback`;
  return name;
}
