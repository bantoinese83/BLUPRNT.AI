import { describe, it, expect } from "vitest";
import {
  friendlyAuthError,
  friendlyDocumentUploadError,
  friendlyPostgrestMutationError,
} from "./user-friendly-errors";

describe("user-friendly-errors shared logic", () => {
  describe("friendlyAuthError", () => {
    it("maps invalid credentials", () => {
      const raw = "Invalid login credentials";
      expect(friendlyAuthError(raw)).toContain("That email or password");
    });

    it("maps email not confirmed", () => {
      const raw = "Email not confirmed";
      expect(friendlyAuthError(raw)).toContain("Confirm your email");
    });

    it("maps network errors", () => {
      const raw = "TypeError: Failed to fetch";
      expect(friendlyAuthError(raw)).toContain(
        "Check your internet connection",
      );
    });

    it("obfuscates internal errors (JWT/SQL)", () => {
      const raw = "JWT expired or SQLState 42501";
      expect(friendlyAuthError(raw)).toBe(
        "Something went wrong. Please try again.",
      );
    });

    it("returns raw message if not matched and short", () => {
      const raw = "Custom Error Message";
      expect(friendlyAuthError(raw)).toBe(raw);
    });
  });

  describe("friendlyDocumentUploadError", () => {
    it("maps file size errors", () => {
      const raw = "File must be under 10MB";
      expect(friendlyDocumentUploadError({ message: raw })).toContain("10 MB");
    });

    it("passes through specific upgrade messages", () => {
      const raw = "Upload limit reached. Upgrade to Architect.";
      expect(friendlyDocumentUploadError(null, { error: raw })).toBe(raw);
    });

    it("maps unauthorized access", () => {
      const raw = "401 Unauthorized";
      expect(friendlyDocumentUploadError({ message: raw })).toContain(
        "Sign in again",
      );
    });

    it("provides fallback for empty error", () => {
      expect(friendlyDocumentUploadError()).toContain("That didn’t go through");
    });
  });

  describe("friendlyPostgrestMutationError", () => {
    it("maps RLS/Auth errors", () => {
      const err = { code: "PGRST301", message: "JWT expired" };
      expect(friendlyPostgrestMutationError(err)).toContain(
        "session may have expired",
      );
    });

    it("maps network errors", () => {
      const err = { message: "Failed to fetch" };
      expect(friendlyPostgrestMutationError(err)).toContain(
        "Check your internet connection",
      );
    });
  });
});
