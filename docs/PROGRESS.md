# Multi-Agent AI Workspace

## Backend Development Log

**Project:** Multi-Agent AI Workspace
**Backend Scope:** Identity & Access + Workspace & Task Management
**Owner:** Harendra Godara
**Backend Stack:** Node.js, Express.js, PostgreSQL
**Architecture:** Modular Monolithic Express Application
**Current Phase:** Backend Foundation & Database Setup

---

# 1. Project Backend Overview

The backend of the **Multi-Agent AI Workspace** is responsible for providing APIs for:

- User registration and authentication
- Login and logout
- User identity management
- Workspace creation and management
- Workspace membership and roles
- Task creation and management
- Task dependencies
- Workflow/task execution tracking
- Future AI-agent execution and orchestration

The original architecture divides the backend into two logical services:

1. **Identity & Access Service**
2. **Workspace & Task Service**

For the current implementation, these are being developed inside **one Express application** using a modular structure.

> The application is logically separated by domain even though it currently runs as a single backend process.

---

# 2. Architecture Decision

## 2.1 Original Microservice Proposal

The original project architecture proposed:

```text
                ┌─────────────────────┐
                │      Frontend       │
                └──────────┬──────────┘
                           │
                 HTTP / REST APIs
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
┌──────────────────────┐      ┌────────────────────────┐
│ Identity & Access    │      │ Workspace & Task       │
│ Service              │      │ Service                │
└──────────┬───────────┘      └───────────┬────────────┘
           │                              │
           ▼                              ▼
     Identity DB                    Workspace DB
```

Each service would have its own server and database and communicate with the other service through HTTP.

---

## 2.2 Current Architecture Decision

Because this project is currently being developed by one person, running multiple independent microservices would introduce unnecessary overhead:

- Multiple servers
- Multiple ports
- Multiple databases
- HTTP communication between services
- More configuration
- More deployment complexity
- More failure points
- More debugging overhead

Microservices become more valuable when different teams need to independently develop, deploy, own, or scale services.

Therefore, the current decision is:

> **Use one Express application with clearly separated modules.**

This is commonly called a **Modular Monolith**.

---

## 2.3 Current Architecture

```text
                    ┌─────────────────────┐
                    │      Frontend       │
                    └──────────┬──────────┘
                               │
                            HTTP/REST
                               │
                    ┌──────────▼──────────┐
                    │   Express Backend   │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Identity/Auth │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Workspace     │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Task          │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Workflow      │  │
                    │  └───────────────┘  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    └─────────────────────┘
```

The important point is:

**Logical services ≠ physically separate microservices.**

The domains remain separated in code so they can later be extracted into independent services if required.

---

# 3. Technology Stack

| Technology   | Role                                 |
| ------------ | ------------------------------------ |
| Node.js      | JavaScript runtime for backend       |
| Express.js   | HTTP server and API framework        |
| PostgreSQL   | Relational database                  |
| pg           | Node.js PostgreSQL driver            |
| dotenv       | Environment variable management      |
| cors         | Cross-origin request handling        |
| bcrypt       | Password hashing                     |
| jsonwebtoken | JWT creation and verification        |
| nodemon      | Automatic development-server restart |

---

# 4. Understanding the Backend Stack

A simple analogy is a restaurant.

| Component  | Restaurant Analogy            | Backend Role                                      |
| ---------- | ----------------------------- | ------------------------------------------------- |
| Node.js    | Engine/Kitchen infrastructure | Runs JavaScript server code                       |
| Express    | Waiter                        | Receives HTTP requests and sends responses        |
| PostgreSQL | Storage/Kitchen database      | Permanently stores application data               |
| pg         | Translator                    | Allows Node.js to communicate with PostgreSQL     |
| Middleware | Security/checkpoint staff     | Performs checks before request reaches controller |
| Controller | Chef                          | Performs actual application logic                 |
| JWT        | Entry pass                    | Proves that a user is authenticated               |

---

# 5. Request Flow

For example, when the frontend requests the user's tasks:

```text
Frontend
   │
   │ GET /api/tasks
   ▼
Express
   │
   ▼
Authentication Middleware
   │
   │ Is JWT valid?
   ▼
Task Controller
   │
   ▼
PostgreSQL
   │
   │ Return task rows
   ▼
Task Controller
   │
   ▼
Express
   │
   ▼
Frontend
```

In simple terms:

```text
Frontend
   ↓
HTTP Request
   ↓
Express Route
   ↓
Middleware
   ↓
Controller
   ↓
PostgreSQL
   ↓
Controller
   ↓
JSON Response
   ↓
Frontend
```

---

# 6. Packages Installed

```bash
npm install express pg dotenv cors bcrypt jsonwebtoken
npm install -D nodemon
```

## Package Responsibilities

### express

Creates the HTTP server and handles routing.

Example:

```js
app.get("/api/tasks", getTasks);
```

---

### pg

Allows Node.js to communicate with PostgreSQL.

```js
const { Pool } = require("pg");
```

---

### dotenv

Loads configuration/secrets from `.env`.

```env
DATABASE_URL=...
JWT_SECRET=...
PORT=5000
```

They become available through:

```js
process.env.DATABASE_URL;
process.env.JWT_SECRET;
process.env.PORT;
```

---

### cors

Allows the frontend and backend to communicate when they are running on different origins/ports.

Example:

```text
Frontend → localhost:3000
Backend  → localhost:5000
```

---

### bcrypt

Used for password hashing.

Passwords should **never** be stored directly in the database.

Instead:

```text
Original Password
       ↓
     bcrypt
       ↓
Password Hash
       ↓
PostgreSQL
```

Important:

> Hashing is not the same as encryption.

Hashing is designed to be one-way, whereas encrypted data can be decrypted using the appropriate key.

---

### jsonwebtoken

Used to create and verify JSON Web Tokens.

After successful login:

```text
Email + Password
       ↓
Authentication
       ↓
JWT
       ↓
Frontend
```

The frontend can then send the JWT with protected requests.

---

### nodemon

Development-only package.

Instead of manually restarting:

```bash
node server.js
```

every time code changes, nodemon automatically restarts the server.

---

# 7. PostgreSQL Setup

## 7.1 Installation — Fedora

```bash
sudo dnf install postgresql-server postgresql-contrib
```

Initialize PostgreSQL:

```bash
sudo postgresql-setup --initdb
```

Start PostgreSQL:

```bash
sudo systemctl enable --now postgresql
```

### Meaning

`--now`

Starts PostgreSQL immediately.

`enable`

Configures PostgreSQL to start automatically after future system boots.

---

# 8. Database and Application User

A separate application database and database user are used rather than connecting the application as the PostgreSQL superuser.

Example:

```sql
CREATE DATABASE myapp_db;

CREATE USER app_user WITH PASSWORD '...';

GRANT ALL PRIVILEGES ON DATABASE myapp_db TO app_user;

GRANT ALL ON SCHEMA public TO app_user;
```

## Why not use `postgres`?

`postgres` is a highly privileged PostgreSQL superuser.

If the application connects using a superuser account, a serious application bug could potentially affect databases or objects outside the application's intended scope.

Using:

