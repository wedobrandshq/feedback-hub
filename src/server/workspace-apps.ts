import { assertAppPlatform, assertAppStatus, appSlugBase } from "@/domain/app";
import { cleanProfileName } from "@/domain/console";
import { DomainError } from "@/domain/errors";
import { createAppSecret } from "@/server/app-install";
import { prisma } from "@/server/db";

function assertOwner(role: string) {
  if (role !== "owner") throw new DomainError("Only an owner can do that.", "unauthorized");
}

async function uniqueSlug(workspaceId: string, name: string) {
  const base = appSlugBase(name);
  for (let index = 0; index < 50; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`;
    const existing = await prisma.app.findFirst({
      where: { workspaceId, slug },
      select: { id: true },
    });
    if (!existing) return slug;
  }
  throw new DomainError("Choose a different name.", "conflict");
}

export async function createWorkspaceApp(input: {
  actorRole: string;
  workspaceId: string;
  name: string;
  platform: string;
}) {
  assertOwner(input.actorRole);
  const name = cleanProfileName(input.name);
  const platform = assertAppPlatform(input.platform);
  const slug = await uniqueSlug(input.workspaceId, name);
  const credential = createAppSecret();
  return prisma.app.create({
    data: {
      workspaceId: input.workspaceId,
      name,
      slug,
      platform,
      status: "active",
      credentialHash: credential.credentialHash,
      issuedCredential: credential.secret,
    },
    select: { id: true, name: true, slug: true, platform: true, status: true, issuedCredential: true, credentialHash: true },
  });
}

export async function updateWorkspaceApp(input: {
  actorRole: string;
  workspaceId: string;
  slug: string;
  name: string;
  platform: string;
  status: string;
}) {
  assertOwner(input.actorRole);
  const app = await prisma.app.findFirst({
    where: { workspaceId: input.workspaceId, slug: input.slug },
    select: { id: true, slug: true },
  });
  if (!app) throw new DomainError("That app was not found.", "not_found");
  return prisma.app.update({
    where: { id: app.id },
    data: {
      name: cleanProfileName(input.name),
      platform: assertAppPlatform(input.platform),
      status: assertAppStatus(input.status),
    },
    select: { id: true, name: true, slug: true, platform: true, status: true },
  });
}
