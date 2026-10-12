import type { Prisma } from "@prisma/client";

export function visibleApps(input: {
  workspaceId: string;
  appId?: string | null;
  adminId?: string | null;
}): Prisma.AppWhereInput {
  return {
    workspaceId: input.workspaceId,
    ...(input.appId ? { id: input.appId } : {}),
    ...(input.adminId ? { adminAccess: { some: { adminUserId: input.adminId } } } : {}),
  };
}
