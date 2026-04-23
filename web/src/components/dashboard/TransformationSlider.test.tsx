import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransformationSlider } from "./TransformationSlider";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn((path) => ({
          data: { publicUrl: `https://cdn.example.com/${path}` },
        })),
      }),
    },
  },
}));

describe("TransformationSlider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no before photo is provided", () => {
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

  it("renders the interactive slider when paths are provided and unlocked", () => {
    render(
      <TransformationSlider
        projectId="p1"
        beforePath="before.jpg"
        afterPath="after.jpg"
        isArchitect={true}
      />,
    );

    const beforeImg = screen.getByAltText("Before");
    const currentImg = screen.getByAltText("Current state");

    expect(beforeImg).toHaveAttribute(
      "src",
      "https://cdn.example.com/before.jpg",
    );
    expect(currentImg).toHaveAttribute(
      "src",
      "https://cdn.example.com/after.jpg",
    );
    expect(screen.getByText("Swipe to compare")).toBeInTheDocument();
  });

  it("shows the locked state and calls onUpgradeClick for free users", () => {
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

    expect(screen.getByText("Upgrade to compare")).toBeInTheDocument();
    expect(screen.getByText("Visual Timeline Locked")).toBeInTheDocument();

    // Clicking the container should trigger upgrade
    const container =
      screen.getByText("Upgrade to compare").parentElement?.parentElement;
    if (container) fireEvent.click(container);
    expect(onUpgrade).toHaveBeenCalled();
  });

  it("handles missing after photo by defaulting to before photo as current", () => {
    render(
      <TransformationSlider
        projectId="p1"
        beforePath="before.jpg"
        afterPath={null}
        isArchitect={true}
      />,
    );

    const currentImg = screen.getByAltText("Current state");
    expect(currentImg).toHaveAttribute(
      "src",
      "https://cdn.example.com/before.jpg",
    );
  });
});
