import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Setup from "./Setup";
import { api } from "../api/client";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  };
});

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("../hooks/usePermissions", () => ({
  usePermissions: () => ({
    canViewObject: () => true,
    canCreateObject: () => true,
    canEditObject: () => true,
    canDeleteObject: () => true,
    isFieldVisible: () => true,
    isFieldReadOnly: () => false,
  }),
}));

vi.mock("../components/SetupRolesSection", () => ({
  default: () => <div>Roles Section</div>,
}));

vi.mock("../components/SetupProfilesSection", () => ({
  default: () => <div>Profiles Section</div>,
}));

vi.mock("../components/SetupSharingSettingsSection", () => ({
  default: () => <div>Sharing Settings Section</div>,
}));

describe("Setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    localStorage.setItem("token", "test-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        first_name: "Test",
        name: "Test User",
      })
    );

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/users") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 1,
                first_name: "Jane",
                last_name: "Doe",
                username: "jane",
                email: "jane@test.com",
                role_id: null,
                profile_id: null,
              },
            ],
          },
        } as any);
      }

      if (url === "/api/roles") {
        return Promise.resolve({ data: { data: [] } } as any);
      }

      if (url === "/api/profiles") {
        return Promise.resolve({ data: { data: [] } } as any);
      }

      if (url === "/api/company-information") {
        return Promise.resolve({
          data: {
            data: {
              ID: 1,
              organization_name: "TheNucleus",
              website: "https://example.com",
              phone: "1234567890",
              street: "Main Street",
              city: "Gainesville",
              state: "FL",
              postal_code: "32601",
              country: "USA",
            },
          },
        } as any);
      }

      if (url === "/api/org-wide-defaults") {
        return Promise.resolve({
          data: {
            data: [
              { ID: 1, object_name: "Customers", access_level: "Private" },
              { ID: 2, object_name: "Cases", access_level: "PublicReadWrite" },
            ],
          },
        } as any);
      }

      return Promise.resolve({ data: { data: [] } } as any);
    });
  });

  it("renders setup welcome page", () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome to Setup/i)).toBeInTheDocument();
  });

  it("renders Users section when Users is clicked", async () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Users"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/users");
    });

    expect(await screen.findByText("jane@test.com")).toBeInTheDocument();
  });

  it("renders Roles section when Roles is clicked", async () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Roles"));

    expect(await screen.findByText("Roles Section")).toBeInTheDocument();
  });

  it("renders Profiles section when Profiles is clicked", async () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Profiles"));

    expect(await screen.findByText("Profiles Section")).toBeInTheDocument();
  });

  it("renders Sharing Settings section when Sharing Settings is clicked", async () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Sharing Settings"));

    expect(
      await screen.findByText("Sharing Settings Section")
    ).toBeInTheDocument();
  });

  it("renders Company Information section when Company Information is clicked", async () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Company Information"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/company-information");
    });

    expect(await screen.findByDisplayValue("TheNucleus")).toBeInTheDocument();
  });

  it("filters setup sidebar with Quick Find", () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText("Quick Find"), {
      target: { value: "Sharing" },
    });

    expect(screen.getByText("Sharing Settings")).toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
    expect(screen.queryByText("Roles")).not.toBeInTheDocument();
  });

  it("redirects to login when token is missing", () => {
    localStorage.removeItem("token");

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    expect(screen.getByText("Navigate to /login")).toBeInTheDocument();
  });
});