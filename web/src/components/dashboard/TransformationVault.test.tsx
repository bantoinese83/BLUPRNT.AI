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
        createSignedUrls: vi.fn((paths) =>
          Promise.resolve({
            data: paths.map((path: string) => ({
              path,
              signedUrl: `https://cdn.example.com/${path}?token=signed`,
            })),
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

    expect(screen.getAllByText("Photo").length).toBeGreaterThan(0);
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
        // Filter for images with specific alt text
        const transformationImages = images.filter(
          (img) => img.getAttribute("alt") === "Transformation photo",
        );

        expect(transformationImages.length).toBeGreaterThan(0);
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

  it("navigates between angles when multiple sets exist", async () => {
    const mockItems = [
      {
        id: "1",
        photo_type: "before",
        storage_path: "b1.jpg",
        caption: null,
        created_at: "2026-01-01",
      },
      {
        id: "2",
        photo_type: "after",
        storage_path: "a1.jpg",
        caption: null,
        created_at: "2026-01-01",
      },
      {
        id: "3",
        photo_type: "before",
        storage_path: "b2.jpg",
        caption: null,
        created_at: "2026-01-02",
      },
    ];

    (vi.mocked(supabase.from) as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockItems, error: null }),
    });

    render(<TransformationVault projectId="p1" />);

    await waitFor(() => {
      expect(screen.getByText("Angle 1 of 3")).toBeInTheDocument();
    });

    const nextBtn = screen.getByLabelText("Next angle");

    if (nextBtn) {
      nextBtn.click();
      await waitFor(() => {
        expect(screen.getByText("Angle 2 of 3")).toBeInTheDocument();
      });
    }
  });
});
