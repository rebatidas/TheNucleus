# Sprint 2

## Sprint 2 Work Completed

During Sprint 2, we completed the core CRM workflows for authentication, customer management, and case management across both frontend and backend.

### Functional work completed
- Implemented **user registration** flow
- Implemented **user login** flow with token handling and redirect to dashboard
- Implemented **Customers list page**
- Implemented **Create Customer** flow from the Customers page
- Implemented **Customer Record** page
- Implemented **related Cases section** on the Customer Record page
- Implemented **Create Case from Customer Related List** flow
- Implemented **Cases list page**
- Implemented **Create Case from Cases page** flow
- Added stable test selectors (`data-cy`) to frontend components for automated testing
- Added frontend unit tests with **Vitest + React Testing Library**
- Added end-to-end frontend test with **Cypress**
- Added backend unit/controller tests with **Go test**, **Gin test routing**, and **httptest**

---

## Frontend Tests

### Cypress Test
#### 1. `customer-case-flow.cy.ts`
This end-to-end test validates the main user workflow through the browser:
- Register a new user
- Login with that user
- Navigate to Customers
- Create a new customer
- Open the customer record page
- Create a new case from the customer related list
- Verify the flow works successfully end-to-end

### Frontend Unit Tests (Vitest)
#### 1. `Login.test.tsx`
Covers:
- Login page renders correctly
- Successful login stores token and redirects to dashboard
- Invalid login shows error message

#### 2. `Customers.test.tsx`
Covers:
- Customers list renders from API data
- New customer can be created successfully
- User is redirected to the created customer record page

#### 3. `CustomerRecord.test.tsx`
Covers:
- Customer details render correctly
- Related cases render correctly
- New case can be created from the customer related list

#### 4. `Cases.test.tsx`
Covers:
- Cases list renders from API data
- New case can be created from the Cases page
- User is redirected to the created case record page

### Frontend Test Result Summary
- Frontend unit tests passed successfully
- Cypress flow passed successfully for the main customer + related case workflow

---

## Backend Unit Tests

### 1. `auth_controller_test.go`
Covers:
- `TestRegisterSuccess`
- `TestRegisterDuplicateEmail`
- `TestLoginSuccess`
- `TestLoginInvalidPassword`

### 2. `customer_controller_test.go`
Covers:
- `TestCreateCustomerSuccess`
- `TestGetCustomersSuccess`
- `TestGetCustomerByIDSuccess`

### 3. `case_controller_test.go`
Covers:
- `TestCreateCaseSuccess`
- `TestGetCasesSuccess`
- `TestGetCasesByCustomerIDSuccess`

### Backend Test Result Summary
All backend controller tests passed successfully using:
- Go test
- Gin test router
- `httptest`
- test database setup for isolated execution

---

## Backend API Documentation

Base URL:
- `http://localhost:8080`

### Authentication APIs

#### POST `/api/auth/register`
Registers a new user.

**Request Body**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Password123"
}
```

**Success Response**
- Status: `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully"
}
```

**Failure Response**
- Status: `400 Bad Request`

```json
{
  "success": false,
  "message": "Email already exists"
}
```

---

#### POST `/api/auth/login`
Logs in an existing user.

**Request Body**
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```

**Success Response**
- Status: `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here"
  }
}
```

**Failure Response**
- Status: `401 Unauthorized`

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### Customer APIs

#### GET `/api/customers`
Returns all customers.

**Success Response**
- Status: `200 OK`

```json
{
  "data": [
    {
      "ID": 1,
      "salutation": "Mr.",
      "first_name": "John",
      "middle_name": "M",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "shipping_address": "123 Ship Street",
      "billing_address": "456 Bill Street"
    }
  ]
}
```

---

#### POST `/api/customers`
Creates a new customer.

**Request Body**
```json
{
  "salutation": "Mr.",
  "first_name": "John",
  "middle_name": "M",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "shipping_address": "123 Ship Street",
  "billing_address": "456 Bill Street"
}
```

