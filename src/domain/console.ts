import { DomainError } from "@/domain/errors";

export const CONSOLE_ROLES = ["owner", "admin"] as const;
export type ConsoleRole = (typeof CONSOLE_ROLES)[number];

export const PASSWORD_MIN_LENGTH = 8;
export const PROFILE_NAME_MAX = 80;

export function consoleRoleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return role;
}

export function isConsoleRole(value: string): value is ConsoleRole {
  return (CONSOLE_ROLES as readonly string[]).includes(value);
}

export function cleanProfileName(value: string) {
  const name = value.trim();
  if (!name) throw new DomainError("Name is required.", "validation");
  if (name.length > PROFILE_NAME_MAX) {
    throw new DomainError(`Name needs to be ${PROFILE_NAME_MAX} characters or less.`, "validation");
  }
  return name;
}

export function cleanProfileEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainError("Enter a valid email.", "validation");
  }
  return email;
}

export function cleanPassword(value: string) {
  if (value.length < PASSWORD_MIN_LENGTH) {
    throw new DomainError(`Password needs to be at least ${PASSWORD_MIN_LENGTH} characters.`, "validation");
  }
  if (value.length > 200) {
    throw new DomainError("Password needs to be 200 characters or less.", "validation");
  }
  return value;
}
