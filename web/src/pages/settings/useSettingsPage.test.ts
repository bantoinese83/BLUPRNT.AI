import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSettingsPage } from "./useSettingsPage";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/use-logout", () => ({
  useLogout: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    auth: {
      updateUser: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("@shared/lib/architect-entitlement", () => ({
  isArchitectPlanEffective: vi.fn().mockReturnValue(false),
}));

vi.mock("@shared/lib/user-friendly-errors", () => ({
  friendlyAuthError: vi.fn((e) => e),
}));

vi.mock("@/lib/posthog", () => ({
  setAnalyticsEnabled: vi.fn(),
}));

describe("useSettingsPage", () => {
  const mockNavigate = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useNavigate as any).mockReturnValue(mockNavigate);
    (useAuth as any).mockReturnValue({
      user: {
        id: "user-1",
        email: "test@example.com",
        user_metadata: { full_name: "Test User" },
      },
    });
    (useLogout as any).mockReturnValue({ logout: mockLogout });

    // Default supabase mocks
    (supabase.from as any)().maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
    (supabase.from as any)().order().limit.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it("initializes with user data", async () => {
    const { result } = renderHook(() => useSettingsPage());

    expect(result.current.displayName).toBe("Test User");
    expect(result.current.user?.id).toBe("user-1");
  });

  it("handles profile name update", async () => {
    const { result } = renderHook(() => useSettingsPage());

    (supabase.auth.updateUser as any).mockResolvedValue({
      data: {},
      error: null,
    });

    await act(async () => {
      result.current.setDisplayName("New Name");
    });

    await act(async () => {
      await result.current.onSaveProfile();
    });

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: "New Name" },
    });
    expect(result.current.profileMessage).toBe("Saved.");
  });

  it("validates password length", async () => {
    const { result } = renderHook(() => useSettingsPage());

    await act(async () => {
      result.current.setNewPassword("short");
      result.current.setConfirmPassword("short");
    });

    await act(async () => {
      await result.current.onChangePassword();
    });

    expect(result.current.passwordMessage).toBe(
      "Password must be at least 8 characters.",
    );
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("validates password match", async () => {
    const { result } = renderHook(() => useSettingsPage());

    await act(async () => {
      result.current.setNewPassword("password123");
      result.current.setConfirmPassword("password456");
    });

    await act(async () => {
      await result.current.onChangePassword();
    });

    expect(result.current.passwordMessage).toBe("Passwords do not match.");
  });

  it("updates password successfully", async () => {
    const { result } = renderHook(() => useSettingsPage());

    (supabase.auth.updateUser as any).mockResolvedValue({
      data: {},
      error: null,
    });

    await act(async () => {
      result.current.setNewPassword("newpassword123");
      result.current.setConfirmPassword("newpassword123");
    });

    await act(async () => {
      await result.current.onChangePassword();
    });

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      password: "newpassword123",
    });
    expect(result.current.passwordMessage).toBe(
      "Success! Your password has been updated.",
    );
  });

  it("handles account deletion", async () => {
    const { result } = renderHook(() => useSettingsPage());

    (supabase.functions.invoke as any).mockResolvedValue({
      data: { success: true },
      error: null,
    });
    (supabase.auth.signOut as any).mockResolvedValue({ error: null });

    // Should not delete without confirm
    await act(async () => {
      await result.current.onDeleteAccount();
    });
    expect(supabase.functions.invoke).not.toHaveBeenCalled();

    // Confirm and delete
    await act(async () => {
      result.current.setDeleteConfirm(true);
    });

    await act(async () => {
      await result.current.onDeleteAccount();
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("delete-account", {
      method: "POST",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/signed-out", { replace: true });
  });

  it("toggles analytics", async () => {
    const { result } = renderHook(() => useSettingsPage());

    await act(async () => {
      result.current.onAnalyticsToggle(false);
    });

    expect(localStorage.getItem("bluprnt_analytics_opt_in")).toBe("false");
    expect(result.current.analyticsEnabled).toBe(false);
  });
});
