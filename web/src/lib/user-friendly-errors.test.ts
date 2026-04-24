import { describe, expect, it } from "vitest";
import {
  friendlyAuthError,
  friendlyDocumentUploadError,
  friendlyProjectShareError,
  getUserFriendlyErrorMessage,
} from "@shared/lib/user-friendly-errors";

describe("friendlyAuthError", () => {
  it("maps invalid credentials", () => {
    expect(friendlyAuthError("Invalid login credentials")).toContain(
      "doesn’t match",
    );
  });

  it("maps rate limits", () => {
    expect(friendlyAuthError("over_email_send_rate_limit")).toContain(
      "Too many attempts",
    );
  });

  it("hides long technical messages", () => {
    expect(
      friendlyAuthError("JWT expired: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."),
    ).toBe("Something went wrong. Please try again.");
  });
});

describe("friendlyDocumentUploadError", () => {
  it("passes through plan limit copy", () => {
    expect(
      friendlyDocumentUploadError(null, {
        error: "Free plan limit reached for invoices",
      }),
    ).toBe("Free plan limit reached for invoices");
  });

  it("maps file size validation", () => {
    expect(
      friendlyDocumentUploadError(null, {
        error: "File must be under 10MB",
      }),
    ).toContain("too large");
  });

  it("maps generic invoke errors", () => {
    expect(
      friendlyDocumentUploadError({ message: "Server Error" } as Error),
    ).toContain("That didn’t go through");
  });
});

describe("friendlyProjectShareError", () => {
  it("maps permission errors", () => {
    expect(
      friendlyProjectShareError("new row violates row-level security"),
    ).toContain("share link");
  });
});

describe("getUserFriendlyErrorMessage", () => {
  it("returns string errors directly", () => {
    const msg = "Something went wrong";
    expect(getUserFriendlyErrorMessage(msg)).toBe(msg);
  });

  it("extracts message from error objects", () => {
    const error = { message: "Internal server error" };
    expect(getUserFriendlyErrorMessage(error)).toBe(error.message);
  });

  it("returns default message for unknown errors", () => {
    expect(getUserFriendlyErrorMessage(null)).toBe(
      "An unexpected error occurred.",
    );
    expect(getUserFriendlyErrorMessage({})).toBe(
      "An unexpected error occurred.",
    );
  });
});
