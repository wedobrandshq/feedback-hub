import Link from "next/link";
import { logoutAction } from "@/app/(admin)/admin/login/actions";
import { consoleRoleLabel } from "@/domain/console";

export function Wordmark() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2.5 rounded-md text-[#0e0e1a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0e0e1a]"
    >
      <span aria-hidden className="size-[1.35rem] shrink-0 rounded-md bg-[#c6ff4f]" />
      <span className="product-name text-[1.35rem] leading-none font-extrabold tracking-[-0.045em]">Feedie</span>
    </Link>
  );
}

export function AccountBlock({
  admin,
}: {
  admin: { name: string; role: string; workspaceName: string };
}) {
  return (
    <div className="px-4 pt-8 pb-4">
      <p className="truncate text-base leading-6 font-medium text-[#0e0e1a]">
        {admin.name}, {consoleRoleLabel(admin.role)}
      </p>
      <p className="mt-1 truncate text-sm leading-5 font-normal text-[#5a5b70]">{admin.workspaceName}</p>
      <form action={logoutAction} className="mt-3">
        <button type="submit" className="text-sm leading-5 font-normal text-[#5a5b70] hover:text-[#0e0e1a]">
          Sign out
        </button>
      </form>
    </div>
  );
}
