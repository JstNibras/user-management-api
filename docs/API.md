# Dual-Database User Management REST API

**Base URL:** `http://localhost:4000`\
**Authentication:** JWT in an HTTP-only `token` cookie\
**Primary database:** MySQL (Prisma)\
**Profile mirror:** MongoDB (Mongoose)

## 1. Overview

This backend implements public user registration and login, plus
administrator-managed user CRUD operations. It is built with Node.js,
Express.js, TypeScript, MySQL, MongoDB, Prisma, Mongoose, bcrypt and
Zod.

MySQL is the source of truth for user accounts. MongoDB stores a
synchronized profile identified by the MySQL user ID. Password hashes
are not copied to MongoDB.

## 2. Implementation facts and boundaries

-   Public registration always assigns role `USER`.
-   Admin user creation accepts role `USER` or `ADMIN`.
-   Admin listing excludes soft-deleted users.
-   Deletion is a soft delete: MySQL sets `isDeleted=true`; MongoDB
    retains the profile and sets `isDeleted=true`.
-   `mongoSynced` indicates whether the latest profile synchronization
    completed.
-   MySQL and MongoDB do not share one atomic transaction. If MongoDB
    synchronization fails after the MySQL write succeeds, the MySQL
    change remains and `mongoSynced` remains `false`.
-   A `syncPendingUsers()` service method exists, but no scheduled retry
    or sync API endpoint is currently configured.
-   The current implemented route set does not include logout or
    user-profile endpoints.

## 3. Base URL and route groups

``` text
http://localhost:4000
```

  Group                   Prefix               Access
  ----------------------- -------------------- -----------------------
  Health                  `/health`            Public
  Authentication          `/api/auth`          Public
  Admin user management   `/api/admin/users`   Authenticated `ADMIN`

Send JSON bodies with `Content-Type: application/json`.

## 4. Authentication and authorization

### Cookie

After successful login, the server sets a cookie named `token`. The JWT
is not included in the JSON response.

  Attribute    Current setting
  ------------ ------------------------------------------------------
  `httpOnly`   `true`
  `secure`     `true` when `NODE_ENV=production`; otherwise `false`
  `sameSite`   `lax`
  `path`       `/`
  Max age      24 hours

Postman should retain the cookie in its cookie jar and send it on later
requests to `localhost`.

### Protected request flow

1.  Read the `token` cookie.
2.  Verify JWT signature and expiry.
3.  Load the active user from MySQL.
4.  Use the current database role, not a stale role claim, for
    authorization.
5.  Reject deleted or nonexistent users.

Admin routes additionally require role `ADMIN`.

  Role      Access
  --------- ------------------------------------
  `USER`    Authentication; no admin endpoints
  `ADMIN`   Admin user-management endpoints

## 5. Authentication endpoints

### 5.1 Register

`POST /api/auth/register`

Authentication: not required.

Request body:

``` json
{
  "name": "Nibras",
  "email": "nibras@example.com",
  "password": "StrongPass@123"
}
```

Validation: - `name`: trimmed string, minimum 2 characters - `email`:
valid trimmed email - `password`: minimum 8 characters

`confirmPassword` and `role` are not part of the public registration
schema. The service assigns `USER`.

Success: `201 Created`. The response contains safe user fields and does
not expose the password. It includes `mongoSynced` and `isDeleted`. If
MySQL creation succeeds but MongoDB synchronization fails, the user is
still created and `mongoSynced` is `false`.

Possible status codes: `201`, `400`, `409`, `500`.

### 5.2 Login

`POST /api/auth/login`

Authentication: not required.

Request body:

``` json
{
  "email": "nibras@example.com",
  "password": "StrongPass@123"
}
```

Validation: - `email`: valid trimmed email - `password`: non-empty
string

Success: `200 OK`. The safe user object is returned and the JWT is set
in the HTTP-only `token` cookie.

Possible status codes: `200`, `400`, `401`, `500`. Invalid credentials
use a generic `401` response.

## 6. Admin user-management endpoints

All endpoints below require a valid `token` cookie and current MySQL
role `ADMIN`.

### 6.1 List users

