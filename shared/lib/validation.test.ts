import { describe, it, expect } from "vitest";
import {
  uploadFileMimeLooksAllowed,
  isValidPassword,
  isValidZip,
  photoToScopeSchema,
  documentTypeSchema,
  uploadLedgerEntrySchema,
  marketingLeadSchema,
  chatWithProjectSchema,
  validatePassword,
  isValidEmail,
  uuidSchema,
} from "./validation.ts";

describe("validation logic", () => {
  describe("uuidSchema", () => {
    it("validates correct UUIDs", () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";
      expect(uuidSchema.safeParse(id).success).toBe(true);
    });

    it("rejects invalid UUIDs", () => {
      expect(uuidSchema.safeParse("not-a-uuid").success).toBe(false);
    });
  });

  describe("photoToScopeSchema", () => {
    it("transforms zip_code correctly", () => {
      const result = photoToScopeSchema.safeParse({
        zip_code: "12345-6789",
        room_type: "kitchen",
        finish_preference: "premium",
      });
      if (!result.success) throw new Error("Parse failed");
      expect(result.data.zip_code).toBe("12345");

      const shortZip = photoToScopeSchema.safeParse({
        zip_code: "123",
        room_type: "kitchen",
        finish_preference: "premium",
      });
      if (!shortZip.success) throw new Error("Parse failed");
      expect(shortZip.data.zip_code).toBe("00000");
    });

    it("transforms room_type correctly", () => {
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "KITCHEN",
          finish_preference: "mid",
        }).room_type,
      ).toBe("kitchen");
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "BATH",
          finish_preference: "mid",
        }).room_type,
      ).toBe("bathroom");
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "Living Room",
          finish_preference: "mid",
        }).room_type,
      ).toBe("other");
    });

    it("transforms finish_preference correctly", () => {
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "ECONOMY",
        }).finish_preference,
      ).toBe("economy");
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "PREMIUM",
        }).finish_preference,
      ).toBe("premium");
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "garbage",
        }).finish_preference,
      ).toBe("mid");
    });

    it("transforms project_id correctly", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "mid",
          project_id: validUuid,
        }).project_id,
      ).toBe(validUuid);
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "mid",
          project_id: "",
        }).project_id,
      ).toBe(null);
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "mid",
          project_id: "invalid",
        }).project_id,
      ).toBe(null);
    });

    it("transforms location_unset correctly", () => {
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "mid",
          location_unset: "1",
        }).location_unset,
      ).toBe(true);
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "mid",
          location_unset: "true",
        }).location_unset,
      ).toBe(true);
      expect(
        photoToScopeSchema.parse({
          zip_code: "12345",
          room_type: "kitchen",
          finish_preference: "mid",
          location_unset: "0",
        }).location_unset,
      ).toBe(false);
    });
  });

  describe("documentTypeSchema", () => {
    it("normalizes and validates document types", () => {
      expect(documentTypeSchema.parse("RECEIPT ")).toBe("receipt");
      expect(documentTypeSchema.parse("INVOICE")).toBe("invoice");
      expect(documentTypeSchema.parse("unknown")).toBe("auto");
      expect(documentTypeSchema.parse(null)).toBe("auto");
    });
  });

  describe("uploadFileMimeLooksAllowed", () => {
    it("allows standard PDF and images", () => {
      expect(uploadFileMimeLooksAllowed("application/pdf")).toBe(true);
      expect(uploadFileMimeLooksAllowed("image/jpeg")).toBe(true);
      expect(uploadFileMimeLooksAllowed("image/png")).toBe(true);
      expect(uploadFileMimeLooksAllowed("image/webp")).toBe(true);
    });

    it("allows HEIC/HEIF for mobile support", () => {
      expect(uploadFileMimeLooksAllowed("image/heic")).toBe(true);
      expect(uploadFileMimeLooksAllowed("image/heif")).toBe(true);
    });

    it("infers from extension when MIME type is empty (React Native case)", () => {
      expect(uploadFileMimeLooksAllowed("", "invoice.pdf")).toBe(true);
      expect(uploadFileMimeLooksAllowed(undefined, "photo.jpg")).toBe(true);
      expect(
        uploadFileMimeLooksAllowed("application/octet-stream", "receipt.png"),
      ).toBe(true);
    });

    it("rejects unsupported types and extensions", () => {
      expect(uploadFileMimeLooksAllowed("text/plain")).toBe(false);
      expect(uploadFileMimeLooksAllowed("", "script.js")).toBe(false);
      expect(uploadFileMimeLooksAllowed(undefined, "archive.zip")).toBe(false);
    });

    it("is case-insensitive", () => {
      expect(uploadFileMimeLooksAllowed("IMAGE/JPEG")).toBe(true);
      expect(uploadFileMimeLooksAllowed("", "DOCUMENT.PDF")).toBe(true);
    });
  });

  describe("uploadLedgerEntrySchema", () => {
    const validUuid = "550e8400-e29b-41d4-a716-446655440000";

    it("transforms amount_hint correctly", () => {
      expect(
        uploadLedgerEntrySchema.parse({
          project_id: validUuid,
          document_type: "receipt",
          amount_hint: "100.50",
        }).amount_hint,
      ).toBe(100.5);
      expect(
        uploadLedgerEntrySchema.parse({
          project_id: validUuid,
          document_type: "receipt",
          amount_hint: 200,
        }).amount_hint,
      ).toBe(200);
      expect(
        uploadLedgerEntrySchema.parse({
          project_id: validUuid,
          document_type: "receipt",
          amount_hint: "",
        }).amount_hint,
      ).toBe(null);
      expect(
        uploadLedgerEntrySchema.parse({
          project_id: validUuid,
          document_type: "receipt",
          amount_hint: "invalid",
        }).amount_hint,
      ).toBe(null);
    });
  });

  describe("marketingLeadSchema", () => {
    it("validates marketing leads", () => {
      expect(
        marketingLeadSchema.safeParse({
          email: "test@example.com",
          source: "landing",
        }).success,
      ).toBe(true);
      expect(
        marketingLeadSchema.safeParse({ email: "invalid", source: "landing" })
          .success,
      ).toBe(false);
      expect(
        marketingLeadSchema.safeParse({ email: "test@example.com", source: "" })
          .success,
      ).toBe(false);
    });
  });

  describe("chatWithProjectSchema", () => {
    it("validates chat queries", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(
        chatWithProjectSchema.safeParse({
          projectId: validUuid,
          query: "hello",
        }).success,
      ).toBe(true);
      expect(
        chatWithProjectSchema.safeParse({
          projectId: validUuid,
          query: "hello",
          history: [
            { role: "assistant", content: "Hi" },
            { role: "user", content: "Budget?" },
          ],
        }).success,
      ).toBe(true);
      expect(
        chatWithProjectSchema.safeParse({ projectId: validUuid, query: "   " })
          .success,
      ).toBe(false);
    });

    it("rejects oversized history arrays", () => {
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      const history = Array.from({ length: 25 }, (_, i) => ({
        role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
        content: "x",
      }));
      expect(
        chatWithProjectSchema.safeParse({
          projectId: validUuid,
          query: "hello",
          history,
        }).success,
      ).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("returns error message for short passwords", () => {
      expect(validatePassword("short")).toBe(
        "Use at least 8 characters for your password.",
      );
      expect(validatePassword("")).toBe(
        "Use at least 8 characters for your password.",
      );
      expect(validatePassword(null)).toBe(
        "Use at least 8 characters for your password.",
      );
    });

    it("returns null for valid passwords", () => {
      expect(validatePassword("longenough")).toBe(null);
    });
  });

  describe("isValidPassword", () => {
    it("enforces minimum length (8)", () => {
      expect(isValidPassword("1234567")).toBe(false);
      expect(isValidPassword("12345678")).toBe(true);
      expect(isValidPassword("a-long-password")).toBe(true);
    });

    it("handles null/undefined", () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
    });
  });

  describe("isValidEmail", () => {
    it("validates emails correctly", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("test@example")).toBe(false);
      expect(isValidEmail("test")).toBe(false);
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe("isValidZip", () => {
    it("validates 5-digit US zips", () => {
      expect(isValidZip("12345")).toBe(true);
      expect(isValidZip("1234")).toBe(false);
      expect(isValidZip("123456")).toBe(false);
      expect(isValidZip("abcde")).toBe(false);
      expect(isValidZip(null)).toBe(false);
    });
  });
});
