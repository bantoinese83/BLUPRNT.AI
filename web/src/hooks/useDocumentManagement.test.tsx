import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDocumentManagement } from "./useDocumentManagement";
import { MemoryRouter } from "react-router-dom";
import * as supabaseLib from "@/lib/supabase";
import { toast } from "sonner";

vi.mock("@/lib/supabase", () => ({
  invokeFunction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/lib/sentry", () => ({
  addUserFlowBreadcrumb: vi.fn(),
  reportClientError: vi.fn(),
}));

describe("useDocumentManagement", () => {
  const mockOnUploaded = vi.fn();
  const mockOnUpgradeClick = vi.fn();
  const mockProps = {
    projectId: "test-project",
    documents: [],
    onUploaded: mockOnUploaded,
    onUpgradeClick: mockOnUpgradeClick,
    subscription: null,
    hasProjectPass: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );

  it("handles file selection and successful upload", async () => {
    const mockInvoke = vi.mocked(supabaseLib.invokeFunction);
    mockInvoke.mockResolvedValue({
      data: { invoice_id: "inv-123", document_type: "invoice" },
      error: null,
    } as any);

    const { result } = renderHook(() => useDocumentManagement(mockProps), {
      wrapper,
    });

    const file = new File(["test content"], "receipt.jpg", {
      type: "image/jpeg",
    });
    const files = {
      length: 1,
      0: file,
      item: (i: number) => (i === 0 ? file : null),
    } as unknown as FileList;

    await act(async () => {
      await result.current.handleUploadFile(files);
    });

    expect(mockInvoke).toHaveBeenCalled();
    expect(mockOnUploaded).toHaveBeenCalledWith("test-project");
    expect(result.current.reviewInvoiceId).toBe("inv-123");
    expect(toast.success).toHaveBeenCalled();
  });

  it("blocks upload when at limit and document type is invoice", async () => {
    const { result } = renderHook(
      () =>
        useDocumentManagement({
          ...mockProps,
          documents: Array(10).fill({ document_type: "invoice" }) as any,
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.setDocumentType("invoice");
    });

    await act(async () => {
      await result.current.handleUploadFile({ length: 1 } as any);
    });

    expect(mockOnUpgradeClick).toHaveBeenCalledWith("invoice_limit");
    expect(supabaseLib.invokeFunction).not.toHaveBeenCalled();
  });

  it("allows upload of non-quota documents even if at invoice limit", async () => {
    const mockInvoke = vi.mocked(supabaseLib.invokeFunction);
    mockInvoke.mockResolvedValue({
      data: { invoice_id: "doc-123", document_type: "other" },
      error: null,
    } as any);

    const { result } = renderHook(
      () =>
        useDocumentManagement({
          ...mockProps,
          documents: Array(10).fill({ document_type: "invoice" }) as any,
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.setDocumentType("other");
    });

    const file = new File(["test"], "doc.pdf", { type: "application/pdf" });
    const files = {
      length: 1,
      0: file,
      item: (i: number) => (i === 0 ? file : null),
    } as unknown as FileList;

    await act(async () => {
      await result.current.handleUploadFile(files);
    });

    expect(mockInvoke).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });
});
