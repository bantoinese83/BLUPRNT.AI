import { describe, it, expect, vi, afterEach } from "vitest";
import { reportClientError } from "./report-error";

describe("reportClientError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a UUID and logs one JSON object", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const id = reportClientError("unit-test", new Error("boom"), {
      extra: true,
    });
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(spy).toHaveBeenCalledTimes(1);
    const raw = spy.mock.calls[0][0];
    expect(typeof raw).toBe("string");
    const parsed = JSON.parse(raw as string) as {
      eventId: string;
      source: string;
      message: string;
      extra?: boolean;
    };
    expect(parsed.eventId).toBe(id);
    expect(parsed.source).toBe("unit-test");
    expect(parsed.message).toBe("boom");
    expect(parsed.extra).toBe(true);
  });
});
