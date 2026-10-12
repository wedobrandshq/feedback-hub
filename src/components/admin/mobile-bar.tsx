"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AccountBlock, Wordmark } from "@/components/admin/chrome";
import { AdminNav } from "@/components/admin/admin-nav";

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <path d="M3.5 5.5h13M3.5 10h13M3.5 14.5h13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <path d="M5 5l10 10M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MobileBar({
  admin,
}: {
  admin: { name: string; role: string; workspaceName: string };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="sticky top-0 z-30 bg-[#fffcf2] md:hidden">
      <div className="flex items-center justify-between gap-3 border-b-2 border-[#0e0e1a] px-4 py-3">
        <Wordmark />
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center text-[#0e0e1a]"
          aria-expanded={open}
          aria-controls="admin-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      {open ? (
        <div id="admin-menu" className="max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b-2 border-[#0e0e1a]">
          <AdminNav onNavigate={() => setOpen(false)} />
          <AccountBlock admin={admin} />
        </div>
      ) : null}
    </div>
  );
}
