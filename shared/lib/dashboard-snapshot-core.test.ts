import { describe, it, expect, vi } from "vitest";
import {
  emptyDashboardSnapshot,
  buildDashboardDataForProject,
} from "./dashboard-snapshot-core";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("dashboard-snapshot-core", () => {
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
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          // Default mock implementation
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
          in: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockImplementation(() => {
            if (table === "user_subscriptions")
              return Promise.resolve({
                data: { revenuecat_entitlement_active: true },
                error: null,
              });
            return Promise.resolve({ data: null, error: null });
          }),
          then: (callback: any) => {
            let data: any[] = [];
            if (table === "scope_items")
              data = [{ id: "s1", category: "Test" }];
            if (table === "invoices")
              data = [{ id: "i1", vendor_name: "Vendor" }];
            if (table === "project_gallery")
              data = [{ id: "g1", photo_type: "before" }];
            return Promise.resolve({ data, error: null }).then(callback);
          },
        };
        return chain as any;
      });

      const result = await buildDashboardDataForProject(mockSupabase, {
        userId: "u1",
        projectId: "p1",
        allProjects: [{ id: "p1", name: "Project 1" } as any],
        partialMessageVariant: "web",
      });

      expect(result.project.id).toBe("p1");
      expect(result.scopeItems).toHaveLength(1);
      expect(result.invoices).toHaveLength(1);
      expect(result.galleryItems).toHaveLength(1);
      expect(result.isArchitect).toBe(true);
    });

    it("handles partial load errors correctly", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          maybeSingle: vi
            .fn()
            .mockResolvedValue({ data: null, error: { message: "Fail" } }),
          then: (callback: any) =>
            Promise.resolve({ data: null, error: { message: "Fail" } }).then(
              callback,
            ),
        }),
      } as unknown as SupabaseClient;

      const result = await buildDashboardDataForProject(mockSupabase, {
        userId: "u1",
        projectId: "p1",
        allProjects: [{ id: "p1", name: "Project 1" } as any],
        partialMessageVariant: "web",
      });

      expect(result.loadError).not.toBeNull();
      expect(result.loadError).toContain("We couldn’t load"); // From partialDashboardLoadMessage
    });
  });
});
