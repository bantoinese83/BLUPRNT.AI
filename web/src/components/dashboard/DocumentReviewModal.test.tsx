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

    const dateInput = screen.getByLabelText(/Warranty Expiration/i);
    fireEvent.change(dateInput, { target: { value: "2026-12-31" } });

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          warranty_expiry_date: "2026-12-31",
        }),
      );
    });
  });
});
