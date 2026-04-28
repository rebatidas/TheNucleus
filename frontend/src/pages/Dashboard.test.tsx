import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";
import { api } from "../api/client";

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
  api: { get: vi.fn() },
}));

// Replace recharts with simple DOM equivalents so jsdom can render the dashboard
// without needing ResizeObserver or SVG support.
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({
    data,
    onClick,
  }: {
    data: Array<{ name: string; value: number }>;
    onClick?: (entry: { name: string; value: number }) => void;
    children?: React.ReactNode;
  }) => (
    <div data-testid="pie">
      {data?.map((entry) => (
        <button
          key={entry.name}
          data-testid={`slice-${entry.name.replace(/\s+/g, "-")}`}
          onClick={() => onClick?.(entry)}
        >
          {entry.name}: {entry.value}
        </button>
      ))}
    </div>
  ),
  Cell: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// ── fixtures ──────────────────────────────────────────────────────────────────

const customerA = {
  ID: 10,
  first_name: "John",
  last_name: "Doe",
  email: "john@test.com",
  phone: "1234567890",
};
const customerB = {
  ID: 11,
  first_name: "Jane",
  last_name: "Smith",
  email: "jane@test.com",
  phone: "0987654321",
};

const myCasesFixture = [
  {
    id: 1,
    case_number: "CASE-1001",
    status: "New",
    subject: "Printer issue",
    customer_id: 10,
    customer: customerA,
    created_date: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    case_number: "CASE-1002",
    status: "New",
    subject: "Network down",
    customer_id: 10,
    customer: customerA,
    created_date: "2026-01-02T00:00:00Z",
  },
  {
    id: 3,
    case_number: "CASE-1003",
    status: "In Progress",
    subject: "Login blocked",
    customer_id: 11,
    customer: customerB,
    created_date: "2026-01-03T00:00:00Z",
  },
  {
    id: 4,
    case_number: "CASE-1004",
    status: "Closed",
    subject: "Old ticket",
    customer_id: 10,
    customer: customerA,
    created_date: "2026-01-04T00:00:00Z",
  },
];

// Distinct IDs/subjects so they never collide with myCasesFixture in queries
const recentCasesFixture = [
  {
    id: 20,
    case_number: "CASE-2001",
    status: "New",
    subject: "Remote desktop broken",
    customer_id: 10,
    customer: customerA,
    created_date: "2026-02-01T00:00:00Z",
  },
  {
    id: 21,
    case_number: "CASE-2002",
    status: "In Progress",
    subject: "Email bounce",
    customer_id: 11,
    customer: customerB,
    created_date: "2026-02-02T00:00:00Z",
  },
];

