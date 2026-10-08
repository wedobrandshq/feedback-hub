import { headers } from "next/headers";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/shell";
import { getSelectedApp, requireAdmin } from "@/server/auth/admin";
import { listWorkspaceApps } from "@/server/feedback-queries";

export const instant = false;

async function ConsoleFrame({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [apps, selected, headerList] = await Promise.all([
    listWorkspaceApps(admin.workspaceId),
    getSelectedApp(admin.workspaceId),
    headers(),
  ]);

  return (
    <AdminShell
      admin={admin}
      pathname={headerList.get("x-pathname") ?? ""}
      apps={apps}
      selectedId={selected?.id ?? null}
    >
      {children}
    </AdminShell>
  );
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-8">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-64 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <ConsoleFrame>{children}</ConsoleFrame>
    </Suspense>
  );
}
