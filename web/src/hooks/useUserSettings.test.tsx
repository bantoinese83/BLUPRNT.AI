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

  it("does not export when user is missing", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.handleExportData();
    });

    expect(exportUserData).not.toHaveBeenCalled();
  });

  it("shows toast when profile save fails", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: { message: "Profile blocked" },
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.handleSaveProfile();
    });

    expect(toast.error).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalledWith("Profile updated");
  });

  it("blocks password change when passwords differ", async () => {
    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(() => {
      result.current.setNewPassword("longpassword1");
      result.current.setConfirmPassword("longpassword2");
    });

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(result.current.passwordMessage).toMatch(/do not match/i);
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("shows toast when password update fails", async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      error: { message: "weak" },
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(() => {
      result.current.setNewPassword("longenough9");
      result.current.setConfirmPassword("longenough9");
    });

    await act(async () => {
      await result.current.handleChangePassword();
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("skips delete-account invoke when not confirmed", async () => {
    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));
    vi.mocked(supabase.functions.invoke).mockClear();

    await act(async () => {
      await result.current.handleDeleteAccount(false);
    });

    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it("signs out and navigates after successful delete-account", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { success: true },
      error: null,
    } as never);
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    } as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    await act(async () => {
      await result.current.handleDeleteAccount(true);
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("marks architect and picks latest project for upgrades", async () => {
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "user_subscriptions") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { status: "active" },
            error: null,
          }),
        };
      }
      if (table === "properties") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ id: "prop-1" }],
            error: null,
          }),
        };
      }
      if (table === "projects") {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [{ id: "proj-latest" }],
            error: null,
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        in: vi.fn().mockReturnThis(),
      };
    }) as never);

    const { result } = renderHook(() => useUserSettings());

    await waitFor(() => expect(result.current.userLoading).toBe(false));

    expect(result.current.isArchitect).toBe(true);
    expect(result.current.upgradeProjectId).toBe("proj-latest");
  });
});
