export const ADMIN_WINDOW_DAYS = 30;
export const ADMIN_LIST_LIMIT = 200;
export const TRENDING_LIMIT = 8;

export function adminWindow(now = new Date()) {
  const span = ADMIN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const since = new Date(now.getTime() - span);
  const prior = new Date(since.getTime() - span);
  return { since, prior };
}

export function feedbackDeltaSentence(current: number, prior: number) {
  const delta = current - prior;
  if (delta === 0) return "Same as the previous 30 days.";
  if (delta > 0) return `${delta} more than the previous 30 days.`;
  return `${Math.abs(delta)} fewer than the previous 30 days.`;
}

export const USER_ACTIVITY = ["recent", "quiet"] as const;
export type UserActivityName = (typeof USER_ACTIVITY)[number];

export function parseUserActivity(value: string | undefined): UserActivityName | null {
  if (value && (USER_ACTIVITY as readonly string[]).includes(value)) return value as UserActivityName;
  return null;
}
