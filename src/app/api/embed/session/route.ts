import { DomainError } from "@/domain/errors";
import { issueEmbedSession } from "@/server/embed";

function bearer(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

export async function POST(request: Request) {
  const appSecret = bearer(request);
  const body = (await request.json().catch(() => null)) as {
    userId?: unknown;
    email?: unknown;
    name?: unknown;
    plan?: unknown;
    locale?: unknown;
    timezone?: unknown;
    appVersion?: unknown;
    osVersion?: unknown;
    device?: unknown;
  } | null;
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const text = (value: unknown) => (typeof value === "string" ? value : undefined);
  try {
    const session = await issueEmbedSession({
      appSecret,
      externalUserId: userId,
      email: text(body?.email),
      name: text(body?.name),
      plan: text(body?.plan),
      locale: text(body?.locale),
      timezone: text(body?.timezone),
      appVersion: text(body?.appVersion),
      osVersion: text(body?.osVersion),
      device: text(body?.device),
    });
    return Response.json({ session });
  } catch (error) {
    if (error instanceof DomainError && (error.code === "unauthorized" || error.code === "validation")) {
      return Response.json({ error: error.message }, { status: error.code === "unauthorized" ? 401 : 400 });
    }
    throw error;
  }
}
