import bcrypt from "bcryptjs";
import { SEEDED_ADMIN_NAME, WORKSPACE_NAME, WORKSPACE_SLUG } from "@/domain/config";
import { WILLOW_DEMO_USER } from "@/domain/willow-demo";
import { earnItAppSecret, seededAdminEmail, seededAdminPassword, willowAppSecret } from "@/domain/secrets";
import { hashAppCredential } from "@/server/credentials";
import { prisma } from "@/server/db";
import { identifyUser } from "@/server/identify-user";

export async function seedDatabase() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: WORKSPACE_SLUG },
    create: { name: WORKSPACE_NAME, slug: WORKSPACE_SLUG },
    update: { name: WORKSPACE_NAME },
  });

  const willowHash = hashAppCredential(willowAppSecret());
  const earnItHash = hashAppCredential(earnItAppSecret());

  await prisma.app.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "willow" } },
    create: {
      workspaceId: workspace.id,
      name: "Willow",
      slug: "willow",
      platform: "iOS",
      status: "active",
      credentialHash: willowHash,
    },
    update: {
      name: "Willow",
      platform: "iOS",
      status: "active",
      credentialHash: willowHash,
    },
  });

  await prisma.app.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "earn-it" } },
    create: {
      workspaceId: workspace.id,
      name: "Earn It",
      slug: "earn-it",
      platform: "iOS",
      status: "active",
      credentialHash: earnItHash,
    },
    update: {
      name: "Earn It",
      platform: "iOS",
      status: "active",
      credentialHash: earnItHash,
    },
  });

  const passwordHash = await bcrypt.hash(seededAdminPassword(), 10);
  await prisma.adminUser.upsert({
    where: { email: seededAdminEmail() },
    create: {
      workspaceId: workspace.id,
      email: seededAdminEmail(),
      name: SEEDED_ADMIN_NAME,
      passwordHash,
      role: "owner",
    },
    update: {
      workspaceId: workspace.id,
      name: SEEDED_ADMIN_NAME,
      passwordHash,
      role: "owner",
    },
  });

  await identifyUser({
    appSecret: willowAppSecret(),
    externalUserId: WILLOW_DEMO_USER.externalUserId,
    email: WILLOW_DEMO_USER.email,
    name: WILLOW_DEMO_USER.name,
    plan: WILLOW_DEMO_USER.plan,
    locale: WILLOW_DEMO_USER.locale,
    timezone: WILLOW_DEMO_USER.timezone,
    appVersion: WILLOW_DEMO_USER.appVersion,
    osVersion: WILLOW_DEMO_USER.osVersion,
    device: WILLOW_DEMO_USER.device,
  });

  return workspace;
}