const recentCustomersFixture = [
  {
    ID: 20,
    first_name: "Alice",
    last_name: "Cooper",
    email: "alice@test.com",
    phone: "1112223333",
  },
  {
    ID: 21,
    first_name: "Bob",
    last_name: "Taylor",
    email: "bob@test.com",
    phone: "4445556666",
  },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function mockApi({
  myCases = myCasesFixture,
  recentCases = recentCasesFixture,
  recentCustomers = recentCustomersFixture,
}: {
  myCases?: object[];
  recentCases?: object[];
  recentCustomers?: object[];
} = {}) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.includes("view=my_cases"))
      return Promise.resolve({ data: { data: myCases } } as any);
    if (url.includes("recently-viewed/cases"))
      return Promise.resolve({ data: { data: recentCases } } as any);
    if (url.includes("recently-viewed/customers"))
      return Promise.resolve({ data: { data: recentCustomers } } as any);
    return Promise.reject(new Error(`Unhandled GET: ${url}`));
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── section headings ────────────────────────────────────────────────────────

  it("renders all three section headings", async () => {
    mockApi();
    renderDashboard();

    expect(await screen.findByText("Cases by Stage")).toBeInTheDocument();
    expect(screen.getByText("Recently Viewed Cases")).toBeInTheDocument();
    expect(screen.getByText("Recently Viewed Customers")).toBeInTheDocument();
  });

  // ── API calls ───────────────────────────────────────────────────────────────

  it("fetches my cases, recently viewed cases, and recently viewed customers on mount", async () => {
    mockApi();
    renderDashboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("view=my_cases")
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("recently-viewed/cases")
      );
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining("recently-viewed/customers")
      );
    });
  });

  // ── Cases by Stage – pie chart ──────────────────────────────────────────────

  it("shows an empty state when the user has no cases", async () => {
    mockApi({ myCases: [] });
    renderDashboard();

    expect(
      await screen.findByText("No cases assigned to you")
    ).toBeInTheDocument();
  });

  it("renders a pie slice for each distinct status", async () => {
    mockApi();
    renderDashboard();

    // Two New, one In Progress, one Closed → three slices
    expect(await screen.findByTestId("slice-New")).toBeInTheDocument();
    expect(screen.getByTestId("slice-In-Progress")).toBeInTheDocument();
    expect(screen.getByTestId("slice-Closed")).toBeInTheDocument();
  });

  it("pie slices display the correct counts", async () => {
    mockApi();
    renderDashboard();

    expect(await screen.findByText("New: 2")).toBeInTheDocument();
    expect(screen.getByText("In Progress: 1")).toBeInTheDocument();
    expect(screen.getByText("Closed: 1")).toBeInTheDocument();
  });

  // ── Cases by Stage – stage panel ────────────────────────────────────────────

  it("clicking a slice opens the stage panel", async () => {
    mockApi();
    renderDashboard();

    // The Clear button only exists when a stage panel is open
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();

    fireEvent.click(await screen.findByTestId("slice-New"));

    expect(await screen.findByText("Clear")).toBeInTheDocument();
  });

  it("stage panel shows case number, subject, status, and customer for matching cases", async () => {
    mockApi();
    renderDashboard();

    fireEvent.click(await screen.findByTestId("slice-New"));

    // Both New cases appear
    expect(await screen.findByText("CASE-1001")).toBeInTheDocument();
    expect(screen.getByText("Printer issue")).toBeInTheDocument();
    expect(screen.getByText("CASE-1002")).toBeInTheDocument();
    expect(screen.getByText("Network down")).toBeInTheDocument();

    // Customer name rendered
    const customerNames = screen.getAllByText("John Doe");
    expect(customerNames.length).toBeGreaterThanOrEqual(1);
  });

  it("stage panel only shows cases belonging to the selected status", async () => {
    mockApi();
    renderDashboard();

    fireEvent.click(await screen.findByTestId("slice-New"));

    await screen.findByText("CASE-1001");

    // In Progress and Closed cases must not be in the panel
    expect(screen.queryByText("CASE-1003")).not.toBeInTheDocument();
    expect(screen.queryByText("CASE-1004")).not.toBeInTheDocument();
  });

  it("clicking the same slice a second time hides the stage panel", async () => {
    mockApi();
    renderDashboard();

    const slice = await screen.findByTestId("slice-New");
    fireEvent.click(slice);
    await screen.findByText("CASE-1001");

    fireEvent.click(slice);

    await waitFor(() => {
      expect(screen.queryByText("CASE-1001")).not.toBeInTheDocument();
    });
  });

  it("Clear button hides the stage panel", async () => {
    mockApi();
    renderDashboard();

    fireEvent.click(await screen.findByTestId("slice-New"));
    await screen.findByText("CASE-1001");

    fireEvent.click(screen.getByText("Clear"));

    await waitFor(() => {
      expect(screen.queryByText("CASE-1001")).not.toBeInTheDocument();
    });
  });

  it("clicking a different slice switches the panel to that stage", async () => {
    mockApi();
    renderDashboard();

    fireEvent.click(await screen.findByTestId("slice-New"));
    await screen.findByText("CASE-1001");

    fireEvent.click(screen.getByTestId("slice-In-Progress"));

    await screen.findByText("CASE-1003");
    expect(screen.queryByText("CASE-1001")).not.toBeInTheDocument();
  });

  it("stage panel case rows link to the case record page", async () => {
    mockApi();
    renderDashboard();

    fireEvent.click(await screen.findByTestId("slice-New"));

    const link = (await screen.findByText("CASE-1001")).closest("a");
    expect(link).toHaveAttribute("href", "/cases/1");
  });

  // ── Recently Viewed Cases ───────────────────────────────────────────────────

  it("renders recently viewed cases with case number and subject", async () => {
    mockApi();
    renderDashboard();

    expect(await screen.findByText("CASE-2001")).toBeInTheDocument();
    expect(screen.getByText("Remote desktop broken")).toBeInTheDocument();
    expect(screen.getByText("CASE-2002")).toBeInTheDocument();
    expect(screen.getByText("Email bounce")).toBeInTheDocument();
  });

  it("shows empty state when there are no recently viewed cases", async () => {
    mockApi({ recentCases: [] });
    renderDashboard();

    expect(
      await screen.findByText("No recently viewed cases")
    ).toBeInTheDocument();
  });

  it("recently viewed case rows link to the case record page", async () => {
    mockApi();
    renderDashboard();

    const link = (await screen.findByText("CASE-2001")).closest("a");
    expect(link).toHaveAttribute("href", "/cases/20");
  });

  // ── Recently Viewed Customers ───────────────────────────────────────────────

  it("renders recently viewed customers with name and email", async () => {
    mockApi();
    renderDashboard();

    expect(await screen.findByText("Alice Cooper")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Taylor")).toBeInTheDocument();
    expect(screen.getByText("bob@test.com")).toBeInTheDocument();
  });

  it("shows empty state when there are no recently viewed customers", async () => {
    mockApi({ recentCustomers: [] });
    renderDashboard();

    expect(
      await screen.findByText("No recently viewed customers")
    ).toBeInTheDocument();
  });

  it("recently viewed customer rows link to the customer record page", async () => {
    mockApi();
    renderDashboard();

    const link = (await screen.findByText("Alice Cooper")).closest("a");
    expect(link).toHaveAttribute("href", "/customers/20");
  });
});
