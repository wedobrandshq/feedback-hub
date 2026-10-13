"use client";

import { Children, useState, type ReactNode } from "react";
import { HOME_LIST_STEP, homeListWindow } from "@/domain/admin";

export const LIST_PREVIEW = 3;

export function ShowMoreButton({
  open,
  hidden,
  onToggle,
}: {
  open: boolean;
  hidden: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="mt-3 text-sm text-[#5a5b70] hover:text-[#0e0e1a]"
      aria-expanded={open}
      onClick={onToggle}
    >
      {open ? "Show less" : `Show ${hidden} more`}
    </button>
  );
}

export function PreviewList({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const items = Children.toArray(children);
  const shown = open ? items : items.slice(0, LIST_PREVIEW);
  const hidden = items.length - shown.length;

  return (
    <div>
      <ul className="mt-3 divide-y divide-border">{shown}</ul>
      {items.length > LIST_PREVIEW ? (
        <ShowMoreButton open={open} hidden={hidden} onToggle={() => setOpen((value) => !value)} />
      ) : null}
    </div>
  );
}

export function StepList({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(HOME_LIST_STEP);
  const window = homeListWindow(items.length, shown);
  const visible = items.slice(0, window.visible);

  return (
    <div>
      <ul className="mt-3">{visible}</ul>
      {window.more > 0 || window.canCollapse ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {window.more > 0 ? (
            <button
              type="button"
              className="text-sm text-[#5a5b70] hover:text-[#0e0e1a]"
              aria-expanded={false}
              onClick={() => setShown((current) => current + HOME_LIST_STEP)}
            >
              Show {window.more} more
            </button>
          ) : null}
          {window.canCollapse ? (
            <button
              type="button"
              className="text-sm text-[#5a5b70] hover:text-[#0e0e1a]"
              aria-expanded={true}
              onClick={() => setShown(HOME_LIST_STEP)}
            >
              Show less
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
