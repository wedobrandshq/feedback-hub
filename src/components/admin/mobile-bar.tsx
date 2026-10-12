"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AccountBlock, Wordmark } from "@/components/admin/chrome";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppSelector } from "@/components/admin/app-selector";

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

const MOTION_MS = 200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MobileBar({
  admin,
  apps,
  selectedId,
}: {
  admin: { name: string; role: string; workspaceName: string };
  apps: { id: string; name: string }[];
  selectedId: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) setPresent(true);
  }, [open]);

  useEffect(() => {
    if (open || shown || !present) return;
    const delay = prefersReducedMotion() ? 0 : MOTION_MS;
    const timer = window.setTimeout(() => setPresent(false), delay);
    return () => window.clearTimeout(timer);
  }, [open, shown, present]);

  useEffect(() => {
    if (!present || !open) {
      setShown(false);
      return;
    }
    if (prefersReducedMotion()) {
      setShown(true);
      return;
    }
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => setShown(true));
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [present, open]);

  return (
    <div className="sticky top-0 z-30 bg-[#fffcf2] md:hidden">
      <div className="flex items-center gap-2 px-3 py-3">
        <button
          type="button"
          className="inline-flex size-10 shrink-0 items-center justify-center text-[#0e0e1a]"
          aria-expanded={open}
          aria-controls="admin-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Wordmark />
        <div className="ml-auto min-w-0">
          <AppSelector apps={apps} selectedId={selectedId} id="app-selector-mobile" />
        </div>
      </div>
      {present ? (
        <div
          id="admin-menu"
          data-open={shown ? "true" : "false"}
          className={`grid transition-[grid-template-rows,opacity,translate] duration-200 ease-out motion-reduce:transition-none ${
            shown
              ? "[grid-template-rows:1fr] opacity-100 [translate:0_0]"
              : "[grid-template-rows:0fr] opacity-0 [translate:0_-8px]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b-2 border-[#0e0e1a]">
              <AdminNav onNavigate={() => setOpen(false)} />
              <AccountBlock admin={admin} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
