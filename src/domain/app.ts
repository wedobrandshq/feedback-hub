import { DomainError } from "@/domain/errors";

export const APP_PLATFORMS = [
  { value: "iOS", label: "iOS" },
  { value: "Android", label: "Android" },
  { value: "Web", label: "Web" },
  { value: "CrossPlatform", label: "Cross-platform" },
] as const;

export const APP_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export type AppPlatformName = (typeof APP_PLATFORMS)[number]["value"];
export type AppStatusName = (typeof APP_STATUSES)[number]["value"];

export function appPlatformLabel(platform: string) {
  return APP_PLATFORMS.find((item) => item.value === platform)?.label ?? platform;
}

export function isAppPlatform(value: string): value is AppPlatformName {
  return APP_PLATFORMS.some((item) => item.value === value);
}

export function isAppStatus(value: string): value is AppStatusName {
  return APP_STATUSES.some((item) => item.value === value);
}

export function assertAppPlatform(value: string): AppPlatformName {
  if (!isAppPlatform(value)) throw new DomainError("Choose a platform.", "validation");
  return value;
}

export function assertAppStatus(value: string): AppStatusName {
  if (!isAppStatus(value)) throw new DomainError("Choose a status.", "validation");
  return value;
}

export function appSlugBase(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "app";
}
