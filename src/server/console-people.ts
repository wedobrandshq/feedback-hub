import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import {
  cleanPassword,
  cleanProfileEmail,
  cleanProfileName,
  cleanWorkspaceName,
  isConsoleRole,
  type ConsoleRole,
} from "@/domain/console";
import { DomainError } from "@/domain/errors";
import { prisma } from "@/server/db";

function assertOwner(role: string) {
  if (role !== "owner") throw new DomainError("Only an owner can do that.", "unauthorized");
}

function asEmailConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new DomainError("That email is already used.", "conflict");
  }
  throw error;
}

export async function listWorkspaceAppChoices(workspaceId: string) {
  return prisma.app.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function listConsolePeople(workspaceId: string) {
  return prisma.adminUser.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function updateOwnProfile(input: {
  adminId: string;
  name: string;
  email: string;
  currentPassword: string;
  nextPassword: string;
  passwordConfirm: string;
}) {
  const name = cleanProfileName(input.name);
  const email = cleanProfileEmail(input.email);
  const admin = await prisma.adminUser.findUnique({ where: { id: input.adminId } });
  if (!admin) throw new DomainError("That person was not found.", "not_found");

  const taken = await prisma.adminUser.findFirst({
    where: { email, NOT: { id: admin.id } },
    select: { id: true },
  });
  if (taken) throw new DomainError("That email is already used.", "conflict");

  const changingPassword = input.nextPassword.length > 0 || input.passwordConfirm.length > 0;
  if (changingPassword && input.nextPassword !== input.passwordConfirm) {
    throw new DomainError("Passwords do not match.", "validation");
  }

  const data: { name: string; email: string; passwordHash?: string } = { name, email };
  if (input.nextPassword) {
    if (!input.currentPassword) {
      throw new DomainError("Enter your current password to set a new one.", "validation");
    }
    const matches = await bcrypt.compare(input.currentPassword, admin.passwordHash);
    if (!matches) throw new DomainError("Current password is wrong.", "unauthorized");
    data.passwordHash = await bcrypt.hash(cleanPassword(input.nextPassword), 10);
  }

  try {
    return await prisma.adminUser.update({
      where: { id: admin.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
  } catch (error) {
    asEmailConflict(error);
  }
}

export async function updateWorkspaceName(input: {
  actorRole: string;
  workspaceId: string;
  name: string;
}) {
  assertOwner(input.actorRole);
  const name = cleanWorkspaceName(input.name);
  return prisma.workspace.update({
    where: { id: input.workspaceId },
    data: { name },
    select: { id: true, name: true },
  });
}

export async function addConsolePerson(input: {
  actorRole: string;
  workspaceId: string;
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: string;
  appIds: string[];
}) {
  assertOwner(input.actorRole);
  if (input.password !== input.passwordConfirm) {
    throw new DomainError("Passwords do not match.", "validation");
  }
  if (!isConsoleRole(input.role)) throw new DomainError("Choose Owner or Admin.", "validation");
  const name = cleanProfileName(input.name);
  const email = cleanProfileEmail(input.email);
  const passwordHash = await bcrypt.hash(cleanPassword(input.password), 10);
  const appIds = [...new Set(input.appIds.map((id) => id.trim()).filter(Boolean))];
  if (appIds.length === 0) throw new DomainError("Choose at least one app.", "validation");
  const apps = await prisma.app.findMany({
    where: { workspaceId: input.workspaceId, id: { in: appIds } },
    select: { id: true },
  });
  if (apps.length !== appIds.length) {
    throw new DomainError("Choose an app from this workspace.", "validation");
  }
  const taken = await prisma.adminUser.findFirst({ where: { email }, select: { id: true } });
  if (taken) throw new DomainError("That email is already used.", "conflict");
  try {
    return await prisma.adminUser.create({
      data: {
        workspaceId: input.workspaceId,
        name,
        email,
        passwordHash,
        role: input.role,
        appAccess: { create: apps.map((app) => ({ appId: app.id })) },
      },
      select: { id: true, name: true, email: true, role: true },
    });
  } catch (error) {
    asEmailConflict(error);
  }
}

async function personInWorkspace(workspaceId: string, personId: string) {
  const person = await prisma.adminUser.findFirst({
    where: { id: personId, workspaceId },
  });
  if (!person) throw new DomainError("That person was not found.", "not_found");
  return person;
}

async function assertOwnerRemains(workspaceId: string, person: { role: string }, nextRole: ConsoleRole | null) {
  const leavingOwner = person.role === "owner" && nextRole !== "owner";
  if (!leavingOwner) return;
  const owners = await prisma.adminUser.count({ where: { workspaceId, role: "owner" } });
  if (owners <= 1) {
    throw new DomainError("The workspace needs at least one owner.", "conflict");
  }
}

export async function setConsoleRole(input: {
  actorRole: string;
  workspaceId: string;
  personId: string;
  role: string;
}) {
  assertOwner(input.actorRole);
  if (!isConsoleRole(input.role)) throw new DomainError("Choose Owner or Admin.", "validation");
  const person = await personInWorkspace(input.workspaceId, input.personId);
  await assertOwnerRemains(input.workspaceId, person, input.role);
  return prisma.adminUser.update({
    where: { id: person.id },
    data: { role: input.role },
    select: { id: true, role: true },
  });
}

export async function removeConsolePerson(input: {
  actorRole: string;
  workspaceId: string;
  personId: string;
}) {
  assertOwner(input.actorRole);
  const person = await personInWorkspace(input.workspaceId, input.personId);
  await assertOwnerRemains(input.workspaceId, person, null);
  await prisma.adminUser.delete({ where: { id: person.id } });
}
