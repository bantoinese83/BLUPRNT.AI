import { describe, it, expect } from "vitest";
import {
  photoToScopeSchema,
  uploadFileMimeLooksAllowed,
  isValidEmail,
  isValidZip,
  validatePassword,
  marketingLeadSchema,
} from "./validation.ts";

describe("validation library", () => {
  describe("photoToScopeSchema", () => {
    it("transforms zip_code to 5 digits", () => {
      const result = photoToScopeSchema.safeParse({
        zip_code: "90210-1234",
        room_type: "Kitchen",
        finish_preference: "Premium",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.zip_code).toBe("90210");
      }
    });

    it("defaults invalid zip_code to 00000", () => {
      const result = photoToScopeSchema.safeParse({
        zip_code: "abc",
        room_type: "Kitchen",
        finish_preference: "Mid",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.zip_code).toBe("00000");
      }
    });

    it("normalizes room_type", () => {
      const k = photoToScopeSchema.parse({
        zip_code: "12345",
        room_type: "KITCHEN",
        finish_preference: "Mid",
      });
      expect(k.room_type).toBe("kitchen");

      const b = photoToScopeSchema.parse({
        zip_code: "12345",
        room_type: "BATH",
        finish_preference: "Mid",
      });
      expect(b.room_type).toBe("bathroom");

      const o = photoToScopeSchema.parse({
        zip_code: "12345",
        room_type: "Garage",
        finish_preference: "Mid",
      });
      expect(o.room_type).toBe("other");
    });
  });

  describe("uploadFileMimeLooksAllowed", () => {
    it("allows standard image and pdf types", () => {
      expect(uploadFileMimeLooksAllowed("image/jpeg")).toBe(true);
      expect(uploadFileMimeLooksAllowed("application/pdf")).toBe(true);
      expect(uploadFileMimeLooksAllowed("image/heic")).toBe(true);
    });

    it("infers from filename when type is empty", () => {
      expect(uploadFileMimeLooksAllowed("", "test.jpg")).toBe(true);
      expect(
        uploadFileMimeLooksAllowed("application/octet-stream", "report.pdf"),
      ).toBe(true);
      expect(uploadFileMimeLooksAllowed(undefined, "image.PNG")).toBe(true);
    });

    it("rejects non-allowed types", () => {
      expect(uploadFileMimeLooksAllowed("text/plain")).toBe(false);
      expect(uploadFileMimeLooksAllowed("", "malicious.exe")).toBe(false);
    });
  });

  describe("helpers", () => {
    it("validates emails correctly", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("  test@example.com  ")).toBe(true);
      expect(isValidEmail("invalid-email")).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });

    it("validates zip codes correctly", () => {
      expect(isValidZip("90210")).toBe(true);
      expect(isValidZip("1234")).toBe(false);
      expect(isValidZip("90210-1234")).toBe(false);
    });

    it("validates passwords correctly", () => {
      expect(validatePassword("12345678")).toBeNull();
      expect(validatePassword("short")).toBe(
        "Use at least 8 characters for your password.",
      );
    });
  });

  describe("marketingLeadSchema", () => {
    it("normalizes email and source", () => {
      const result = marketingLeadSchema.parse({
        email: "  User@Example.COM  ",
        source: "  web_landing  ",
      });
      expect(result.email).toBe("user@example.com");
      expect(result.source).toBe("web_landing");
    });
  });
});
