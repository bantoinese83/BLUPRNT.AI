import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportUserData } from "./export-service";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("exportUserData", () => {
  const clickSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports empty datasets when there are no properties", async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [] }),
    } as unknown as ReturnType<typeof supabase.from>);

    await exportUserData("user-1", "u@example.com");

    expect(supabase.from).toHaveBeenCalledWith("properties");
    expect(clickSpy).toHaveBeenCalled();
  });

  it("loads nested data from projects when properties exist", async () => {
    const projectId = "proj-1";
    const invoiceId = "inv-1";

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "properties") {
        return {
          select: vi.fn().mockResolvedValue({ data: [{ id: "prop-1" }] }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: projectId,
                  property_id: "prop-1",
                  scope_items: [{ id: "scope-1" }],
                  invoices: [
                    { id: invoiceId, invoice_line_items: [{ id: "line-1" }] },
                  ],
                  documents: [{ id: "doc-1" }],
                },
              ],
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      throw new Error(`unexpected table ${table}`);
    });

    await exportUserData("user-2", "v@example.com");

    expect(supabase.from).toHaveBeenCalledWith("projects");
    expect(clickSpy).toHaveBeenCalled();
  });

  it("handles null data returns from Supabase gracefully in main queries", async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "properties") {
        return {
          select: vi.fn().mockResolvedValue({ data: [{ id: "prop-1" }] }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi
              .fn()
              .mockResolvedValue({ data: null, error: new Error("DB Error") }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      }
      throw new Error(`unexpected table ${table}`);
    });

    await exportUserData("user-4", "x@example.com");

    expect(supabase.from).toHaveBeenCalledWith("projects");
    expect(clickSpy).toHaveBeenCalled();
  });
});
