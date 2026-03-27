import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLocalStorage } from "./use-local-storage";

describe("useLocalStorage", () => {
  const key = "test-key";
  const initialValue = { foo: "bar" };

  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("should return initialValue when no value exists in localStorage", () => {
    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toEqual(initialValue);
  });

  it("should return value from localStorage if it exists", () => {
    const existingValue = { foo: "baz" };
    window.localStorage.setItem(key, JSON.stringify(existingValue));

    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toEqual(existingValue);
  });

  it("should return initialValue if localStorage.getItem returns null", () => {
    vi.spyOn(window.localStorage, "getItem").mockReturnValue(null);
    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toEqual(initialValue);
  });

  it("should return raw string if JSON.parse fails", () => {
    const rawString = "invalid json";
    window.localStorage.setItem(key, rawString);

    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toBe(rawString);
  });

  it("should return initialValue if localStorage.getItem throws", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("Local storage access denied");
      });

    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toEqual(initialValue);
    expect(consoleSpy).toHaveBeenCalled();

    getItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("should handle SSR environment where window is undefined", () => {
    // Mock window to be undefined specifically for this test
    const originalWindow = global.window;
    // We don't delete global.window here because React-testing-library needs it.
    // Instead we can mock the behavior if we want to test SSR,
    // but since we're in jsdom, window is always defined.
    // We'll test that it returns initialValue if window is simulated to be missing
    // by mocking the localStorage access to throw and checking if it recovers.
    // Actually, we already have a test for throwing.
    // For true SSR testing, we'd need a different environment.
    // We'll just verify it works when window.localStorage is not present.
    const localStorageSpy = vi
      .spyOn(window, "localStorage", "get")
      .mockReturnValue(undefined as any);

    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    expect(result.current[0]).toEqual(initialValue);

    localStorageSpy.mockRestore();
  });

  it("should update state and localStorage when setValue is called with a direct value", () => {
    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    const newValue = { foo: "updated" };

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toEqual(newValue);
    expect(JSON.parse(window.localStorage.getItem(key)!)).toEqual(newValue);
  });

  it("should update state and localStorage when setValue is called with a function", () => {
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    act(() => {
      result.current[1]((prev) => ({ ...prev, foo: "updated-via-fn" }));
    });

    const expectedValue = { foo: "updated-via-fn" };
    expect(result.current[0]).toEqual(expectedValue);
    expect(JSON.parse(window.localStorage.getItem(key)!)).toEqual(
      expectedValue,
    );
  });

  it("should log a warning if localStorage.setItem throws", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    act(() => {
      result.current[1]({ foo: "new" });
    });

    expect(consoleSpy).toHaveBeenCalled();
    setItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it("should remove value from localStorage and reset to initialValue when removeValue is called", () => {
    window.localStorage.setItem(key, JSON.stringify({ foo: "exists" }));
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toEqual(initialValue);
    expect(window.localStorage.getItem(key)).toBeNull();
  });

  it("should log a warning if localStorage.removeItem throws", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const removeItemSpy = vi
      .spyOn(Storage.prototype, "removeItem")
      .mockImplementation(() => {
        throw new Error("Removal failed");
      });

    const { result } = renderHook(() => useLocalStorage(key, initialValue));
    act(() => {
      result.current[2]();
    });

    expect(consoleSpy).toHaveBeenCalled();
    removeItemSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
