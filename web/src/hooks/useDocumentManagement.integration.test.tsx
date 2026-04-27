import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDocumentManagement } from "./useDocumentManagement";
import { MemoryRouter } from "react-router-dom";
import * as supabaseLib from "@/lib/supabase";
import { toast } from "sonner";

vi.mock("@/lib/supabase", () => ({
  invokeFunction: vi.fn(),
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/sentry", () => ({
  addUserFlowBreadcrumb: vi.fn(),
  reportClientError: vi.fn(),
}));

describe("useDocumentManagement Integration", () => {
  const mockOnUploaded = vi.fn();
  const mockOnUpgradeClick = vi.fn();
  const mockProps = {
    projectId: "test-p",
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

  it("successfully uploads a single document", async () => {
    const mockInvoke = vi.mocked(supabaseLib.invokeFunction);
    mockInvoke.mockResolvedValue({
      data: { invoice_id: "inv-1", document_type: "invoice" },
      error: null,
    } as any);

    const { result } = renderHook(() => useDocumentManagement(mockProps), {
      wrapper,
    });

    const file = new File(["foo"], "test.jpg", { type: "image/jpeg" });
    const files = { length: 1, 0: file, item: () => file } as any;

    await act(async () => {
      await result.current.handleUploadFile(files);
    });

    expect(mockInvoke).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringContaining("Invoice / bill uploaded"),
      expect.any(Object),
    );
  });

  it("handles batch upload failures gracefully", async () => {
    const mockInvoke = vi.mocked(supabaseLib.invokeFunction);
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "Auth fail" },
    } as any);
    mockInvoke.mockResolvedValueOnce({
      data: { invoice_id: "2" },
      error: null,
    } as any);

    const { result } = renderHook(() => useDocumentManagement(mockProps), {
      wrapper,
    });

    const f1 = new File(["1"], "1.jpg", { type: "image/jpeg" });
    const f2 = new File(["2"], "2.jpg", { type: "image/jpeg" });
    const files = {
      length: 2,
      0: f1,
      1: f2,
      item: (i: number) => (i === 0 ? f1 : f2),
    } as any;

    await act(async () => {
      await result.current.handleUploadFile(files);
    });

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to upload 1.jpg"),
    );
    expect(toast.info).toHaveBeenCalled();
  });

  it("prevents upload when at free tier limit", async () => {
    const { result } = renderHook(
      () =>
        useDocumentManagement({
          ...mockProps,
          documents: Array(10).fill({ document_type: "invoice" }) as any,
        }),
      { wrapper },
    );

    act(() => {
      result.current.setDocumentType("invoice");
    });

    const file = new File(["foo"], "test.jpg", { type: "image/jpeg" });
    const files = { length: 1, 0: file, item: () => file } as any;

    await act(async () => {
      await result.current.handleUploadFile(files);
    });

    expect(mockOnUpgradeClick).toHaveBeenCalledWith("ledger_limit");
  });
});
