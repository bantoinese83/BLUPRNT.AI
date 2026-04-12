import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("@/lib/report-error", () => ({
  reportClientError: vi.fn(),
}));

function Thrower(): never {
  throw new Error("unit-test-boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom</div>}>
        <Thrower />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});
