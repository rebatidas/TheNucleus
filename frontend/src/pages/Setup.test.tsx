import React from "react";
<<<<<<< HEAD
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Setup from "./Setup";
=======
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
    Navigate: ({ to }: { to: string }) => <div>Redirected to {to}</div>,
  };
});
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
<<<<<<< HEAD
    post: vi.fn(),
    put: vi.fn(),
=======
    put: vi.fn(),
    post: vi.fn(),
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
  },
}));

vi.mock("../components/SetupRolesSection", () => ({
<<<<<<< HEAD
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
=======
  default: () => <div>Roles Section</div>,
}));

vi.mock("../components/SetupProfilesSection", () => ({
  default: () => <div>Profiles Section</div>,
}));

vi.mock("../hooks/usePermissions", () => ({
  usePermissions: () => ({
    permissions: {
      profile_id: null,
      object_permissions: [],
      field_permissions: [],
    },
    loading: false,
    hasProfile: false,
    canViewObject: () => true,
    canCreateObject: () => true,
    canEditObject: () => true,
    canDeleteObject: () => true,
    isFieldVisible: () => true,
    isFieldReadOnly: () => false,
  }),
}));
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

describe("Setup page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
<<<<<<< HEAD
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
=======

    const store: Record<string, string> = {
      token: "fake-token",
      user: JSON.stringify({
        id: 1,
        name: "Ankan Ghosh",
        first_name: "Ankan",
        last_name: "Ghosh",
        username: "ankang",
        email: "ankan@test.com",
      }),
    };

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

    vi.stubGlobal("open", vi.fn());
  });

  it("shows centered welcome message with logged in user's first name by default", () => {
    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    expect(screen.getByText(/hello! ankan/i)).toBeInTheDocument();
    expect(screen.getByText(/welcome to setup/i)).toBeInTheDocument();
  });

  it("loads and displays company information when Company Information is clicked", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
      if (url === "/api/company-information") {
        return Promise.resolve({
          data: {
            data: {
<<<<<<< HEAD
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
=======
              organization_name: "UF Foundation",
              website: "https://uff.ufl.edu",
              phone: "1234567890",
              street: "123 Main St",
              city: "Gainesville",
              state: "FL",
              postal_code: "32611",
              country: "USA",
            },
          },
        } as any);
      }

      return Promise.resolve({ data: { data: [] } } as any);
    });

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("Company Information"));
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

    expect(await screen.findByDisplayValue("UF Foundation")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://uff.ufl.edu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("shows create company information form when no record exists", async () => {
<<<<<<< HEAD
    mockedApi.get.mockImplementation((url: string) => {
=======
    vi.mocked(api.get).mockImplementation((url: string) => {
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
      if (url === "/api/company-information") {
        return Promise.resolve({
          data: {
            data: null,
          },
<<<<<<< HEAD
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
=======
        } as any);
      }

      return Promise.resolve({ data: { data: [] } } as any);
    });

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("Company Information"));

    expect(await screen.findByText("New Company Information")).toBeInTheDocument();
    expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
  });

  it("loads and displays users table when Users is clicked", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
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
<<<<<<< HEAD
                role_id: 1,
              },
            ],
          },
        });
=======
                role_id: 2,
                profile_id: 3,
              },
            ],
          },
        } as any);
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
      }

      if (url === "/api/roles") {
        return Promise.resolve({
          data: {
<<<<<<< HEAD
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
=======
            data: [{ ID: 2, label: "Admin", role_name: "admin" }],
          },
        } as any);
      }

      if (url === "/api/profiles") {
        return Promise.resolve({
          data: {
            data: [{ ID: 3, name: "Give all access" }],
          },
        } as any);
      }

      return Promise.resolve({ data: { data: [] } } as any);
    });

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(screen.getByText("Users"));
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(await screen.findByText("Ankan Ghosh")).toBeInTheDocument();
    expect(screen.getByText("ankang")).toBeInTheDocument();
<<<<<<< HEAD
    expect(screen.getByText("ankan@test.com")).toBeInTheDocument();
    expect(screen.getByText("Support Manager")).toBeInTheDocument();
  });

  it("opens edit user modal and submits updated user data with role", async () => {
    mockedApi.get.mockImplementation((url: string) => {
=======
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Give all access")).toBeInTheDocument();
  });

  it("opens edit user modal and submits updated user data with role and profile", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
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
<<<<<<< HEAD
                role_id: 1,
              },
            ],
          },
        });
=======
                role_id: 2,
                profile_id: 3,
              },
            ],
          },
        } as any);
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
      }

      if (url === "/api/roles") {
        return Promise.resolve({
          data: {
            data: [
<<<<<<< HEAD
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
=======
              { ID: 2, label: "Admin", role_name: "admin" },
              { ID: 4, label: "Case Agent", role_name: "case_agent" },
            ],
          },
        } as any);
      }

      if (url === "/api/profiles") {
        return Promise.resolve({
          data: {
            data: [
              { ID: 3, name: "Give all access" },
              { ID: 5, name: "Restricted User" },
            ],
          },
        } as any);
      }

      return Promise.resolve({ data: { data: [] } } as any);
    });

    vi.mocked(api.put).mockResolvedValue({
      data: {
        message: "User updated successfully",
      },
    } as any);

    render(
      <MemoryRouter>
        <Setup />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    await user.click(screen.getByText("Users"));
    expect(await screen.findByText("Ankan Ghosh")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(await screen.findByText("Edit User")).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, "ankan.updated@test.com");

    const roleInput = document.getElementById("role_id");
    if (!roleInput) {
      throw new Error("Role combobox not found");
    }
    await user.click(roleInput);
    await user.click(await screen.findByText("Case Agent"));

    const profileInput = document.getElementById("profile_id");
    if (!profileInput) {
      throw new Error("Profile combobox not found");
    }
    await user.click(profileInput);
    await user.click(await screen.findByText("Restricted User"));

    const modal = screen.getByRole("dialog");
    await user.click(within(modal).getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/api/users/1", {
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
        first_name: "Ankan",
        last_name: "Ghosh",
        username: "ankang",
        email: "ankan.updated@test.com",
<<<<<<< HEAD
        role_id: 2,
=======
        role_id: 4,
        profile_id: 5,
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
      });
    });
  });
});