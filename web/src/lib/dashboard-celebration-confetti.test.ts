import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import confetti from "canvas-confetti";
import { runViewportCelebration } from "./dashboard-celebration-confetti";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("runViewportCelebration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((cb) => setTimeout(cb, 16)),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("calls confetti multiple times", () => {
    const colors = ["#ff0000", "#00ff00"];
    runViewportCelebration(colors);

    // Initial cannon frame calls
    expect(confetti).toHaveBeenCalled();

    // Advance time to trigger frames and intervals
    vi.advanceTimersByTime(500);
    expect(confetti).toHaveBeenCalledTimes(
      vi.mocked(confetti).mock.calls.length,
    );

    // Advance time beyond duration
    vi.advanceTimersByTime(3000);
    const callCountAfterDuration = vi.mocked(confetti).mock.calls.length;

    vi.advanceTimersByTime(1000);
    // Should not have been called anymore
    expect(confetti).toHaveBeenCalledTimes(callCountAfterDuration);
  });

  it("passes the provided colors to confetti", () => {
    const colors = ["#ff0000", "#00ff00"];
    runViewportCelebration(colors);

    const calls = vi.mocked(confetti).mock.calls;
    calls.forEach((call) => {
      const opts = call[0];
      expect(opts?.colors).toEqual(colors);
    });
  });
});
