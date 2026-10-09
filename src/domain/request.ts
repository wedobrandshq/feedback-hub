import { BODY_MAX_LENGTH } from "@/domain/config";
import { DomainError } from "@/domain/errors";

export const REQUEST_STATUSES = [
  "review",
  "under_consideration",
  "planned",
  "in_progress",
  "released",
  "not_planned",
] as const;
export type RequestStatusName = (typeof REQUEST_STATUSES)[number];

export const INTERNAL_REQUEST_STATUSES = ["review", "under_consideration"] as const;
export const PUBLIC_REQUEST_STATUSES = ["planned", "in_progress", "released", "not_planned"] as const;
export type PublicRequestStatusName = (typeof PUBLIC_REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatusName, string> = {
  review: "Review",
  under_consideration: "Under consideration",
  planned: "Planned",
  in_progress: "In progress",
  released: "Released",
  not_planned: "Not planned",
};

export const REQUEST_SORTS = ["updated", "created", "feedback", "votes"] as const;
export type RequestSortName = (typeof REQUEST_SORTS)[number];

export const ADMIN_ROADMAP_STATUSES = ["under_consideration", "planned", "in_progress", "released"] as const;

export function isRequestStatus(value: string): value is RequestStatusName {
  return (REQUEST_STATUSES as readonly string[]).includes(value);
}

export function isPublicRequestStatus(value: string): value is PublicRequestStatusName {
  return (PUBLIC_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function publicStatusLabel(status: RequestStatusName) {
  if (!isPublicRequestStatus(status)) return null;
  return REQUEST_STATUS_LABELS[status];
}

export function assertStoredText(value: string, label: string) {
  if (value.trim().length === 0) {
    throw new DomainError(`${label} is required.`, "validation");
  }
  if (value.length > BODY_MAX_LENGTH) {
    throw new DomainError(`${label} needs to be 10,000 characters or less.`, "validation");
  }
  return value;
}

export function notificationBody(title: string, status: RequestStatusName) {
  return `${title} is now ${REQUEST_STATUS_LABELS[status]}.`;
}
