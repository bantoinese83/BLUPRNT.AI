import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadSellerPacket } from "./seller-packet-download";
import { supabase } from "./supabase";
import { generateSellerPacketBlob } from "./pdf-export";
import { buildSellerPacketAppendixItems } from "./seller-packet-appendix";

vi.mock("./pdf-export", () => ({
  generateSellerPacketBlob: vi
    .fn()
    .mockResolvedValue(new Blob(["%PDF-1.4"], { type: "application/pdf" })),
}));

vi.mock("./seller-packet-appendix", () => ({
  buildSellerPacketAppendixItems: vi.fn().mockResolvedValue([]),
}));

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe("downloadSellerPacket", () => {
  const params = {
    projectId: "p1",
    propertyId: "prop1",
    project: {
      name: "Kitchen",
      estimated_min_total: 1000,
      estimated_max_total: 2000,
    },
    scopeItems: [],
    ledgerEntries: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click,
    } as unknown as HTMLAnchorElement);
  });

  it("downloads blob and skips storage when user is anonymous", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
    } as never);

    const { savedToProject } = await downloadSellerPacket(params);
    expect(savedToProject).toBe(false);
    expect(generateSellerPacketBlob).toHaveBeenCalled();
    expect(buildSellerPacketAppendixItems).not.toHaveBeenCalled();
  });

  it("uploads and records seller packet when user is signed in", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "u1" } },
    } as never);

    const upload = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload,
    } as never);

    const upsert = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert,
    } as never);

    const { savedToProject } = await downloadSellerPacket(params);
    expect(savedToProject).toBe(true);
    expect(upload).toHaveBeenCalled();
    expect(upsert).toHaveBeenCalled();
  });

  it("includes appendix when requested", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
    } as never);

    vi.mocked(buildSellerPacketAppendixItems).mockResolvedValue([
      {
        title: "x",
        kind: "pdf_note",
        noteLines: ["n"],
      },
    ]);

    await downloadSellerPacket({ ...params, includeAppendix: true });
    expect(buildSellerPacketAppendixItems).toHaveBeenCalled();
    expect(generateSellerPacketBlob).toHaveBeenCalledWith(
      params.project,
      params.scopeItems,
      params.ledgerEntries,
      expect.objectContaining({ appendixItems: expect.any(Array) }),
    );
  });
});
