import { describe, it, expect, vi, beforeEach } from "vitest";
import { ensureUserHasWorkspace } from "./ensure-user-workspace";
import { supabase } from "./supabase";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}));

describe("ensureUserHasWorkspace", () => {
  const userId = "test-user-id";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("sets localStorage if user already has property and project", async () => {
    const mockProperty = { id: "prop-123" };
    const mockProject = { id: "proj-456" };

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "properties") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue({ data: [mockProperty], error: null }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi
            .fn()
            .mockResolvedValue({ data: [mockProject], error: null }),
        };
      }
    });

    await ensureUserHasWorkspace(userId);

    expect(localStorage.getItem("bluprnt_project_id")).toBe(mockProject.id);
  });

  it("creates project and sets localStorage if user has property but no project", async () => {
    const mockProperty = { id: "prop-123" };
    const mockProject = { id: "proj-789" };

    // Need a more specific mock for multiple calls to the same table
    const fromSpy = vi.spyOn(supabase, "from");
    fromSpy.mockImplementation((table: any) => {
      if (table === "properties") {
        return {
          select: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({ data: [mockProperty], error: null }),
            }),
          }),
        } as any;
      }
      if (table === "projects") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockProject, error: null }),
            }),
          }),
        } as any;
      }
    });

    await ensureUserHasWorkspace(userId);

    expect(localStorage.getItem("bluprnt_project_id")).toBe(mockProject.id);
  });

  it("creates property and project if user has nothing", async () => {
    const mockProperty = { id: "prop-new" };
    const mockProject = { id: "proj-new" };

    const fromSpy = vi.spyOn(supabase, "from");
    fromSpy.mockImplementation((table: any) => {
      if (table === "properties") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [], error: null }),
              single: () =>
                Promise.resolve({ data: mockProperty, error: null }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({ data: mockProperty, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "projects") {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: mockProject, error: null }),
            }),
          }),
        } as any;
      }
    });

    await ensureUserHasWorkspace(userId);

    expect(localStorage.getItem("bluprnt_project_id")).toBe(mockProject.id);
  });

  it("warns but doesn't throw on Supabase errors", async () => {
    const fromSpy = vi.spyOn(supabase, "from");
    fromSpy.mockImplementation(
      () =>
        ({
          select: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({ data: null, error: { message: "DB Error" } }),
            }),
          }),
        }) as any,
    );

    await expect(ensureUserHasWorkspace(userId)).resolves.not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(
      "ensureUserHasWorkspace: properties query failed",
      "DB Error",
    );
  });

  it("ignores localStorage.setItem errors", async () => {
    const mockProperty = { id: "prop-123" };
    const mockProject = { id: "proj-456" };

    const fromSpy = vi.spyOn(supabase, "from");
    fromSpy.mockImplementation((table: any) => {
      if (table === "properties") {
        return {
          select: () => ({
            eq: () => ({
              limit: () =>
                Promise.resolve({ data: [mockProperty], error: null }),
            }),
          }),
        } as any;
      }
      if (table === "projects") {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () =>
                  Promise.resolve({ data: [mockProject], error: null }),
              }),
            }),
          }),
        } as any;
      }
    });

    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Quota exceeded");
      });

    await expect(ensureUserHasWorkspace(userId)).resolves.not.toThrow();
    expect(setItemSpy).toHaveBeenCalledWith(
      "bluprnt_project_id",
      mockProject.id,
    );
  });
});
