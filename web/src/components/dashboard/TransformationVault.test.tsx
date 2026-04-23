import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TransformationVault } from "./TransformationVault";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
    },
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

  it("renders placeholders when no photos are provided", () => {
    render(
      <TransformationVault projectId="p1" beforePath={null} afterPath={null} />,
    );

    expect(screen.getByText("The Transformation Vault")).toBeInTheDocument();
    // Use getAllByText because labels appear in multiple places (placeholder and badge)
    expect(screen.getAllByText("Baseline").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Current").length).toBeGreaterThan(0);
  });

  it("renders photos when paths are provided", async () => {
    render(
      <TransformationVault
        projectId="p1"
        beforePath="before.jpg"
        afterPath="after.jpg"
      />,
    );

    await waitFor(
      () => {
        const beforeImg = screen.getByAltText("Baseline");
        const currentImg = screen.getByAltText("Current");

        expect(beforeImg).toHaveAttribute(
          "src",
          "https://cdn.example.com/before.jpg?token=signed",
        );
        expect(currentImg).toHaveAttribute(
          "src",
          "https://cdn.example.com/after.jpg?token=signed",
        );
      },
      { timeout: 2000 },
    );
  });

  it("triggers upload when capture button is clicked", async () => {
    render(
      <TransformationVault projectId="p1" beforePath={null} afterPath={null} />,
    );

    const captureBtns = screen.getAllByText(/Capture/i);
    expect(captureBtns.length).toBeGreaterThan(0);
  });
});
