import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransformationSlider } from "./TransformationSlider";

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

describe("TransformationSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no photos are provided", () => {
    render(
      <TransformationSlider
        projectId="p1"
        beforePath={null}
        afterPath={null}
      />,
    );

    expect(screen.getByText("Visual Transformation")).toBeInTheDocument();
    expect(screen.getByText(/Upload a starting photo/i)).toBeInTheDocument();
  });

  it("renders the interactive slider when paths are provided and unlocked", async () => {
    render(
      <TransformationSlider
        projectId="p1"
        beforePath="before.jpg"
        afterPath="after.jpg"
        isArchitect={true}
      />,
    );

    await waitFor(() => {
      const beforeImg = screen.getByAltText("Before");
      const currentImg = screen.getByAltText("Current state");

      expect(beforeImg).toHaveAttribute(
        "src",
        "https://cdn.example.com/before.jpg?token=signed",
      );
      expect(currentImg).toHaveAttribute(
        "src",
        "https://cdn.example.com/after.jpg?token=signed",
      );
    });

    expect(screen.getByText("Swipe to compare")).toBeInTheDocument();
  });

  it("shows the locked state for free users", async () => {
    const onUpgrade = vi.fn();
    render(
      <TransformationSlider
        projectId="p1"
        beforePath="before.jpg"
        afterPath="after.jpg"
        isArchitect={false}
        hasProjectPass={false}
        onUpgradeClick={onUpgrade}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Upgrade to compare")).toBeInTheDocument();
    });

    expect(screen.getByText("Visual Timeline Locked")).toBeInTheDocument();

    const upgradeBtn = screen.getByText("Upgrade to compare");
    fireEvent.click(upgradeBtn);
    expect(onUpgrade).toHaveBeenCalled();
  });

  it("handles missing after photo by defaulting to before photo as current", async () => {
    render(
      <TransformationSlider
        projectId="p1"
        beforePath="before.jpg"
        afterPath={null}
        isArchitect={true}
      />,
    );

    await waitFor(() => {
      const currentImg = screen.getByAltText("Current state");
      expect(currentImg).toHaveAttribute(
        "src",
        "https://cdn.example.com/before.jpg?token=signed",
      );
    });
  });
});
