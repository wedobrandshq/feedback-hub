import bcrypt from "bcryptjs";
import { afterAll, beforeAll, it } from "vitest";
import { ADMIN_ROADMAP_STATUSES } from "@/domain/request";
import { emptyInboxCopy } from "@/domain/conversation";
import { hostServerInstall, viewInstall } from "@/domain/install-code";
import { seededAdminPassword } from "@/domain/secrets";
import { hashAppCredential } from "@/server/credentials";
import { prisma } from "@/server/db";
import { seedDatabase } from "@/server/seed";
import {
  addConsolePerson,
  removeConsolePerson,
  setConsoleRole,
  updateOwnProfile,
  updateWorkspaceName,
} from "@/server/console-people";
import { listWorkspaceApps } from "@/server/feedback-queries";
import { createWorkspaceApp, updateWorkspaceApp } from "@/server/workspace-apps";

beforeAll(async () => {
  await seedDatabase();
});

afterAll(async () => {
  await prisma.adminUser.deleteMany({
    where: {
      email: {
        in: [
          "ada-console@example.com",
          "second-owner@example.com",
          "taken-console@example.com",
          "limited-console@example.com",
        ],
      },
    },
  });
  await prisma.app.deleteMany({ where: { slug: { startsWith: "north-path" } } });
  await seedDatabase();
  await prisma.$disconnect();
});

async function grantPerson(input: {
  actorRole: string;
  workspaceId: string;
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const apps = await prisma.app.findMany({ where: { workspaceId: input.workspaceId }, select: { id: true } });
  return addConsolePerson({
    ...input,
    passwordConfirm: input.password,
    appIds: apps.map((app) => app.id),
  });
}

async function messageOf(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    return error instanceof Error ? error.message : "";
  }
  return "";
}

it("lets the signed-in person change name, email, and password", async () => {
  const owner = await prisma.adminUser.findFirstOrThrow({ where: { email: "owner@healthysteps.example" } });
  const taken = await grantPerson({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "Taken",
    email: "taken-console@example.com",
    password: "taken-password",
    role: "admin",
  });
  try {
    const renamed = await updateOwnProfile({
      adminId: owner.id,
      name: "Alex Edited",
      email: "owner@healthysteps.example",
      currentPassword: "",
      nextPassword: "",
    });
    if (renamed?.name !== "Alex Edited") throw new Error("name was not saved");

    const conflict = await messageOf(() =>
      updateOwnProfile({
        adminId: owner.id,
        name: "Alex Edited",
        email: "taken-console@example.com",
        currentPassword: "",
        nextPassword: "",
      }),
    );
    if (conflict !== "That email is already used.") throw new Error("email uniqueness");

    const missing = await messageOf(() =>
      updateOwnProfile({
        adminId: owner.id,
        name: "Alex Edited",
        email: owner.email,
        currentPassword: "",
        nextPassword: "another-password",
      }),
    );
    if (missing !== "Enter your current password to set a new one.") throw new Error("current password required");

    const wrong = await messageOf(() =>
      updateOwnProfile({
        adminId: owner.id,
        name: "Alex Edited",
        email: owner.email,
        currentPassword: "not-the-password",
        nextPassword: "another-password",
      }),
    );
    if (wrong !== "Current password is wrong.") throw new Error("wrong current password");

    await updateOwnProfile({
      adminId: owner.id,
      name: owner.name,
      email: owner.email,
      currentPassword: seededAdminPassword(),
      nextPassword: "changed-password-1",
    });
    const row = await prisma.adminUser.findUniqueOrThrow({ where: { id: owner.id } });
    if (!(await bcrypt.compare("changed-password-1", row.passwordHash))) throw new Error("password was not saved");
    if (await bcrypt.compare(seededAdminPassword(), row.passwordHash)) throw new Error("old password still works");
  } finally {
    await prisma.adminUser.update({
      where: { id: owner.id },
      data: { name: owner.name, email: owner.email, passwordHash: owner.passwordHash },
    });
    await prisma.adminUser.delete({ where: { id: taken?.id } });
  }
});

it("keeps the last owner and lets an owner add an admin", async () => {
  const owner = await prisma.adminUser.findFirstOrThrow({ where: { role: "owner" } });
  const demote = await messageOf(() =>
    setConsoleRole({
      actorRole: "owner",
      workspaceId: owner.workspaceId,
      personId: owner.id,
      role: "admin",
    }),
  );
  if (demote !== "The workspace needs at least one owner.") throw new Error("last owner was demoted");
  const removed = await messageOf(() =>
    removeConsolePerson({ actorRole: "owner", workspaceId: owner.workspaceId, personId: owner.id }),
  );
  if (removed !== "The workspace needs at least one owner.") throw new Error("last owner was removed");

  const added = await grantPerson({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "Ada Admin",
    email: "ada-console@example.com",
    password: "ada-password",
    role: "admin",
  });
  if (added?.role !== "admin") throw new Error("admin was not added");

  const denied = await messageOf(() =>
    grantPerson({
      actorRole: "admin",
      workspaceId: owner.workspaceId,
      name: "Nope",
      email: "nope-console@example.com",
      password: "nope-password",
      role: "admin",
    }),
  );
  if (denied !== "Only an owner can do that.") throw new Error("admin added a person");

  const self = await updateOwnProfile({
    adminId: added!.id,
    name: "Ada A. Admin",
    email: "ada-console@example.com",
    currentPassword: "",
    nextPassword: "",
  });
  if (self?.name !== "Ada A. Admin") throw new Error("admin could not edit their profile");

  const second = await grantPerson({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "Second Owner",
    email: "second-owner@example.com",
    password: "second-password",
    role: "owner",
  });
  await setConsoleRole({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    personId: second!.id,
    role: "admin",
  });
  await removeConsolePerson({ actorRole: "owner", workspaceId: owner.workspaceId, personId: added!.id });
  const stillOwner = await prisma.adminUser.findUniqueOrThrow({ where: { id: owner.id } });
  if (stillOwner.role !== "owner") throw new Error("original owner changed");
  await prisma.adminUser.delete({ where: { id: second!.id } });
});

