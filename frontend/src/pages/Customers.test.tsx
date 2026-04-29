import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Customers from "./Customers";
import { api } from "../api/client";

const mockNavigate = vi.fn();

const permissionState = {
  view: true,
  create: true,
  visibleFields: new Set<string>([
    "salutation",
    "first_name",
    "middle_name",
    "last_name",
    "email",
    "phone",
    "shipping_address",
    "billing_address",
  ]),
  readOnlyFields: new Set<string>(),
};

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

<<<<<<< HEAD
const customerFixture = {
  ID: 1,
  salutation: "Mr.",
  first_name: "John",
  middle_name: "",
  last_name: "Doe",
  email: "john@test.com",
  phone: "1234567890",
  shipping_address: "Ship address",
  billing_address: "Bill address",
};
=======
vi.mock("../hooks/usePermissions", () => ({
  usePermissions: () => ({
    canViewObject: (objectName: string) =>
      objectName === "Customers" ? permissionState.view : true,
    canCreateObject: (objectName: string) =>
      objectName === "Customers" ? permissionState.create : true,
    canEditObject: () => true,
    canDeleteObject: () => true,
    isFieldVisible: (objectName: string, fieldName: string) =>
      objectName !== "Customers" || permissionState.visibleFields.has(fieldName),
    isFieldReadOnly: (objectName: string, fieldName: string) =>
      objectName === "Customers" && permissionState.readOnlyFields.has(fieldName),
  }),
}));
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

describe("Customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.view = true;
    permissionState.create = true;
    permissionState.visibleFields = new Set([
      "salutation",
      "first_name",
      "middle_name",
      "last_name",
      "email",
      "phone",
      "shipping_address",
      "billing_address",
    ]);
    permissionState.readOnlyFields = new Set();
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

<<<<<<< HEAD
  it("defaults to All Customers view", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } } as any);
=======
  it("shows no access message when customer view permission is missing", async () => {
    permissionState.view = false;
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

<<<<<<< HEAD
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("view=all_customers")
      );
    });
  });

  it("fetches with my_customers view when My Customers is selected", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [customerFixture] },
=======
    expect(
      screen.getByText(/you do not have access to customers/i)
    ).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("hides New button when customer create permission is missing", async () => {
    permissionState.create = false;

    vi.mocked(api.get).mockResolvedValue({
      data: { data: [] },
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
    } as any);

    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

<<<<<<< HEAD
    await screen.findByText("Mr. John Doe");

    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } } as any);

    const select = document.querySelector(".ant-select-selector")!;
    fireEvent.mouseDown(select);

    const myOption = await screen.findByText("My Customers");
    fireEvent.click(myOption);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("view=my_customers")
      );
    });
  });

  it("fetches with recently_viewed when Recently Viewed is selected", async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: [customerFixture] },
=======
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/customers");
    });

    expect(
      screen.queryByRole("button", { name: /^new$/i })
    ).not.toBeInTheDocument();
  });

  it("hides fields that are not visible", async () => {
    permissionState.visibleFields = new Set(["first_name", "last_name"]);

    vi.mocked(api.get).mockResolvedValue({
      data: { data: [] },
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
    } as any);

    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

<<<<<<< HEAD
    await screen.findByText("Mr. John Doe");

    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } } as any);

    const select = document.querySelector(".ant-select-selector")!;
    fireEvent.mouseDown(select);

    const recentOption = await screen.findByText("Recently Viewed");
    fireEvent.click(recentOption);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("view=recently_viewed")
      );
    });
  });

  it("shows empty state when no customers are returned", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } } as any);
=======
    fireEvent.click(await screen.findByRole("button", { name: /^new$/i }));
    await screen.findByText("New Customer");

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();

    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/billing address/i)).not.toBeInTheDocument();
  });

  it("disables fields that are read only", async () => {
    permissionState.readOnlyFields = new Set(["email", "phone"]);

    vi.mocked(api.get).mockResolvedValue({
      data: { data: [] },
    } as any);
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

<<<<<<< HEAD
    expect(await screen.findByText("No customers found")).toBeInTheDocument();
=======
    fireEvent.click(await screen.findByRole("button", { name: /^new$/i }));
    await screen.findByText("New Customer");

    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/phone/i)).toBeDisabled();
    expect(screen.getByLabelText(/first name/i)).not.toBeDisabled();
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
  });
});