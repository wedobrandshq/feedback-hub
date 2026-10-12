"use client";

import { Children, useState, type ReactNode } from "react";

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
