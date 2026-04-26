import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPassword,
  MIN_PASSWORD_LENGTH,
} from "./validation";

describe("mobile validation (proxied from shared)", () => {
  it("exports the correct constants", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it("validates email", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
  });

  it("validates password length", () => {
    expect(isValidPassword("12345678")).toBe(true);
    expect(isValidPassword("short")).toBe(false);
  });
});
