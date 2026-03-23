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
      expect(screen.getByRole("heading", { name: /turn your renovation/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /get my first estimate/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create free account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("create account link goes to register", async () => {
    render(
      <MemoryRouter>
        <WelcomeScreen />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /create free account/i })).toBeInTheDocument();
    });
    const createAccount = screen.getByRole("link", { name: /create free account/i });
    expect(createAccount).toHaveAttribute("href", "/register");
  });
});
