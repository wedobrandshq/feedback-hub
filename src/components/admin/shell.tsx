import Link from "next/link";
import { logoutAction } from "@/app/(admin)/admin/login/actions";
import { AppSelector } from "@/components/admin/app-selector";
import { hatchLift } from "@/components/admin/hatch";
import { consoleRoleLabel } from "@/domain/console";
import type { CurrentAdmin } from "@/server/auth/admin";

const NAV = [
  { label: "Home", items: [{ href: "/admin", label: "Home" }] },
  {
    label: "Communication",
    items: [
      { href: "/admin/inbox", label: "Inbox" },
      { href: "/admin/feedback", label: "Feedback" },
    ],
  },
  {
    label: "Product",
    items: [
      { href: "/admin/requests", label: "Requests" },
      { href: "/admin/roadmap", label: "Roadmap" },
      { href: "/admin/changelog", label: "Changelog" },
    ],
  },
  { label: "Users", items: [{ href: "/admin/users", label: "Users" }] },
  {
    label: "System",
    items: [
      { href: "/admin/apps", label: "Apps" },
      { href: "/admin/people", label: "People" },
      { href: "/admin/settings", label: "Settings" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  admin,
  pathname,
  apps,
  selectedId,
  children,
}: {
  admin: CurrentAdmin;
  pathname: string;
  apps: { id: string; name: string }[];
  selectedId: string | null;
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
        <nav className="flex gap-2 overflow-x-auto px-3 pt-1 pr-3 pb-3 md:flex-col md:gap-0 md:overflow-visible md:px-3 md:pb-4">
          {NAV.map((group) => (
            <div key={group.label} className="md:mt-5 md:first:mt-0">
              <p className="hidden px-1 pb-2 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase md:block [font-family:var(--font-mono)]">
                {group.label}
              </p>
              <ul className="flex gap-2 md:flex-col md:gap-1.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`inline-flex items-center rounded-full border-2 px-3 py-1 text-[17px] leading-[26px] font-medium whitespace-nowrap text-[#0e0e1a] ${hatchLift} ${
                          active
                            ? "border-[#0e0e1a] bg-[#c6ff4f] shadow-[3px_3px_0_#0e0e1a] hover:shadow-[3px_3px_0_#0e0e1a]"
                            : "border-transparent hover:border-[#0e0e1a] hover:bg-white hover:shadow-[2px_2px_0_#0e0e1a]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-auto hidden border-t-2 border-[#0e0e1a] px-4 py-4 md:block">
          <p className="truncate text-base leading-6 font-medium text-[#0e0e1a]">{admin.name}</p>
          <p className="truncate text-xs leading-4 font-normal text-[#5a5b70]">{consoleRoleLabel(admin.role)}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className={`rounded-full border-2 border-transparent px-3 py-1 text-sm leading-5 font-normal text-[#5a5b70] hover:border-[#0e0e1a] hover:bg-white hover:text-[#0e0e1a] hover:shadow-[2px_2px_0_#0e0e1a] ${hatchLift}`}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between gap-3 border-b-2 border-[#0e0e1a] bg-[#fffcf2] px-4 md:px-6">
          <p className="truncate text-sm font-medium text-[#0e0e1a] md:hidden">{admin.name}</p>
          <p className="hidden truncate text-sm font-medium text-[#0e0e1a] md:block">{admin.workspaceName}</p>
          <div className="flex items-center gap-4">
            <form action={logoutAction} className="md:hidden">
              <button type="submit" className={`rounded-full border-2 border-transparent px-3 py-1 text-sm font-normal text-[#5a5b70] hover:border-[#0e0e1a] hover:bg-white hover:text-[#0e0e1a] hover:shadow-[2px_2px_0_#0e0e1a] ${hatchLift}`}>
                Sign out
              </button>
            </form>
            <AppSelector apps={apps} selectedId={selectedId} />
          </div>
        </div>
        <div className="min-w-0 flex-1 bg-[#fffcf2] text-[#0e0e1a]">{children}</div>
      </div>
    </div>
  );
}
