import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AppLayout from "../components/AppLayout";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn() },
  setAuthToken: vi.fn(),
}));

describe("AppLayout logout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders children", () => {
    render(
      <MemoryRouter>
        <AppLayout><div>Hello World</div></AppLayout>
      </MemoryRouter>
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("removes token from localStorage on logout", async () => {
    localStorage.setItem("token", "abc123");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<AppLayout><div>Home</div></AppLayout>} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // The settings icon button opens a dropdown with Logout
    const settingsBtn = screen.getByRole("button");
    fireEvent.mouseEnter(settingsBtn);
    fireEvent.click(settingsBtn);

    // Wait for dropdown to appear and click Logout
    const logout = await screen.findByText("Logout");
    fireEvent.click(logout);

    expect(localStorage.getItem("token")).toBeNull();
  });

  it("navigates to /dashboard when Dashboard sidebar item is clicked", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<AppLayout><div>Home</div></AppLayout>} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Dashboard"));
    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
  });
});
