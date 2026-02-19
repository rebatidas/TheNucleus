📌 Sprint_1 Goal

The goal of Sprint 1 was to build the foundational skeleton of TheNucleus CRM, including authentication, protected routing, backend API setup, PostgreSQL integration, and initial customer creation functionality.
This sprint focused on establishing the core architecture so future CRM features (cases, reports, workflows, etc.) can be built on top of a stable system.

🧾 User Stories
✅ US-1: User Registration
  As a new user,
  I want to register with my name, email, and password,so that I can create an account in TheNucleus.

❌ US-2: Case Creation Form
  As a logged-in user,I want to create a new case record,so that service requests can be tracked inside the CRM.
  Status: Not Completed
  Due to time constraints, we prioritized authentication and customer management first.
  The case creation form and corresponding backend logic will be implemented in Sprint 2.

✅ US-3: Protected Dashboard
  As a logged-in user,I want to access a protected dashboard page,so that unauthorized users cannot view system content.

✅ US-4: Customer Creation & Database Storage
  As a logged-in user,I want to create a new customer record,so that customer information is stored and managed inside TheNucleus CRM.

🛠 Issues Planned for Sprint 1
We planned and created issues for:
  - Authentication API (Register + Login)
  - JWT token handling
  - Protected frontend routing
  - PostgreSQL integration
  - User table creation
  - Customer table creation
  - Customer creation endpoint
  - Salesforce-style UI layout

✅ Successfully Completed
The following items were completed:
  - Go backend server setup using Gin
  - PostgreSQL database integration
  - User registration API
  - JWT token generation
  - Protected frontend routing
  - React + TypeScript frontend setup using Vite
  - Dashboard Layout
  - Customer creation form
  - Customer API endpoint
  - Customer database insertion
  - CORS configuration


🧱 Architecture Established
Backend (Go + Gin)
- REST API structure
- JWT middleware
- Modular controllers, models, routes
- PostgreSQL database integration
- Frontend (React + TypeScript)
- Routing with React Router
- ProtectedRoute implementation
- Registration page
- Dashboard layout
- Customer creation page
- Axios API integration

🎯 Sprint 1 Outcome

By the end of Sprint 1, we successfully built a working full-stack CRM foundation with:
  1. User registration
  2. Protected routes
  3. Customer data persistence
  4. Modern CRM-style UI
  5. GitHub-based team workflow

Sprint 1 establishes a strong architectural base for expanding TheNucleus into a fully featured CRM in upcoming sprints.
