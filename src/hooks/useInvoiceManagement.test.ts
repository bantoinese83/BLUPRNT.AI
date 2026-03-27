import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInvoiceManagement } from "./useInvoiceManagement";
import { invokeFunction } from "@/lib/supabase";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

vi.mock("@/lib/supabase", () => ({
  invokeFunction: vi.fn(),
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
    isArchitect: false,
    subscription: null,
    hasProjectPass: false,
  };

  it("calculates initial state correctly", () => {
    const { result } = renderHook(() => useInvoiceManagement(defaultProps));

    expect(result.current.invoiceCount).toBe(0);
    expect(result.current.atLimit).toBe(false);
    expect(result.current.documentType).toBe("invoice");
  });

  describe("atLimit calculation", () => {
    it("is at limit for free user with 3 invoices", () => {
      const { result } = renderHook(() =>
        useInvoiceManagement({
          ...defaultProps,
          invoices: [
            { id: "1", document_type: "invoice" },
            { id: "2", document_type: "invoice" },
            { id: "3", document_type: "invoice" },
          ] as any,
        }),
      );
      expect(result.current.atLimit).toBe(true);
    });

    it("is NOT at limit for free user with 2 invoices", () => {
      const { result } = renderHook(() =>
        useInvoiceManagement({
          ...defaultProps,
          invoices: [
            { id: "1", document_type: "invoice" },
            { id: "2", document_type: "invoice" },
          ] as any,
        }),
      );
      expect(result.current.atLimit).toBe(false);
    });

    it("is at limit for architect user at 10 global uploads", () => {
      const { result } = renderHook(() =>
        useInvoiceManagement({
          ...defaultProps,
          isArchitect: true,
          subscription: { status: "active", invoice_uploads_count: 10 } as any,
        }),
      );
      expect(result.current.atLimit).toBe(true);
    });

    it("is NOT at limit for architect user at 9 global uploads", () => {
      const { result } = renderHook(() =>
        useInvoiceManagement({
          ...defaultProps,
          isArchitect: true,
          subscription: { status: "active", invoice_uploads_count: 9 } as any,
        }),
      );
      expect(result.current.atLimit).toBe(false);
    });

    it("is NOT at limit if project has a pass, even if at free limit", () => {
      const { result } = renderHook(() =>
        useInvoiceManagement({
          ...defaultProps,
          hasProjectPass: true,
          invoices: [
            { id: "1", document_type: "invoice" },
            { id: "2", document_type: "invoice" },
            { id: "3", document_type: "invoice" },
          ] as any,
        }),
      );
      expect(result.current.atLimit).toBe(false);
    });
  });

  describe("handleUploadFile", () => {
    it("blocks upload if at limit and calls onUpgradeClick", async () => {
      const { result } = renderHook(() =>
        useInvoiceManagement({
          ...defaultProps,
          invoices: new Array(3).fill({ document_type: "invoice" }),
        } as any),
      );

      const file = new File([""], "test.pdf", { type: "application/pdf" });
      const fileList = {
        0: file,
        length: 1,
        item: () => file,
      } as unknown as FileList;

      await act(async () => {
        await result.current.handleUploadFile(fileList);
      });

      expect(mockOnUpgradeClick).toHaveBeenCalledWith("invoice_limit");
      expect(invokeFunction).not.toHaveBeenCalled();
    });

    it("toasts error if file is too large (>10MB)", async () => {
      const { result } = renderHook(() => useInvoiceManagement(defaultProps));

      const largeFile = new File(["".padEnd(11 * 1024 * 1024)], "large.pdf", {
        type: "application/pdf",
      });
      const fileList = {
        0: largeFile,
        length: 1,
        item: () => largeFile,
      } as unknown as FileList;

      await act(async () => {
        await result.current.handleUploadFile(fileList);
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("too large"),
      );
      expect(invokeFunction).not.toHaveBeenCalled();
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
        expect.stringContaining("Unsupported file type"),
      );
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

      expect(invokeFunction).toHaveBeenCalledWith(
        "upload-invoice",
        expect.objectContaining({
          body: expect.any(FormData),
        }),
      );

      const formData = (invokeFunction as any).mock.calls[0][1]
        .body as FormData;
      expect(formData.get("project_id")).toBe(mockProjectId);
      expect(formData.get("document_type")).toBe("invoice");
      expect(formData.get("file")).toBe(file);

      expect(mockOnUploaded).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("uploaded successfully"),
      );
    });

    it("handles invokeFunction error using friendlyUploadError", async () => {
      vi.mocked(invokeFunction).mockResolvedValue({
        data: null,
        error: { message: "Some internal error" },
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

      expect(result.current.error).toBe(
        "That didn’t go through. Check your connection and try again—or try a smaller PDF or image.",
      );
    });

    it("triggers onUpgradeClick if server returns a limit error", async () => {
      vi.mocked(invokeFunction).mockResolvedValue({
        data: { error: "Free plan limit reached" },
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

      expect(mockOnUpgradeClick).toHaveBeenCalledWith("invoice_limit");
      expect(result.current.error).toBe("Free plan limit reached");
    });
  });

  it("updates documentType from searchParams and clears the param", () => {
    (useSearchParams as any).mockReturnValue([
      new URLSearchParams("type=quote"),
      mockSetSearchParams,
    ]);

    renderHook(() => useInvoiceManagement(defaultProps));

    expect(mockSetSearchParams).toHaveBeenCalled();
    const [nextParams] = mockSetSearchParams.mock.calls[0];
    expect(nextParams.has("type")).toBe(false);
  });
});
