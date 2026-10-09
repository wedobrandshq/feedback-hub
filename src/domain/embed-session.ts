import { SignJWT, jwtVerify } from "jose";
import { authSecret } from "@/domain/secrets";

const PURPOSE = "embed";

function key() {
  return new TextEncoder().encode(authSecret());
}

export async function signEmbedSession(input: { userId: string; appId: string }) {
  return new SignJWT({ purpose: PURPOSE, appId: input.appId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());
}

export async function verifyEmbedSession(token: string) {
  const { payload } = await jwtVerify(token, key());
  if (payload.purpose !== PURPOSE) return null;
  if (typeof payload.sub !== "string" || typeof payload.appId !== "string") return null;
  return { userId: payload.sub, appId: payload.appId };
}
