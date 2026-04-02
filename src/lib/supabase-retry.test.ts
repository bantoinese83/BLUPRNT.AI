import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  })),
}));

import { invokeFunction, supabase } from "./supabase";

describe("invokeFunction retry logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns data on first success", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { result: "success" },
      error: null,
    });

    const promise = invokeFunction("test-func");
    const result = await promise;

    expect(result.data).toEqual({ result: "success" });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it("retries on 500 error and eventually succeeds", async () => {
    (supabase.functions.invoke as any)
      .mockResolvedValueOnce({
        data: null,
        error: { status: 500, message: "Server Error" },
      })
      .mockResolvedValueOnce({
        data: { Fixed: true },
        error: null,
      });

    const promise = invokeFunction("test-func", {}, 2);

    // Fast-forward through first retry delay
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result.data).toEqual({ Fixed: true });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 400 error", async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: { status: 400, message: "Bad Request" },
    });

    const result = await invokeFunction("test-func", {}, 2);

    expect(result.error).toMatchObject({ status: 400 });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it("retries on exceptions (network errors)", async () => {
    (supabase.functions.invoke as any)
      .mockRejectedValueOnce(new Error("Network Error"))
      .mockResolvedValueOnce({
        data: { Recovered: true },
        error: null,
      });

    const promise = invokeFunction("test-func", {}, 2);

    await vi.runAllTimersAsync();

    const result = await promise;

    expect(result.data).toEqual({ Recovered: true });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(2);
  });

  it("exhausts all retries and returns the last error", async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: { status: 503, message: "Service Unavailable" },
    });

    const promise = invokeFunction("test-func", {}, 2);

    await vi.runAllTimersAsync(); // Run all retry timers

    const result = await promise;

    expect(result.error).toMatchObject({ status: 503 });
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });
});
