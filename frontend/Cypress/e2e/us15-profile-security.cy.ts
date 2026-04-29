describe("US-15 Profile Access with Object and Field-Level Security", () => {
  it("logs in, goes to Customers, and opens the New Customer modal", () => {
    cy.visit("/login");

    cy.get('input[id="email"]').should("be.visible").clear().type("jhilik@test.com");
    cy.get('input[id="password"]').should("be.visible").clear().type("Jhilik123");
    cy.contains("button", /^login$/i).click();

    cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");

    cy.contains(/^customers$/i).click();

    cy.location("pathname", { timeout: 10000 }).should("include", "/customers");

    cy.contains("button", /^new$/i).should("be.visible").click();

    cy.contains(/^new customer$/i).should("be.visible");
    cy.get('input[id="first_name"]').should("be.visible");
    cy.get('input[id="last_name"]').should("be.visible");
  });
});