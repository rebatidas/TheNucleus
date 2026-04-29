import React from "react";
import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SetupProfilesSection from "./SetupProfilesSection";
import { api } from "../api/client";

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function findButtonByTextMatch(patterns: RegExp[]) {
  const buttons = screen.getAllByRole("button");
  return buttons.find((button) =>
    patterns.every((pattern) => pattern.test(button.textContent || ""))
  );
}

describe("SetupProfilesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads profiles list", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [{ ID: 1, name: "Give all access", description: "Full" }],
      },
    } as any);

    render(<SetupProfilesSection />);

    expect(await screen.findByText("Give all access")).toBeInTheDocument();
  });

  it("opens profile details when clicked", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/profiles") {
        return Promise.resolve({
          data: { data: [{ ID: 1, name: "Give all access", description: "" }] },
        } as any);
      }

      if (url === "/api/profiles/1") {
        return Promise.resolve({
          data: {
            data: {
              profile: { ID: 1, name: "Give all access", description: "" },
              object_permissions: [],
              field_permissions: [],
            },
          },
        } as any);
      }

      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });

    render(<SetupProfilesSection />);

    await userEvent.click(await screen.findByText("Give all access"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/profiles/1");
    });

    expect(
      screen.getByRole("heading", { name: "Give all access" })
    ).toBeInTheDocument();
  });

  it("creates a new profile", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [] },
    } as any);

    vi.mocked(api.post).mockResolvedValue({
      data: { data: { ID: 10, name: "Restricted User", description: "" } },
    } as any);

    render(<SetupProfilesSection />);

    await userEvent.click(screen.getByRole("button", { name: /new profile/i }));
    await userEvent.type(screen.getByLabelText(/profile name/i), "Restricted User");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/profiles", {
        name: "Restricted User",
      });
    });
  });

  it("updates object permissions", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/profiles") {
        return Promise.resolve({
          data: { data: [{ ID: 1, name: "Give all access", description: "" }] },
        } as any);
      }

      if (url === "/api/profiles/1") {
        return Promise.resolve({
          data: {
            data: {
              profile: { ID: 1, name: "Give all access", description: "" },
              object_permissions: [],
              field_permissions: [],
            },
          },
        } as any);
      }

      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });

    vi.mocked(api.put).mockResolvedValue({
      data: { message: "Object permissions updated successfully" },
    } as any);

    render(<SetupProfilesSection />);

    await userEvent.click(await screen.findByText("Give all access"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/profiles/1");
    });

    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);

    await userEvent.click(
      screen.getByRole("button", { name: /save object permissions/i })
    );

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/api/profiles/1/object-permissions",
        expect.any(Array)
      );
    });
  });

  it("updates field level security", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/profiles") {
        return Promise.resolve({
          data: { data: [{ ID: 1, name: "Give all access", description: "" }] },
        } as any);
      }

      if (url === "/api/profiles/1") {
        return Promise.resolve({
          data: {
            data: {
              profile: { ID: 1, name: "Give all access", description: "" },
              object_permissions: [],
              field_permissions: [],
            },
          },
        } as any);
      }

      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });

    vi.mocked(api.put).mockResolvedValue({
      data: { message: "Field permissions updated successfully" },
    } as any);

    render(<SetupProfilesSection />);

    await userEvent.click(await screen.findByText("Give all access"));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/profiles/1");
    });

    const fieldTab = screen.getByRole("tab", { name: /field-level security/i });
    await userEvent.click(fieldTab);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: /field-level security/i })
      ).toHaveAttribute("aria-selected", "true");
    });

    const customersToggles = await screen.findAllByText("Customers");
    await userEvent.click(customersToggles[1]);

    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);

    const saveFieldButton =
      findButtonByTextMatch([/save/i, /field/i]) ??
      screen.getByRole("button", { name: /save/i });

    await userEvent.click(saveFieldButton);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/api/profiles/1/field-permissions",
        expect.any(Array)
      );
    });
  });

  it("deletes a profile", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [{ ID: 1, name: "Give all access", description: "" }],
      },
    } as any);

    vi.mocked(api.delete).mockResolvedValue({
      data: { message: "Profile deleted successfully" },
    } as any);

    render(<SetupProfilesSection />);

    const deleteButtons = await screen.findAllByRole("button", { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    const yesButton = await screen.findByRole("button", { name: /^yes$/i });
    await userEvent.click(yesButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/api/profiles/1");
    });
  });
});