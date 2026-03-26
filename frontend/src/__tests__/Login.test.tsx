import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import { vi, beforeEach, test, expect } from "vitest";

// mock the api module before importing the Login component
vi.mock("../api/client", () => {
  return {
    api: {
      post: vi.fn().mockResolvedValue({ data: { data: { token: "test-token" } } }),
    },
    setAuthToken: vi.fn(),
  };
});

import Login from "../pages/Login";

beforeEach(() => {
  if (typeof localStorage === "undefined") {
    // minimal localStorage mock for non-jsdom environments
    // @ts-ignore
    globalThis.localStorage = {
      _data: {} as Record<string, string>,
      getItem(key: string) { return this._data[key] ?? null; },
      setItem(key: string, val: string) { this._data[key] = String(val); },
      removeItem(key: string) { delete this._data[key]; },
      clear() { this._data = {}; },
    };
  }
  localStorage.clear();
});

test("successful login stores token and navigates to /dashboard", async () => {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>
  );

  const user = userEvent.setup();

  const email = screen.getByLabelText(/Email/i);
  const password = screen.getByLabelText(/Password/i);
  const submit = screen.getByRole("button", { name: /Login/i });

  await user.type(email, "test@email.com");
  await user.type(password, "pass");
  await user.click(submit);

  await waitFor(() => expect(localStorage.getItem("token")).toBe("test-token"));
  expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
});
