import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddScopeItemModal } from "./AddScopeItemModal";

describe("AddScopeItemModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onAdd: vi.fn().mockResolvedValue(true),
    saving: false,
  };

  it("renders correctly when open", () => {
    render(<AddScopeItemModal {...defaultProps} />);
    expect(screen.getByText("Add Line Item")).toBeInTheDocument();
    expect(screen.getByLabelText(/Item Name/i)).toBeInTheDocument();
  });

  it("calls onAdd with formatted data on submission", async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    render(<AddScopeItemModal {...defaultProps} onAdd={onAdd} />);

    const nameInput = screen.getByPlaceholderText(/e.g. Custom Cabinetry/i);
    const costInput = screen.getByPlaceholderText("0.00");
    const submitBtn = screen.getByRole("button", { name: /Add to Budget/i });

    await userEvent.type(nameInput, "New Cabinets");
    await userEvent.type(costInput, "5000");

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "New Cabinets",
          cost: 5000,
          quantity: 1,
        }),
      );
    });
  });

  it("validates required fields", async () => {
    render(<AddScopeItemModal {...defaultProps} />);
    const submitBtn = screen.getByRole("button", { name: /Add to Budget/i });

    expect(submitBtn).toBeDisabled();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<AddScopeItemModal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("shows loading state when saving is true", () => {
    render(<AddScopeItemModal {...defaultProps} saving={true} />);
    expect(screen.getByText("Adding to budget...")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Adding to budget/i }),
    ).toBeDisabled();
  });
});
