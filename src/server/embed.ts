import { DomainError } from "@/domain/errors";
import { signEmbedSession, verifyEmbedSession } from "@/domain/embed-session";
import { identifyUser, type IdentifyUserInput } from "@/server/identify-user";
import { prisma } from "@/server/db";

export async function issueEmbedSession(input: IdentifyUserInput) {
  const user = await identifyUser(input);
  return signEmbedSession({ userId: user.id, appId: user.appId });
}

export async function readEmbedActor(session: string) {
  let claims: { userId: string; appId: string } | null = null;
  try {
    claims = await verifyEmbedSession(session);
  } catch {
    claims = null;
  }
  if (!claims) {
    throw new DomainError("This feedback window needs a new session from your server.", "unauthorized");
  }
  const user = await prisma.user.findFirst({
    where: { id: claims.userId, appId: claims.appId },
  });
  if (!user) {
    throw new DomainError("This feedback window needs a new session from your server.", "unauthorized");
  }
  return user;
}
