import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BillOfMaterialsTable } from "./BillOfMaterialsTable";

describe("BillOfMaterialsTable", () => {
  const mockMaterials = [
    {
      name: "Luxury Vinyl Plank",
      brand: "Lifeproof",
      model: "Choice Oak",
      quantity: 500,
      unit: "sqft",
      estimated_cost: 4.5,
    },
    {
      name: "Semi-Gloss Paint",
      brand: "Sherwin Williams",
      quantity: 5,
      unit: "gallons",
      estimated_cost: 65,
    },
    {
      name: "Baseboards",
      model: "5-1/4 in. MDF",
      quantity: 200,
      unit: "lin ft",
      estimated_cost: 1.25,
    },
    {
      name: "Generic Screws",
      quantity: 1,
      unit: "box",
    },
  ];

  it("renders the table with correct headers", () => {
    render(<BillOfMaterialsTable materials={mockMaterials} />);
    expect(screen.getByText("Material Item")).toBeInTheDocument();
    expect(screen.getByText("Brand / Model")).toBeInTheDocument();
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByText("Unit Price")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("renders all material items", () => {
    render(<BillOfMaterialsTable materials={mockMaterials} />);
    expect(screen.getByText("Luxury Vinyl Plank")).toBeInTheDocument();
    expect(screen.getByText("Semi-Gloss Paint")).toBeInTheDocument();
    expect(screen.getByText("Baseboards")).toBeInTheDocument();
    expect(screen.getByText("Generic Screws")).toBeInTheDocument();
  });

  it("displays brand and model correctly", () => {
    render(<BillOfMaterialsTable materials={mockMaterials} />);

    // Item 1: Brand and Model
    expect(screen.getByText("Lifeproof")).toBeInTheDocument();
    expect(screen.getByText("Choice Oak")).toBeInTheDocument();

    // Item 2: Brand only
    expect(screen.getByText("Sherwin Williams")).toBeInTheDocument();

    // Item 3: Model only
    expect(screen.getByText("5-1/4 in. MDF")).toBeInTheDocument();

    // Item 4: Neither (should show 'Standard')
    expect(screen.getAllByText("Standard").length).toBeGreaterThan(0);
  });

  it("formats currency correctly", () => {
    render(<BillOfMaterialsTable materials={mockMaterials} />);

    // Unit price for Lifeproof: $4.50
    expect(screen.getByText("$4.50")).toBeInTheDocument();

    // Total for Lifeproof: 500 * 4.5 = $2,250.00
    expect(screen.getByText("$2,250.00")).toBeInTheDocument();
  });

  it("handles missing cost gracefully", () => {
    render(<BillOfMaterialsTable materials={mockMaterials} />);

    // Generic Screws has no cost
    const items = screen.getAllByRole("row");
    const screwsRow = items.find((row) =>
      row.textContent?.includes("Generic Screws"),
    );
    expect(screwsRow?.textContent).toContain("—");
  });

  it("shows the correct item count in the badge", () => {
    render(<BillOfMaterialsTable materials={mockMaterials} />);
    expect(screen.getByText("4 Items")).toBeInTheDocument();
  });
});
