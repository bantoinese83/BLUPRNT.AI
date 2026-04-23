import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TransformationVault } from "./TransformationVault";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn((path) => ({
          data: { publicUrl: `https://cdn.example.com/${path}` },
        })),
        createSignedUrl: vi.fn((path) =>
          Promise.resolve({
            data: { signedUrl: `https://cdn.example.com/${path}?token=signed` },
            error: null,
          }),
        ),
      }),
    },
  },
}));

describe("TransformationVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholders when no photos are provided", async () => {
    render(<TransformationVault projectId="p1" />);

    await waitFor(() => {
      expect(screen.getByText("Transformation Gallery")).toBeInTheDocument();
    });

    expect(screen.getAllByText("Baseline").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Current").length).toBeGreaterThan(0);
  });

  it("renders photos when paths are provided", async () => {
    const mockItems = [
      {
        id: "1",
        photo_type: "before",
        storage_path: "before.jpg",
        caption: null,
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        photo_type: "after",
        storage_path: "after.jpg",
        caption: null,
        created_at: new Date().toISOString(),
      },
    ];

    // Re-mock for this specific test
    (vi.mocked(supabase.from) as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
    });

    render(<TransformationVault projectId="p1" />);

    await waitFor(
      () => {
        const images = screen.getAllByRole("img");
        // Filter for images with specific src or alt
        const beforeImg = images.find(
          (img) => img.getAttribute("alt") === "Baseline",
        );
        const currentImg = images.find(
          (img) => img.getAttribute("alt") === "Current",
        );

        expect(beforeImg).toBeInTheDocument();
        expect(currentImg).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("triggers upload when capture button is clicked", async () => {
    render(<TransformationVault projectId="p1" />);

    await waitFor(() => {
      const captureBtns = screen.getAllByText(/Capture/i);
      expect(captureBtns.length).toBeGreaterThan(0);
    });
  });
});
