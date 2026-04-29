import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

vi.mock("../api/client", () => ({
  api: {
    post: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
    };

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  it("renders the login page", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /^login$/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^login$/i })
    ).toBeInTheDocument();
  });

  it("logs in successfully and navigates to dashboard", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          token: "fake-jwt-token",
          user: {
            id: 1,
            name: "Test User",
            first_name: "Test",
            last_name: "User",
            username: "testuser",
            email: "test@example.com",
          },
        },
      },
    } as any);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    await user.type(await screen.findByLabelText(/email/i), "test@example.com");
    await user.type(await screen.findByLabelText(/password/i), "Password123");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });

    expect(localStorage.setItem).toHaveBeenCalledWith("token", "fake-jwt-token");
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({
        id: 1,
        name: "Test User",
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        email: "test@example.com",
      })
    );
    expect(setAuthToken).toHaveBeenCalledWith("fake-jwt-token");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows an error when login fails", async () => {
    vi.mocked(api.post).mockRejectedValue({
      response: {
        data: {
          error: "Invalid credentials",
        },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    await user.type(await screen.findByLabelText(/email/i), "wrong@test.com");
    await user.type(await screen.findByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /^login$/i }));

    expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});