import { describe, expect, it } from "vitest";
import { FEEDBACK_HOLD_MS, gestureResult } from "@/host/feedback-hold-region";

describe("feedback hold region", () => {
  it("opens after a 500ms hold inside the region and treats a shorter press as a tap", () => {
    expect(FEEDBACK_HOLD_MS).toBe(500);
    expect(gestureResult({ elapsedMs: 499, pointerInside: true })).toBe("tap");
    expect(gestureResult({ elapsedMs: 500, pointerInside: true })).toBe("open");
    expect(gestureResult({ elapsedMs: 800, pointerInside: true })).toBe("open");
    expect(gestureResult({ elapsedMs: 900, pointerInside: false })).toBe("ignore");
    expect(gestureResult({ elapsedMs: 40, pointerInside: false })).toBe("ignore");
  });
});
