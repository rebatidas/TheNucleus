import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
  setAuthToken: vi.fn(),
}));

import { api } from "../api/client";
import Setup from "../pages/Setup";

function renderSetup() {
  return render(
    <MemoryRouter>
      <Setup />
    </MemoryRouter>
  );
}

describe("Setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'No users found' when users list is empty", async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });

    renderSetup();

    expect(await screen.findByText("No users found")).toBeInTheDocument();
  });

  it("shows 'No queues' when queues list is empty", async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });

    renderSetup();

    expect(await screen.findByText("No queues")).toBeInTheDocument();
  });

  it("displays users fetched from the API", async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === "/api/users")
        return Promise.resolve({ data: { data: [{ id: 1, name: "Alice", email: "alice@example.com" }] } });
      return Promise.resolve({ data: { data: [] } });
    });

    renderSetup();

    expect(await screen.findByText(/Alice/)).toBeInTheDocument();
  });

  it("displays queues fetched from the API", async () => {
    (api.get as any).mockImplementation((url: string) => {
      if (url === "/api/queues")
        return Promise.resolve({ data: { data: [{ id: 1, name: "Support" }] } });
      return Promise.resolve({ data: { data: [] } });
    });

    renderSetup();

    expect(await screen.findByText("Support")).toBeInTheDocument();
  });

  it("calls POST /api/queues when Create is clicked with a queue name", async () => {
    (api.get as any).mockResolvedValue({ data: { data: [] } });
    (api.post as any).mockResolvedValue({});

    renderSetup();

    const input = await screen.findByPlaceholderText("Queue name");
    fireEvent.change(input, { target: { value: "Billing" } });
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/queues", { name: "Billing" });
    });
  });
});