```text
app_user
```

follows the:

### Principle of Least Privilege

> Give an application only the permissions it actually needs.

---

# 9. PostgreSQL Authentication Issue

During setup, the following error was encountered:

```text
Ident authentication failed
```

## Why did this happen?

PostgreSQL can authenticate users through different methods.

For example:

- `peer`
- `ident`
- `scram-sha-256`

Local PostgreSQL configurations may use OS-user-based authentication such as `peer`.

However, the Node.js application connects using a database username and password.

Therefore, PostgreSQL's authentication configuration needed to permit password-based authentication.

The relevant configuration is:

```text
pg_hba.conf
```

After changing the authentication method, PostgreSQL was restarted/reloaded so the configuration could take effect.

---

# 10. Environment Variables

The project uses a `.env` file.

Example:

```env
PORT=5000

DATABASE_URL=postgresql://app_user:...@localhost:5432/myapp_db

JWT_SECRET=...
```

## Why use `.env`?

Sensitive values should not be hardcoded into source code.

For example, this is bad:

```js
const password = "myDatabasePassword";
```

If the project is pushed to GitHub, the password could become exposed.

Instead:

```js
process.env.DATABASE_URL;
```

is used.

---

# 11. `.gitignore`

The `.env` file should be excluded from Git.

Example:

```gitignore
.env
node_modules/
```

This prevents secrets and unnecessary generated dependencies from being committed.

---

# 12. Backend Folder Structure

Current modular structure:

```text
src/
│
├── config/
│   └── db.js
│
├── routes/
│   ├── auth.js
│   ├── workspace.js
│   ├── task.js
│   └── workflow.js
│
├── controllers/
│   ├── auth.js
│   ├── workspace.js
│   ├── task.js
│   └── workflow.js
│
├── middleware/
│   └── auth.js
│
└── db/
    └── schema.sql
```

---

# 13. Why Separate Routes, Controllers and Middleware?

## Routes

Routes answer:

> "Which URL calls which function?"

Example:

```js
router.post("/register", register);
```

Routes should remain lightweight.

---

## Controllers

Controllers contain actual application/business logic.

Example:

```text
Register User
   ↓
Validate input
   ↓
Check existing user
   ↓
Hash password
   ↓
Insert user
   ↓
Return response
```

---

## Middleware

Middleware runs before the controller.

Example:

```text
Request
   ↓
JWT Middleware
   ↓
Is token valid?
   │
   ├── No → 401 Unauthorized
   │
   └── Yes
         ↓
      Controller
```

Authentication is one of the most important uses of middleware.

---

# 14. Database Connection Pool

The project uses PostgreSQL's connection pool.

Example:

```js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

## What is a Connection Pool?

Opening a new database connection for every HTTP request is inefficient.

Without pooling:

```text
Request 1 → Open DB connection → Query → Close
Request 2 → Open DB connection → Query → Close
Request 3 → Open DB connection → Query → Close
```

With a pool:

```text
             ┌─────────────┐
             │ Connection 1│
             ├─────────────┤
Request ────►│ Connection 2│
             ├─────────────┤
             │ Connection 3│
             ├─────────────┤
             │ Connection 4│
             └─────────────┘
```

Connections are reused.

This improves efficiency when multiple requests arrive concurrently.

---

# 15. Server Configuration

Important middleware:

```js
app.use(cors());

app.use(express.json());
```

### `cors()`

Allows appropriate cross-origin frontend requests.

### `express.json()`

Parses JSON request bodies.

For example:

```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

becomes accessible through:

```js
req.body;
```

---

# 16. Health Check API

The backend contains:

```http
GET /api/health
```

Example implementation:

```js
app.get("/api/health", async (req, res) => {
  const result = await pool.query("SELECT NOW()");

  res.json({
    status: "ok",
    dbTime: result.rows[0].now,
  });
});
```

## Why does this endpoint exist?

It is not a business feature.

It is a **sanity-check endpoint**.

It verifies:

### 1. Express is running

If the server responds, the Express application is running.

### 2. PostgreSQL is reachable

The query:

```sql
SELECT NOW();
```

returns the PostgreSQL server's current time.

Therefore:

```text
GET /api/health
      ↓
Express
      ↓
PostgreSQL
      ↓
SELECT NOW()
      ↓
Response
```

proves that the backend can communicate with PostgreSQL.

---

# 17. Testing Strategy

Instead of building the entire backend first and testing everything at the end, the backend is being tested incrementally.

Example:

```text
Database Setup
      ↓
Test
      ↓
Express Setup
      ↓
Test
      ↓
Database Connection
      ↓
Test
      ↓
Health API
      ↓
Test
      ↓
Authentication
      ↓
Test
      ↓
Workspace
      ↓
Test
```

This makes debugging easier because a failure can be associated with a specific development step.

---

# 18. Database Design

The current database contains seven major tables:

```text
users
auth_sessions
workspaces
workspace_members
tasks
task_dependencies
workflow_runs
```

---

# 19. `users`

Purpose:

Stores user identity and authentication-related information.

Conceptually:

```text
users
-------------------------
id
email
password_hash
created_at
...
```

The password itself should not be stored.

Instead:

```text
password
   ↓
bcrypt
   ↓
password_hash
```

---

# 20. `auth_sessions`

Purpose:

Tracks authenticated sessions.

This becomes useful for features such as:

- Logout
- Session revocation
- Tracking active sessions
- Security controls

Conceptually:

```text
User
  │
  ├── Session 1
  ├── Session 2
  └── Session 3
```

---

# 21. `workspaces`

Purpose:

Represents an individual AI workspace.

Example:

```text
Workspace
-------------------------
workspaceId
name
created_by
created_at
```

A workspace is the main container in which users create and manage tasks and AI-agent workflows.

---

# 22. `workspace_members`

Purpose:

Connects users with workspaces.

This is effectively a membership/association table.

Example:

```text
User A ─────┐
            │
            ▼
       Workspace X
            ▲
            │
User B ─────┘
```

It can also store roles such as:

```text
owner
admin
member
```

This allows the backend to implement authorization rules.

---

# 23. `tasks`

Purpose:

Stores tasks that belong to a workspace.

Conceptually:

```text
Workspace
    │
    ├── Task 1
    ├── Task 2
    ├── Task 3
    └── Task 4
```

Tasks are the core units of work that can eventually be executed by AI agents.

---

# 24. `task_dependencies`

Purpose:

Represents relationships between tasks.

Example:

```text
Task A
  │
  │ must finish first
  ▼
Task B
```

Meaning:

> Task B cannot start until Task A is completed.

This is useful for building task/workflow execution logic.

---

# 25. `workflow_runs`

Purpose:

Tracks an execution attempt of a task/workflow.

For example:

```text
Task
 ↓
Workflow Run #1
 ↓
Running
 ↓
Completed
```

If the task is run again:

```text
Task
 ├── Workflow Run #1 → Completed
 └── Workflow Run #2 → Failed
```

This provides execution history.

---

# 26. UUID Primary Keys

The database uses UUIDs rather than simple sequential integer IDs.

Example:

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

Instead of:

```text
1
2
3
4
5
```

the IDs look like:

