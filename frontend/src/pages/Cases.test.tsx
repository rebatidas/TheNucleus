import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Cases from "./Cases";
import { api } from "../api/client";

const mockNavigate = vi.fn();

const permissionState = {
  view: true,
  create: true,
  customerCreate: true,
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
    post: vi.fn(),
  },
}));

<<<<<<< HEAD
const caseFixture = {
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
};

const customerFixture = {
  ID: 10,
  salutation: "Mr.",
  first_name: "John",
  middle_name: "",
  last_name: "Doe",
  email: "john@test.com",
  phone: "1234567890",
};

function mockGetForView(cases: object[]) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.startsWith("/api/cases")) {
      return Promise.resolve({ data: { data: cases } } as any);
    }
    if (url.startsWith("/api/customers")) {
      return Promise.resolve({
        data: { data: [customerFixture] },
      } as any);
    }
    return Promise.reject(new Error(`Unhandled GET url: ${url}`));
  });
}
=======
vi.mock("../hooks/usePermissions", () => ({
  usePermissions: () => ({
    canViewObject: (objectName: string) =>
      objectName === "Cases" ? permissionState.view : true,
    canCreateObject: (objectName: string) => {
      if (objectName === "Cases") return permissionState.create;
      if (objectName === "Customers") return permissionState.customerCreate;
      return true;
    },
    canEditObject: () => true,
    canDeleteObject: () => true,
    isFieldVisible: (objectName: string, fieldName: string) =>
      objectName !== "Cases" || permissionState.visibleFields.has(fieldName),
    isFieldReadOnly: (objectName: string, fieldName: string) =>
      objectName === "Cases" && permissionState.readOnlyFields.has(fieldName),
  }),
}));
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)

describe("Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    permissionState.view = true;
    permissionState.create = true;
    permissionState.customerCreate = true;
    permissionState.visibleFields = new Set([
      "case_number",
      "status",
      "subject",
      "description",
      "customer_id",
      "resolution",
    ]);
    permissionState.readOnlyFields = new Set();
  });

  it("renders cases list from API", async () => {
    mockGetForView([caseFixture]);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    expect(await screen.findByText("CASE-1001")).toBeInTheDocument();
    expect(screen.getByText("Printer issue")).toBeInTheDocument();
    expect(screen.getByText("Mr. John Doe")).toBeInTheDocument();
  });

  it("defaults to All Cases view", async () => {
    mockGetForView([]);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("view=all_cases")
      );
    });
  });

  it("fetches with my_cases view when My Cases is selected", async () => {
    mockGetForView([caseFixture]);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    await screen.findByText("CASE-1001");

    mockGetForView([]);

    const select = document.querySelector(".ant-select-selector")!;
    fireEvent.mouseDown(select);

    const myOption = await screen.findByText("My Cases");
    fireEvent.click(myOption);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("view=my_cases")
      );
    });
  });

  it("fetches with recently_viewed when Recently Viewed is selected", async () => {
    mockGetForView([caseFixture]);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    await screen.findByText("CASE-1001");

    mockGetForView([]);

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

  it("shows empty state when no cases are returned", async () => {
    mockGetForView([]);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    expect(await screen.findByText("No cases found")).toBeInTheDocument();
  });

  it("creates a new case and navigates to the case record page", async () => {
    mockGetForView([]);

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
<<<<<<< HEAD
});
=======

  it("shows no access message when case view permission is missing", () => {
    permissionState.view = false;

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/you do not have access to cases/i)
    ).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("hides New button when case create permission is missing", async () => {
    permissionState.create = false;

    vi.mocked(api.get).mockResolvedValue({
      data: { data: [] },
    } as any);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/api/cases");
    });

    expect(
      screen.queryByRole("button", { name: /^new$/i })
    ).not.toBeInTheDocument();
  });

  it("hides case fields that are not visible", async () => {
    permissionState.visibleFields = new Set(["subject"]);

    vi.mocked(api.get).mockResolvedValue({
      data: { data: [] },
    } as any);

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    expect(await screen.findByText("Subject")).toBeInTheDocument();
    expect(screen.queryByText("Case Number")).not.toBeInTheDocument();
    expect(screen.queryByText("Status")).not.toBeInTheDocument();
    expect(screen.queryByText("Customer")).not.toBeInTheDocument();
  });

  it("disables read-only case fields in create modal", async () => {
    permissionState.readOnlyFields = new Set(["subject", "status"]);

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/cases") {
        return Promise.resolve({ data: { data: [] } } as any);
      }
      if (url === "/api/customers") {
        return Promise.resolve({
          data: { data: [{ ID: 10, first_name: "John", last_name: "Doe" }] },
        } as any);
      }
      return Promise.reject(new Error(`Unhandled GET url: ${url}`));
    });

    render(
      <MemoryRouter>
        <Cases />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /^new$/i }));
    await screen.findByText("New Case");

    expect(screen.getByLabelText(/subject/i)).toBeDisabled();
  });
});
>>>>>>> ad7fbb6 (Complete US-15: profile access with object and field-level security)
