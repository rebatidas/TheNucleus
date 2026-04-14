import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupRolesSection from "./SetupRolesSection";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

import { api } from "../api/client";

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

describe("SetupRolesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows warning when company information is missing", () => {
    render(<SetupRolesSection companyInfo={null} />);

    expect(
      screen.getByText(/please create company information first/i)
    ).toBeInTheDocument();
  });

  it("renders company root and existing role hierarchy", async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          { ID: 1, label: "Support Manager", role_name: "support_manager" },
          {
            ID: 2,
            label: "Case Agent",
            role_name: "case_agent",
            reports_to_id: 1,
          },
        ],
      },
    });

    render(
      <SetupRolesSection
        companyInfo={{ organization_name: "UF Foundation" }}
      />
    );

    expect(await screen.findByText("UF Foundation")).toBeInTheDocument();
    expect(await screen.findByText("Support Manager")).toBeInTheDocument();
    expect(await screen.findByText("Case Agent")).toBeInTheDocument();
  });

  it("creates a new top-level role", async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [],
      },
    });

    mockedApi.post.mockResolvedValue({
      data: {
        message: "Role created successfully",
      },
    });

    render(
      <SetupRolesSection
        companyInfo={{ organization_name: "UF Foundation" }}
      />
    );

    await userEvent.click(await screen.findByRole("button", { name: /add role/i }));

    expect(await screen.findByText("New Role")).toBeInTheDocument();

    await userEvent.type(screen.getByRole("textbox", { name: /role label/i }), "Support Manager");
    await userEvent.type(screen.getByRole("textbox", { name: /role name/i }), "support_manager");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/api/roles", {
        label: "Support Manager",
        role_name: "support_manager",
        reports_to_id: null,
      });
    });
  });

  it("edits an existing role", async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        data: [
          { ID: 1, label: "Support Manager", role_name: "support_manager" },
        ],
      },
    });

    mockedApi.put.mockResolvedValue({
      data: {
        message: "Role updated successfully",
      },
    });

    render(
      <SetupRolesSection
        companyInfo={{ organization_name: "UF Foundation" }}
      />
    );

    expect(await screen.findByText("Support Manager")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /edit/i }));

    expect(await screen.findByText("Edit Role")).toBeInTheDocument();

    const labelInput = screen.getByRole("textbox", { name: /role label/i });
    await userEvent.clear(labelInput);
    await userEvent.type(labelInput, "Senior Support Manager");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedApi.put).toHaveBeenCalledWith("/api/roles/1", {
        label: "Senior Support Manager",
        role_name: "support_manager",
        reports_to_id: null,
      });
    });
  });
});