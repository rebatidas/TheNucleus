import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "./Login";
import { api, setAuthToken } from "../api/client";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../components/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../api/client", () => ({
  api: {
    post: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the login page", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create an account/i })).toBeInTheDocument();
  });

  it("logs in successfully and navigates to dashboard", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          token: "abc123",
        },
      },
    } as any);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = document.querySelector(
      '[data-cy="login-email"]'
    ) as HTMLInputElement;

    const passwordInput = document.querySelector(
      '[data-cy="login-password"] input'
    ) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/auth/login", {
        email: "test@example.com",
        password: "Password123",
      });
    });

    expect(localStorage.getItem("token")).toBe("abc123");
    expect(setAuthToken).toHaveBeenCalledWith("abc123");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows an error when login fails", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          message: "Invalid credentials",
        },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const emailInput = document.querySelector(
      '[data-cy="login-email"]'
    ) as HTMLInputElement;

    const passwordInput = document.querySelector(
      '[data-cy="login-password"] input'
    ) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "wrong@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});