`GET /api/admin/users`

Query parameters:

  Parameter     Type            Default Rules
  ------------- --------- ------------- ------------------------------
  `search`      string              --- Searches name or email
  `page`        integer             `1` Minimum 1
  `limit`       integer            `10` 1--100
  `sortBy`      string      `createdAt` `name`, `email`, `createdAt`
  `sortOrder`   string           `desc` `asc`, `desc`

Examples:

``` http
GET /api/admin/users
GET /api/admin/users?page=2&limit=5
GET /api/admin/users?search=nibras
GET /api/admin/users?sortBy=name&sortOrder=asc
```

Success: `200 OK`.

Example response shape:

``` json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": 12,
      "name": "Nibras",
      "email": "nibras@example.com",
      "role": "USER",
      "mongoSynced": true,
      "isDeleted": false,
      "createdAt": "2026-11-17T08:00:00.000Z",
      "updatedAt": "2026-11-17T08:00:00.000Z"
    }
  ],
  "pagination": {
    "totalUsers": 1,
    "currentPage": 1,
    "totalPages": 1,
    "limit": 10
  }
}
```

Passwords are excluded. Soft-deleted users are excluded.

Possible status codes: `200`, `400`, `401`, `403`.

### 6.2 Get user by ID

`GET /api/admin/users/:id`

Example: `GET /api/admin/users/12`

-   `id` must be a positive integer.
-   Success: `200 OK`, returning a safe user object without password.
-   Possible status codes: `200`, `400`, `401`, `403`, `404`.
-   Missing and soft-deleted users both return `404 User not found`.

### 6.3 Create user

`POST /api/admin/users`

Request body:

``` json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "StrongPass@123",
  "role": "USER"
}
```

Validation: - `name`: trimmed string, minimum 2 characters - `email`:
valid trimmed email - `password`: minimum 8 characters - `role`: `USER`
or `ADMIN`

The service checks duplicate email, hashes the password, creates the
MySQL record and attempts MongoDB profile synchronization.

Success: `201 Created`. Password is excluded. `mongoSynced` reports
whether the profile synchronization succeeded.

Possible status codes: `201`, `400`, `401`, `403`, `409`, `500`.

### 6.4 Update user

`PATCH /api/admin/users/:id`

Partial request body; at least one supported field is required.

Examples:

``` json
{ "name": "Nibras Updated" }
```

``` json
{ "email": "new-address@example.com" }
```

``` json
{ "password": "NewStrongPass@123" }
```

``` json
{ "role": "ADMIN" }
```

Supported fields: - `name`: optional, trimmed, minimum 2 characters -
`email`: optional, valid email - `password`: optional, minimum 8
characters - `role`: optional, `USER` or `ADMIN`

Password changes are bcrypt-hashed and the password is not copied to
MongoDB. Profile changes are synchronized to MongoDB.

Possible status codes: `200`, `400`, `401`, `403`, `404`, `409`, `500`.

### 6.5 Soft-delete user

`DELETE /api/admin/users/:id`

The service: 1. Finds an active user. 2. Sets `isDeleted=true` and
`mongoSynced=false` in MySQL. 3. Synchronizes `isDeleted=true` to the
retained MongoDB profile. 4. Sets `mongoSynced=true` if synchronization
succeeds.

Success: `200 OK`.

Example:

``` json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "id": 12,
    "isDeleted": true,
    "mongoSynced": true
  }
}
```

If MongoDB synchronization fails after the MySQL soft delete, the
response can still indicate successful MySQL deletion with
`mongoSynced=false`.

Possible status codes: `200`, `400`, `401`, `403`, `404`, `500`.

## 7. Health endpoint

`GET /health`

Example:

``` json
{
  "success": true,
  "message": "User Management API is running"
}
```

This confirms that the API process responds; it is not a complete
database-readiness check.

## 8. Validation and common errors

Zod validates request bodies and query parameters.

Example body validation response:

``` json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email address"]
  }
}
```

