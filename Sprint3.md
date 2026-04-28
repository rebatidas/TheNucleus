# Sprint 3

## Detail work completed in Sprint 3

During Sprint 3, we focused on building the Setup module and its administrative functionality for TheNucleus CRM.

### Setup Module
- Implemented a Salesforce-style Setup page that opens in a new tab from the gear icon in the header
- Added a blue Setup header with gear menu access
- Added Setup landing page with welcome message for the logged-in user
- Added left-side Setup navigation panel with Quick Find search
- Added navigation items for:
  - Users
  - Roles
  - Company Information

### Company Information
- Created backend model for Company Information
- Added backend controller and API routes for Company Information
- Implemented create-once behavior for Company Information
- Implemented edit functionality for existing Company Information
- Added frontend Company Information form in Setup
- Displayed saved Company Information in Setup

### Users Management
- Updated backend User model to support:
  - First Name
  - Last Name
  - Username
  - Email
  - Role ID
- Added backend APIs to:
  - fetch all users
  - fetch a user by ID
  - update a user
- Added Users table inside Setup
- Added user edit modal in Setup
- Allowed editing of:
  - First Name
  - Last Name
  - Username
  - Email

### Roles Management with Hierarchy
- Created backend Role model
- Added backend controller and API routes for Roles
- Implemented hierarchical roles using parent-child relationships
- Displayed company name from Company Information as the root node of the hierarchy
- Added ability to create top-level roles
- Added ability to create child roles under existing roles
- Added ability to edit roles
- Added roles hierarchy UI in the frontend

### Add Roles to Users
- Added role assignment in the User edit modal
- Saved role assignment to the user record in the backend
- Displayed assigned role in the Users table

---

## Frontend unit tests

Frontend unit tests were written using:
- Vitest
- React Testing Library

Frontend unit tests completed for Setup functionality include:

### Setup / Company Information / Users
- Verified Setup welcome screen displays the logged-in user’s name
- Verified Company Information section displays existing company data
- Verified Company Information create form is shown when no record exists
- Verified Users table loads and displays users correctly
- Verified user edit modal opens correctly
- Verified updating a user submits the correct data
- Verified assigning a role to a user submits the correct role ID

### Roles
- Verified Roles section displays the company root node
- Verified existing role hierarchy renders correctly
- Verified a new top-level role can be created
- Verified an existing role can be edited

---

## Backend unit tests

Backend unit tests were written using:
- Go testing package (`testing`)

Backend unit tests completed include:

### Auth Controller
- Register success
- Register duplicate email failure
- Login success
- Login invalid password failure

### Company Information Controller
- Get company information when no record exists
- Create company information successfully
- Reject second company information record creation
- Update company information successfully

### Users Controller
- Get all users successfully
- Get user by ID successfully
- Update user successfully
- Update user role successfully

### Roles Controller
- Get all roles successfully
- Get role by ID successfully
- Create role successfully
- Create child role successfully
- Update role successfully

### Other existing backend tests
- Case controller tests
- Customer controller tests

---

## Updated backend API documentation

### Authentication
#### `POST /api/auth/register`
Registers a new user.

Request body:
```json
{
  "first_name": "Ankan",
  "last_name": "Ghosh",
  "username": "ankang",
  "email": "ankan@test.com",
  "password": "password123"
}
