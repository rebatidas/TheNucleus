import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cases from "./Cases";
import { api } from "../api/client";

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
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      {title && <h1>{title}</h1>}
      {children}
    </div>
  ),
}));

vi.mock("../api/client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders cases list from API", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/cases") {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 1,
                case_number: "CASE-1001",
                status: "New",
                subject: "Printer issue",
                description: "Printer not working",
                resolution: "",
                customer_id: 10,
                customer: {
                  ID: 10,
                  salutation: "Mr.",
                  first_name: "John",
                  middle_name: "",
                  last_name: "Doe",
                  email: "john@test.com",
                  phone: "1234567890",
                },
                created_date: "2026-03-25T00:00:00Z",
                last_modified_date: "2026-03-25T00:00:00Z",
              },
            ],
          },
        } as any);
      }

      if (url === "/api/customers") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 10,
                salutation: "Mr.",
                first_name: "John",
                middle_name: "",
                last_name: "Doe",
                email: "john@test.com",
                phone: "1234567890",
              },
            ],
          },
        } as any);
      }

      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    expect(await screen.findByText("CASE-1001")).toBeInTheDocument();
    expect(screen.getByText("Printer issue")).toBeInTheDocument();
    expect(screen.getByText("Mr. John Doe")).toBeInTheDocument();
  });

  it("creates a new case and navigates to the case record page", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/cases") {
        return Promise.resolve({
          data: {
            data: [],
          },
        } as any);
      }

      if (url === "/api/customers") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 10,
                salutation: "Mr.",
                first_name: "John",
                middle_name: "",
                last_name: "Doe",
                email: "john@test.com",
                phone: "1234567890",
              },
            ],
          },
        } as any);
      }

      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });

    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          id: 2,
          case_number: "CASE-1002",
          status: "New",
          subject: "Login problem",
          description: "Cannot log in",
          resolution: "Pending",
          customer_id: 10,
        },
      },
    } as any);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /^new$/i }));

    const title = await screen.findByText("New Case");
    const modal = title.closest(".ant-modal") as HTMLElement;

    const selectBoxes = modal.querySelectorAll(".ant-select-selector");
    fireEvent.mouseDown(selectBoxes[0]);

    const customerOption = await screen.findByText("Mr. John Doe");
    fireEvent.click(customerOption);

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Login problem" },
    });

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Cannot log in" },
    });

    fireEvent.change(screen.getByLabelText(/resolution/i), {
      target: { value: "Pending" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/cases", {
        customer_id: 10,
        subject: "Login problem",
        description: "Cannot log in",
        status: "New",
        resolution: "Pending",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/cases/2");
  });
});