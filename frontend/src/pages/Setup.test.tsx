import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Setup from "./Setup";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("../components/SetupRolesSection", () => ({
  default: () => <div>Mock Roles Section</div>,
}));

import { api } from "../api/client";

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

function renderSetup() {
  return render(
    <MemoryRouter>
      <Setup />
    </MemoryRouter>
  );
}

describe("Setup page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("token", "fake-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        name: "Ankan Ghosh",
        email: "ankan@test.com",
      })
    );
    window.open = vi.fn();
  });

  it("shows centered welcome message with logged in user's name by default", async () => {
    renderSetup();

    expect(await screen.findByText("Hello! Ankan Ghosh")).toBeInTheDocument();
    expect(screen.getByText("Welcome to Setup")).toBeInTheDocument();
  });

  it("loads and displays company information when Company Information is clicked", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === "/api/company-information") {
        return Promise.resolve({
          data: {
            data: {
              ID: 1,
              organization_name: "UF Foundation",
              website: "https://uff.ufl.edu",
              phone: "1234567890",
              city: "Gainesville",
              state: "FL",
            },
          },
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    renderSetup();

    await userEvent.click(screen.getByText("Company Information"));

    expect(await screen.findByDisplayValue("UF Foundation")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://uff.ufl.edu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("shows create company information form when no record exists", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === "/api/company-information") {
        return Promise.resolve({
          data: {
            data: null,
          },
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    renderSetup();

    await userEvent.click(screen.getByText("Company Information"));

    expect(await screen.findByText("New Company Information")).toBeInTheDocument();
    expect(screen.getByText("Organization Name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("loads and displays users table when Users is clicked", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === "/api/users") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 1,
                first_name: "Ankan",
                last_name: "Ghosh",
                username: "ankang",
                email: "ankan@test.com",
                role_id: 1,
              },
            ],
          },
        });
      }

      if (url === "/api/roles") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 1,
                label: "Support Manager",
                role_name: "support_manager",
              },
            ],
          },
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    renderSetup();

    await userEvent.click(screen.getByText("Users"));

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(await screen.findByText("Ankan Ghosh")).toBeInTheDocument();
    expect(screen.getByText("ankang")).toBeInTheDocument();
    expect(screen.getByText("ankan@test.com")).toBeInTheDocument();
    expect(screen.getByText("Support Manager")).toBeInTheDocument();
  });

  it("opens edit user modal and submits updated user data with role", async () => {
    mockedApi.get.mockImplementation((url: string) => {
      if (url === "/api/users") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 1,
                first_name: "Ankan",
                last_name: "Ghosh",
                username: "ankang",
                email: "ankan@test.com",
                role_id: 1,
              },
            ],
          },
        });
      }

      if (url === "/api/roles") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 1,
                label: "Support Manager",
                role_name: "support_manager",
              },
              {
                ID: 2,
                label: "Case Agent",
                role_name: "case_agent",
              },
            ],
          },
        });
      }

      return Promise.resolve({ data: { data: [] } });
    });

    mockedApi.put.mockResolvedValue({
      data: {
        message: "User updated successfully",
      },
    });

    renderSetup();

    await userEvent.click(screen.getByText("Users"));
    expect(await screen.findByText("Ankan Ghosh")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(await screen.findByText("Edit User")).toBeInTheDocument();

    const emailInput = screen.getByRole("textbox", { name: /email/i });
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, "ankan.updated@test.com");

    const roleCombobox = screen.getByRole("combobox");
    await userEvent.click(roleCombobox);
    await userEvent.click(await screen.findByText("Case Agent"));

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith("/api/users/1", {
        first_name: "Ankan",
        last_name: "Ghosh",
        username: "ankang",
        email: "ankan.updated@test.com",
        role_id: 2,
      });
    });
  });
});