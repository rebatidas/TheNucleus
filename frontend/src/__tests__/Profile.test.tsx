import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Profile from "../pages/Profile";
import React from "react";

// mocks
vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("antd", async () => {
  const actual = await vi.importActual<any>("antd");
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

import { api } from "../api/client";
import { message } from "antd";

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup() {
    return render(<Profile />);
  }

  it("redirects to login if no token", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    setup();

    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  it("fetches and displays user data", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("token");

    (api.get as any).mockResolvedValue({
      data: {
        data: {
          name: "John Doe",
          email: "john@example.com",
          created_at: "2024-01-01T00:00:00Z",
        },
      },
    });

    setup();

    expect(await screen.findByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
  });

  it("enters edit mode when edit button clicked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("token");

    (api.get as any).mockResolvedValue({
      data: { data: { name: "John", email: "john@test.com" } },
    });

    setup();

    const editBtn = await screen.findByText("Edit");
    fireEvent.click(editBtn);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("submits updated profile successfully", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("token");

    (api.get as any).mockResolvedValue({
      data: { data: { name: "John", email: "john@test.com" } },
    });

    (api.put as any).mockResolvedValue({
      data: { data: { name: "Jane", email: "jane@test.com" } },
    });

    setup();

    fireEvent.click(await screen.findByText("Edit"));

    const nameInput = screen.getByLabelText("Name");
    const emailInput = screen.getByLabelText("Email");

    fireEvent.change(nameInput, { target: { value: "Jane" } });
    fireEvent.change(emailInput, { target: { value: "jane@test.com" } });

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/api/me", {
        name: "Jane",
        email: "jane@test.com",
      });
    });

    expect(message.success).toHaveBeenCalledWith("Profile updated");
    expect(await screen.findByText("Jane")).toBeInTheDocument();
  });

  it("shows error message on update failure", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("token");

    (api.get as any).mockResolvedValue({
      data: { data: { name: "John", email: "john@test.com" } },
    });

    (api.put as any).mockRejectedValue(new Error("fail"));

    setup();

    fireEvent.click(await screen.findByText("Edit"));

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith("Update failed");
    });
  });

  it("cancel button exits edit mode", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("token");

    (api.get as any).mockResolvedValue({
      data: { data: { name: "John", email: "john@test.com" } },
    });

    setup();

    fireEvent.click(await screen.findByText("Edit"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(await screen.findByText("Edit")).toBeInTheDocument();
  });
});