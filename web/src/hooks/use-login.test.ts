/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLogin } from "./use-login";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(() => ({ pathname: "/login" })),
  useNavigationType: vi.fn(),
  createRoutesFromChildren: vi.fn(),
  matchRoutes: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe("useLogin", () => {
  const mockNavigate = vi.fn();
  const mockSignInWithPassword = vi.mocked(supabase.auth.signInWithPassword);
  const mockSignInWithOtp = vi.mocked(supabase.auth.signInWithOtp);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("handles successful password login", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "123" }, session: {} } as any,
      error: null,
    });

    const { result } = renderHook(() => useLogin(null));
    await result.current.onPasswordLogin({
      email: "test@example.com",
      password: "password",
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      }),
    );
  });

  it("handles password login error", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid credentials" } as any,
    });

    const { result } = renderHook(() => useLogin(null));
    await result.current.onPasswordLogin({
      email: "test@example.com",
      password: "wrong",
    });

    await waitFor(() =>
      expect(result.current.error).toBe("Invalid credentials"),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles successful OTP login", async () => {
    mockSignInWithOtp.mockResolvedValue({ data: {} as any, error: null });

    const { result } = renderHook(() => useLogin(null));
    await result.current.onMagicRequest({ email: "test@example.com" });

    expect(mockSignInWithOtp).toHaveBeenCalled();
    await waitFor(() => expect(result.current.magicSent).toBe(true));
  });

  it("handles OTP login error", async () => {
    mockSignInWithOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Too many requests" } as any,
    });

    const { result } = renderHook(() => useLogin(null));
    await result.current.onMagicRequest({ email: "test@example.com" });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("handles fatal error in onPasswordLogin", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: new Error("Fatal") as any,
    });

    const { result } = renderHook(() => useLogin(null));
    await result.current.onPasswordLogin({
      email: "test@example.com",
      password: "password",
    });

    await waitFor(() => expect(result.current.error).toBe("Fatal"));
  });
});
