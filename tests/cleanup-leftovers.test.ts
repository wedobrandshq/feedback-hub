import { afterAll, beforeAll, it } from "vitest";
import { prisma } from "@/server/db";
import { seedDatabase } from "@/server/seed";
import { createWorkspaceApp } from "@/server/workspace-apps";
import { addConsolePerson } from "@/server/console-people";
import { removeVerificationLeftovers } from "@/server/cleanup-leftovers";

beforeAll(async () => {
  await seedDatabase();
});

afterAll(async () => {
  await seedDatabase();
  await prisma.$disconnect();
});

it("removes North Path apps and Ada Console admins and leaves the seeded records", async () => {
  const owner = await prisma.adminUser.findFirstOrThrow({ where: { email: "owner@healthysteps.example" } });
  const first = await createWorkspaceApp({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "North Path cleanup",
    platform: "Web",
  });
  const second = await createWorkspaceApp({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "North Path again",
    platform: "iOS",
  });
  await addConsolePerson({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "Ada Console",
    email: "ada.console.cleanup@example.com",
    password: "ada-password",
    role: "admin",
  });

  const result = await removeVerificationLeftovers(owner.workspaceId);
  const slugs = result.remainingApps.map((app) => app.slug).sort();
  if (slugs.join() !== "earn-it,willow") throw new Error("apps were not restored to the seed");
  if (result.deletedApps.length < 2) throw new Error("north path apps were not deleted");
  if (result.deletedPeople.length !== 1) throw new Error("ada was not deleted");
  if (result.remainingPeople.length !== 1) throw new Error("people were not restored to the owner");
  const person = result.remainingPeople[0];
  if (person?.name !== "Alex Rivera" || person.email !== "owner@healthysteps.example" || person.role !== "owner") {
    throw new Error("owner record changed");
  }
  const willow = await prisma.app.findFirst({ where: { slug: "willow" } });
  const earnIt = await prisma.app.findFirst({ where: { slug: "earn-it" } });
  if (!willow || !earnIt) throw new Error("seeded apps missing");
  if (await prisma.app.findFirst({ where: { id: { in: [first.id, second.id] } } })) {
    throw new Error("deleted app still exists");
  }
});
