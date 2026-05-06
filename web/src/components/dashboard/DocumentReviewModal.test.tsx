import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentReviewModal } from "./DocumentReviewModal";
import { supabase, invokeFunction } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  },
  invokeFunction: vi.fn(),
}));

vi.mock("@/lib/sentry", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("@/components/dashboard/DocumentThumbnail", () => ({
  DocumentThumbnail: () => <div data-testid="doc-thumb" />,
}));

describe("DocumentReviewModal", () => {
  const documentId = "doc123";
  const projectId = "proj456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders and saves warranty expiration date", async () => {
    const mockInvoice = {
      id: documentId,
      vendor_name: "Test Vendor",
      total: 100,
      document_type: "warranty",
      line_items: [],
      warranty_expiry_date: null,
      insurance_renewal_date: null,
      permit_expiration_date: null,
    };

    (invokeFunction as any).mockResolvedValue({
      data: { ledger_entry: mockInvoice, line_items: [] },
      error: null,
    });

    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: mockUpdate,
      eq: vi.fn().mockReturnThis(),
    });

    render(
      <DocumentReviewModal
        documentId={documentId}
        projectId={projectId}
        onClose={() => {}}
      />,
    );

    await screen.findByText(/Review warranty/i);

    expect(screen.queryByLabelText(/Total amount/i)).toBeNull();

    const dateInput = screen.getByLabelText(/Warranty expiration/i);
    fireEvent.change(dateInput, { target: { value: "2026-12-31" } });

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          warranty_expiry_date: "2026-12-31",
          insurance_renewal_date: null,
          permit_expiration_date: null,
          total: 0,
        }),
      );
    });
  });

  it("renders and saves insurance policy renewal date", async () => {
    const mockEntry = {
      id: documentId,
      vendor_name: "Carrier Co",
      total: 0,
      document_type: "insurance",
      line_items: [],
      warranty_expiry_date: null,
      insurance_renewal_date: null,
      permit_expiration_date: null,
    };

    (invokeFunction as any).mockResolvedValue({
      data: { ledger_entry: mockEntry, line_items: [] },
      error: null,
    });

    const mockUpdate = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      update: mockUpdate,
      eq: vi.fn().mockReturnThis(),
    });

    render(
      <DocumentReviewModal
        documentId={documentId}
        projectId={projectId}
        onClose={() => {}}
      />,
    );

    await screen.findByText(/Review insurance document/i);

    const dateInput = screen.getByLabelText(/Policy renewal date/i);
    fireEvent.change(dateInput, { target: { value: "2027-06-01" } });

    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          insurance_renewal_date: "2027-06-01",
          warranty_expiry_date: null,
          permit_expiration_date: null,
        }),
      );
    });
  });
});
