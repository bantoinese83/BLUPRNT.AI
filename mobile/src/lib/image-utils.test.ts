import { describe, it, expect, vi, beforeEach } from "vitest";
import * as ImageManipulator from "expo-image-manipulator";
import { compressImageForAnalysis } from "./image-utils";

vi.mock("expo-image-manipulator", () => ({
  manipulateAsync: vi.fn(),
  SaveFormat: { JPEG: "jpeg" },
}));

describe("compressImageForAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns compressed uri on success", async () => {
    vi.mocked(ImageManipulator.manipulateAsync).mockResolvedValue({
      uri: "file:///compressed.jpg",
    } as never);

    const out = await compressImageForAnalysis("file:///orig.jpg");
    expect(out).toBe("file:///compressed.jpg");
  });

  it("returns original uri on failure", async () => {
    vi.mocked(ImageManipulator.manipulateAsync).mockRejectedValue(
      new Error("boom"),
    );
    const out = await compressImageForAnalysis("file:///orig.jpg");
    expect(out).toBe("file:///orig.jpg");
  });
});
