import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), put: vi.fn() },
  setAuthToken: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("antd", async () => {
  const actual = await vi.importActual<any>("antd");
  return { ...actual, message: { success: vi.fn(), error: vi.fn() } };
});

import { api } from "../api/client";
import Profile from "../pages/Profile";

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("does not fetch user when no token is present", async () => {
    render(<Profile />);
    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  it("fetches and displays user data when token exists", async () => {
    localStorage.setItem("token", "test-token");
    (api.get as any).mockResolvedValue({
      data: { data: { name: "Jane Doe", email: "jane@example.com" } },
    });

    render(<Profile />);

    expect(await screen.findByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/jane@example.com/)).toBeInTheDocument();
  });

  it("shows the Edit button after loading user data", async () => {
    localStorage.setItem("token", "test-token");
    (api.get as any).mockResolvedValue({
      data: { data: { name: "Jane", email: "jane@example.com" } },
    });

    render(<Profile />);

    expect(await screen.findByText("Edit")).toBeInTheDocument();
  });
});
