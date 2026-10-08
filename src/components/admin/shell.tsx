import Link from "next/link";
import { logoutAction } from "@/app/(admin)/admin/login/actions";
import { AppSelector } from "@/components/admin/app-selector";
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
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-sidebar md:min-h-screen md:w-60 md:border-r md:border-b-0">
        <div className="px-4 py-4">
          <p className="text-sm font-semibold tracking-tight">Feedback Hub</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{admin.workspaceName}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:px-2 md:pb-4">
          {NAV.map((group) => (
            <div key={group.label} className="md:mt-4 md:first:mt-0">
              <p className="hidden px-2 pb-1 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase md:block">
                {group.label}
              </p>
              <ul className="flex md:flex-col">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap ${
                          active
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
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
        <div className="mt-auto hidden border-t border-sidebar-border px-4 py-4 md:block">
          <p className="truncate text-sm font-medium">{admin.name}</p>
          <p className="truncate text-xs text-muted-foreground">{admin.role === "owner" ? "Owner" : admin.role}</p>
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-border px-4 md:px-6">
          <p className="truncate text-sm text-muted-foreground md:hidden">{admin.name}</p>
          <p className="hidden text-sm text-muted-foreground md:block">{admin.workspaceName}</p>
          <div className="flex items-center gap-4">
            <form action={logoutAction} className="md:hidden">
              <button type="submit" className="text-sm text-muted-foreground">
                Sign out
              </button>
            </form>
            <AppSelector apps={apps} selectedId={selectedId} />
          </div>
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
