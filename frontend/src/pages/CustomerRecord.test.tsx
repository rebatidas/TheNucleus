import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomerRecord from "./CustomerRecord";
import { api } from "../api/client";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "1" }),
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
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("CustomerRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders customer details and related cases", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          data: {
            ID: 1,
            salutation: "Mr.",
            first_name: "John",
            middle_name: "",
            last_name: "Doe",
            email: "john@test.com",
            phone: "1234567890",
            shipping_address: "Ship address",
            billing_address: "Bill address",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 10,
              case_number: "CASE-001",
              status: "New",
              subject: "Printer issue",
              description: "Printer not working",
              resolution: "",
              customer_id: 1,
            },
          ],
        },
      } as any);

    render(
      <MemoryRouter>
        <CustomerRecord />
      </MemoryRouter>
    );

    expect(await screen.findByText("Mr. John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@test.com")).toBeInTheDocument();
    expect(screen.getByText("Printer issue")).toBeInTheDocument();
    expect(screen.getByText("CASE-001")).toBeInTheDocument();
  });

  it("creates a new case for the customer", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: {
          data: {
            ID: 1,
            salutation: "Mr.",
            first_name: "John",
            middle_name: "",
            last_name: "Doe",
            email: "john@test.com",
            phone: "1234567890",
            shipping_address: "Ship address",
            billing_address: "Bill address",
          },
        },
      } as any)
      .mockResolvedValueOnce({
        data: {
          data: [],
        },
      } as any);

    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          id: 11,
          case_number: "CASE-002",
          status: "New",
          subject: "Login problem",
          description: "Cannot log in",
          resolution: "Pending",
          customer_id: 1,
        },
      },
    } as any);

    render(
      <MemoryRouter>
        <CustomerRecord />
      </MemoryRouter>
    );

    expect(await screen.findByText("Mr. John Doe")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^new$/i }));

    await screen.findByText("New Case");

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
        subject: "Login problem",
        description: "Cannot log in",
        status: "New",
        resolution: "Pending",
        customer_id: 1,
      });
    });

    expect(await screen.findByText("Login problem")).toBeInTheDocument();
    expect(screen.getByText("CASE-002")).toBeInTheDocument();
  });
});