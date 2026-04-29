import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CaseRecord from "./CaseRecord";
import { api } from "../api/client";

const mockNavigate = vi.fn();

const permissionState = {
  caseView: true,
  caseEdit: true,
  caseDelete: true,
  visibleFields: new Set<string>([
    "case_number",
    "status",
    "subject",
    "description",
    "customer_id",
    "resolution",
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
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../hooks/usePermissions", () => ({
  usePermissions: () => ({
    canViewObject: (objectName: string) =>
      objectName === "Cases" ? permissionState.caseView : true,
    canCreateObject: () => true,
    canEditObject: (objectName: string) =>
      objectName === "Cases" ? permissionState.caseEdit : true,
    canDeleteObject: (objectName: string) =>
      objectName === "Cases" ? permissionState.caseDelete : true,
    isFieldVisible: (objectName: string, fieldName: string) =>
      objectName !== "Cases" || permissionState.visibleFields.has(fieldName),
    isFieldReadOnly: (objectName: string, fieldName: string) =>
      objectName === "Cases" && permissionState.readOnlyFields.has(fieldName),
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/cases/10"]}>
      <Routes>
        <Route path="/cases/:id" element={<CaseRecord />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("CaseRecord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.caseView = true;
    permissionState.caseEdit = true;
    permissionState.caseDelete = true;
    permissionState.visibleFields = new Set([
      "case_number",
      "status",
      "subject",
      "description",
      "customer_id",
      "resolution",
    ]);
    permissionState.readOnlyFields = new Set();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/cases/10") {
        return Promise.resolve({
          data: {
            data: {
              id: 10,
              case_number: "CASE-1010",
              status: "New",
              subject: "Printer issue",
              description: "Printer jam",
              resolution: "Pending",
              customer_id: 9,
              created_date: "2026-04-01T00:00:00Z",
              last_modified_date: "2026-04-01T00:00:00Z",
              customer: {
                ID: 9,
                salutation: "Mr.",
                first_name: "John",
                middle_name: "",
                last_name: "Doe",
                email: "john@test.com",
                phone: "1234567890",
              },
            },
          },
        } as any);
      }

      if (url === "/api/customers") {
        return Promise.resolve({
          data: {
            data: [
              {
                ID: 9,
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
  });

  it("renders case record details", async () => {
    renderPage();

    expect(await screen.findAllByText("CASE-1010")).toHaveLength(2);
    expect(screen.getByText("Printer issue")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows no access message when case view is missing", () => {
    permissionState.caseView = false;
    renderPage();

    expect(
      screen.getByText(/you do not have access to this record/i)
    ).toBeInTheDocument();
  });

  it("hides edit and delete buttons when object permissions are missing", async () => {
    permissionState.caseEdit = false;
    permissionState.caseDelete = false;

    renderPage();

    await screen.findAllByText("CASE-1010");

    expect(
      screen.queryByRole("button", { name: /^edit$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^delete$/i })
    ).not.toBeInTheDocument();
  });

  it("hides invisible fields", async () => {
    permissionState.visibleFields = new Set(["subject"]);

    renderPage();

    await screen.findByText("Printer issue");

    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.queryByText("Case Number")).not.toBeInTheDocument();
    expect(screen.queryByText("Resolution")).not.toBeInTheDocument();
  });

  it("disables read-only fields in edit modal", async () => {
    permissionState.readOnlyFields = new Set(["subject", "resolution"]);

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: /^edit$/i }));
    await screen.findByText("Edit Case");

    expect(screen.getByLabelText(/subject/i)).toBeDisabled();
    expect(screen.getByLabelText(/resolution/i)).toBeDisabled();
  });
});