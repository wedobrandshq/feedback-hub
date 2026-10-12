"use client";

import { useEffect, useState } from "react";

const MOTION_MS = 200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Disclose({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [present, setPresent] = useState(false);
  const [shown, setShown] = useState(false);
  const [settled, setSettled] = useState(false);

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

  useEffect(() => {
    if (!shown) {
      setSettled(false);
      return;
    }
    const delay = prefersReducedMotion() ? 0 : MOTION_MS;
    const timer = window.setTimeout(() => setSettled(true), delay);
    return () => window.clearTimeout(timer);
  }, [shown]);

  if (!present) return null;

  return (
    <div
      data-disclose={shown ? "open" : "closed"}
      className={`grid transition-[grid-template-rows,opacity,translate] duration-200 ease-out motion-reduce:transition-none ${
        shown ? "grid-rows-[1fr] opacity-100 [translate:0_0]" : "grid-rows-[0fr] opacity-0 [translate:0_-8px]"
      }`}
    >
      <div className={settled ? "min-h-0 overflow-visible" : "min-h-0 overflow-hidden"}>{children}</div>
    </div>
  );
}
