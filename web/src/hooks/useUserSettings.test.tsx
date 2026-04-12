import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useUserSettings } from "./useUserSettings";
import { supabase } from "@/lib/supabase";
import { exportUserData } from "@/services/export-service";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

vi.mock("@/services/export-service", () => ({
  exportUserData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useUserSettings", () => {
  const navigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(navigate);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email: "a@b.com",
          user_metadata: { full_name: "Test User" },
        },
      },
    } as never);
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }) as never,
    );
  });

  it("loads user and finishes profile", async () => {
    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));
    expect(result.current.user?.id).toBe("u1");
    expect(result.current.displayName).toBe("Test User");
  });

  it("saves profile and shows success", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: null,
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.handleSaveProfile();
    });

    expect(supabase.auth.updateUser).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Profile updated");
  });

  it("exports data when user exists", async () => {
    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.handleExportData();
    });

    expect(exportUserData).toHaveBeenCalledWith("u1", "a@b.com");
    expect(toast.success).toHaveBeenCalledWith("Export download started");
  });

  it("validates password length", async () => {
    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      result.current.setNewPassword("short");
      result.current.setConfirmPassword("short");
      await result.current.handleChangePassword();
    });

    expect(result.current.passwordMessage).toMatch(/8 characters/);
  });

  it("signs out and navigates home", async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.handleSignOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("updates password when validation passes", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: null,
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(() => {
      result.current.setNewPassword("longenough1");
      result.current.setConfirmPassword("longenough1");
    });

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      password: "longenough1",
    });
    expect(toast.success).toHaveBeenCalledWith("Password updated successfully");
  });

  it("sets delete message when delete-account fails", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { error: "nope" },
      error: null,
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.handleDeleteAccount(true);
    });

    expect(result.current.deleteMessage).toBe("nope");
  });
});
