import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLogout } from "./use-logout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useLogout", () => {
  const mockNavigate = vi.fn();
  const mockSignOut = vi.mocked(supabase.auth.signOut);
  const mockToastError = vi.mocked(toast.error);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    // Manual localStorage mock to ensure spyability
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
    });

    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("signs out from Supabase, clears localStorage and navigates to default path", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    localStorage.setItem("bluprnt_project_id", "test-project");

    const { result } = renderHook(() => useLogout());
    await result.current.logout();

    expect(mockSignOut).toHaveBeenCalled();
    expect(localStorage.removeItem).toHaveBeenCalledWith("bluprnt_project_id");
    expect(localStorage.getItem("bluprnt_project_id")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("navigates to custom path when provided", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useLogout());
    await result.current.logout("/login");

    expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
  });

  it("shows toast error when Supabase sign out fails", async () => {
    const error = { message: "Sign out failed" } as any;
    mockSignOut.mockResolvedValue({ error });

    const { result } = renderHook(() => useLogout());
    await result.current.logout();

    expect(mockToastError).toHaveBeenCalledWith(
      "There was a problem signing out.",
    );
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("handles fatal errors and still navigates", async () => {
    mockSignOut.mockRejectedValue(new Error("Fatal error"));

    const { result } = renderHook(() => useLogout());
    await result.current.logout();

    expect(console.error).toHaveBeenCalledWith(
      "Logout fatal error:",
      expect.any(Error),
    );
    expect(mockNavigate).toHaveBeenCalled();
  });
});
