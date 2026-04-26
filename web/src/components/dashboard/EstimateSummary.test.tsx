/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { EstimateSummary } from "./EstimateSummary";

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("EstimateSummary", () => {
  const mockProject = {
    id: "p1",
    name: "Living Room Refresh",
    estimated_min_total: 5000,
    estimated_max_total: 7500,
    confidence_score: 4.5,
    metadata: {
      regional_signal: "High Activity",
    },
  } as any;

  const mockScopeItems = [
    {
      id: "item-1",
      category: "Flooring",
      description: "LVP Installation",
      total_cost_min: 2000,
      total_cost_max: 2500,
      finish_tier: "mid",
      metadata: {
        materials: [
          {
            name: "LVP Planks",
            brand: "Shaw",
            quantity: 500,
            unit: "sqft",
            estimated_cost: 4,
          },
        ],
      },
    },
  ] as any;

  const defaultProps = {
    project: mockProject,
    scopeItems: mockScopeItems,
    reconciliation: null,
    isArchitect: true,
  };

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  it("renders the summary total correctly", () => {
    renderWithRouter(<EstimateSummary {...defaultProps} />);
    expect(screen.getByText(/\$5,000\s*–\s*\$7,500/)).toBeInTheDocument();
  });

  it("renders scope items with breakdown buttons", () => {
    renderWithRouter(<EstimateSummary {...defaultProps} />);
    expect(screen.getByText("Flooring")).toBeInTheDocument();
    expect(screen.getByText("View Breakdown")).toBeInTheDocument();
  });

  it("expands the BOM table in the summary view", () => {
    renderWithRouter(<EstimateSummary {...defaultProps} />);

    const viewBreakdownBtn = screen.getByText("View Breakdown");
    fireEvent.click(viewBreakdownBtn);

    expect(screen.getByText("Bill of Materials")).toBeInTheDocument();
    expect(screen.getByText("LVP Planks")).toBeInTheDocument();
    expect(screen.getByText("Shaw")).toBeInTheDocument();
    expect(screen.getByText(/500\s+sqft/)).toBeInTheDocument();
    expect(screen.getByText(/\$4(\.00)?/)).toBeInTheDocument();
    expect(screen.getAllByText(/\$2,000(\.00)?/).length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("shows the empty state when no scope items are provided", () => {
    renderWithRouter(<EstimateSummary {...defaultProps} scopeItems={[]} />);
    expect(screen.getByText("No line items yet")).toBeInTheDocument();
    expect(screen.getByText("Open project scope")).toBeInTheDocument();
  });

  it("navigates to scope page when empty state button is clicked", () => {
    renderWithRouter(<EstimateSummary {...defaultProps} scopeItems={[]} />);
    const openScopeBtn = screen.getByText("Open project scope");
    fireEvent.click(openScopeBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/scope");
  });
});
