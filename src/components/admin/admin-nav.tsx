"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hatchLift } from "@/components/admin/hatch";

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

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0 overflow-visible px-3 pt-1 pr-3 pb-4">
      {NAV.map((group) => (
        <div key={group.label} className="mt-5 first:mt-0">
          <p className="px-1 pb-2 text-[11px] leading-[11px] font-bold tracking-[0.6px] text-[#5a5b70] uppercase [font-family:var(--font-mono)]">
            {group.label}
          </p>
          <ul className="flex flex-col gap-1.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
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
  );
}
