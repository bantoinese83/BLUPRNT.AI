import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "./use-auth";
import React from "react";
import { AuthContext } from "@/contexts/auth-context";

describe("useAuth", () => {
  it("throws error when used outside of AuthProvider", () => {
    // Hide the console error for the expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an AuthProvider",
    );

    spy.mockRestore();
  });

  it("returns context when used within AuthProvider", () => {
    const mockContext = {
      session: null,
      user: null,
      loading: false,
      signOut: vi.fn(),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockContext}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toEqual(mockContext);
  });
});
