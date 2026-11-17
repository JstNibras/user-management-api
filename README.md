# User Management REST API

A backend REST API built with **Node.js, Express.js, TypeScript, MySQL,
Prisma, MongoDB, and Mongoose**. It provides user registration and
login, admin user management, role-based authorization, validation, and
profile synchronization between two databases.

## Features

-   User registration and login
-   Password hashing with bcrypt
-   JWT authentication stored in an HTTP-only cookie
-   Role-based authorization (`ADMIN` and `USER`)
-   Admin user management
-   Search, pagination, and sorting
-   Soft deletion of user accounts
-   Zod request validation
-   Centralized error handling
-   MySQL as the primary user database
-   MongoDB profile synchronization
-   Layered architecture and Repository Pattern

## Tech Stack

  Technology   Purpose
  ------------ ----------------------------
  Node.js      JavaScript runtime
  Express.js   REST API framework
  TypeScript   Static typing
  MySQL        Primary database
  Prisma       MySQL ORM
  MongoDB      Synchronized profile store
  Mongoose     MongoDB ODM
  JWT          Authentication
  bcrypt       Password hashing
  Zod          Request validation

## Architecture

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

### Project structure

``` text
src/
├── domain/
│   ├── entities/
│   └── interfaces/
├── application/
│   ├── use-cases/
│   ├── services/
│   └── interfaces/
├── infrastructure/
│   ├── database/
│   │   ├── mysql/
│   │   └── mongodb/
│   │       └── models/
│   ├── repositories/
│   └── security/
├── presentation/
│   ├── routes/
│   ├── controllers/
│   ├── middlewares/
│   └── validators/
├── config/
├── utils/
├── app.ts
└── server.ts

prisma/
├── schema.prisma
└── migrations/
```

## Database Design

### MySQL --- Primary database

MySQL is the source of truth for user accounts. It stores the account
details, password hash, role, soft-delete state, and synchronization
status.

The Prisma `User` model includes: - `id` - `name` - `email` - `password`
(hashed) - `role` - `mongoSynced` - `isDeleted` - `createdAt` -
`updatedAt`

### MongoDB --- Profile copy

MongoDB stores synchronized profile information: - `userId` - `name` -
`email` - `role` - `isDeleted` - timestamps

**The password hash is not copied to MongoDB.**

### Synchronization behavior

1.  MySQL is updated first.
2.  The synchronization flag is set to `false` while synchronization is
    pending.
3.  The application attempts to upsert the MongoDB profile.
4.  On success, `mongoSynced` is set to `true`.
5.  If MongoDB synchronization fails, the MySQL record remains and the
    flag indicates that synchronization is pending.

Soft deletion is represented in both databases using `isDeleted`; the
MongoDB profile document is retained.

> MySQL and MongoDB do not participate in one ordinary atomic
> transaction. A failure during the second database operation can leave
> the profile temporarily out of sync.

## API Endpoints

  Method     Endpoint                 Access   Description
  ---------- ------------------------ -------- --------------------
  `GET`      `/health`                Public   Health check
  `POST`     `/api/auth/register`     Public   Register a user
  `POST`     `/api/auth/login`        Public   Log in
  `GET`      `/api/admin/users`       Admin    List users
  `GET`      `/api/admin/users/:id`   Admin    Get a user
  `POST`     `/api/admin/users`       Admin    Create a user
  `PATCH`    `/api/admin/users/:id`   Admin    Update a user
  `DELETE`   `/api/admin/users/:id`   Admin    Soft-delete a user

### User listing query parameters

`GET /api/admin/users`

  Parameter     Description
  ------------- -------------------------------------------------
  `search`      Optional search string
  `page`        Page number; defaults to `1`
  `limit`       Items per page; defaults to `10`, maximum `100`
  `sortBy`      `name`, `email`, or `createdAt`
  `sortOrder`   `asc` or `desc`

Example:

``` http
GET /api/admin/users?search=ahmad&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

## Authentication

-   Register through `POST /api/auth/register`.
-   Log in through `POST /api/auth/login`.
-   On successful login, the server sets a JWT in an HTTP-only cookie
    named `token`.
-   The JWT is not returned in the JSON response.
-   Protected requests must include the cookie.
-   Authentication checks the current active user in MySQL.
-   Admin routes additionally require the current role to be `ADMIN`.

Cookie settings include `httpOnly`, `sameSite: "lax"`, a one-day maximum
age, and `secure` in production.

## Getting Started

### Prerequisites

Install and configure: - Node.js and npm - MySQL - MongoDB - Git

### 1. Clone the repository

``` bash
git clone <your-repository-url>
cd <your-project-folder>
```

### 2. Install dependencies

``` bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. Use the following keys and
replace the example values with your local configuration:

``` env
PORT=4000
CLIENT_URL=http://localhost:3000
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/user_management"
MONGODB_URI=mongodb://127.0.0.1:27017/user_management
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
```

Do not commit your real `.env` file or expose database credentials or
JWT secrets. Keep `.env` in `.gitignore`. Commit an `.env.example`
containing placeholders only.

### 4. Set up the database

Make sure the MySQL database exists and the MySQL and MongoDB services
are running.

Apply the Prisma migrations:

``` bash
npx prisma migrate deploy
npx prisma generate
```

For local development when creating new migrations, use:

``` bash
npx prisma migrate dev
```

### 5. Run the project

Development command, if configured in `package.json`:

``` bash
npm run dev
```

Build the TypeScript project:

``` bash
npm run build
```

Start the compiled application using the start script configured in
`package.json`:

``` bash
npm start
```

The API is configured to use port `4000` by default. Check the terminal
output and your `.env` configuration to confirm the actual port.

## Testing with Postman

Import the Postman collection provided with this project, if available.

1.  Set `baseUrl` to `http://localhost:4000`.
2.  Call the health endpoint.
3.  Register a user and log in.
4.  Log in with an admin account to test admin routes.
5.  Use the collection's `userId` variable for user-specific requests.
6.  Ensure Postman retains the login cookie for protected requests.

The browser/Postman cookie behavior depends on the client and cookie
configuration.

## Common HTTP Status Codes

  Status   Meaning
  -------- -----------------------------------
  `200`    Request succeeded
  `201`    Resource created
  `400`    Invalid request data
  `401`    Missing or invalid authentication
  `403`    Insufficient permissions
  `404`    User not found
  `409`    Duplicate email
  `500`    Unexpected server error

## Current Scope

Implemented: - Registration and login - Admin user management - Search,
pagination, and sorting - Soft deletion - MySQL-to-MongoDB profile
synchronization attempts - JWT authentication and role authorization -
Zod validation and centralized error handling

Not currently implemented: - Logout endpoint - User profile endpoint -
Manual/public synchronization endpoint - Scheduled background
synchronization worker

## Security Notes

-   Never commit `.env` or real credentials.
-   Use a strong, random `JWT_SECRET`.
-   Use HTTPS in production so secure cookies can be enabled.
-   Do not expose password hashes in API responses.
-   Restrict admin credentials and protect admin routes.

## License

Add a license before distributing this project publicly. If no license
is specified, GitHub users do not automatically receive permission to
reuse, modify, or distribute the code.
