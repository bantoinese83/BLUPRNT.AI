import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { reportClientError } from "./report-error";

const { mockGetClient, mockCaptureException, mockLastEventId } = vi.hoisted(
  () => ({
    mockGetClient: vi.fn(),
    mockCaptureException: vi.fn(),
    mockLastEventId: vi.fn(),
  }),
);

vi.mock("@sentry/react", () => ({
  getClient: () => mockGetClient(),
  captureException: (...args: unknown[]) => mockCaptureException(...args),
  lastEventId: () => mockLastEventId(),
}));

describe("reportClientError", () => {
  beforeEach(() => {
    mockGetClient.mockReturnValue(null);
    mockCaptureException.mockClear();
    mockLastEventId.mockReturnValue(undefined);
  });

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

  it("captures with Sentry when a client is active and uses lastEventId when present", () => {
    mockGetClient.mockReturnValue({});
    mockLastEventId.mockReturnValue("sentry-event-1");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const id = reportClientError("checkout", new Error("pay"), { cart: 1 });

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(id).toBe("sentry-event-1");
    const raw = spy.mock.calls[0][0] as string;
    expect(JSON.parse(raw).eventId).toBe("sentry-event-1");
    spy.mockRestore();
  });

  it("falls back to random UUID in the log when Sentry omits lastEventId", () => {
    mockGetClient.mockReturnValue({});
    mockLastEventId.mockReturnValue(undefined);
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const id = reportClientError("flow", new Error("x"));

    expect(mockCaptureException).toHaveBeenCalled();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    spy.mockRestore();
  });
});
