import { describe, it, expect, vi } from "vitest";
import {
  emptyDashboardSnapshot,
  buildDashboardDataForProject,
} from "./dashboard-snapshot-core.ts";
import { buildSpendByCategory } from "./spend-by-category.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("dashboard-snapshot-core", () => {
  describe("buildSpendByCategory", () => {
    it("uses scope item category if line category is missing", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scope = [{ id: "s1", category: "Kitchen" }] as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lines = [{ scope_item_id: "s1", line_total: 100 }] as any[];
      const spend = buildSpendByCategory(lines, scope);
      expect(spend.Kitchen).toBe(100);
    });

    it("falls back to Uncategorized if everything is missing", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spend = buildSpendByCategory([{ line_total: 50 }] as any, []);
      expect(spend.Uncategorized).toBe(50);
    });
  });

  describe("emptyDashboardSnapshot", () => {
    it("returns a correctly initialized empty snapshot", () => {
      const snapshot = emptyDashboardSnapshot();
      expect(snapshot.projects).toEqual([]);
      expect(snapshot.project).toBeNull();
      expect(snapshot.galleryItems).toEqual([]);
      expect(snapshot.loadError).toBeNull();
    });
  });

  describe("buildDashboardDataForProject", () => {
    it("aggregates data correctly from multiple tables", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          // Default mock implementation
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          then: (callback: any) =>
            Promise.resolve({ data: [], error: null }).then(callback),
        }),
      } as unknown as SupabaseClient;

      // Mock specific responses
      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === "user_subscriptions")
              return Promise.resolve({
                data: { revenuecat_entitlement_active: true },
                error: null,
              });
            return Promise.resolve({ data: null, error: null });
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          then: (callback: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let data: any[] = [];
            if (table === "scope_items")
              data = [{ id: "s1", category: "Test" }];
            if (table === "ledger_entries")
              data = [
                {
                  id: "i1",
                  vendor_name: "Vendor",
                  ledger_line_items: [
                    {
                      ledger_entry_id: "i1",
                      category: "Test",
                      line_total: 100,
                      scope_item_id: "s1",
                    },
                  ],
                },
              ];
            if (table === "project_gallery")
              data = [{ id: "g1", photo_type: "before" }];
            return Promise.resolve({ data, error: null }).then(callback);
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return chain as any;
      });

      const result = await buildDashboardDataForProject(mockSupabase, {
        userId: "u1",
        projectId: "p1",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allProjects: [{ id: "p1", name: "Project 1" } as any],
        partialMessageVariant: "web",
      });

      expect(result.project.id).toBe("p1");
      expect(result.scopeItems).toHaveLength(1);
      expect(result.ledgerEntries).toHaveLength(1);
      expect(result.galleryItems).toHaveLength(1);
      expect(result.isArchitect).toBe(true);
    });

    it("synthesizes line items when an entry has a total but no line items", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
          then: (callback: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(callback),
        }),
      } as unknown as SupabaseClient;

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
          then: (callback: (v: unknown) => unknown) => {
            let data: unknown[] = [];
            if (table === "scope_items") data = [];
            if (table === "ledger_entries") {
              data = [
                {
                  id: "flat-1",
                  vendor_name: "",
                  total: 199,
                  ledger_line_items: [],
                  ai_summary: "From OCR",
                  is_verified: true,
                },
              ];
            }
            if (table === "project_gallery") data = [];
            return Promise.resolve({ data, error: null }).then(callback);
          },
        };
        return chain as never;
      });

      const result = await buildDashboardDataForProject(mockSupabase, {
        userId: "u1",
        projectId: "p1",
        allProjects: [{ id: "p1", name: "Project 1" } as never],
        partialMessageVariant: "web",
      });

      expect(result.spendByCategory.Uncategorized).toBe(199);
    });

    it("uses Document Total label when synthesis has no vendor or summary", async () => {
      const mockSupabase = {
        from: vi.fn(),
      } as unknown as SupabaseClient;

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
          then: (callback: (v: unknown) => unknown) => {
            let data: unknown[] = [];
            if (table === "scope_items") data = [];
            if (table === "ledger_entries") {
              data = [
                {
                  id: "flat-2",
                  vendor_name: "",
                  total: 10,
                  ledger_line_items: [],
                  ai_summary: null,
                  is_verified: false,
                },
              ];
            }
            if (table === "project_gallery") data = [];
            return Promise.resolve({ data, error: null }).then(callback);
          },
        };
        return chain as never;
      });

      const result = await buildDashboardDataForProject(mockSupabase, {
        userId: "u1",
        projectId: "p1",
        allProjects: [{ id: "p1", name: "P" } as never],
        partialMessageVariant: "web",
      });

      expect(result.spendByCategory.Uncategorized).toBe(10);
    });

    it("uses ledger line items when present instead of total fallback", async () => {
      const mockSupabase = {
        from: vi.fn(),
      } as unknown as SupabaseClient;

      vi.mocked(mockSupabase.from).mockImplementation((table: string) => {
        const chain = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === "user_subscriptions") {
              return Promise.resolve({
                data: {
                  status: "active",
                  revenuecat_entitlement_active: false,
                },
                error: null,
              });
            }
            return Promise.resolve({ data: null, error: null });
          }),
          then: (callback: (v: unknown) => unknown) => {
            let data: unknown[] = [];
            if (table === "scope_items") {
              data = [{ id: "s1", category: "Plumbing" }];
            }
            if (table === "ledger_entries") {
              data = [
                {
                  id: "inv-lined",
                  vendor_name: "Pipe Co",
                  total: 999,
                  ledger_line_items: [
                    {
                      ledger_entry_id: "inv-lined",
                      category: null,
                      line_total: 42,
                      scope_item_id: "s1",
                    },
                  ],
                  is_verified: true,
                },
              ];
            }
            if (table === "project_gallery") data = [];
            return Promise.resolve({ data, error: null }).then(callback);
          },
        };
        return chain as never;
      });

      const result = await buildDashboardDataForProject(mockSupabase, {
        userId: "u1",
        projectId: "p1",
        allProjects: [{ id: "p1", name: "Project 1" } as never],
        partialMessageVariant: "web",
      });

      expect(result.spendByCategory.Plumbing).toBe(42);
    });

    it("handles partial load errors correctly", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: "Fail" } }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          then: (callback: any) =>
            Promise.resolve({ data: null, error: { message: "Fail" } }).then(
              callback,
            ),
        }),
      } as unknown as SupabaseClient;

      const result = await buildDashboardDataForProject(mockSupabase, {
        userId: "u1",
        projectId: "p1",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allProjects: [{ id: "p1", name: "Project 1" } as any],
        partialMessageVariant: "web",
      });

      expect(result.loadError).not.toBeNull();
      expect(result.loadError).toContain("We couldn’t load"); // From partialDashboardLoadMessage
    });
  });

  describe("fetchDashboardProjectsList", () => {
    it("returns projects list for user", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi
            .fn()
            .mockResolvedValue({ data: [{ id: "p1" }], error: null }),
        }),
      } as unknown as SupabaseClient;

      const res = await import("./dashboard-snapshot-core").then((m) =>
        m.fetchDashboardProjectsList(mockSupabase, "u1"),
      );
      expect(res.rows).toHaveLength(1);
      expect(res.rows[0]!.id).toBe("p1");
    });

    it("returns error when fetch fails", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: "Fail" } }),
        }),
      } as unknown as SupabaseClient;

      const res = await import("./dashboard-snapshot-core").then((m) =>
        m.fetchDashboardProjectsList(mockSupabase, "u1"),
      );
      expect(res.error?.message).toBe("Fail");
    });

    it("returns empty rows when projects response has no data", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as unknown as SupabaseClient;

      const res = await import("./dashboard-snapshot-core").then((m) =>
        m.fetchDashboardProjectsList(mockSupabase, "u1"),
      );
      expect(res.error).toBeNull();
      expect(res.rows).toEqual([]);
    });
  });

  describe("fetchLastActiveProjectIdFromPreferences", () => {
    it("returns project id when found", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { last_active_project_id: "p1" },
            error: null,
          }),
        }),
      } as unknown as SupabaseClient;

      const res = await import("./dashboard-snapshot-core").then((m) =>
        m.fetchLastActiveProjectIdFromPreferences(mockSupabase, "u1"),
      );
      expect(res).toBe("p1");
    });

    it("returns null when not found", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      } as unknown as SupabaseClient;

      const res = await import("./dashboard-snapshot-core").then((m) =>
        m.fetchLastActiveProjectIdFromPreferences(mockSupabase, "u1"),
      );
      expect(res).toBeNull();
    });
  });
});