Query validation uses the message `Query validation failed`.

    Status Meaning
  -------- ------------------------------------------------------
     `200` Request succeeded
     `201` Resource created
     `400` Invalid body, ID or query
     `401` Missing, invalid, expired or inactive authentication
     `403` Authenticated user lacks permission
     `404` Active user not found
     `409` Duplicate email
     `500` Unexpected server error

## 9. Architecture

``` text
Client / Postman
       |
       v
     Routes
       |
       v
 Middleware (Auth / Role / Validation)
       |
       v
   Controllers
       |
       v
    Services
       |
       v
Repository Interfaces
       |
       v
Repository Implementations
       |
       +------------------+
       |                  |
       v                  v
 MySQL + Prisma     MongoDB + Mongoose
```

  Layer                        Responsibility
  ---------------------------- -------------------------------------------------
  Routes                       Define HTTP methods, paths and middleware
  Middleware                   Authentication, authorization and validation
  Controllers                  Handle HTTP requests and responses
  Services                     Business logic and synchronization coordination
  Domain interfaces            Repository contracts
  Repository implementations   Prisma and Mongoose database operations
  Config                       Dependency wiring and application setup

## 10. Database design and synchronization

### MySQL primary user record

Fields include `id`, `name`, `email`, `password`, `role`, `mongoSynced`,
`isDeleted`, `createdAt` and `updatedAt`.

### MongoDB synchronized profile

Fields include `userId` (the MySQL ID), `name`, `email`, `role`,
`isDeleted` and timestamps. Password hashes are not stored in MongoDB.

  -----------------------------------------------------------------------
  Operation               MySQL                   MongoDB
  ----------------------- ----------------------- -----------------------
  Register / admin create Create; initially       Upsert profile
                          `mongoSynced=false`     

  Profile update          Update; mark sync       Upsert latest profile
                          pending                 

  Password update         Update hash             Password is not copied

  Soft delete             Set `isDeleted=true`;   Retain profile and set
                          mark sync pending       `isDeleted=true`
  -----------------------------------------------------------------------

The two databases do not share a distributed atomic transaction. A
failed MongoDB operation can leave a pending `mongoSynced=false` state.
A `syncPendingUsers()` service method exists, but no scheduled retry or
public sync endpoint is configured.

## 11. Security

-   Passwords are hashed with bcrypt (12 salt rounds in the current
    implementation).
-   Passwords are excluded from API responses.
-   JWT is stored in an HTTP-only cookie and expires after one day.
-   Protected requests reload the active user and current role from
    MySQL.
-   Admin endpoints require current role `ADMIN`.
-   Public registration assigns `USER` on the server.
-   Soft-deleted users cannot authenticate through the active-user
    lookup.
-   Keep `.env` and JWT secrets out of source control.
-   Production should use HTTPS so the cookie `Secure` attribute is
    enabled.

## 12. Postman usage

Import `user_api_backend.postman_collection.json`.

1.  Set `baseUrl` to `http://localhost:4000`.
2.  Register a normal USER.
3.  Log in; Postman should retain the `token` cookie for `localhost`.
4.  Confirm a USER receives `403` on admin routes.
5.  Log in with a controlled ADMIN account.
6.  Run list, get-by-ID, create, update and delete requests.
7.  Set the `userId` collection variable to the target MySQL user ID.
8.  Inspect MySQL and MongoDB to demonstrate synchronization.

Do not save a live JWT or session cookie in the collection or source
control.

## 13. Suggested demo sequence

1.  `GET /health`.
2.  Register a user.
3.  Show the MySQL row and MongoDB profile.
4.  Log in and show the HTTP-only cookie in Postman.
5.  Call an admin route as USER and show `403`.
6.  Log in as ADMIN.
7.  Demonstrate list/search/pagination/sorting.
8.  Demonstrate get-by-ID.
9.  Create a user and show that the password is absent from the
    response.
10. Update a user's profile.
11. Soft-delete a user.
12. Show `isDeleted=true` in both databases and demonstrate that the
    deleted user's old JWT is rejected.

## 14. Scope boundaries

Implemented routes: `GET /health`, `POST /api/auth/register`,
`POST /api/auth/login`, and the five admin user CRUD routes.

Not currently implemented: logout API, user profile API, admin sync API,
scheduled synchronization worker.