```text
a1b2c3d4-....
7f82e1ab-....
c92d14ef-....
```

## Why UUID?

Sequential IDs are easy to guess.

For example:

```text
/tasks/101
/tasks/102
/tasks/103
```

can reveal that nearby resources may exist.

UUIDs are much harder to guess.

> Important: UUIDs improve identifier unpredictability, but they are **not a replacement for authorization**. Every protected resource must still verify that the current user is allowed to access it.

---

# 27. Foreign Keys

Example:

```sql
user_id UUID NOT NULL
REFERENCES users(id)
```

This means:

```text
tasks.user_id
      │
      ▼
users.id
```

PostgreSQL ensures that the referenced user exists.

This prevents invalid/orphaned references.

---

# 28. Cascading Deletes

Example:

```sql
REFERENCES users(id)
ON DELETE CASCADE
```

If a parent user is deleted, related records can automatically be deleted according to the configured relationship.

Conceptually:

```text
User
 │
 ├── Session
 ├── Workspace Membership
 └── Other dependent data
```

Deleting the parent can trigger deletion of dependent records.

This reduces the need for manual cleanup queries.

> Cascade behavior must be designed carefully, especially around shared resources such as workspaces.

---

# 29. Timestamps

Most tables use:

```sql
created_at TIMESTAMPTZ DEFAULT NOW()
```

This records when a record was created.

Useful for:

- Sorting
- Debugging
- Activity history
- Auditing
- Showing recent tasks
- Tracking workflow execution

`TIMESTAMPTZ` is preferred for backend systems where timestamps may be consumed across different time zones.

---

# 30. Status Model

Tasks and workflow runs use statuses such as:

```text
pending
running
completed
failed
cancelled
```

A typical workflow is:

```text
pending
   │
   ▼
running
   │
   ├──────────────► completed
   │
   ├──────────────► failed
   │
   └──────────────► cancelled
```

This state model will become important when AI agents begin executing tasks.

---

# 31. Current Backend Domain Boundaries

The backend currently has these logical domains:

```text
Backend
│
├── Identity & Access
│   ├── Users
│   ├── Authentication
│   ├── JWT
│   └── Sessions
│
├── Workspace Management
│   ├── Workspaces
│   ├── Members
│   └── Roles
│
├── Task Management
│   ├── Tasks
│   ├── Dependencies
│   └── Status
│
└── Workflow Execution
    ├── Workflow Runs
    ├── Execution Status
    └── Future Agent Execution
```

These boundaries are intentionally separated so they can later become independent services if necessary.

---

# 32. Current Status

## Completed

- [x] Backend project initialized
- [x] Node.js configured
- [x] Express configured
- [x] PostgreSQL installed
- [x] PostgreSQL initialized
- [x] PostgreSQL service started
- [x] Application database created
- [x] Dedicated application DB user created
- [x] PostgreSQL authentication configured
- [x] `.env` configuration added
- [x] `.gitignore` configured
- [x] Database connection pool configured
- [x] Express middleware configured
- [x] Health-check API created
- [x] PostgreSQL connectivity verified
- [x] Seven database tables created
- [x] Database tables verified using `\dt`

---

# 33. Next Development Phase — Authentication

The next major phase is:

## Identity & Access Implementation

Planned APIs:

```http
POST /auth/register
POST /auth/login
POST /auth/logout
```

Authentication flow:

```text
                 REGISTER
                    │
                    ▼
             Validate Input
                    │
                    ▼
           Check Existing User
                    │
                    ▼
            Hash Password
                 bcrypt
                    │
                    ▼
              Save User
                    │
                    ▼
              Response
```

Login flow:

```text
                  LOGIN
                    │
                    ▼
          Email + Password
                    │
                    ▼
             Find User
                    │
                    ▼
          Compare Password
               bcrypt
                    │
             ┌──────┴──────┐
             │             │
           Wrong          Correct
             │             │
             ▼             ▼
           401           Create JWT
                           │
                           ▼
                      Auth Session
                           │
                           ▼
                        Response
```

---

# 34. Protected API Flow

After authentication, protected endpoints will follow:

```text
Frontend
   │
   │ Authorization: Bearer <JWT>
   ▼
Express
   │
   ▼
Auth Middleware
   │
   ├── Invalid Token → 401
   │
   └── Valid Token
           │
           ▼
      req.user
           │
           ▼
       Controller
           │
           ▼
       PostgreSQL
```

The controller will not blindly trust a resource ID.

It must also verify:

```text
Is this user allowed to access this workspace/task?
```

This is **authorization**, which is different from authentication.

---

# 35. Upcoming Development Order

The backend will be developed in the following order:

```text
Phase 1
Backend + PostgreSQL Setup
        ↓
Phase 2
Authentication
        ↓
Phase 3
JWT Middleware
        ↓
Phase 4
Workspace APIs
        ↓
Phase 5
Workspace Membership + Roles
        ↓
Phase 6
Task APIs
        ↓
Phase 7
Task Dependencies
        ↓
Phase 8
Workflow Runs
        ↓
Phase 9
AI Agent Execution
        ↓
Phase 10
Frontend Integration
        ↓
Phase 11
Testing + Security
        ↓
Phase 12
Deployment
```

---

# 36. Development Log Rule Going Forward

Each future development session should be added using this format:

```text
## Session X — <Topic>

### Goal
What we are trying to build.

### Concepts
Theory required to understand the implementation.

### Implementation
Files/code/configuration created or changed.

### API
Endpoints introduced or modified.

### Database
Tables/queries/schema changes.

### Testing
Commands and expected results.

### Problems Encountered
Errors and why they occurred.

### Solution
How the problem was fixed.

### Status
✅ Completed items

### Next Up
What will be implemented next.
```

This keeps the development history understandable instead of becoming a collection of disconnected commands and code snippets.

---

# 37. Glossary

### Connection Pool

A reusable collection of PostgreSQL connections that can be shared between multiple requests.

---

### Hashing

A one-way transformation used to securely store passwords.

```text
Password
   ↓
Hash Function
   ↓
Password Hash
```

Hashing is different from encryption.

---

### JWT

JSON Web Token.

A signed token that can represent an authenticated user's identity.

Typical request:

```http
Authorization: Bearer <JWT>
```

---

### Foreign Key

A database constraint connecting one table to another.

Example:

```text
tasks.user_id
      ↓
users.id
```

---

### Least Privilege

Giving a user, service, or application only the permissions it actually requires.

---

### Middleware

Code that executes during the HTTP request/response pipeline, often before the main controller.

Example:

```text
Request
  ↓
Auth Middleware
  ↓
Controller
  ↓
Response
```

---

### Authentication

Answers:

> **Who are you?**

Example:

```text
Login + Password
       ↓
Identity verified
```

---

### Authorization

Answers:

> **Are you allowed to do this?**

Example:

```text
User A
  ↓
Can User A access Workspace B?
```

Authentication and authorization are separate concepts.

---

### UUID

Universally Unique Identifier.

Used as a difficult-to-guess resource identifier instead of sequential integers.

---

### Modular Monolith

A single deployable application whose internal code is divided into clearly separated business modules.

