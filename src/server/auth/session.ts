import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { APP_COOKIE, SESSION_COOKIE } from "@/domain/config";
import { authSecret } from "@/domain/secrets";

function secretKey() {
  return new TextEncoder().encode(authSecret());
}

export async function signSession(adminId: string) {
  return new SignJWT({ sub: adminId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSessionAdminId() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

const week = 60 * 60 * 24 * 7;

function baseCookie() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function setSessionCookie(adminId: string) {
  const token = await signSession(adminId);
  (await cookies()).set(SESSION_COOKIE, token, { ...baseCookie(), maxAge: week });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { ...baseCookie(), maxAge: 0 });
}

export async function readSelectedAppCookie() {
  const value = (await cookies()).get(APP_COOKIE)?.value;
  if (!value || value === "all") return null;
  return value;
}

export async function setSelectedAppCookie(appId: string | null) {
  (await cookies()).set(APP_COOKIE, appId ?? "all", {
    ...baseCookie(),
    maxAge: 60 * 60 * 24 * 365,
  });
}
