describe("Register and login flow", () => {
  it("creates a new account and logs in", () => {
    const email = `test${Date.now()}@example.com`;
    const password = "Password123";
    const name = "Test User";

    cy.visit("http://localhost:5173/login");

    cy.get('[data-cy="login-register-link"]').contains("Create an account").click();

    cy.url().should("include", "/register");

    cy.get('[data-cy="register-name"]').type(name);
    cy.get('[data-cy="register-email"]').type(email);
    cy.get('[data-cy="register-password"] input').type(password);
    cy.get('[data-cy="register-button"]').click();

    cy.url().should("include", "/login");

    cy.get('[data-cy="login-email"]').type(email);
    cy.get('[data-cy="login-password"] input').type(password);
    cy.get('[data-cy="login-button"]').click();

    cy.url().should("include", "/dashboard");
  });
});