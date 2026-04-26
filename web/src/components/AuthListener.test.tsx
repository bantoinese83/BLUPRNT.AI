/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthListener } from "./AuthListener";

const mockNavigate = vi.fn();
let authCallback: (event: string, session: null) => void = () => {};

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((cb: typeof authCallback) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/safe-redirect", () => ({
  getSafeRedirect: (path: string, fallback: string) => path || fallback,
}));

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

describe("AuthListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = () => {};
    vi.mocked(isSupabaseConfigured).mockReturnValue(true);
  });

  it("redirects to login on SIGNED_OUT from a protected path", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <>
                <AuthListener />
                <div>dash</div>
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    authCallback("SIGNED_OUT", null);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("/login?redirect="),
      { replace: true },
    );
  });

  it("does not redirect if on a public path during SIGNED_OUT", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<AuthListener />} />
        </Routes>
      </MemoryRouter>,
    );

    authCallback("SIGNED_OUT", null);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does nothing when Supabase is not configured", () => {
    vi.mocked(isSupabaseConfigured).mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AuthListener />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(supabase.auth.onAuthStateChange).not.toHaveBeenCalled();
  });
});
