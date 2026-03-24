import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WelcomeScreen } from "./WelcomeScreen";

describe("WelcomeScreen", () => {
  it("renders heading and CTAs after load", async () => {
    render(
      <MemoryRouter>
        <WelcomeScreen />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /transform your renovation/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /get my first estimate/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("register link goes to register", async () => {
    render(
      <MemoryRouter>
        <WelcomeScreen />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
    });
    const createAccount = screen.getByRole("link", { name: /register/i });
    expect(createAccount).toHaveAttribute("href", "/register");
  });
});
