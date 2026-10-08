export const BODY_MAX_LENGTH = 10_000;
export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;
export const FEEDBACK_LIST_LIMIT = 200;
export const INBOX_LIST_LIMIT = 200;
export const DEMO_CONVERSATION_LIMIT = 50;

export const SEEDED_ADMIN_NAME = "Alex Rivera";

export const WORKSPACE_NAME = "Healthy Steps";
export const WORKSPACE_SLUG = "healthy-steps";

export const SUBMIT_FEEDBACK_TYPES = ["idea", "bug", "improvement", "other"] as const;
export type SubmitFeedbackType = (typeof SUBMIT_FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPES = ["idea", "problem", "improvement", "bug", "other"] as const;
export type FeedbackTypeName = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_STATUSES = ["new", "reviewed", "linked", "closed"] as const;
export type FeedbackStatusName = (typeof FEEDBACK_STATUSES)[number];

export const SESSION_COOKIE = "fh_session";
export const APP_COOKIE = "fh_app";