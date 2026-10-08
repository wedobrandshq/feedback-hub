import type { Prisma } from "@prisma/client";
import { DomainError } from "@/domain/errors";
import { hashAppCredential } from "@/server/credentials";
import { prisma } from "@/server/db";

export async function resolveAppBySecret(appSecret: string) {
  if (!appSecret) {
    throw new DomainError("App credential is required.", "unauthorized");
  }
  const app = await prisma.app.findUnique({
    where: { credentialHash: hashAppCredential(appSecret) },
  });
  if (!app) {
    throw new DomainError("App credential is invalid.", "unauthorized");
  }
  return app;
}

export type IdentifyUserInput = {
  appSecret: string;
  externalUserId: string;
  email?: string | null;
  name?: string | null;
  plan?: string | null;
  locale?: string | null;
  timezone?: string | null;
  appVersion?: string | null;
  osVersion?: string | null;
  device?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function identifyUser(input: IdentifyUserInput) {
  const app = await resolveAppBySecret(input.appSecret);
  const externalUserId = input.externalUserId.trim();
  if (!externalUserId) {
    throw new DomainError("A user id is required.", "validation");
  }

  const profile = {
    ...(input.email !== undefined ? { email: input.email } : {}),
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.plan !== undefined ? { plan: input.plan } : {}),
    ...(input.locale !== undefined ? { locale: input.locale } : {}),
    ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
    ...(input.appVersion !== undefined ? { appVersion: input.appVersion } : {}),
    ...(input.osVersion !== undefined ? { osVersion: input.osVersion } : {}),
    ...(input.device !== undefined ? { device: input.device } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    lastSeenAt: new Date(),
  };

  return prisma.user.upsert({
    where: { appId_externalUserId: { appId: app.id, externalUserId } },
    create: {
      appId: app.id,
      externalUserId,
      email: input.email ?? null,
      name: input.name ?? null,
      plan: input.plan ?? null,
      locale: input.locale ?? null,
      timezone: input.timezone ?? null,
      appVersion: input.appVersion ?? null,
      osVersion: input.osVersion ?? null,
      device: input.device ?? null,
      metadata: input.metadata ?? {},
      lastSeenAt: profile.lastSeenAt,
    },
    update: profile,
  });
}
