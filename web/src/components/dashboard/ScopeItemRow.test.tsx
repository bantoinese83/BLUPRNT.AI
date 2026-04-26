/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScopeItemRow } from "./ScopeItemRow";

describe("ScopeItemRow", () => {
  const mockItem = {
    id: "item-1",
    project_id: "p1",
    category: "Flooring",
    description: "Install luxury vinyl plank in living room",
    total_cost_min: 2000,
    total_cost_max: 2500,
    finish_tier: "premium",
    priority: "high",
    quantity: 500,
    unit: "sqft",
    confidence_score: 4.5,
    metadata: {
      materials: [
        {
          name: "Lifeproof LVP",
          brand: "Lifeproof",
          model: "Heritage Oak",
          quantity: 500,
          unit: "sqft",
          estimated_cost: 4.5,
        },
      ],
    },
  } as any;

  const defaultProps = {
    item: mockItem,
    isEditing: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onCancelEdit: vi.fn(),
    onSave: vi.fn(),
    editQty: "500",
    setEditQty: vi.fn(),
    editTier: "premium",
    setEditTier: vi.fn(),
    editMaterials: [],
    setEditMaterials: vi.fn(),
    saving: false,
  };

  it("renders basic item information", () => {
    render(<ScopeItemRow {...defaultProps} />);
    expect(screen.getByText("Flooring")).toBeInTheDocument();
    expect(screen.getByText(/Install luxury vinyl plank/i)).toBeInTheDocument();
    expect(screen.getByText("premium tier")).toBeInTheDocument();
    expect(screen.getByText("high")).toBeInTheDocument();
  });

  it("expands to show the Bill of Materials table when 'View Breakdown' is clicked", async () => {
    render(<ScopeItemRow {...defaultProps} />);

    const expandBtn = screen.getByText("View Breakdown");
    fireEvent.click(expandBtn);

    expect(screen.getByText("Bill of Materials")).toBeInTheDocument();
    expect(screen.getByText("Material Item")).toBeInTheDocument();
    expect(screen.getByText("Lifeproof LVP")).toBeInTheDocument();
    expect(screen.getByText("Heritage Oak")).toBeInTheDocument();
    expect(screen.getAllByText(/500\s+sqft/).length).toBeGreaterThanOrEqual(1);
  });

  it("switches to edit mode when Pencil icon is clicked", () => {
    const onEdit = vi.fn();
    render(<ScopeItemRow {...defaultProps} onEdit={onEdit} />);

    const editBtn = screen.getByLabelText("Edit");
    fireEvent.click(editBtn);

    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });

  it("renders editable material table when isEditing is true", () => {
    const editMaterials = [
      { name: "New Material", quantity: 10, unit: "pcs", estimated_cost: 100 },
    ];
    render(
      <ScopeItemRow
        {...defaultProps}
        isEditing={true}
        editMaterials={editMaterials}
      />,
    );

    expect(screen.getByDisplayValue("New Material")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    expect(screen.getByDisplayValue("pcs")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
  });

  it("calls setEditMaterials when updating a material in edit mode", () => {
    const setEditMaterials = vi.fn();
    const editMaterials = [{ name: "Old Name", quantity: 1, unit: "pc" }];
    render(
      <ScopeItemRow
        {...defaultProps}
        isEditing={true}
        editMaterials={editMaterials}
        setEditMaterials={setEditMaterials}
      />,
    );

    const nameInput = screen.getByDisplayValue("Old Name");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    expect(setEditMaterials).toHaveBeenCalledWith([
      expect.objectContaining({ name: "Updated Name" }),
    ]);
  });
});
