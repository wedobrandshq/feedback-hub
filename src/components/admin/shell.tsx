import { logoutAction } from "@/app/(admin)/admin/login/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { hatchLift } from "@/components/admin/hatch";
import { consoleRoleLabel } from "@/domain/console";
import type { CurrentAdmin } from "@/server/auth/admin";

export function AdminShell({
  admin,
  children,
}: {
  admin: CurrentAdmin;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b-2 border-[#0e0e1a] bg-[#fffcf2] text-[#0e0e1a] md:min-h-screen md:w-60 md:border-r-2 md:border-b-0">
        <div className="px-4 pt-5 pb-4">
          <p className="product-name text-[1.35rem] leading-none font-extrabold tracking-[-0.045em] text-[#0e0e1a]">
            Feedback Hub
          </p>
          <p className="mt-2 truncate text-sm leading-5 font-normal text-[#5a5b70]">{admin.workspaceName}</p>
        </div>
        <AdminNav />
        <div className="mt-auto border-t-2 border-[#0e0e1a] px-4 py-4">
          <p className="truncate text-base leading-6 font-medium text-[#0e0e1a]">{admin.name}</p>
          <p className="truncate text-xs leading-4 font-normal text-[#5a5b70]">{consoleRoleLabel(admin.role)}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className={`rounded-full border-2 border-transparent px-3 py-1 text-sm leading-5 font-normal text-[#5a5b70] hover:border-[#0e0e1a] hover:bg-white hover:text-[#0e0e1a] hover:shadow-[2px_2px_0_#0e0e1a] ${hatchLift}`}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-[#fffcf2] text-[#0e0e1a]">{children}</div>
    </div>
  );
}
