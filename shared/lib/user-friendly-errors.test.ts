import { describe, it, expect } from "vitest";
import {
  friendlyAuthError,
  friendlyAuthErrorFromUrlParam,
  friendlyDocumentUploadError,
  friendlyPostgrestMutationError,
  friendlyProjectShareError,
  getUserFriendlyErrorMessage,
} from "./user-friendly-errors.ts";

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

    it("handles rate limits", () => {
      expect(friendlyAuthError("over_request_rate")).toContain(
        "Too many attempts",
      );
    });

    it("handles already registered", () => {
      expect(friendlyAuthError("user_already_exists")).toContain(
        "already has an account",
      );
    });

    it("handles bad requests", () => {
      expect(friendlyAuthError("bad request", 400)).toContain(
        "Check what you entered",
      );
    });
  });

  describe("friendlyAuthErrorFromUrlParam", () => {
    it("returns null for empty", () => {
      expect(friendlyAuthErrorFromUrlParam(null)).toBeNull();
      expect(friendlyAuthErrorFromUrlParam("")).toBeNull();
      expect(friendlyAuthErrorFromUrlParam("   ")).toBeNull();
    });

    it("decodes percent-encoding and maps auth copy", () => {
      const encoded = encodeURIComponent("Invalid login credentials");
      expect(friendlyAuthErrorFromUrlParam(encoded)).toContain(
        "That email or password",
      );
    });

    it("accepts first value when array (Expo Router)", () => {
      expect(
        friendlyAuthErrorFromUrlParam([
          encodeURIComponent("over_request_rate"),
          "ignored",
        ]),
      ).toContain("Too many attempts");
    });
  });

  describe("friendlyDocumentUploadError", () => {
    it("maps file size errors", () => {
      const raw = "File must be under 10MB";
      expect(friendlyDocumentUploadError({ message: raw })).toContain("10 MB");
    });

    it("maps unsupported file types", () => {
      expect(
        friendlyDocumentUploadError(null, { error: "unsupported file type" }),
      ).toContain("file type isn’t supported");
    });

    it("maps rate limits", () => {
      expect(
        friendlyDocumentUploadError(null, { error: "too many requests" }),
      ).toContain("sending files quickly");
    });

    it("maps project not found", () => {
      expect(
        friendlyDocumentUploadError(null, { error: "project not found" }),
      ).toContain("find that project");
    });

    it("maps storage quota", () => {
      expect(
        friendlyDocumentUploadError(null, { error: "quota exceeded" }),
      ).toContain("couldn’t save that file");
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

    it("handles null or non-object errors", () => {
      expect(friendlyPostgrestMutationError(null)).toContain(
        "Something went wrong",
      );
      expect(friendlyPostgrestMutationError("string error")).toContain(
        "Something went wrong",
      );
    });

    it("handles generic errors", () => {
      expect(friendlyPostgrestMutationError({ message: "unknown" })).toContain(
        "Try again in a moment",
      );
    });
  });

  describe("friendlyProjectShareError", () => {
    it("handles network errors", () => {
      expect(friendlyProjectShareError("Failed to fetch")).toContain(
        "Check your internet connection",
      );
    });

    it("handles permission/RLS errors", () => {
      expect(friendlyProjectShareError("row-level security")).toContain(
        "Sign in again if needed",
      );
      expect(friendlyProjectShareError(undefined, "42501")).toContain(
        "Sign in again if needed",
      );
    });

    it("handles generic share errors", () => {
      expect(friendlyProjectShareError("unknown")).toContain(
        "Try again in a moment",
      );
    });
  });

  describe("getUserFriendlyErrorMessage", () => {
    it("returns strings directly", () => {
      expect(getUserFriendlyErrorMessage("Direct message")).toBe(
        "Direct message",
      );
    });

    it("extracts message from error objects", () => {
      expect(getUserFriendlyErrorMessage({ message: "Object message" })).toBe(
        "Object message",
      );
    });

    it("handles fallback cases", () => {
      expect(getUserFriendlyErrorMessage(null)).toBe(
        "An unexpected error occurred.",
      );
      expect(getUserFriendlyErrorMessage({})).toBe(
        "An unexpected error occurred.",
      );
    });
  });

  describe("Edge cases in other functions", () => {
    it("friendlyAuthError: handles empty or blank message", () => {
      expect(friendlyAuthError("")).toBe(
        "Something went wrong. Please try again.",
      );
      expect(friendlyAuthError("   ")).toBe(
        "Something went wrong. Please try again.",
      );
    });

    it("friendlyAuthError: handles signup disabled", () => {
      expect(friendlyAuthError("signup_disabled")).toContain(
        "New sign-ups aren’t available",
      );
    });

    it("friendlyAuthError: handles invalid otp", () => {
      expect(friendlyAuthError("invalid otp")).toContain("Request a new one");
    });

    it("friendlyDocumentUploadError: handles complex error objects", () => {
      expect(friendlyDocumentUploadError({ message: "too large" })).toContain(
        "too large",
      );
      expect(friendlyDocumentUploadError({ message: undefined })).toContain(
        "That didn’t go through",
      );
    });

    it("friendlyDocumentUploadError: handles version mismatch", () => {
      expect(
        friendlyDocumentUploadError({ message: "api version mismatch" }),
      ).toContain("update your app");
    });

    it("friendlyDocumentUploadError: handles gemini ocr delay", () => {
      expect(
        friendlyDocumentUploadError({ message: "gemini ocr failed" }),
      ).toContain("taking longer than usual");
    });
  });
});
