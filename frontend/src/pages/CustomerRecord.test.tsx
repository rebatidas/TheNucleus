import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomerRecord from "./CustomerRecord";
import { api } from "../api/client";

const mockNavigate = vi.fn();

const permissionState = {
  customerView: true,
  customerEdit: true,
  customerDelete: true,
  caseView: true,
  caseCreate: true,
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
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../hooks/usePermissions", () => ({
  usePermissions: () => ({
    canViewObject: (objectName: string) => {
      if (objectName === "Customers") return permissionState.customerView;
      if (objectName === "Cases") return permissionState.caseView;
      return true;
    },
    canCreateObject: (objectName: string) => {
      if (objectName === "Cases") return permissionState.caseCreate;
      return true;
    },
    canEditObject: (objectName: string) =>
      objectName === "Customers" ? permissionState.customerEdit : true,
    canDeleteObject: (objectName: string) =>
      objectName === "Customers" ? permissionState.customerDelete : true,
    isFieldVisible: (objectName: string, fieldName: string) =>
      objectName !== "Customers" || permissionState.visibleFields.has(fieldName),
    isFieldReadOnly: (objectName: string, fieldName: string) =>
      objectName === "Customers" && permissionState.readOnlyFields.has(fieldName),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/customers/9"]}>
      <Routes>
        <Route path="/customers/:id" element={<CustomerRecord />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CustomerRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
<<<<<<< HEAD
    // Default: recently-viewed POST resolves silently so .catch() doesn't throw
    vi.mocked(api.post).mockResolvedValue({ data: {} } as any);
  });
=======
    permissionState.customerView = true;
    permissionState.customerEdit = true;
    permissionState.customerDelete = true;
    permissionState.caseView = true;
    permissionState.caseCreate = true;
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
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/customers/9") {
        return Promise.resolve({
          data: {
            data: {
              ID: 9,
              salutation: "Mr.",
              first_name: "Ankan",
              middle_name: "K",
              last_name: "Ghosh",
              email: "ankan@test.com",
              phone: "9999999999",
              shipping_address: "Ship",
              billing_address: "Bill",
            },
          },
        } as any);
      }

      if (url === "/api/customer-cases/9") {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 100,
                case_number: "CASE-100",
                subject: "Test subject",
                status: "New",
                customer_id: 9,
              },
            ],
          },
        } as any);
      }

      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });
  });

  it("renders customer record details", async () => {
    renderPage();

    expect(await screen.findByText("Mr. Ankan K Ghosh")).toBeInTheDocument();
    expect(screen.getByText("ankan@test.com")).toBeInTheDocument();
  });

  it("shows no access message when customer view is missing", () => {
    permissionState.customerView = false;

    renderPage();

    expect(
      screen.getByText(/you do not have access to this record/i)
    ).toBeInTheDocument();
  });

  it("hides edit and delete buttons when customer object permissions are missing", async () => {
    permissionState.customerEdit = false;
    permissionState.customerDelete = false;

    renderPage();

    await screen.findByText("Mr. Ankan K Ghosh");

    expect(
      screen.queryByRole("button", { name: /^edit$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^delete$/i })
    ).not.toBeInTheDocument();
  });

  it("hides related cases panel when case view is missing", async () => {
    permissionState.caseView = false;

    renderPage();

    await screen.findByText("Mr. Ankan K Ghosh");

    expect(screen.queryByText(/^Cases$/i)).not.toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalledWith("/api/customer-cases/9");
  });

  it("hides invisible fields", async () => {
    permissionState.visibleFields = new Set(["first_name"]);

    renderPage();

    await screen.findByText("First Name");

    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.queryByText("Email")).not.toBeInTheDocument();
    expect(screen.queryByText("Phone")).not.toBeInTheDocument();
  });

  it("disables read-only fields in edit modal", async () => {
    permissionState.readOnlyFields = new Set(["first_name", "email"]);

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /^edit$/i }));
    await screen.findByText("Edit Customer");

    expect(screen.getByLabelText(/first name/i)).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
  });

  it("creates related case from side panel", async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        data: {
          id: 222,
          case_number: "CASE-222",
          subject: "Fresh case",
          status: "New",
          customer_id: 9,
        },
      },
    } as any);

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /^new$/i }));
    await screen.findByText("New Case");

    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: "Fresh case" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/api/cases", {
        subject: "Fresh case",
        status: "New",
        customer_id: 9,
      });
    });
  });
});