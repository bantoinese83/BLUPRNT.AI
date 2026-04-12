import { describe, it, expect, vi, beforeEach } from "vitest";
import { alertMock } from "../test/react-native-mock";
import { uploadDocumentWithType } from "./upload-document";
import { invokeFunction } from "./supabase";

vi.mock("./supabase", () => ({
  invokeFunction: vi.fn(),
}));

describe("uploadDocumentWithType", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { invoice_id: "inv-1" },
      error: null,
    });
    alertMock.mockImplementation(
      (
        _title: string,
        _msg: string,
        buttons: { text: string; onPress?: () => void }[],
      ) => {
        const invoice = buttons.find((b) => b.text === "Invoice");
        invoice?.onPress?.();
      },
    );
  });

  it("uploads after user picks Invoice", async () => {
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(true);
    expect(result.invoice_id).toBe("inv-1");
    expect(invokeFunction).toHaveBeenCalled();
  });

  it("returns friendly error when invoke fails", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: null,
      error: new Error("network"),
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns error when server returns error field", async () => {
    vi.mocked(invokeFunction).mockResolvedValue({
      data: { error: "bad" },
      error: null,
    });
    const result = await uploadDocumentWithType(
      "file:///a.jpg",
      "image/jpeg",
      "p1",
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
