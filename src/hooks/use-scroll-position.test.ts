import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useScrollPosition } from "./use-scroll-position";

describe("useScrollPosition", () => {
  beforeEach(() => {
    window.scrollY = 0;
    vi.clearAllMocks();
  });

  it("should initialize as false when scrollY is below threshold", () => {
    const { result } = renderHook(() => useScrollPosition(10));
    expect(result.current).toBe(false);
  });

  it("should initialize as true when scrollY is above threshold", () => {
    window.scrollY = 20;
    const { result } = renderHook(() => useScrollPosition(10));
    expect(result.current).toBe(true);
  });

  it("should update when scroll event is dispatched and threshold crossed", () => {
    const { result } = renderHook(() => useScrollPosition(10));
    expect(result.current).toBe(false);

    act(() => {
      window.scrollY = 15;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(true);

    act(() => {
      window.scrollY = 5;
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBe(false);
  });

  it("should use default threshold of 8", () => {
    const { result } = renderHook(() => useScrollPosition());

    act(() => {
      window.scrollY = 5;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.scrollY = 9;
      window.dispatchEvent(new Event("scroll"));
    });
    expect(result.current).toBe(true);
  });

  it("should clean up event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useScrollPosition());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });
});
