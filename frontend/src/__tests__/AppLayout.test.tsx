import React from "react";
import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AppLayout from "../components/AppLayout";

test("clicking sidebar Dashboard navigates to /dashboard", async () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<AppLayout><div>Home</div></AppLayout>} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>
  );

  const user = userEvent.setup();
  const dashboardItem = screen.getByText("Dashboard");
  await user.click(dashboardItem);

  expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
});
