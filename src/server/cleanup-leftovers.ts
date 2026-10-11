import { prisma } from "@/server/db";

const PROTECTED_SLUGS = ["willow", "earn-it"];
const OWNER_EMAIL = "owner@healthysteps.example";

async function deleteAppGraph(appId: string) {
  const [feedback, requests, conversations] = await Promise.all([
    prisma.feedback.findMany({ where: { appId }, select: { id: true } }),
    prisma.request.findMany({ where: { appId }, select: { id: true } }),
    prisma.conversation.findMany({ where: { appId }, select: { id: true } }),
  ]);
  const feedbackIds = feedback.map((row) => row.id);
  const requestIds = requests.map((row) => row.id);
  const conversationIds = conversations.map((row) => row.id);

  await prisma.$transaction(async (tx) => {
    if (feedbackIds.length) {
      await tx.feedbackSuggestion.deleteMany({ where: { feedbackId: { in: feedbackIds } } });
      await tx.feedbackAttachment.deleteMany({ where: { feedbackId: { in: feedbackIds } } });
    }
    if (requestIds.length) {
      await tx.requestSummary.deleteMany({ where: { requestId: { in: requestIds } } });
      await tx.requestUpdate.deleteMany({ where: { requestId: { in: requestIds } } });
      await tx.vote.deleteMany({ where: { requestId: { in: requestIds } } });
      await tx.changelogEntry.deleteMany({ where: { requestId: { in: requestIds } } });
    }
    if (feedbackIds.length || requestIds.length) {
      await tx.feedbackRequest.deleteMany({
        where: {
          OR: [
            ...(feedbackIds.length ? [{ feedbackId: { in: feedbackIds } }] : []),
            ...(requestIds.length ? [{ requestId: { in: requestIds } }] : []),
          ],
        },
      });
    }
    if (conversationIds.length) {
      await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
    }
    await tx.notification.deleteMany({ where: { appId } });
    await tx.event.deleteMany({ where: { appId } });
    await tx.conversation.deleteMany({ where: { appId } });
    await tx.feedback.deleteMany({ where: { appId } });
    await tx.request.deleteMany({ where: { appId } });
    await tx.user.deleteMany({ where: { appId } });
    await tx.changelogEntry.deleteMany({ where: { appId } });
    await tx.app.delete({ where: { id: appId } });
  });
}

export async function removeVerificationLeftovers(workspaceId: string) {
  const apps = await prisma.app.findMany({
    where: {
      workspaceId,
      slug: { notIn: PROTECTED_SLUGS },
      OR: [{ slug: { startsWith: "north-path" } }, { name: { startsWith: "North Path" } }],
    },
    select: { id: true, name: true, slug: true },
  });

  for (const app of apps) {
    if (PROTECTED_SLUGS.includes(app.slug)) continue;
    await deleteAppGraph(app.id);
  }

  const people = await prisma.adminUser.findMany({
    where: {
      workspaceId,
      role: "admin",
      name: "Ada Console",
      email: { not: OWNER_EMAIL },
    },
    select: { id: true, name: true, email: true },
  });
  if (people.length) {
    await prisma.adminUser.deleteMany({ where: { id: { in: people.map((person) => person.id) } } });
  }

  const [remainingApps, remainingPeople] = await Promise.all([
    prisma.app.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.adminUser.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      select: { name: true, email: true, role: true },
    }),
  ]);

  return {
    deletedApps: apps.map((app) => ({ name: app.name, slug: app.slug })),
    deletedPeople: people.map((person) => ({ name: person.name, email: person.email })),
    remainingApps,
    remainingPeople,
  };
}
