/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRegister } from "./use-register";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
  useLocation: vi.fn(() => ({ pathname: "/" })),
  useNavigationType: vi.fn(),
  createRoutesFromChildren: vi.fn(),
  matchRoutes: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(() => ({
      then: vi.fn((cb) => cb({ data: null, error: null })),
    })),
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

describe("useRegister", () => {
  const mockNavigate = vi.fn();
  const mockSignUp = vi.mocked(supabase.auth.signUp);
  const mockSignInWithPassword = vi.mocked(supabase.auth.signInWithPassword);

  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);

    mockSignUp.mockResolvedValue({
      data: { user: { id: "user-123" }, session: null } as any,
      error: null,
    });

    mockSignInWithPassword.mockResolvedValue({
      data: { session: { user: { id: "user-123" } } } as any,
      error: null,
    });

    mockSingle.mockResolvedValue({ data: { id: "prop-123" }, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);
  });

  it("handles successful registration and initialization", async () => {
    const { result } = renderHook(() => useRegister(null));

    await result.current.onPasswordRegister({
      email: "test@example.com",
      password: "password",
      zip: "12345",
    });

    expect(mockSignUp).toHaveBeenCalled();
    await waitFor(
      () =>
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
          replace: true,
        }),
      { timeout: 2000 },
    );
  });

  it("handles fatal error in onPasswordRegister", async () => {
    mockSignUp.mockRejectedValue(new Error("Fatal"));

    const { result } = renderHook(() => useRegister(null));
    await result.current.onPasswordRegister({
      email: "test@example.com",
      password: "password",
      zip: "12345",
    });

    await waitFor(() =>
      expect(result.current.error).toBe("Sign-up failed. Try again."),
    );
  });

  it("handles successful magic link registration", async () => {
    const mockSignInWithOtp = vi.mocked(supabase.auth.signInWithOtp);
    mockSignInWithOtp.mockResolvedValue({ data: {} as any, error: null });

    const { result } = renderHook(() => useRegister(null));
    await result.current.onMagicRegister({ email: "test@example.com" });

    expect(mockSignInWithOtp).toHaveBeenCalled();
    await waitFor(() => expect(result.current.magicSent).toBe(true));
  });

  it("handles magic link registration error", async () => {
    const mockSignInWithOtp = vi.mocked(supabase.auth.signInWithOtp);
    mockSignInWithOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Rate limit exceeded" } as any,
    });

    const { result } = renderHook(() => useRegister(null));
    await result.current.onMagicRegister({ email: "test@example.com" });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it("handles signUp error", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Email already in use" } as any,
    });

    const { result } = renderHook(() => useRegister(null));
    await result.current.onPasswordRegister({
      email: "test@example.com",
      password: "password",
      zip: "12345",
    });

    await waitFor(() =>
      expect(result.current.error).toBe("Email already in use"),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles signInWithPassword error", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null } as any,
      error: { message: "Sign-in failed" } as any,
    });

    const { result } = renderHook(() => useRegister(null));
    await result.current.onPasswordRegister({
      email: "test@example.com",
      password: "password",
      zip: "12345",
    });

    await waitFor(() =>
      expect(result.current.error).toContain(
        "Check your email to confirm your account",
      ),
    );
  });
});
