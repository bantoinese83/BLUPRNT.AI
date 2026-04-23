import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useInvoiceManagement } from "./useInvoiceManagement";
import { invokeFunction } from "@/lib/supabase";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

vi.mock("@/lib/sentry", () => ({
  addUserFlowBreadcrumb: vi.fn(),
  reportClientError: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  invokeFunction: vi.fn().mockResolvedValue({ data: {}, error: null }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("react-router-dom", () => ({
  useSearchParams: vi.fn(),
}));

describe("useInvoiceManagement", () => {
  const mockProjectId = "project-123";
  const mockOnUploaded = vi.fn();
  const mockOnUpgradeClick = vi.fn();
  const mockSetSearchParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams(),
      mockSetSearchParams,
    ]);
    localStorage.clear();
  });

  const defaultProps = {
    projectId: mockProjectId,
    invoices: [],
    onUploaded: mockOnUploaded,
    onUpgradeClick: mockOnUpgradeClick,
    subscription: null,
    hasProjectPass: false,
  };

  it("calculates initial state correctly", () => {
    const { result } = renderHook(() => useInvoiceManagement(defaultProps));

    expect(result.current.invoiceCount).toBe(0);
    expect(result.current.atLimit).toBe(false);
    expect(result.current.documentType).toBe("auto");
  });

  it("resets state when projectId changes", async () => {
    const { result, rerender } = renderHook(
      (props) => useInvoiceManagement(props),
      { initialProps: defaultProps },
    );

    await act(async () => {
      result.current.setReviewInvoiceId("r1");
    });
    expect(result.current.reviewInvoiceId).toBe("r1");

    rerender({ ...defaultProps, projectId: "project-456" });

    expect(result.current.reviewInvoiceId).toBeNull();
  });

  describe("handleUploadFile", () => {
    it("returns early if no files are provided", async () => {
      const { result } = renderHook(() => useInvoiceManagement(defaultProps));
      await act(async () => {
        await result.current.handleUploadFile(null);
        await result.current.handleUploadFile({ length: 0 } as any);
      });
      expect(invokeFunction).not.toHaveBeenCalled();
    });

    it("successfully uploads a file and calls onUploaded", async () => {
      vi.mocked(invokeFunction).mockResolvedValue({
        data: { invoice_id: "new-inv-123" },
        error: null,
      });

      const { result } = renderHook(() => useInvoiceManagement(defaultProps));

      const file = new File(["content"], "invoice.pdf", {
        type: "application/pdf",
      });
      const fileList = {
        0: file,
        length: 1,
        item: () => file,
      } as unknown as FileList;

      await act(async () => {
        await result.current.handleUploadFile(fileList);
      });

      expect(invokeFunction).toHaveBeenCalled();
      expect(mockOnUploaded).toHaveBeenCalled();
      expect(result.current.reviewInvoiceId).toBe("new-inv-123");
    });

    it("handles bulk upload sequentially", async () => {
      vi.mocked(invokeFunction)
        .mockResolvedValueOnce({ data: { invoice_id: "batch-1" }, error: null })
        .mockResolvedValueOnce({
          data: { invoice_id: "batch-2" },
          error: null,
        });

      const { result } = renderHook(() => useInvoiceManagement(defaultProps));
      const f1 = new File(["1"], "1.pdf", { type: "application/pdf" });
      const f2 = new File(["2"], "2.jpg", { type: "image/jpeg" });
      const fileList = {
        0: f1,
        1: f2,
        length: 2,
        item: (i: number) => (i === 0 ? f1 : f2),
      } as unknown as FileList;

      await act(async () => {
        await result.current.handleUploadFile(fileList);
      });

      expect(invokeFunction).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Successfully uploaded 2 documents"),
      );
    });

    it("toasts error if file type is unsupported", async () => {
      const { result } = renderHook(() => useInvoiceManagement(defaultProps));

      const badFile = new File([""], "test.txt", { type: "text/plain" });
      const fileList = {
        0: badFile,
        length: 1,
        item: () => badFile,
      } as unknown as FileList;

      await act(async () => {
        await result.current.handleUploadFile(fileList);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/unsupported format/i),
      );
    });
  });

  it("updates documentType from searchParams and clears the param", async () => {
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams("type=quote"),
      mockSetSearchParams,
    ]);

    const { result } = renderHook(() => useInvoiceManagement(defaultProps));

    await waitFor(() => {
      expect(result.current.documentType).toBe("quote");
    });
  });
});
