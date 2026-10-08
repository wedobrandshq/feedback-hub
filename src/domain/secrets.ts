function devFallback(value: string, name: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production`);
  }
  return value;
}

const DEV_WILLOW_APP_SECRET = "willow-dev-secret";
const DEV_EARNIT_APP_SECRET = "earnit-dev-secret";
const DEV_AUTH_SECRET = "dev-only-auth-secret-change-me-32bytes";
const DEV_ADMIN_PASSWORD = "owner-local-dev";
const DEV_ADMIN_EMAIL = "owner@healthysteps.example";

export function willowAppSecret() {
  return process.env.WILLOW_APP_SECRET || devFallback(DEV_WILLOW_APP_SECRET, "WILLOW_APP_SECRET");
}

export function earnItAppSecret() {
  return process.env.EARNIT_APP_SECRET || devFallback(DEV_EARNIT_APP_SECRET, "EARNIT_APP_SECRET");
}

export function authSecret() {
  return process.env.AUTH_SECRET || devFallback(DEV_AUTH_SECRET, "AUTH_SECRET");
}

export function seededAdminPassword() {
  return process.env.ADMIN_PASSWORD || devFallback(DEV_ADMIN_PASSWORD, "ADMIN_PASSWORD");
}

export function seededAdminEmail() {
  return (process.env.ADMIN_EMAIL || DEV_ADMIN_EMAIL).toLowerCase();
}
