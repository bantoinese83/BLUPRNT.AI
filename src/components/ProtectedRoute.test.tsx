import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

const { getSession, mockConfigured } = vi.hoisted(() => {
  return {
    getSession: vi.fn(),
    mockConfigured: vi.fn(() => true),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
    },
  },
  isSupabaseConfigured: () => mockConfigured(),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    getSession.mockReset();
    mockConfigured.mockReturnValue(true);
  });

  it("shows loading state while session is pending", () => {
    getSession.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("status", { name: /loading page/i }),
    ).toBeInTheDocument();
  });

  it("renders children when session exists", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Protected content")).toBeInTheDocument();
    });
  });

  it("redirects to login when there is no session", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    render(
      <MemoryRouter initialEntries={["/dashboard/secret"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/dashboard/secret"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Login page")).toBeInTheDocument();
    });
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("shows setup message when Supabase env is not configured", async () => {
    mockConfigured.mockReturnValue(false);
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /isn't connected yet/i }),
      ).toBeInTheDocument();
    });
  });
});
