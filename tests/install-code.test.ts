import { afterAll, beforeAll, it } from "vitest";
import { hostServerInstall, viewInstall } from "@/domain/install-code";
import { earnItAppSecret, willowAppSecret } from "@/domain/secrets";
import { hashAppCredential } from "@/server/credentials";
import { prisma } from "@/server/db";
import { resolveAppSecret } from "@/server/app-install";
import { seedDatabase } from "@/server/seed";

beforeAll(async () => {
  await seedDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

function assertIncludes(haystack: string, needle: string, label: string) {
  if (!haystack.includes(needle)) throw new Error(label);
}

function assertExcludes(haystack: string, needle: string, label: string) {
  if (needle && haystack.includes(needle)) throw new Error(label);
}

it("builds a server call with that app’s secret and a view with none", () => {
  const server = hostServerInstall("Willow", "secret-one");
  const view = viewInstall("Willow");
  assertIncludes(server, "https://feedback-hub-smoky.vercel.app/api/embed/session", "server url");
  assertIncludes(server, 'Authorization: Bearer secret-one', "bearer");
  assertIncludes(server, '"userId":"user-id"', "user id");
  assertIncludes(server, '"email":"user@example.com"', "email");
  assertIncludes(server, '"name":"User name"', "name");
  assertIncludes(server, '"plan":"Plus"', "plan");
  assertIncludes(server, "# Willow", "app name");
  assertExcludes(server, "Earn It", "other app in server block");
  assertIncludes(view, "data-fh-open", "trigger");
  assertIncludes(view, 'src="https://feedback-hub-smoky.vercel.app/embed.js"', "script");
  assertIncludes(view, 'data-session="SESSION"', "session placeholder");
  assertIncludes(view, "Willow", "view names the app");
  assertExcludes(view, "secret-one", "secret in the view");
  assertExcludes(view, "Bearer", "bearer in the view");
  assertExcludes(view, "Earn It", "other app in the view");
});

it("resolves each seeded app to its own secret", async () => {
  const willow = await prisma.app.findFirstOrThrow({ where: { slug: "willow" } });
  const earnIt = await prisma.app.findFirstOrThrow({ where: { slug: "earn-it" } });
  const willowSecret = await resolveAppSecret(willow);
  const earnItSecret = await resolveAppSecret(earnIt);

  if (willowSecret === earnItSecret) throw new Error("apps resolved to the same secret");
  if (hashAppCredential(willowSecret) !== willow.credentialHash) throw new Error("willow hash mismatch");
  if (hashAppCredential(earnItSecret) !== earnIt.credentialHash) throw new Error("earn it hash mismatch");
  if (willowSecret !== willowAppSecret()) throw new Error("willow did not match its configured secret");
  if (earnItSecret !== earnItAppSecret()) throw new Error("earn it did not match its configured secret");

  const willowServer = hostServerInstall(willow.name, willowSecret);
  const willowView = viewInstall(willow.name);
  const earnItServer = hostServerInstall(earnIt.name, earnItSecret);
  assertIncludes(willowServer, willow.name, "willow names itself");
  assertExcludes(willowServer, earnIt.name, "willow server names earn it");
  assertExcludes(willowView, earnItSecret, "willow view has earn it secret");
  assertExcludes(willowServer, earnItSecret, "willow server has earn it secret");
  assertExcludes(hostServerInstall(earnIt.name, earnItSecret), willowSecret, "earn it server has willow secret");
  assertExcludes(viewInstall(earnIt.name), willowSecret, "earn it view has willow secret");
  const reread = await prisma.app.findUniqueOrThrow({ where: { id: willow.id } });
  if (reread.issuedCredential !== null) throw new Error("matched app stored a replacement secret");
  if (reread.credentialHash !== willow.credentialHash) throw new Error("matched app hash changed");
});

it("regenerates an unmatched secret once and keeps it", async () => {
  const workspace = await prisma.workspace.findFirstOrThrow();
  const created = await prisma.app.create({
    data: {
      workspaceId: workspace.id,
      name: "Temp Install",
      slug: `temp-install-${Date.now().toString(36)}`,
      platform: "iOS",
      status: "active",
      credentialHash: hashAppCredential("not-a-configured-secret"),
    },
  });

  try {
    const first = await resolveAppSecret(created);
    const stored = await prisma.app.findUniqueOrThrow({ where: { id: created.id } });
    if (stored.credentialHash === created.credentialHash) throw new Error("hash was not replaced");
    if (hashAppCredential(first) !== stored.credentialHash) throw new Error("shown secret does not match the new hash");
    if (stored.issuedCredential !== first) throw new Error("issued secret was not stored");
    const second = await resolveAppSecret(stored);
    if (second !== first) throw new Error("secret was regenerated again");

    const willow = await prisma.app.findFirstOrThrow({ where: { slug: "willow" } });
    if (willow.credentialHash !== hashAppCredential(willowAppSecret())) {
      throw new Error("willow hash changed");
    }
  } finally {
    await prisma.app.delete({ where: { id: created.id } });
  }
});
