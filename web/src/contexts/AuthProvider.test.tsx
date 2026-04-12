import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useContext } from "react";
import { AuthProvider } from "./AuthProvider";
import { AuthContext } from "./auth-context";

vi.mock("@/lib/sentry", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
    },
  },
  isSupabaseConfigured: vi.fn(),
}));

vi.mock("@sentry/react", () => ({
  setUser: vi.fn(),
}));

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function Probe() {
  const ctx = useContext(AuthContext);
  if (!ctx) return null;
  return (
    <span data-testid="auth-state">
      {ctx.loading ? "loading" : ctx.user ? "user" : "anon"}
    </span>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
    } as never);
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    } as never);
  });

  it("resolves loading and exposes session from getSession", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("auth-state")).toHaveTextContent("anon"),
    );
  });

  it("skips Supabase when not configured", async () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("auth-state")).toHaveTextContent("anon"),
    );
    expect(supabase.auth.getSession).not.toHaveBeenCalled();
  });
});
