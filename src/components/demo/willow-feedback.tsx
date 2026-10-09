"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { FeedbackHoldRegion } from "@/host/feedback-hold-region";

export function WillowFeedback({ name, plan }: { name: string; plan: string }) {
  const [walks, setWalks] = useState(0);

  function openWindow() {
    document.dispatchEvent(new Event("fh-open"));
  }

  return (
    <div className="relative flex h-full min-h-full flex-col px-5 pt-4 pb-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-[#6a7268]">
          {name} · {plan}
        </p>
        <button
          type="button"
          data-fh-open=""
          aria-label="Feedback"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1f3d32] text-[#f4f1ea]"
        >
          <MessageSquare className="size-5" aria-hidden="true" />
        </button>
      </div>
      <h2 className="mt-6 text-[2rem] leading-none font-semibold tracking-tight text-[#1c241c]">Willow</h2>
      <p className="mt-2 text-sm text-[#3d463d]">A short walk still counts.</p>
      <FeedbackHoldRegion
        className="mt-6 rounded-2xl border-2 border-dashed border-[#1f3d32] bg-white px-4 py-5 text-left"
        label="Today's walk. Tap to log a walk. Hold to share feedback."
        onOpenFeedback={openWindow}
        onTap={() => setWalks((count) => count + 1)}
      >
        <p className="text-xs font-medium tracking-[0.14em] text-[#1f3d32] uppercase">Marked region</p>
        <p className="mt-2 text-xl font-semibold tracking-tight text-[#1c241c]">Today&apos;s walk</p>
        <p className="mt-1 text-sm text-[#3d463d]" data-walk-count={walks}>
          {walks === 1 ? "1 walk logged" : `${walks} walks logged`}
        </p>
        <p className="mt-3 text-sm text-[#6a7268]">Tap to log it. Hold to share feedback.</p>
      </FeedbackHoldRegion>
    </div>
  );
}
