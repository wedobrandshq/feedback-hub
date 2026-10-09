import { prisma } from "@/server/db";

export async function listAdminApps(workspaceId: string) {
  const [apps, latest] = await Promise.all([
    prisma.app.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    }),
    prisma.event.groupBy({
      by: ["appId"],
      where: { workspaceId },
      _max: { createdAt: true },
    }),
  ]);
  const lastEvent = new Map(latest.map((row) => [row.appId, row._max.createdAt]));
  return apps.map((app) => ({
    id: app.id,
    name: app.name,
    platform: app.platform,
    status: app.status,
    lastEventAt: lastEvent.get(app.id) ?? null,
  }));
}