Current backend architecture:

```text
             One Express Application
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
    Identity       Workspace        Tasks
       │              │              │
       └──────────────┼──────────────┘
                      ▼
                  PostgreSQL
```

---

# 38. One-Line Project Summary

> **Multi-Agent AI Workspace is a backend-driven platform where authenticated users work inside collaborative workspaces, create dependent tasks, and eventually execute those tasks through AI agents and track their workflow runs.**

---

# 39. Current Milestone

**Milestone 1 — Backend Foundation: COMPLETED ✅**

```text
Node.js
   +
Express
   +
PostgreSQL
   +
Database Schema
   +
Connection Pool
   +
Health Check
   +
Project Structure
        ↓
Authentication ← NEXT
```

# ================================================================================================

# ================================================================================================

# ================================================================================================

# ================================================================================================

# ================================================================================================================================================================================================

================================================================================================

# Multi-Agent AI Workspace

## Backend Development Log

**Project:** Multi-Agent AI Workspace
**Backend Scope:** Identity & Access + Workspace & Task Management
**Owner:** Harendra Godara
**Backend Stack:** Node.js, Express.js, PostgreSQL
**Architecture:** Modular Monolith
**Current Phase:** Authentication — Register Endpoint

---

# Session 2 — Authentication System: Register Endpoint

## 1. Session Goal

The objective of this session was to implement the first real authentication API:

```http
POST /api/auth/register
```

The register endpoint allows a new user to create an account.

The complete flow is:

```text
Client
   │
   │ POST /api/auth/register
   │
   ▼
Express Route
   │
   ▼
Register Controller
   │
   ├── Validate Input
   │
   ├── Check Duplicate Email
   │
   ├── Hash Password
   │
   ├── Insert User
   │
   ├── Generate JWT
   │
   └── Return Safe User Data
   │
   ▼
Client
```

---

# 2. What the Register Endpoint Needs to Do

When a user registers, the backend performs the following steps.

### Step 1 — Validate Input

The backend first checks whether the required fields were provided:

```text
name
email
password
```

Example request:

```json
{
  "name": "Harendra",
  "email": "harendra@test.com",
  "password": "test1234"
}
```

If required information is missing, the backend should reject the request instead of sending incomplete data to PostgreSQL.

---

### Step 2 — Check for Duplicate Email

Before creating the account, the backend checks whether the email already exists.

Conceptually:

```text
Registration Request
        ↓
Does email already exist?
        │
    ┌───┴────┐
    │        │
   Yes       No
    │        │
    ▼        ▼
  409      Continue
```

This prevents multiple accounts from being created with the same email address.

Expected response for a duplicate:

```http
409 Conflict
```

with a message such as:

```json
{
  "message": "Email already registered"
}
```

---

# 3. Parameterized Queries

The database query uses a parameterized query:

```js
await pool.query("SELECT id FROM users WHERE email = $1", [email]);
```

Here:

```text
$1
```

is a placeholder.

The actual value is supplied separately:

```js
[email];
```

The `pg` library sends the SQL and its parameters separately so that the input is treated as **data**, not as SQL syntax.

---

# 4. Why Parameterized Queries Are Important

Without parameterization, someone might write:

```js
`SELECT id FROM users WHERE email = '${email}'`;
```

This directly inserts user input into the SQL string.

That is dangerous.

A malicious input such as:

```text
x' OR '1'='1
```

could alter the intended SQL query.

Conceptually:

```text
User Input
    ↓
String Concatenation
    ↓
SQL Query Meaning Changes
    ↓
SQL Injection
```

With a parameterized query:

```text
SQL Query
   +
User Input
   ↓
PostgreSQL
   ↓
Input treated as data
```

Therefore, user input cannot simply become part of the SQL command.

---

# 5. SQL Injection

### SQL Injection

SQL Injection is an attack where untrusted user input changes the meaning of a SQL query.

Bad approach:

```js
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

Better approach:

```js
const result = await pool.query("SELECT * FROM users WHERE email = $1", [
  email,
]);
```

### Rule

> Always use parameterized queries when inserting user-controlled values into SQL.

---

# 6. Password Hashing with bcrypt

The user's password is never stored directly.

Instead:

```js
const passwordHash = await bcrypt.hash(password, 10);
```

The process is:

```text
User Password
     │
     ▼
   bcrypt
     │
     ▼
Password Hash
     │
     ▼
PostgreSQL
```

The database stores something similar to:

```text
$2b$10$........................................
```

rather than:

```text
test1234
```

---

# 7. Hashing vs Encryption

These concepts are different.

## Encryption

Encryption is reversible.

```text
Original Data
     ↓
Encryption + Key
     ↓
Encrypted Data
     ↓
Decryption + Key
     ↓
Original Data
```

## Hashing

Hashing is designed to be one-way.

```text
Password
    ↓
Hash Function
    ↓
Password Hash
```

The application does not decrypt the hash during login.

Instead, it compares the entered password against the stored hash.

---

# 8. Why Passwords Must Be Hashed

Suppose the database contains:

```text
email: harendra@test.com
password: test1234
```

If the database is compromised, the attacker immediately gets the real password.

With hashing:

```text
email: harendra@test.com
password_hash: $2b$10$...
```

the original password is not stored.

Therefore:

> Even developers and database administrators should not be able to retrieve a user's original password from the database.

---

# 9. bcrypt Salt Rounds

The code uses:

```js
bcrypt.hash(password, 10);
```

The:

```text
10
```

is the bcrypt cost factor, commonly called **salt rounds** in bcrypt terminology.

It controls how computationally expensive the hashing operation is.

Conceptually:

```text
Higher Cost
     ↓
More Computation
     ↓
Slower Hashing
     ↓
More Expensive Brute-Force Attacks
```

A lower cost is faster but gives an attacker less computational resistance.

The exact appropriate cost should be chosen based on the application's performance and security requirements.

---

# 10. How Password Verification Works

During login, the application does **not** decrypt the stored password hash.

Instead:

```js
bcrypt.compare(inputPassword, storedHash);
```

Conceptually:

```text
Entered Password
       │
       ▼
bcrypt.compare()
       │
       ▼
Stored Password Hash
       │
       ▼
Match?
   ┌───┴────┐
   │        │
  Yes       No
   │        │
   ▼        ▼
