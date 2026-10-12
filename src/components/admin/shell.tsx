import { AccountBlock, Wordmark } from "@/components/admin/chrome";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppSelector } from "@/components/admin/app-selector";
import { MobileBar } from "@/components/admin/mobile-bar";
import type { CurrentAdmin } from "@/server/auth/admin";

export function AdminShell({
  admin,
  apps,
  selectedId,
  children,
}: {
  admin: CurrentAdmin;
  apps: { id: string; name: string }[];
  selectedId: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fffcf2] text-[#0e0e1a] md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-[#0e0e1a] md:flex md:border-r-2">
        <div className="px-4 pt-5 pb-4">
          <Wordmark />
        </div>
        <AdminNav />
        <div className="mt-auto">
          <AccountBlock admin={admin} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar admin={admin} apps={apps} selectedId={selectedId} />
        <div className="hidden h-14 items-center justify-end px-4 md:flex md:px-8">
          <AppSelector apps={apps} selectedId={selectedId} />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
        <footer className="mt-auto px-4 pt-10 pb-8 md:px-8 md:pb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t-2 border-[#0e0e1a] pt-4">
            <p className="text-sm font-medium text-[#0e0e1a]">Feedie</p>
            <p className="text-sm text-[#5a5b70]">{admin.workspaceName}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
