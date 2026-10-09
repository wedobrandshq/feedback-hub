"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

export const FEEDBACK_HOLD_MS = 500;

export function gestureResult(input: {
  elapsedMs: number;
  pointerInside: boolean;
  holdMs?: number;
}): "open" | "tap" | "ignore" {
  if (!input.pointerInside) return "ignore";
  if (input.elapsedMs >= (input.holdMs ?? FEEDBACK_HOLD_MS)) return "open";
  return "tap";
}

function pointerInside(event: PointerEvent<HTMLDivElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return (
    event.clientX >= bounds.left &&
    event.clientX <= bounds.right &&
    event.clientY >= bounds.top &&
    event.clientY <= bounds.bottom
  );
}

export function FeedbackHoldRegion({
  children,
  className,
  holdMs = FEEDBACK_HOLD_MS,
  onOpenFeedback,
  onTap,
  label,
}: {
  children: ReactNode;
  className?: string;
  holdMs?: number;
  onOpenFeedback: () => void;
  onTap: () => void;
  label: string;
}) {
  const timer = useRef<number | null>(null);
  const opened = useRef(false);
  const cancelled = useRef(false);
  const pointerId = useRef<number | null>(null);
  const startedAt = useRef(0);

  function clearTimer() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    pointerId.current = event.pointerId;
    opened.current = false;
    cancelled.current = false;
    startedAt.current = performance.now();
    clearTimer();
    event.currentTarget.setPointerCapture(event.pointerId);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      if (cancelled.current || opened.current) return;
      opened.current = true;
      onOpenFeedback();
    }, holdMs);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== event.pointerId || opened.current || cancelled.current) return;
    if (!pointerInside(event)) {
      cancelled.current = true;
      clearTimer();
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== event.pointerId) return;
    clearTimer();
    const inside = !cancelled.current && pointerInside(event);
    const result = gestureResult({
      elapsedMs: performance.now() - startedAt.current,
      pointerInside: inside,
      holdMs,
    });
    pointerId.current = null;
    if (result === "tap") onTap();
    else if (result === "open" && !opened.current) {
      opened.current = true;
      onOpenFeedback();
    }
  }

  function onPointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (pointerId.current !== event.pointerId) return;
    clearTimer();
    cancelled.current = true;
    pointerId.current = null;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      data-feedback-hold=""
      className={className}
      style={{ touchAction: "none", userSelect: "none" }}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTap();
        }
      }}
    >
      {children}
    </div>
  );
}
