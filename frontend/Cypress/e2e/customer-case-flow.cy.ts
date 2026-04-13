describe("Customer and case flow", () => {
  it("registers, logs in, creates a customer, and creates a case", () => {
    const stamp = Date.now();

    const userName = `Cypress User ${stamp}`;
    const userEmail = `cypress_user_${stamp}@test.com`;
    const userPassword = "Password123";

    const firstName = "Cypress";
    const lastName = `Test${stamp}`;
    const customerEmail = `customer_${stamp}@test.com`;
    const customerPhone = `${stamp}`.slice(-10);
    const shippingAddress = "123 Cypress Street";
    const billingAddress = "456 Test Avenue";

    const caseSubject = `Case ${stamp}`;
    const caseDescription = "Created through Cypress";
    const caseResolution = "Pending";

    // Register new user
    cy.visit("http://localhost:5173/register");

    cy.get('[data-cy="register-name"]').type(userName);
    cy.get('[data-cy="register-email"]').type(userEmail);
    cy.get('[data-cy="register-password"] input').type(userPassword);
    cy.get('[data-cy="register-button"]').click();

    cy.url().should("include", "/login");

    // Login with that same user
    cy.get('[data-cy="login-email"]').type(userEmail);
    cy.get('[data-cy="login-password"] input').type(userPassword);
    cy.get('[data-cy="login-button"]').click();

    cy.url().should("include", "/dashboard");

    // Go to Customers
    cy.get('[data-cy="nav-customers"]').click();
    cy.url().should("include", "/customers");

    // Create customer
    cy.get('[data-cy="customers-page"]').should("be.visible");
    cy.get('[data-cy="customers-new-button"]').click();

    cy.get('[data-cy="new-customer-modal"]').should("be.visible");
    cy.get('[data-cy="customer-first-name"]').type(firstName);
    cy.get('[data-cy="customer-middle-name"]').type("Middle");
    cy.get('[data-cy="customer-last-name"]').type(lastName);
    cy.get('[data-cy="customer-email"]').type(customerEmail);
    cy.get('[data-cy="customer-phone"]').type(customerPhone);
    cy.get('[data-cy="customer-shipping-address"]').type(shippingAddress);
    cy.get('[data-cy="customer-billing-address"]').type(billingAddress);
    cy.get('[data-cy="customer-save-button"]').click();

    // Customer record page opens
    cy.get('[data-cy="customer-record-page"]').should("be.visible");
    cy.get('[data-cy="customer-name-header"]').should("contain", firstName);
    cy.get('[data-cy="customer-name-header"]').should("contain", lastName);

    // Create related case
    cy.get('[data-cy="customer-record-new-case-button"]').click();
    cy.get('[data-cy="new-case-modal"]').should("be.visible");

    cy.get('[data-cy="case-subject"]').type(caseSubject);
    cy.get('[data-cy="case-description"]').type(caseDescription);
    cy.get('[data-cy="case-resolution"]').type(caseResolution);
    cy.get('[data-cy="case-save-button"]').click();

    // Verify case is shown in related list
    cy.get('[data-cy="customer-cases-table"]').should("contain", caseSubject);
  });
});