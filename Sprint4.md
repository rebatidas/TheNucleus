## Detail work completed in Sprint 4

During Sprint 4, we focused on implementing advanced security features and dashboard functionality for TheNucleus CRM, including profile-based access control, record-level security, and a Salesforce-style dashboard.

---

## Profiles and Field-Level Security (US-15)

### Profiles Module

* Added **Profiles section** in Setup navigation
* Displayed list of profiles
* Enabled navigation to Profile Detail page
* Added configuration sections:

  * Object Permissions
  * Field-Level Security

### Object Permissions

* Implemented backend model for Object Permissions
* Added APIs to:

  * Fetch object permissions
  * Update object permissions
* Supported permissions:

  * View
  * Create
  * Edit
  * Delete
* Enforced object-level security:

  * Hidden objects not visible in UI
  * Unauthorized API access blocked

### Field-Level Security

* Implemented backend model for Field Permissions
* Added APIs to:

  * Fetch field permissions
  * Update field permissions
* Supported:

  * Visible
  * Read Only
* Enforced in frontend:

  * Hidden fields not rendered
  * Read-only fields disabled

### Frontend Security Enforcement

* Integrated `usePermissions` hook
* Applied across:

  * Customers
  * Cases
  * Customer Record
* Enforced:

  * Conditional field rendering
  * Read-only input states
  * Permission-based UI actions

---

## Org-Wide Defaults and Record-Level Access (US-16)

### Sharing Settings

* Added **Sharing Settings section** in Setup
* Implemented UI for configuring Org-Wide Defaults
* Supported objects:

  * Customers
  * Cases
* Supported access levels:

  * Private
  * Public Read Only
  * Public Read/Write

### Backend OWD Implementation

* Created OrgWideDefault model
* Added APIs to:

  * Fetch OWD settings
  * Update OWD settings
* Implemented default access behavior

### Role-Based Record Access

* Implemented role hierarchy access
* Parent roles inherit access from child roles
* Built helper logic for resolving accessible users

### Record-Level Security Enforcement

* Enforced in backend APIs:

  * Customers
  * Cases
* Implemented:

  * My Customers / My Cases filtering
  * All Customers / All Cases filtering based on OWD + role hierarchy
* Ensured unauthorized records are not returned

### Recently Viewed Records

* Implemented tracking for:

  * Customers
  * Cases
* Added APIs for logging and retrieving recently viewed records

---

## Dashboard (US-17)

### Dashboard Page

* Set Dashboard as landing page after login
* Built UI using Ant Design and Recharts

### Cases by Stage

* Displayed pie chart of cases assigned to logged-in user
* Grouped by status:

  * New
  * In Progress
  * Closed
* Each slice shows count of cases

### Stage-Based Case Filtering

* Clicking a slice filters cases by selected stage
* Displayed:

  * Case Number
  * Subject
  * Status
  * Customer
* Enabled navigation to Case Record page

### Recently Viewed Cases

* Displayed latest 5 recently viewed cases
* Sorted by most recent
* User-specific data
* Clickable navigation

### Recently Viewed Customers

* Displayed latest 5 recently viewed customers
* Sorted by most recent
* User-specific data
* Clickable navigation

---

## Frontend Unit and Cypress Tests

Frontend unit tests were written using:

* Vitest
* React Testing Library

End-to-end tests were written using:

* Cypress

### Customers

* Verified list rendering
* Verified list views:

  * All Customers
  * My Customers
  * Recently Viewed
* Verified customer creation
* Verified navigation to record page
* Verified:

  * Object-level access restrictions
  * Field visibility enforcement
  * Read-only field enforcement

### Cases

* Verified list rendering
* Verified list views:

  * All Cases
  * My Cases
  * Recently Viewed
* Verified case creation
* Verified permission-based UI behavior

### Customer Record

* Verified record details rendering
* Verified edit/delete actions based on permissions
* Verified related cases visibility
* Verified field-level enforcement

### Dashboard

* Verified pie chart rendering
* Verified case grouping by stage
* Verified slice click filtering
* Verified recently viewed sections

### Setup

* Verified navigation:

  * Users
  * Roles
  * Profiles
  * Sharing Settings
  * Company Information
* Verified Sharing Settings functionality

### Cypress Tests

* Login flow
* Customer creation flow
* Case creation flow
* Profile security behavior
* End-to-end navigation across modules

---

## Backend Unit Tests

Backend unit tests were written using:

* Go testing package (`testing`)

### Customer Controller

* Create customer
* Fetch customers
* Fetch customer by ID
* Verified:

  * Object permissions
  * Field-level security
  * OWD enforcement
  * Role hierarchy access
* Verified:

  * My Customers filtering
  * Recently viewed filtering

### Case Controller

* Create case
* Fetch cases
* Fetch case by ID
* Verified:

  * My Cases filtering
  * OWD enforcement
  * Role hierarchy access

### Recently Viewed Controller

* Logging viewed records
* Fetching recently viewed records

### Org-Wide Defaults Controller

* Fetch OWD settings
* Update OWD settings

---

## Updated Backend API Documentation

### Org-Wide Defaults

* `GET /api/org-wide-defaults`
* `PUT /api/org-wide-defaults`

**Request body:**

```json
[
  {
    "object_name": "Customers",
    "access_level": "Private"
  },
  {
    "object_name": "Cases",
    "access_level": "PublicReadWrite"
  }
]
```

---

### Recently Viewed

* `POST /api/recently-viewed/customers/:id`
* `POST /api/recently-viewed/cases/:id`
* `GET /api/recently-viewed/customers`
* `GET /api/recently-viewed/cases`

---

### Cases (Dashboard Usage)

* `GET /api/cases?view=my_cases`
* `GET /api/cases?view=all_cases`

---

## Summary

Sprint 4 introduced:

* Profile-based object and field-level security
* Org-wide defaults and role hierarchy-based record access
* Backend enforcement of all access rules
* Dashboard with case distribution and recently viewed records
* Comprehensive frontend and backend test coverage

