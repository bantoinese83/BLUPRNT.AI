import { describe, it, expect } from "vitest";
import {
  uploadFileMimeLooksAllowed,
  isValidPassword,
  isValidZip,
} from "./validation.ts";

describe("validation logic", () => {
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

  describe("isValidZip", () => {
    it("validates 5-digit US zips", () => {
      expect(isValidZip("12345")).toBe(true);
      expect(isValidZip("1234")).toBe(false);
      expect(isValidZip("123456")).toBe(false);
      expect(isValidZip("abcde")).toBe(false);
    });
  });
});
