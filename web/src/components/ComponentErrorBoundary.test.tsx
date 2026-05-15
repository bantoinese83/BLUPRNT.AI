import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComponentErrorBoundary } from "./ComponentErrorBoundary";
import { reportClientError } from "@/lib/sentry";

vi.mock("@/lib/sentry", () => ({
  reportClientError: vi.fn(),
}));

function Thrower(): never {
  throw new Error("component-boundary-boom");
}

describe("ComponentErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("reports to Sentry when a child throws", () => {
    render(
      <ComponentErrorBoundary name="Billing">
        <Thrower />
      </ComponentErrorBoundary>,
    );

    expect(reportClientError).toHaveBeenCalledWith(
      "component-error-boundary:Billing",
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) }),
    );
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
  });
});
