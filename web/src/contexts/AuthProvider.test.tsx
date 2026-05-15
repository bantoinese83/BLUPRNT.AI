/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";

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
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null }),
      ),
      onAuthStateChange: vi.fn((cb: typeof authCallback) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signOut: vi.fn(),
    },
  },
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/sentry", () => ({
  reportClientError: vi.fn(),
}));

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authCallback = () => {};
  });

  it("redirects to login on SIGNED_OUT from a protected path", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <AuthProvider>
                <span>dash</span>
              </AuthProvider>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(typeof authCallback).toBe("function");
    });

    authCallback("SIGNED_OUT", null);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining("/login?redirect="),
      { replace: true },
    );
  });
});
