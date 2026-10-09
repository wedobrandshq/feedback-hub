import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { WILLOW_DEMO_USER } from "@/domain/willow-demo";
import { earnItAppSecret, willowAppSecret } from "@/domain/secrets";
import { prisma } from "@/server/db";
import { getAdminHome } from "@/server/admin-home";
import { getAdminUser, listAdminUsers } from "@/server/admin-users";
import { listAdminApps } from "@/server/admin-apps";
import { identifyUser } from "@/server/identify-user";
import { createRequestFromFeedback, publishRequest, voteOnRequest } from "@/server/requests";
import { seedDatabase } from "@/server/seed";
import { submitFeedback } from "@/server/submit-feedback";

const willowSecret = willowAppSecret();

async function clearProduct() {
  await prisma.notification.deleteMany();
  await prisma.changelogEntry.deleteMany();
  await prisma.requestUpdate.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.feedbackRequest.deleteMany();
  await prisma.request.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.feedbackAttachment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await seedDatabase();
});

beforeEach(async () => {
  await clearProduct();
  await seedDatabase();
});

afterAll(async () => {
  await clearProduct();
  await seedDatabase();
  await prisma.$disconnect();
});

describe("admin home, users, and apps", () => {
  it("counts Willow signals separately from Earn It and keeps votes apart from feedback", async () => {
    const feedback = await submitFeedback({
      appSecret: willowSecret,
      externalUserId: WILLOW_DEMO_USER.externalUserId,
      type: "idea",
      body: "Please add a weekly mood chart.",
      context: {},
    });
    const admin = await prisma.adminUser.findFirstOrThrow();
    const actor = { id: admin.id, name: admin.name, workspaceId: admin.workspaceId };
    const request = await createRequestFromFeedback({
      ...actor,
      feedbackId: feedback.id,
      title: "Weekly mood chart",
      description: "A chart of the week.",
      status: "review",
    });
    await publishRequest({ ...actor, requestId: request.id });
    await voteOnRequest({
      appSecret: willowSecret,
      externalUserId: WILLOW_DEMO_USER.externalUserId,
      requestId: request.id,
    });

    const willow = await prisma.app.findFirstOrThrow({ where: { slug: "willow", workspaceId: admin.workspaceId } });
    const earnIt = await prisma.app.findFirstOrThrow({ where: { slug: "earn-it", workspaceId: admin.workspaceId } });
    const willowHome = await getAdminHome({ workspaceId: admin.workspaceId, appId: willow.id });
    const earnItHome = await getAdminHome({ workspaceId: admin.workspaceId, appId: earnIt.id });

    expect(willowHome.signals.feedback).toBe(1);
    expect(willowHome.signals.newRequests).toBe(1);
    expect(willowHome.signals.conversations).toBe(1);
    expect(willowHome.signals.votes).toBe(1);
    expect(willowHome.trending[0]).toMatchObject({
      title: "Weekly mood chart",
      votesInWindow: 1,
      feedbackCount: 1,
    });
    expect(earnItHome.signals).toMatchObject({ feedback: 0, newRequests: 0, conversations: 0, votes: 0 });
    expect(earnItHome.trending).toEqual([]);
  });

  it("finds Maya by email in Willow and does not show her under Earn It", async () => {
    await identifyUser({
      appSecret: willowAppSecret(),
      externalUserId: WILLOW_DEMO_USER.externalUserId,
      email: WILLOW_DEMO_USER.email,
      name: WILLOW_DEMO_USER.name,
      plan: WILLOW_DEMO_USER.plan,
    });
    await identifyUser({ appSecret: earnItAppSecret(), externalUserId: "sam", name: "Sam", email: "sam@example.com" });
    const admin = await prisma.adminUser.findFirstOrThrow();
    const willow = await prisma.app.findFirstOrThrow({ where: { slug: "willow", workspaceId: admin.workspaceId } });
    const earnIt = await prisma.app.findFirstOrThrow({ where: { slug: "earn-it", workspaceId: admin.workspaceId } });

    const found = await listAdminUsers({
      workspaceId: admin.workspaceId,
      appId: willow.id,
      search: "maya.chen@example.com",
      plan: "Plus",
      activity: "recent",
    });
    expect(found.rows.map((row) => row.name)).toEqual(["Maya Chen"]);
    expect(found.rows[0]?.voteCount).toBe(0);

    const hidden = await listAdminUsers({
      workspaceId: admin.workspaceId,
      appId: earnIt.id,
      search: "maya",
      plan: null,
      activity: null,
    });
    expect(hidden.rows).toEqual([]);

    const detail = await getAdminUser({ workspaceId: admin.workspaceId, userId: found.rows[0].id });
    expect(detail?.user.email).toBe("maya.chen@example.com");
    expect(detail?.user.plan).toBe("Plus");
  });

  it("lists Willow and Earn It with platform and status", async () => {
    const admin = await prisma.adminUser.findFirstOrThrow();
    const apps = await listAdminApps(admin.workspaceId);
    expect(apps.map((app) => app.name).sort()).toEqual(["Earn It", "Willow"]);
    expect(apps.every((app) => app.platform === "iOS" && app.status === "active")).toBe(true);
  });
});