Login      Reject
```

bcrypt's stored hash contains the information needed to perform the comparison, including its salt.

---

# 11. Creating the User in PostgreSQL

After validation and password hashing, the user is inserted into the database.

Example:

```sql
INSERT INTO users
(name, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, name, email, created_at;
```

The parameters are:

```text
$1 → name
$2 → email
$3 → passwordHash
```

---

# 12. Why Use `RETURNING`?

PostgreSQL's:

```sql
RETURNING
```

allows the `INSERT` query to return the newly created row.

Without `RETURNING`, the application might need:

```text
INSERT
   ↓
SELECT
```

With `RETURNING`:

```text
INSERT
   ↓
New User Data
```

This means an additional `SELECT` query is unnecessary.

---

# 13. Why `password_hash` Is Not Returned

Notice:

```sql
RETURNING id, name, email, created_at;
```

does **not** contain:

```text
password_hash
```

This is intentional.

The API response should never expose the password hash.

The response should contain only safe information such as:

```json
{
  "id": "...",
  "name": "Harendra",
  "email": "harendra@test.com",
  "created_at": "..."
}
```

and the authentication token.

---

# 14. JWT Generation

After successfully creating the account, the backend immediately generates a JWT.

Example:

```js
jwt.sign(
  {
    id: user.id,
    email: user.email,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
  },
);
```

This means the user is authenticated immediately after registration.

There is no need for:

```text
Register
   ↓
Go to Login
   ↓
Enter Password Again
```

Instead:

```text
Register
   ↓
Account Created
   ↓
JWT Generated
   ↓
User Logged In
```

---

# 15. What Is Inside the JWT?

The payload is intentionally minimal:

```json
{
  "id": "user-uuid",
  "email": "harendra@test.com"
}
```

JWTs also contain standard claims such as:

```text
iat
exp
```

where:

- `iat` = issued-at time
- `exp` = expiration time

The application therefore has enough information to identify the user without putting unnecessary information into the token.

---

# 16. JWT Is Signed, Not Encrypted

This is an important security concept.

A normal JWT is:

```text
Header.Payload.Signature
```

The payload is encoded, not encrypted.

Therefore, someone who possesses the token can decode and read its payload.

However, they cannot safely modify the payload and make the token valid without the signing secret.

Conceptually:

```text
JWT
 │
 ├── Header
 ├── Payload
 └── Signature
```

The signature is generated using:

```text
JWT_SECRET
```

If the payload is modified:

```text
Original Payload
       ↓
Signature
       ↓
Valid

Modified Payload
       ↓
Old Signature
       ↓
Invalid
```

---

# 17. What Should NOT Be Stored in JWT?

Sensitive information should not be placed in a normal JWT payload.

Do not put things such as:

```text
password
password_hash
database credentials
JWT_SECRET
highly sensitive personal information
```

The token should contain only the information required for authentication/authorization.

Current payload:

```json
{
  "id": "...",
  "email": "..."
}
```

is intentionally small.

---

# 18. JWT Expiration

The token is configured with:

```js
{
  expiresIn: "7d";
}
```

Therefore, the token expires after seven days.

Why is expiration important?

Suppose a JWT is stolen.

Without expiration:

```text
Stolen Token
     ↓
Could remain useful indefinitely
```

With expiration:

```text
Stolen Token
     ↓
Valid for limited period
     ↓
Expires
     ↓
No longer accepted
```

Expiration therefore limits the useful lifetime of a leaked token.

---

# 19. Routes and Controllers

The authentication route is kept separate from the authentication logic.

### Route

`src/routes/auth.js`

```js
router.post("/register", register);
```

The route answers:

> Which URL should call which controller?

It does not contain the complete registration logic.

---

## Controller

The actual logic is located in:

```text
src/controllers/authController.js
```

The controller handles:

```text
Validate
   ↓
Check Existing User
   ↓
Hash Password
   ↓
Insert User
   ↓
Generate JWT
   ↓
Return Response
```

This separation keeps the codebase organized.

---

# 20. Why Separate Routes and Controllers?

Without separation, the route could become:

```text
POST /register
    ↓
50+ lines of validation
    ↓
database query
    ↓
bcrypt
    ↓
JWT
    ↓
response
```

As the project grows, this becomes difficult to maintain.

Instead:

```text
routes/
   ↓
"What endpoint exists?"

controllers/
   ↓
"What does the endpoint actually do?"
```

This follows the project's modular architecture.

---

# 21. Middleware Order in Express

In `server.js`:

```js
app.use(express.json());
app.use("/api/auth", authRoutes);
```

The order matters.

Express processes middleware and routes in the order they are registered.

First:

```js
app.use(express.json());
```

parses incoming JSON.

Then:

```js
app.use("/api/auth", authRoutes);
```

allows authentication routes to access:

```js
req.body;
```

---

# 22. What Happens Without `express.json()`?

Suppose the frontend sends:

```json
{
  "name": "Harendra",
  "email": "harendra@test.com",
  "password": "test1234"
}
```

If JSON parsing middleware has not run:

```js
req.body;
```

may not contain the parsed request data.

Therefore:

```js
const { name, email, password } = req.body;
```

would not work as expected.

Correct order:

```text
HTTP Request
     ↓
express.json()
     ↓
req.body
     ↓
Auth Route
     ↓
Controller
```

---

# 23. Error Handling

The registration logic is wrapped in:

```js
try {
  // registration logic
} catch (err) {
  console.error(err);

  res.status(500).json({
    message: "Something went wrong",
  });
}
```

The purpose is to prevent unexpected errors from becoming uncontrolled server failures and to provide a controlled HTTP response.

---

# 24. Why Not Send the Real Error to the Client?

Suppose PostgreSQL produces an internal error.

Sending this directly to the frontend could expose:

```text
SQL query
database information
stack trace
internal file paths
implementation details
```

Such information can help attackers understand the application.

Therefore:

### Server

Can log the detailed error:

```js
console.error(err);
```

### Client

Receives a generic message:

```json
{
  "message": "Something went wrong"
}
```

The detailed error remains on the server side for debugging.

---

# 25. Complete Register Flow

The complete endpoint now works like this:

```text
                  POST /api/auth/register
                            │
                            ▼
                     Express Server
                            │
                            ▼
                     express.json()
                            │
                            ▼
                       Auth Route
                            │
                            ▼
                    Register Controller
                            │
                            ▼
                     Validate Input
                            │
                            ▼
                  Check Existing Email
                            │
                    ┌───────┴───────┐
                    │               │
                  Exists         Doesn't Exist
                    │               │
                    ▼               ▼
               HTTP 409          bcrypt.hash()
                                    │
                                    ▼
                              PostgreSQL INSERT
                                    │
                                    ▼
                             RETURNING user
                                    │
                                    ▼
                               jwt.sign()
                                    │
                                    ▼
                            Safe API Response
```

---

# 26. Register API

### Endpoint

```http
POST /api/auth/register
```

### Request

```json
{
  "name": "Harendra",
  "email": "harendra@test.com",
  "password": "test1234"
}
```

### Successful Response

HTTP status:

```text
201 Created
```

Response conceptually:

```json
{
  "token": "<JWT>",
  "user": {
    "id": "...",
    "name": "Harendra",
    "email": "harendra@test.com",
    "created_at": "..."
  }
}
```

Important:

```text
password      ❌
password_hash ❌
```

Neither should be returned.

---

# 27. Testing

The endpoint was tested using `curl`.

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Harendra","email":"harendra@test.com","password":"test1234"}'
```

The successful response returned:

```text
201-style success response
```

containing:

```text
token
user
```

and no password field.

---

# 28. JWT Testing

The returned JWT payload was manually decoded to verify its contents.

The payload contained:

```text
id
email
iat
exp
```

No password or password hash was present.

This confirms that the JWT payload is intentionally minimal.

---

# 29. Duplicate Email Testing

The duplicate-email guard is currently being tested.

Expected behavior:

```text
First Registration
       ↓
201 Created
```

Second registration using the same email:

```text
Same Email
    ↓
Duplicate Check
    ↓
409 Conflict
```

Expected message:

```json
{
  "message": "Email already registered"
}
```

---

# 30. Current Status

## Completed

- [x] Register route created
- [x] Register controller created
- [x] Request validation added
- [x] Duplicate-email check implemented
- [x] Parameterized PostgreSQL queries used
- [x] Password hashing implemented using bcrypt
- [x] User inserted into PostgreSQL
- [x] Safe fields returned using `RETURNING`
- [x] JWT generated after registration
- [x] JWT configured with expiration
- [x] Password/password hash excluded from response
- [x] Error handling added
- [x] Register API tested with `curl`
- [x] JWT payload manually verified

## In Progress

- [ ] Confirm duplicate-email request returns `409 Conflict`

---

# 31. Next Development Phase

The next authentication steps are:

### 1. Login API

```http
POST /api/auth/login
```

Expected flow:

```text
Email + Password
       ↓
Find User
       ↓
bcrypt.compare()
       ↓
Password Correct?
   ┌───┴────┐
   │        │
  No       Yes
   │        │
   ▼        ▼
401       JWT
            ↓
        Auth Session
            ↓
         Response
```

---

### 2. Authentication Middleware

Create:

```text
verifyToken
```

The middleware will verify the JWT before allowing access to protected APIs.

Example:

```text
GET /api/workspaces
        │
        ▼
   verifyToken
        │
   ┌────┴─────┐
   │          │
Invalid      Valid
   │          │
   ▼          ▼
  401      Controller
```

---

### 3. Protected Workspace and Task APIs

Once authentication middleware is ready, it can be reused by:

```text
Workspace APIs
Task APIs
Workflow APIs
```

Instead of implementing JWT verification separately in every controller.

---

# 32. Authentication Architecture After Session 2

The current authentication architecture is:

```text
                    Frontend
                       │
                       │ Register
                       ▼
               POST /api/auth/register
                       │
                       ▼
                 Auth Routes
                       │
                       ▼
              Auth Controller
                       │
             ┌─────────┼──────────┐
             │         │          │
             ▼         ▼          ▼
          Validate   bcrypt    PostgreSQL
             │         │          │
             └─────────┼──────────┘
                       │
                       ▼
                    JWT
                       │
                       ▼
                    Client
```

The next step adds:

```text
Client
  │
  │ Bearer JWT
  ▼
verifyToken Middleware
  │
  ▼
Protected Controller
  │
  ▼
PostgreSQL
```

---

# 33. Glossary Additions

## SQL Injection

An attack where malicious user input changes the meaning of a SQL query.

---

## Parameterized Query

A SQL query that uses placeholders such as:

```text
$1
$2
$3
```

while supplying actual values separately.

This ensures user input is treated as data rather than SQL syntax.

---

## Salt Rounds / bcrypt Cost Factor

A setting controlling how computationally expensive bcrypt password hashing is.

Higher cost generally means:

```text
More computation
+
More time
+
Greater brute-force resistance
```

but also increases server-side hashing cost.

---

## Signed vs Encrypted

### Signed

The data can be read, but modification can be detected because the signature becomes invalid.

### Encrypted

The data is protected from being read without the appropriate decryption key.

A standard JWT is generally:

```text
Signed ≠ Encrypted
```

---

## Authentication

Answers:

> **Who is this user?**

Example:

```text
Login
  ↓
Credentials verified
  ↓
User authenticated
```

---

## Authorization

Answers:

> **Is this authenticated user allowed to perform this action?**

Example:

```text
Authenticated User
       ↓
Can this user access Workspace X?
```

Authentication will identify the user; authorization will determine what that user is allowed to do.

---

# 34. Session Summary

Session 2 successfully moved the backend from basic infrastructure into actual application functionality.

Before Session 2:

```text
Express
   +
PostgreSQL
   +
Database Schema
   +
Health Check
```

After Session 2:

```text
Express
   +
PostgreSQL
   +
Database Schema
   +
Authentication
   │
   ├── Register
   ├── bcrypt Password Hashing
   ├── Duplicate Email Protection
   ├── Parameterized SQL
   └── JWT Generation
```

The backend can now create authenticated users.

**Next major milestone:**

```text
POST /api/auth/login
        ↓
bcrypt.compare()
        ↓
JWT Authentication
        ↓
verifyToken Middleware
        ↓
Protected APIs
```



## Session 3 — Login, JWT Verification Middleware, and `/me`

### 1. `POST /api/auth/login` — step by step

1. Check that `email` and `password` were sent (`400` otherwise).
2. Look up the user by email — this time selecting `password_hash` too, because we need it to compare.
3. No such user → `401`.
4. `bcrypt.compare(inputPassword, user.password_hash)` → mismatch → `401`.
5. Match → issue a JWT and return `{ token, user }`.

**`bcrypt.compare` mechanics:** the stored hash already contains its own salt and cost factor. `compare` re-hashes the input with that same salt/cost and checks whether the results match, so no separate salt storage is needed and the original password is never recovered.

### 2. Same error message for "wrong email" and "wrong password" (user enumeration)

Both failure paths return exactly `401 Invalid email or password`. If the messages differed, an attacker could probe the login endpoint repeatedly and learn which emails are registered in the system. This attack is called **user enumeration**. Giving no hint about *which* part was wrong closes that leak.

`401` is used (not `403`) because the problem is authentication: "we don't know who you are." `403` is for "we know who you are, but you're not allowed to do this" — that will appear in workspace/task authorization.

### 3. Building the response object manually

```js
user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at }
```

The login query selects `password_hash`, so sending the whole `user` row back would leak the hash in the API response. Picking fields explicitly means a sensitive column can never be sent by accident, even if the query changes later.

### 4. Authentication middleware: `verifyToken`

File: `src/middleware/verifyToken.js`

Analogy: a security guard at the building entrance. A request passes the guard *before* reaching the kitchen (controller). Valid ID → `next()` lets it through. Invalid → turned back with `401`.

What it does:
1. Reads the `Authorization` header and expects the format `Bearer <token>`.
2. `jwt.verify(token, JWT_SECRET)` checks the **signature and the expiry**. A modified or expired token throws an error, which is caught and answered with `401`.
3. On success, stores `{ id, email }` in `req.user`, so every later handler knows which user the request belongs to.
4. Calls `next()`.

**Rule:** a middleware must end with either `next()` or a response (`res.xxx()`). If neither happens, the request hangs forever and the client never gets a reply.

**Order in the route:** `router.get('/me', verifyToken, me)` — Express runs handlers left to right, so `verifyToken` runs first and `me` only runs if `next()` was called.

### 5. `GET /api/auth/me` — why it queries the database again

The token already contains `id` and `email`, but `/me` still fetches the user from the DB. A token stays valid for 7 days; if the user was deleted in the meantime, the token would still verify but the user would no longer exist. The database is the source of truth, the token is only a claim of identity.

If the user is gone, `/me` returns `404`.

### 6. Test results

| Test | Result |
|---|---|
| `GET /me` without a token | `401 Authentication token missing` |
| `GET /me` with a valid token | `200` + `{ user: {...} }` |
| `GET /me` with a tampered token (extra character appended) | `401 Invalid or expired token` |

The tampered-token test shows the key JWT property in practice: the payload is readable by anyone (it's only base64), but without `JWT_SECRET` nobody can change it and still have a valid signature.

Handy trick used in testing — saving the token into a shell variable:
```bash
TOKEN=$(curl -s -X POST .../login -H "Content-Type: application/json" -d '{...}' | sed 's/.*"token":"\([^"]*\)".*/\1/')
curl -i .../me -H "Authorization: Bearer $TOKEN"
```

### 7. Design notes / known gaps

- **Stateless JWT:** the server doesn't remember issued tokens, so it cannot "log a user out" server-side — a token stays valid until it expires. The `auth_sessions` table (token hash, `revoked` flag) exists in the schema for exactly this, but is **not used yet**. Decide later whether to wire it in (real logout/revoke) or keep pure stateless JWT.
- **Error format:** responses currently use `{ message }`. The project doc (section 12) defines a common structure `{ type, title, status, detail }`. Standardize this once more endpoints exist, ideally via one shared error helper.
- **No input validation beyond "field present"** yet (email format, password length). To add later.

### Status
✅ `POST /api/auth/register` — tested, duplicate-email guard verified (`409`)
✅ `POST /api/auth/login` — tested (success, wrong password, unknown email)
✅ `verifyToken` middleware — tested (missing / valid / tampered token)
✅ `GET /api/auth/me` — tested

### Next up
- Workspaces: `POST /api/workspaces` (create) and `GET /api/workspaces` (list the user's workspaces) — first real use of `verifyToken` and `req.user`.
- Members + invite flow.

## Glossary additions

- **Authentication vs authorization** — authentication = proving who you are (`401` on failure); authorization = whether you're allowed to do a specific action (`403` on failure).
- **User enumeration** — an attack where different error messages reveal which accounts exist.
- **Bearer token** — a token sent in the `Authorization: Bearer <token>` header; whoever "bears" it is treated as the identified user.
- **Stateless authentication** — the server keeps no per-session record; everything needed to identify the user is in the signed token itself.
EOF




## Session 4 — Workspaces: Create & List

### 1. What was built

- `POST /api/workspaces` — create a workspace; the creator becomes its `Owner`.
- `GET /api/workspaces` — list the workspaces the logged-in user belongs to.

Both routes live behind `verifyToken`, so `req.user` (`id`, `email`) is always available inside the controller.

### 2. Matching the frontend's data contract

Before writing the backend, the frontend's `api.js` (mock data) was read to see the exact shape it expects:

```js
{ id, name, description, role, members }
```

- `role` is **the current user's role in that workspace**, not a property of the workspace itself. Two users looking at the same workspace see different `role` values. So it must come from the `workspace_members` row of *this* user.
- `members` is a **count**, computed in the query.
- Create-workspace request body: `{ name, description }`.

**Known mismatch to fix in the "connect frontend" phase:** the frontend's mock register/login returns `{ token, name }`, while the backend returns `{ token, user: { id, name, email, created_at } }`. Either the frontend reads `res.user.name`, or the backend also adds a top-level `name`. Decide when connecting.

### 3. The owner is also stored as a row in `workspace_members`

`workspaces.owner_id` records who owns the workspace, but access is decided *only* by `workspace_members`. So when a workspace is created, the creator is inserted into `workspace_members` as `Owner` / `Active` too.

Why: "who can access this workspace?" then has exactly **one** place to look, for owners and members alike. Every later check (view tasks, invite members, run a task) reuses the same query instead of special-casing the owner.

### 4. Transactions — all-or-nothing

Creating a workspace performs two inserts (`workspaces`, then `workspace_members`). If the second fails after the first succeeded, there would be an orphan workspace with no members, invisible to everyone but still in the database.

A **transaction** groups statements so they either all take effect or none do:



Analogy: a bank transfer — if money leaves account A but never arrives in account B, the whole transfer must be cancelled.

**`pool.connect()` instead of `pool.query()`:** a transaction lives inside *one* database connection. `pool.query()` may pick a different connection from the pool on each call, so `BEGIN` and the inserts could land on different connections and the transaction would not work. `pool.connect()` checks out one dedicated client, all statements run on it, and `client.release()` returns it to the pool.

**`finally { client.release() }`:** runs whether the code succeeded or failed. Without it, every error would leak a connection, and eventually the pool would run out and the server would hang.

### 5. Authorization built into the query

```sql
FROM workspaces w
JOIN workspace_members wm ON wm.workspace_id = w.id
WHERE wm.user_id = $1 AND wm.status = 'Active'
```

The user id comes from the verified token (`req.user.id`), never from the request body or URL, so a client cannot ask for someone else's data. The `JOIN ... WHERE` means rows the user doesn't belong to are never selected in the first place.

Verified with a second user: `GET /api/workspaces` for the new user returned `[]` while the first user's workspace existed.

This is *data-level* authorization (filter in the query). For routes that address one specific workspace by id (`/workspaces/:id/...`), a separate membership check will be needed, returning `403`/`404` when the user doesn't belong.

### 6. `router.use(verifyToken)` — secure by default

Placing `router.use(verifyToken)` once at the top of the router protects every route in that file. If a route is added later and the developer forgets to attach the middleware, it is still protected. Opening a route should be a deliberate act, not the default.

### 7. The `COUNT(*)` gotcha — bigint arrives as a string

PostgreSQL's `COUNT(*)` returns `bigint`. The `pg` library converts `bigint` to a JavaScript **string** (`"1"`) because JS numbers can't safely hold every bigint value. The frontend expects a number, so the query casts it: `COUNT(*)::int AS members`. Worth remembering for any `COUNT`/`SUM` query.

### 8. Input validation

```js
if (!name || typeof name !== 'string' || name.trim() === '') → 400
```

- `typeof name !== 'string'` rejects things like `{"name": 123}` or `{"name": {}}`.
- `.trim()` rejects names made only of spaces and stores the trimmed value.

### 9. Test results

| Test | Result |
|---|---|
| `GET /api/workspaces` without token | `401` |
| `POST` with valid name | `201`, `role: "Owner"`, `members: 1` |
| `POST` with name `"   "` | `400 Workspace name is required` |
| `GET` list (owner) | array with the workspace, `members` is a number |
| `GET` list (second user) | `[]` |
| Direct DB query (`workspaces JOIN workspace_members`) | owner row exists: `Owner` / `Active` |

### 10. Known gaps / things to revisit

- If `pool.connect()` itself fails, the request errors before the `try` block (unhandled). Acceptable for now; a central error handler would cover this.
- A valid token for a user who was deleted would fail with a foreign-key error (`500`) on create. Strictly it should be `401`.
- `members` counts every row, including `Pending` invites (matches the frontend's mock behaviour).
- No pagination, no `GET /workspaces/:id`, no rename/delete — the frontend doesn't use them yet.

### Status
✅ `POST /api/workspaces` — tested
✅ `GET /api/workspaces` — tested, including cross-user isolation

### Next up
- `GET /api/workspaces/:id/members` and `POST /api/workspaces/:id/invite`
  - Per-workspace membership check (first real `403`/`404` handling)
  - Role check: who is allowed to invite
  - Inviting an email that has no account yet (`user_id` is `NULL`, status `Pending`)

## Glossary additions

- **Transaction** — a group of database statements that succeed or fail as a single unit (`BEGIN` / `COMMIT` / `ROLLBACK`).
- **Atomicity** — the "all or nothing" guarantee a transaction provides.
- **Connection leak** — checking out a pool connection and never releasing it; eventually exhausts the pool.
- **Secure by default** — protection is applied automatically and must be explicitly removed, instead of being something each route must remember to add.
- **Data-level authorization** — enforcing access rules inside the query itself, so unauthorized rows are never fetched.
EOF




## Session 5 — Members & Invites

### 1. What was built

- `GET  /api/workspaces/:id/members` — list everyone in a workspace (any active member can view).
- `POST /api/workspaces/:id/invite` — invite an email to a workspace (Owner/Admin only).
- Middleware `requireWorkspaceMember` (`src/middleware/workspaceAccess.js`) — reusable per-workspace access check.
- `src/controllers/memberController.js`.

### 2. Frontend contract (read from `Members.jsx` / `api.js` before coding)

- Roles in the UI: `Member` and `Admin` (invite dropdown) plus `Owner` (workspace creator) → three roles.
- Each member must look like `{ id, name, email, role, status }`.
- **`name` must never be `null`** — the page does `m.name.slice(0, 1)` and would crash. A person who has no account yet gets the part of their email before `@` as a display name.
- The invite response has the same shape; the frontend appends it directly to the members list.

### 3. Two different failures, two different status codes

| Situation | Status | Reason |
|---|---|---|
| User is not an (active) member of the workspace | `404 Workspace not found` | A `403` would confirm the workspace exists. `404` hides its existence — same idea as the identical login error messages (user enumeration). |
| User is a member but their role isn't allowed to do this | `403` | They already know the workspace exists; they just lack permission. |

### 4. Authorization as a chain of guards

```js
router.use(verifyToken);                                           // who are you?
router.post('/:id/invite', requireWorkspaceMember, inviteMember);  // are you in THIS workspace? → then the action
```

Order of checks inside the invite controller: **role (403) → input validation (400) → duplicate (409) → insert**. Authorization comes before validation so someone with no right to invite learns nothing about how inputs are validated.

`requireWorkspaceMember` stores `req.workspaceId` and `req.memberRole`, so later handlers (and the future task routes) don't repeat the lookup.

### 5. Validate the `:id` URL parameter

A request like `/workspaces/abc/members` would make PostgreSQL throw `invalid input syntax for type uuid` (error code `22P02`), which would surface as a `500`. Bad client input should never be a server error, so the middleware checks the UUID format with a regex first and answers `404`.

### 6. `LEFT JOIN` + `COALESCE`

```sql
SELECT wm.id,
       COALESCE(u.name, split_part(wm.email, '@', 1)) AS name,
       wm.email, wm.role, wm.status
FROM workspace_members wm
LEFT JOIN users u ON u.id = wm.user_id
```

- A pending invitee without an account has `user_id = NULL`. A normal `JOIN` (inner join) would silently drop that row; `LEFT JOIN` keeps every `workspace_members` row and fills the `users` columns with `NULL` when there is no match.
- `COALESCE(a, b)` returns the first non-null value: the real name if the user exists, otherwise the email prefix.
- `split_part(text, delimiter, n)` takes the n-th piece of a string.

### 7. Email normalization

Invited emails are trimmed and lowercased before storing, and duplicate/lookup queries compare with `LOWER(...)`. Otherwise `NewPerson@Test.com` and `newperson@test.com` would count as two different invitees (the `UNIQUE(workspace_id, email)` constraint is case-sensitive).

### 8. Duplicate protection in two layers

1. **Code check** — `SELECT` before `INSERT` gives a clean `409` in the normal case.
2. **Database constraint** — `UNIQUE(workspace_id, email)` catches the race condition where two identical requests pass the `SELECT` at the same moment. The resulting Postgres error code `23505` (unique violation) is caught and also turned into `409`.

The code check is for good error messages; the constraint is the real guarantee.

### 9. Pending vs Active

Only `Active` memberships grant access. An invited person (even one who already has an account) is `Pending`: they get `404` on the workspace and it does not appear in their `GET /api/workspaces`. Turning `Pending` into `Active` is **not implemented yet** — for testing it was done by hand with `UPDATE workspace_members SET status='Active' ...`.

### 10. Test results

| Test | Result |
|---|---|
| Members list as owner | `200`, 1 member (`Owner`/`Active`) |
| Invite `NewPerson@Test.com` | `201`, stored lowercase, `Pending`, name `newperson` |
| Invite a registered user | `201`, name taken from `users` (`Second User`) |
| Invite the same email again | `409` |
| Invalid email / role `Owner` | `400` / `400` |
| `/workspaces/abc/members` | `404` |
| Pending user lists members | `404` |
| Active `Member` lists members | `200` (3 members) |
| Active `Member` invites | `403 Only owners and admins can invite members` |
| Active `Member` lists workspaces | workspace with `role: "Member"`, `members: 3` |

**Testing tip:** two `curl -i` commands pasted together produce garbled output (headers end in `\r`, the JSON body has no trailing newline, so the next response overwrites the line). For status checks use `curl -s -o /dev/null -w "%{http_code}\n" ...`.

**Test data now in the DB:** workspace "Personal Project" with `harendra@test.com` (Owner, Active), `second@test.com` (Member, Active — activated manually), `newperson@test.com` (Member, Pending).

### 11. Known gaps

- No way for an invitee to accept (see section 9).
- Registration doesn't normalize email case and doesn't verify email ownership. If invites ever auto-activate on registration, anyone could claim an invite by registering with that address — verification would be needed first.
- The owner's own member row stores the email exactly as registered (taken from the token), not lowercased.
- Email format check is a simple regex (`x@y.z`), not full validation.
- An `Admin` can invite another `Admin`; no remove-member or change-role endpoints yet (the frontend doesn't use them).

### Status
✅ `GET /api/workspaces/:id/members` — tested
✅ `POST /api/workspaces/:id/invite` — tested (success, duplicate, validation, 403, 404)

### Next up
- Decide and build how `Pending` becomes `Active`, or defer it.
- Tasks (`GET/POST /api/tasks`) — the core of the project.

## Glossary additions

- **Resource hiding (404 instead of 403)** — answering "not found" for things the caller isn't allowed to see, so their existence isn't revealed.
- **`LEFT JOIN`** — keeps every row of the left table even when the right table has no match (missing columns become `NULL`).
- **`COALESCE`** — returns the first non-null argument; handy for fallback values.
- **Unique violation (`23505`)** — the Postgres error raised when an insert breaks a `UNIQUE` constraint; the final safety net against duplicates and race conditions.
- **Race condition** — two operations interleaving so the result depends on timing (e.g. two identical invites passing the same pre-check).
- **Guard chain** — authentication → membership → role → validation, each step stopping the request early.
EOF