it("lets only an owner rename the company", async () => {
  const owner = await prisma.adminUser.findFirstOrThrow({ where: { role: "owner" } });
  const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: owner.workspaceId } });
  const denied = await messageOf(() =>
    updateWorkspaceName({
      actorRole: "admin",
      workspaceId: owner.workspaceId,
      name: "Nope LLC",
    }),
  );
  if (denied !== "Only an owner can do that.") throw new Error("admin renamed the company");
  const blank = await messageOf(() =>
    updateWorkspaceName({
      actorRole: "owner",
      workspaceId: owner.workspaceId,
      name: "   ",
    }),
  );
  if (blank !== "Company name is required.") throw new Error("blank company name");
  try {
    const renamed = await updateWorkspaceName({
      actorRole: "owner",
      workspaceId: owner.workspaceId,
      name: "North Steps LLC",
    });
    if (renamed.name !== "North Steps LLC") throw new Error("company name was not saved");
  } finally {
    await prisma.workspace.update({ where: { id: workspace.id }, data: { name: workspace.name } });
  }
});

it("creates an app secret for that app and lets an owner edit it", async () => {
  const owner = await prisma.adminUser.findFirstOrThrow({ where: { role: "owner" } });
  const denied = await messageOf(() =>
    createWorkspaceApp({
      actorRole: "admin",
      workspaceId: owner.workspaceId,
      name: "Blocked",
      platform: "iOS",
    }),
  );
  if (denied !== "Only an owner can do that.") throw new Error("admin created an app");

  const created = await createWorkspaceApp({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "North Path",
    platform: "Web",
  });
  try {
    if (!created.issuedCredential) throw new Error("secret was not stored");
    if (hashAppCredential(created.issuedCredential) !== created.credentialHash) throw new Error("hash mismatch");
    const server = hostServerInstall(created.name, created.issuedCredential);
    const view = viewInstall(created.name);
    if (!server.includes("North Path") || !server.includes(created.issuedCredential)) throw new Error("server block");
    if (view.includes(created.issuedCredential) || server.includes("Willow") || view.includes("Willow")) {
      throw new Error("snippet leaked another app or put the secret in the view");
    }
    const edited = await updateWorkspaceApp({
      actorRole: "owner",
      workspaceId: owner.workspaceId,
      slug: created.slug,
      name: "North Path West",
      platform: "Android",
      status: "inactive",
    });
    if (edited.slug !== created.slug || edited.name !== "North Path West" || edited.status !== "inactive") {
      throw new Error("app edit");
    }
    const editDenied = await messageOf(() =>
      updateWorkspaceApp({
        actorRole: "admin",
        workspaceId: owner.workspaceId,
        slug: created.slug,
        name: "North Path",
        platform: "Web",
        status: "active",
      }),
    );
    if (editDenied !== "Only an owner can do that.") throw new Error("admin edited an app");
  } finally {
    await prisma.app.delete({ where: { id: created.id } });
  }
});

it("rejects a mismatched password and limits a person to one app", async () => {
  const owner = await prisma.adminUser.findFirstOrThrow({ where: { email: "owner@healthysteps.example" } });
  const apps = await prisma.app.findMany({
    where: { workspaceId: owner.workspaceId },
    select: { id: true, slug: true },
  });
  const willow = apps.find((app) => app.slug === "willow");
  if (!willow) throw new Error("willow missing");

  const mismatch = await messageOf(() =>
    addConsolePerson({
      actorRole: "owner",
      workspaceId: owner.workspaceId,
      name: "Limited",
      email: "limited-console@example.com",
      password: "limited-password",
      passwordConfirm: "different-password",
      role: "admin",
      appIds: [willow.id],
    }),
  );
  if (mismatch !== "Passwords do not match.") throw new Error("mismatch was saved");
  if (await prisma.adminUser.findFirst({ where: { email: "limited-console@example.com" } })) {
    throw new Error("person exists after a mismatch");
  }

  const added = await addConsolePerson({
    actorRole: "owner",
    workspaceId: owner.workspaceId,
    name: "Limited",
    email: "limited-console@example.com",
    password: "limited-password",
    passwordConfirm: "limited-password",
    role: "admin",
    appIds: [willow.id],
  });
  try {
    const visible = await listWorkspaceApps(owner.workspaceId, added!.id);
    if (visible.map((app) => app.slug).join() !== "willow") throw new Error("limited person sees another app");
    const ownerApps = (await listWorkspaceApps(owner.workspaceId, owner.id)).map((app) => app.slug).sort();
    if (ownerApps.join() !== "earn-it,willow") throw new Error("owner lost an app");
  } finally {
    if (added?.id) await prisma.adminUser.delete({ where: { id: added.id } });
  }
});

it("names the selected inbox app and keeps three roadmap columns", () => {
  const earnIt = emptyInboxCopy("all", "Earn It").description;
  const everyone = emptyInboxCopy("all", null).description;
  if (!earnIt.includes("Earn It") || earnIt.includes("Willow")) throw new Error("selected app");
  if (everyone.includes("Willow")) throw new Error("empty inbox still names Willow");
  if (ADMIN_ROADMAP_STATUSES.join() !== "planned,in_progress,released") throw new Error("roadmap columns");
});
