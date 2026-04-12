import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Linking from "expo-linking";
import {
  extractPkceCodeFromUrl,
  getPasswordRecoveryRedirectUrl,
} from "@/lib/auth-linking";

vi.mock("expo-linking", () => ({
  createURL: vi.fn((path: string) => `ai.bluprnt.mobile:///--${path}`),
  parse: vi.fn(),
}));

describe("getPasswordRecoveryRedirectUrl", () => {
  it("delegates to Linking.createURL with reset-password path", () => {
    vi.mocked(Linking.createURL).mockReturnValueOnce(
      "ai.bluprnt.mobile:///--/reset-password",
    );
    expect(getPasswordRecoveryRedirectUrl()).toBe(
      "ai.bluprnt.mobile:///--/reset-password",
    );
    expect(Linking.createURL).toHaveBeenCalledWith("/reset-password");
  });
});

describe("extractPkceCodeFromUrl", () => {
  beforeEach(() => {
    vi.mocked(Linking.parse).mockReset();
  });

  it("returns string code from query params", () => {
    vi.mocked(Linking.parse).mockReturnValue({
      path: "reset-password",
      queryParams: { code: "pkce-secret" },
    });
    expect(
      extractPkceCodeFromUrl(
        "ai.bluprnt.mobile:///--/reset-password?code=pkce-secret",
      ),
    ).toBe("pkce-secret");
  });

  it("returns first code when query param is string[]", () => {
    vi.mocked(Linking.parse).mockReturnValue({
      path: "",
      queryParams: { code: ["first", "second"] },
    });
    expect(extractPkceCodeFromUrl("x-scheme://x")).toBe("first");
  });

  it("reads code from URL hash when query has no code", () => {
    vi.mocked(Linking.parse).mockReturnValue({ path: "", queryParams: {} });
    expect(extractPkceCodeFromUrl("myapp://host#code=hash-code&state=1")).toBe(
      "hash-code",
    );
  });

  it("returns null when no code in query or hash", () => {
    vi.mocked(Linking.parse).mockReturnValue({ path: "", queryParams: {} });
    expect(extractPkceCodeFromUrl("myapp://path")).toBeNull();
  });

  it("returns null for empty hash fragment", () => {
    vi.mocked(Linking.parse).mockReturnValue({ path: "", queryParams: {} });
    expect(extractPkceCodeFromUrl("myapp://path#")).toBeNull();
  });
});
