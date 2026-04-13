import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Customers from "./Customers";
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

describe("Customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders customer list from API", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [
          {
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
        ],
      },
    } as any);

    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    expect(await screen.findByText("Mr. John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@test.com")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  it("creates a new customer and navigates to record page", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: [],
      },
    } as any);

    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          ID: 101,
          first_name: "Cypress",
          last_name: "User",
        },
      },
    } as any);

    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /^new$/i }));

    await screen.findByText("New Customer");

    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Cypress" },
    });
    fireEvent.change(screen.getByLabelText(/middle name/i), {
      target: { value: "M" },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: "User" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "cypress@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByLabelText(/shipping address/i), {
      target: { value: "123 Ship Street" },
    });
    fireEvent.change(screen.getByLabelText(/billing address/i), {
      target: { value: "456 Bill Street" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/customers", {
        first_name: "Cypress",
        middle_name: "M",
        last_name: "User",
        email: "cypress@test.com",
        phone: "9999999999",
        shipping_address: "123 Ship Street",
        billing_address: "456 Bill Street",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/customers/101");
  });
});