**Success Response**
- Status: `200 OK` or `201 Created`

```json
{
  "data": {
    "ID": 1,
    "salutation": "Mr.",
    "first_name": "John",
    "middle_name": "M",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "shipping_address": "123 Ship Street",
    "billing_address": "456 Bill Street"
  }
}
```

---

#### GET `/api/customers/:id`
Returns a customer by ID.

**Success Response**
- Status: `200 OK`

```json
{
  "data": {
    "ID": 1,
    "salutation": "Mr.",
    "first_name": "John",
    "middle_name": "M",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "shipping_address": "123 Ship Street",
    "billing_address": "456 Bill Street"
  }
}
```

---

#### PUT `/api/customers/:id`
Updates an existing customer.

**Request Body**
```json
{
  "salutation": "Mr.",
  "first_name": "John",
  "middle_name": "M",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "shipping_address": "123 Ship Street",
  "billing_address": "456 Bill Street"
}
```

**Success Response**
- Status: `200 OK`

```json
{
  "data": {
    "ID": 1,
    "salutation": "Mr.",
    "first_name": "John",
    "middle_name": "M",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "shipping_address": "123 Ship Street",
    "billing_address": "456 Bill Street"
  }
}
```

---

#### DELETE `/api/customers/:id`
Deletes a customer by ID.

**Success Response**
- Status: `200 OK`

```json
{
  "message": "Customer deleted successfully"
}
```

---

### Case APIs

#### GET `/api/cases`
Returns all cases.

**Success Response**
- Status: `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "case_number": "CASE-1001",
      "status": "New",
      "subject": "Printer issue",
      "description": "Printer not working",
      "resolution": "",
      "customer_id": 10
    }
  ]
}
```

---

#### POST `/api/cases`
Creates a new case.

**Request Body**
```json
{
  "customer_id": 10,
  "subject": "Login problem",
  "description": "Cannot log in",
  "status": "New",
  "resolution": "Pending"
}
```

**Success Response**
- Status: `200 OK` or `201 Created`

```json
{
  "data": {
    "id": 2,
    "case_number": "CASE-1002",
    "status": "New",
    "subject": "Login problem",
    "description": "Cannot log in",
    "resolution": "Pending",
    "customer_id": 10
  }
}
```

---

#### GET `/api/cases/:id`
Returns a case by ID.

**Success Response**
- Status: `200 OK`

```json
{
  "data": {
    "id": 2,
    "case_number": "CASE-1002",
    "status": "New",
    "subject": "Login problem",
    "description": "Cannot log in",
    "resolution": "Pending",
    "customer_id": 10
  }
}
```

---

#### PUT `/api/cases/:id`
Updates an existing case.

**Request Body**
```json
{
  "customer_id": 10,
  "subject": "Updated subject",
  "description": "Updated description",
  "status": "In Progress",
  "resolution": "Pending"
}
```

**Success Response**
- Status: `200 OK`

```json
{
  "data": {
    "id": 2,
    "case_number": "CASE-1002",
    "status": "In Progress",
    "subject": "Updated subject",
    "description": "Updated description",
    "resolution": "Pending",
    "customer_id": 10
  }
}
```

---

#### DELETE `/api/cases/:id`
Deletes a case by ID.

**Success Response**
- Status: `200 OK`

```json
{
  "message": "Case deleted successfully"
}
```

---

#### GET `/api/customer-cases/:customerId`
Returns all cases related to a specific customer.

**Success Response**
- Status: `200 OK`

```json
{
  "data": [
    {
      "id": 2,
      "case_number": "CASE-1002",
      "status": "New",
      "subject": "Login problem",
      "description": "Cannot log in",
      "resolution": "Pending",
      "customer_id": 10
    }
  ]
}
```

---

## Commands Used for Testing

### Frontend unit tests
```bash
npm run test
```

### Cypress
```bash
npm run cy:open
```

### Backend tests
```bash
go test ./controllers -v
go test ./...
```
