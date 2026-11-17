# User Management REST API

## Architecture, Implementation & Demo

**Technology:** Node.js · Express.js · TypeScript · MySQL · Prisma ·
MongoDB · Mongoose

------------------------------------------------------------------------

## Slide 1 --- Project Overview

-   A REST API for secure user management.
-   MySQL is the primary data store for user accounts.
-   MongoDB maintains a synchronized copy of user profile data.
-   The API supports authentication, role-based access control, user
    administration, validation, and soft deletion.
-   The backend follows a layered architecture and Repository Pattern.

**Project objective:** Build a maintainable backend that demonstrates
secure API design and controlled synchronization across two databases.

------------------------------------------------------------------------

## Slide 2 --- Technology Stack

  Area                 Technology
  -------------------- ----------------------------
  Runtime              Node.js
  Backend framework    Express.js
  Language             TypeScript
  Primary database     MySQL
  MySQL ORM            Prisma
  Secondary database   MongoDB
  MongoDB ODM          Mongoose
  Authentication       JWT in an HTTP-only cookie
  Password hashing     bcrypt
  Validation           Zod

------------------------------------------------------------------------

## Slide 3 --- Architecture

The request passes through the presentation, application, and
infrastructure layers.

``` text
Client / Postman
       |
     Routes
       |
  Middleware
(Auth / Role / Validation)
       |
  Controllers
       |
    Services
       |
Repository Interfaces
       |
Repository Implementations
       |
   +---+---+
   |       |
 MySQL  MongoDB
 Prisma  Mongoose
```

**Design goals** - Separate HTTP handling from business logic. - Keep
persistence details inside infrastructure. - Use repository interfaces
to reduce coupling. - Make the application easier to test and maintain.

------------------------------------------------------------------------

## Slide 4 --- Layer Responsibilities

  Layer                        Responsibility
  ---------------------------- ---------------------------------------------------------
  Routes                       Define API endpoints and connect middleware/controllers
  Middleware                   Authentication, role authorization, and request checks
  Controllers                  Handle HTTP requests and responses
  Services / Use cases         Apply application and business rules
  Repository interfaces        Define persistence contracts
  Repository implementations   Execute database operations
  Infrastructure               Configure databases, models, and security utilities

------------------------------------------------------------------------

## Slide 5 --- Dual-Database Design

### MySQL --- Source of Truth

-   Stores account information.
-   Stores the password hash.
-   Stores the user's role and account status.
-   Uses Prisma for database access.

### MongoDB --- Profile Copy

-   Stores profile fields such as user ID, name, email, role, and
    deletion status.
-   Does not store the password hash.
-   Uses Mongoose for database access.

**Important:** MySQL is authoritative. MongoDB is a synchronized profile
representation, not a second authentication database.

------------------------------------------------------------------------

## Slide 6 --- Synchronization Workflow

1.  Create or update the user in MySQL.
2.  Set `mongoSynced` to `false` when synchronization is pending.
3.  Attempt to upsert the profile in MongoDB.
4.  If the MongoDB operation succeeds, set `mongoSynced` to `true`.
5.  If it fails, the MySQL change remains and the sync flag indicates
    pending synchronization.

### Soft deletion

-   The user is marked as deleted in MySQL.
-   The MongoDB profile is updated with `isDeleted: true`.
-   The MongoDB document is retained rather than physically removed.

**Consistency note:** These two databases do not share one ordinary
atomic transaction. A failed MongoDB operation can leave synchronization
pending.

------------------------------------------------------------------------

## Slide 7 --- Authentication & Authorization

-   Registration creates a regular `USER` account.
-   Passwords are hashed with bcrypt.
-   Login issues a JWT in an HTTP-only cookie.
-   The JWT is not returned in the JSON response.
-   Authentication middleware verifies the token and checks the current
    active user in MySQL.
-   Authorization middleware checks the user's current role.

### Access control

-   `USER` accounts cannot access admin-only routes.
-   `ADMIN` accounts can access admin user-management routes.
-   Deleted or inactive accounts cannot continue using an old token.

------------------------------------------------------------------------

## Slide 8 --- Validation & Error Handling

-   Zod validates request bodies and query parameters.
-   Invalid input is rejected before business logic runs.
-   Centralized error handling produces consistent API errors.
-   Passwords are excluded from user response objects.
-   Duplicate email addresses are handled as a conflict.

Typical status codes: - `200` --- successful request - `201` ---
resource created - `400` --- invalid input - `401` --- missing or
invalid authentication - `403` --- insufficient permissions - `404` ---
user not found - `409` --- duplicate email - `500` --- unexpected server
error

------------------------------------------------------------------------

## Slide 9 --- API Endpoints

  Method   Endpoint                 Purpose
  -------- ------------------------ ------------------------
  GET      `/health`                Health check
  POST     `/api/auth/register`     Register a user
  POST     `/api/auth/login`        Log in
  GET      `/api/admin/users`       List users
  GET      `/api/admin/users/:id`   Get a user
  POST     `/api/admin/users`       Create a user as admin
  PATCH    `/api/admin/users/:id`   Update a user
  DELETE   `/api/admin/users/:id`   Soft-delete a user

The user list supports search, pagination, and sorting.

------------------------------------------------------------------------

## Slide 10 --- Demo Walkthrough

Suggested live demonstration:

1.  Start MySQL and MongoDB.
2.  Start the API server.
3.  Call `GET /health`.
4.  Register a user.
5.  Log in and inspect the HTTP-only cookie.
6.  Call the admin user-list endpoint as an authorized admin.
7.  Demonstrate search, pagination, and sorting.
8.  Create or update a user.
9.  Soft-delete a user and verify the deleted state.
10. Demonstrate that a deleted user cannot authenticate with an old
    token.

Use the Postman collection supplied with the project deliverables.

------------------------------------------------------------------------

## Slide 11 --- Security & Verification

Implemented security measures: - bcrypt password hashing. - JWT
authentication using an HTTP-only cookie. - Current-user lookup during
authentication. - Role-based authorization. - Zod request validation. -
Password exclusion from API responses. - Soft deletion and active-user
checks.

Verified authorization scenarios: - Missing cookie returns `401`. - A
regular user attempting an admin route receives `403`. - A deleted user
with an old token receives `401`. - Role changes are reflected because
the current role is loaded from MySQL.

------------------------------------------------------------------------

## Slide 12 --- Scope & Current Boundaries

Implemented: - Registration and login. - Admin user CRUD operations. -
Search, pagination, and sorting. - Soft deletion. - MySQL-to-MongoDB
profile synchronization attempts. - Authentication and role
authorization. - Request validation and centralized error handling.

Not currently included: - Logout endpoint. - User profile endpoint. -
Public/manual synchronization endpoint. - Scheduled background
synchronization worker.

**Closing:** The project demonstrates a layered TypeScript REST API with
secure authentication and a dual-database synchronization workflow.
