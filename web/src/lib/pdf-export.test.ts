import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSellerPacketBlob } from "./pdf-export";
import type { SellerPacketAppendixItem } from "./pdf-export";

// Mock jspdf
const mockText = vi.fn();
const mockSetFont = vi.fn();
const mockSetFontSize = vi.fn();
const mockAddPage = vi.fn();
const mockSetTextColor = vi.fn();
const mockOutput = vi.fn(
  () => new Blob(["test-pdf-content"], { type: "application/pdf" }),
);
const mockGetImageProperties = vi.fn(() => ({ width: 100, height: 100 }));
const mockAddImage = vi.fn();
const mockSplitTextToSize = vi.fn((text) => [text]);

vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(function (this: any) {
      this.text = mockText;
      this.setFont = mockSetFont;
      this.setFontSize = mockSetFontSize;
      this.addPage = mockAddPage;
      this.setTextColor = mockSetTextColor;
      this.output = mockOutput;
      this.getImageProperties = mockGetImageProperties;
      this.addImage = mockAddImage;
      this.splitTextToSize = mockSplitTextToSize;
      this.internal = {
        pageSize: {
          width: 210,
          height: 297,
        },
      };
      return this;
    }),
  };
});

describe("pdf-export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject = {
    name: "Test Dream House",
    estimated_min_total: 100000,
    estimated_max_total: 150000,
  };

  const mockScopeItems = [
    {
      category: "Kitchen",
      description: "New cabinets",
      total_cost_min: 20000,
      total_cost_max: 25000,
    },
  ];

  const mockLedgerEntries = [
    {
      vendor_name: "Best Cabinets",
      total: 22000,
      created_at: "2023-05-01T12:00:00Z",
      document_type: "invoice",
    },
  ];

  it("generates a PDF with project info and summary", async () => {
    const blob = await generateSellerPacketBlob(
      mockProject,
      mockScopeItems,
      mockLedgerEntries,
    );

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");

    // Verify main title
    expect(mockText).toHaveBeenCalledWith(
      "Property Improvement Ledger",
      expect.any(Number),
      expect.any(Number),
    );

    // Verify project name
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining("Project: Test Dream House"),
      expect.any(Number),
      expect.any(Number),
    );

    // Verify totals in summary
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining("Capital improvements"),
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining("$22,000"),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("handles empty scope and invoices", async () => {
    await generateSellerPacketBlob(mockProject, [], []);

    expect(mockText).toHaveBeenCalledWith(
      "No records or documents added yet.",
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining("Total estimate: $100,000 – $150,000"),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("includes appendix items when provided", async () => {
    const appendixItems: SellerPacketAppendixItem[] = [
      {
        title: "Kitchen Receipt",
        kind: "image",
        dataUrl: "data:image/png;base64,xxx",
        imageFormat: "PNG",
      },
      {
        title: "Notes",
        kind: "pdf_note",
        noteLines: ["Contractor said everything looks good"],
      },
    ];

    await generateSellerPacketBlob(
      mockProject,
      mockScopeItems,
      mockLedgerEntries,
      {
        appendixItems,
      },
    );

    // Verify appendix section title
    expect(mockText).toHaveBeenCalledWith(
      "Appendix: Original uploads",
      expect.any(Number),
      expect.any(Number),
    );

    // Verify appendix items
    expect(mockText).toHaveBeenCalledWith(
      "Kitchen Receipt",
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockAddImage).toHaveBeenCalled();
    expect(mockText).toHaveBeenCalledWith(
      "Notes",
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockText).toHaveBeenCalledWith(
      "Contractor said everything looks good",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("handles image embedding failures gracefully", async () => {
    mockAddImage.mockImplementationOnce(() => {
      throw new Error("Add image failed");
    });

    const appendixItems: SellerPacketAppendixItem[] = [
      {
        title: "Failing Image",
        kind: "image",
        dataUrl: "invalid-data",
        imageFormat: "PNG",
      },
    ];

    await generateSellerPacketBlob(mockProject, [], [], { appendixItems });

    expect(mockText).toHaveBeenCalledWith(
      expect.stringContaining("We couldn’t embed this image"),
      expect.any(Number),
      expect.any(Number),
      expect.any(Object),
    );
  });
});
