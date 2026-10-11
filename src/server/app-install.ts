import { randomBytes } from "node:crypto";
import { earnItAppSecret, willowAppSecret } from "@/domain/secrets";
import { hashAppCredential } from "@/server/credentials";
import { prisma } from "@/server/db";

function knownSecrets() {
  const secrets: string[] = [];
  for (const read of [willowAppSecret, earnItAppSecret]) {
    try {
      const secret = read();
      if (secret && !secrets.includes(secret)) secrets.push(secret);
    } catch {
      // That credential is not configured. Another app can still match.
    }
  }
  return secrets;
}

function matchKnownSecret(credentialHash: string) {
  return knownSecrets().find((secret) => hashAppCredential(secret) === credentialHash) ?? null;
}

export function createAppSecret() {
  const secret = randomBytes(32).toString("base64url");
  return { secret, credentialHash: hashAppCredential(secret) };
}

export async function resolveAppSecret(app: {
  id: string;
  credentialHash: string;
  issuedCredential: string | null;
}): Promise<string> {
  const matched = matchKnownSecret(app.credentialHash);
  if (matched) return matched;
  if (app.issuedCredential && hashAppCredential(app.issuedCredential) === app.credentialHash) {
    return app.issuedCredential;
  }

  const issued = createAppSecret();
  const updated = await prisma.app.updateMany({
    where: { id: app.id, credentialHash: app.credentialHash },
    data: { credentialHash: issued.credentialHash, issuedCredential: issued.secret },
  });
  if (updated.count === 1) return issued.secret;

  const fresh = await prisma.app.findUniqueOrThrow({
    where: { id: app.id },
    select: { id: true, credentialHash: true, issuedCredential: true },
  });
  return resolveAppSecret(fresh);
}
