import { describe, it, expect, vi } from "vitest";
import { registerAppToastHandler, showAppToast } from "@/lib/app-toast";

describe("app-toast", () => {
  it("delegates to registered handler", () => {
    const handler = vi.fn();
    registerAppToastHandler(handler);
    showAppToast("hello");
    expect(handler).toHaveBeenCalledWith("hello");
    registerAppToastHandler(null);
    showAppToast("x");
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
