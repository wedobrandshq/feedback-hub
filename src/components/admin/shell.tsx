import { logoutAction } from "@/app/(admin)/admin/login/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppSelector } from "@/components/admin/app-selector";
import { hatchLift } from "@/components/admin/hatch";
import { consoleRoleLabel } from "@/domain/console";
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
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b-2 border-[#0e0e1a] bg-[#fffcf2] text-[#0e0e1a] md:min-h-screen md:w-60 md:border-r-2 md:border-b-0">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
          <span aria-hidden className="size-[1.35rem] shrink-0 rounded-md bg-[#c6ff4f]" />
          <p className="product-name text-[1.35rem] leading-none font-extrabold tracking-[-0.045em] text-[#0e0e1a]">
            Feedie
          </p>
        </div>
        <AdminNav />
        <div className="mt-auto px-4 pt-8 pb-4">
          <p className="truncate text-base leading-6 font-medium text-[#0e0e1a]">{admin.name}</p>
          <p className="truncate text-xs leading-4 font-normal text-[#5a5b70]">{consoleRoleLabel(admin.role)}</p>
          <p className="mt-1 truncate text-sm leading-5 font-normal text-[#5a5b70]">{admin.workspaceName}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className={`rounded-full border-2 border-transparent px-3 py-1 text-sm leading-5 font-normal text-[#5a5b70] hover:border-[#0e0e1a] hover:bg-white hover:text-[#0e0e1a] hover:shadow-[2px_2px_0_#0e0e1a] ${hatchLift}`}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col bg-[#fffcf2] text-[#0e0e1a]">
        <div className="flex h-14 items-center justify-end px-4 md:px-6">
          <AppSelector apps={apps} selectedId={selectedId} />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
