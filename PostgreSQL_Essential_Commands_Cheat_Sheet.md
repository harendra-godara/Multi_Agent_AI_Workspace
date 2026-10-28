# PostgreSQL Essential Commands Cheat Sheet

A practical reference for the most important PostgreSQL commands used in development, especially with Node.js and Express applications.

---

## 1. PostgreSQL Service Commands

These commands are run directly in the Linux terminal, not inside `psql`.

### Start PostgreSQL

```bash
sudo systemctl start postgresql
```

Starts the PostgreSQL database service.

### Stop PostgreSQL

```bash
sudo systemctl stop postgresql
```

Stops the PostgreSQL database service.

### Restart PostgreSQL

```bash
sudo systemctl restart postgresql
```

Stops and starts PostgreSQL again. Useful after configuration changes or when the service is not responding correctly.

### Check PostgreSQL Status

```bash
sudo systemctl status postgresql
```

Shows whether PostgreSQL is running.

You should see:

```text
Active: active (running)
```

### Enable PostgreSQL at Boot

```bash
sudo systemctl enable postgresql
```

Automatically starts PostgreSQL whenever the computer boots.

### Check PostgreSQL Version

```bash
psql --version
```

Displays the installed PostgreSQL client version.

---

# 2. Open PostgreSQL Terminal

### Connect as the PostgreSQL Admin User

```bash
sudo -u postgres psql
```

Opens the PostgreSQL interactive terminal (`psql`) using the default `postgres` administrative user.

Example prompt:

```text
postgres=#
```

### Exit PostgreSQL

```sql
\q
```

Returns to the normal Linux terminal.

---

# 3. Database Commands

### List All Databases

```sql
\l
```

Displays all databases available in the PostgreSQL server.

### Create a Database

```sql
CREATE DATABASE mydb;
```

Creates a new database named `mydb`.

### Connect to a Database

```sql
\c mydb
```

Switches the current PostgreSQL session to `mydb`.

You may see:

```text
You are now connected to database "mydb".
```

### Show Current Database

```sql
SELECT current_database();
```

Returns the name of the database to which you are currently connected.

### Delete a Database

```sql
DROP DATABASE mydb;
```

Permanently deletes the database and its data.

**Warning:** This operation cannot normally be undone.

---

# 4. Table Commands

### List Tables

```sql
\dt
```

Shows tables in the current database.

### Create a Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
```

Creates a `users` table with:
- `id`: Automatically generated unique ID.
- `name`: User's name.
- `email`: Unique email address.
- `password`: Stores the password value (in real applications, store a password hash, not the plain password).

### Describe a Table

```sql
\d users
```

Shows the columns, data types, indexes, and constraints of the `users` table.

For more details:

```sql
\d+ users
```

### Delete a Table

```sql
DROP TABLE users;
```

Deletes the table and all of its data.

---

# 5. INSERT - Add Data

### Insert One Row

```sql
INSERT INTO users (name, email, password)
VALUES ('Harendra', 'harendra@gmail.com', 'hashed_password');
```

Adds one user to the `users` table.

### Insert Multiple Rows

```sql
INSERT INTO users (name, email, password)
VALUES
('Harendra', 'harendra@gmail.com', 'hash1'),
('Harsh', 'harsh@gmail.com', 'hash2'),
('Mohit', 'mohit@gmail.com', 'hash3');
```

Adds multiple rows in a single query.

---

# 6. SELECT - Read Data

### Select All Data

```sql
SELECT * FROM users;
```

Returns every column and every row from the `users` table.

### Select Specific Columns

```sql
SELECT name, email FROM users;
```

Returns only the `name` and `email` columns.

### Select with a Condition

```sql
SELECT * FROM users
WHERE id = 1;
```

Returns the user whose ID is `1`.

### Search with LIKE

```sql
SELECT * FROM users
WHERE name LIKE '%Har%';
```

Finds users whose names contain `Har`.

### Count Rows

```sql
SELECT COUNT(*) FROM users;
```

Returns the total number of rows.

### Sort Results

```sql
SELECT * FROM users
ORDER BY id DESC;
```

Sorts users by ID in descending order.

Use `ASC` for ascending order:

```sql
SELECT * FROM users
ORDER BY id ASC;
```

### Limit Results

```sql
SELECT * FROM users
LIMIT 5;
```

Returns at most 5 rows.

---

# 7. UPDATE - Modify Data

### Update One Row

```sql
UPDATE users
SET name = 'Harendra Godara'
WHERE id = 1;
```

Changes the name of the user whose ID is `1`.

**Important:** Always use an appropriate `WHERE` condition when you only want to update specific rows.

Without `WHERE`:

```sql
UPDATE users
SET name = 'Unknown';
```

This changes the name for every row.

---

# 8. DELETE - Remove Data

### Delete One Row

```sql
DELETE FROM users
WHERE id = 1;
```

Deletes the user whose ID is `1`.

### Delete All Rows

```sql
DELETE FROM users;
```

Deletes all rows but keeps the table itself.

**Warning:** Always check your `WHERE` condition before executing a DELETE query.

---

# 9. PostgreSQL Users and Roles

PostgreSQL uses roles for authentication and authorization.

### List Users/Roles

```sql
\du
```

Displays PostgreSQL users/roles and their privileges.

### Create a User

```sql
CREATE USER harendra WITH PASSWORD 'mypassword';
```

Creates a PostgreSQL user named `harendra`.

### Create a User with Login

```sql
CREATE ROLE harendra WITH LOGIN PASSWORD 'mypassword';
```

Creates a role that can log in to PostgreSQL.

### Grant Database Privileges

```sql
GRANT ALL PRIVILEGES ON DATABASE mydb TO harendra;
```

Gives the user privileges on the specified database.

Note: Depending on PostgreSQL version and schema ownership, you may also need privileges on the database's schema/tables.

### Change a User Password

```sql
ALTER USER harendra WITH PASSWORD 'newpassword';
```

Changes the password for the PostgreSQL user.

---

# 10. Schema Commands

A schema is a logical container for database objects such as tables.

### List Schemas

```sql
\dn
```

Shows available schemas.

### Create a Schema

```sql
CREATE SCHEMA app;
```

Creates a schema named `app`.

### Create a Table Inside a Schema

```sql
CREATE TABLE app.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);
```

Creates the `users` table inside the `app` schema.

---

# 11. Constraints

Constraints help maintain correct and reliable data.

### PRIMARY KEY

```sql
id SERIAL PRIMARY KEY
```

Uniquely identifies each row.

### NOT NULL

```sql
name VARCHAR(100) NOT NULL
```

Prevents the column from containing `NULL`.

### UNIQUE

```sql
email VARCHAR(150) UNIQUE
```

Prevents duplicate values.

### DEFAULT

```sql
status VARCHAR(20) DEFAULT 'active'
```

Automatically uses `active` when no status is supplied.

### FOREIGN KEY

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id)
);
```

Creates a relationship between `orders.user_id` and `users.id`.

---

# 12. ALTER TABLE

### Add a Column

```sql
ALTER TABLE users
ADD COLUMN age INT;
```

Adds an `age` column.

### Rename a Column

```sql
ALTER TABLE users
RENAME COLUMN name TO full_name;
```

Changes the column name from `name` to `full_name`.

### Change a Column Type

```sql
ALTER TABLE users
ALTER COLUMN age TYPE BIGINT;
```

Changes the data type of `age`.

### Rename a Table

```sql
ALTER TABLE users
RENAME TO customers;
```

Renames `users` to `customers`.

---

# 13. Useful psql Meta-Commands

These commands start with `\` and are specific to the PostgreSQL `psql` terminal.

| Command | Description |
|---|---|
| `\l` | List databases |
| `\c database_name` | Connect to a database |
| `\dt` | List tables |
| `\d table_name` | Describe a table |
| `\d+ table_name` | Detailed table information |
| `\du` | List users/roles |
| `\dn` | List schemas |
| `\conninfo` | Show current connection information |
| `\q` | Exit psql |
| `\?` | Show psql commands |
| `\h SELECT` | Show SQL help for SELECT |

---

# 14. Transactions

Transactions allow multiple operations to be treated as one unit.

### Start a Transaction

```sql
BEGIN;
```

### Commit Changes

```sql
COMMIT;
```

Permanently saves the changes made in the transaction.

### Roll Back Changes

```sql
ROLLBACK;
```

Cancels changes made since the transaction began.

### Example

```sql
BEGIN;

UPDATE users
SET name = 'Harendra'
WHERE id = 1;

ROLLBACK;
```

The update is cancelled.

Another example:

```sql
BEGIN;

UPDATE users
SET name = 'Harendra'
WHERE id = 1;

COMMIT;
```

The update is saved.

---

# 15. JOIN - Combine Data from Tables

Suppose we have:

```sql
users
```

and:

```sql
orders
```

### INNER JOIN

```sql
SELECT users.name, orders.id
FROM users
INNER JOIN orders
ON users.id = orders.user_id;
```

Returns records where matching users and orders exist.

### LEFT JOIN

```sql
SELECT users.name, orders.id
FROM users
LEFT JOIN orders
ON users.id = orders.user_id;
```

Returns all users, including users who have no orders.

---

# 16. Indexes

Indexes improve the speed of searches on frequently queried columns.

### Create an Index

```sql
CREATE INDEX idx_users_email
ON users(email);
```

Creates an index on the `email` column.

### List Indexes

```sql
\di
```

Displays indexes available to the current user.

### Delete an Index

```sql
DROP INDEX idx_users_email;
```

Removes the index.

---

# 17. Useful Terminal Commands

### List Databases Without Entering psql

```bash
sudo -u postgres psql -l
```

### Connect Directly to a Database

```bash
sudo -u postgres psql -d mydb
```

### Run SQL Directly from Linux Terminal

```bash
sudo -u postgres psql -d mydb -c "SELECT * FROM users;"
```

---

# 18. Backup and Restore

### Backup a Database

```bash
pg_dump mydb > mydb_backup.sql
```

Creates a SQL backup file.

### Restore a SQL Backup

```bash
psql mydb < mydb_backup.sql
```

Restores the SQL backup into `mydb`.

For a PostgreSQL server user:

```bash
pg_dump -U postgres mydb > mydb_backup.sql
```

---

# 19. Important PostgreSQL Data Types

| Data Type | Example | Use |
|---|---|---|
| `INTEGER` | `25` | Whole numbers |
| `BIGINT` | `1000000000` | Large whole numbers |
| `SERIAL` | `1, 2, 3...` | Auto-incrementing integer |
| `VARCHAR(100)` | `'Harendra'` | Variable-length text |
| `TEXT` | `'Long description...'` | Large text |
| `BOOLEAN` | `TRUE` | True/false values |
| `DATE` | `2026-10-13` | Date |
| `TIMESTAMP` | `2026-10-13 21:30:00` | Date and time |
| `NUMERIC(10,2)` | `1250.50` | Exact decimal values |
| `JSONB` | `{"role":"admin"}` | JSON data |

---

# 20. Most Important Commands to Memorize

For everyday development, especially with Node.js/Express, remember these first:

```bash
sudo systemctl start postgresql
sudo systemctl restart postgresql
sudo systemctl status postgresql
psql --version
sudo -u postgres psql
```

Inside `psql`:

```sql
\l
\c database_name
\dt
\d table_name
\du
\q
```

SQL:

```sql
CREATE DATABASE mydb;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE
);

INSERT INTO users (name, email)
VALUES ('Harendra', 'harendra@gmail.com');

SELECT * FROM users;

UPDATE users
SET name = 'Harendra Godara'
WHERE id = 1;

DELETE FROM users
WHERE id = 1;
```

---

# 21. Example: Complete Beginner Workflow

### Step 1 — Start PostgreSQL

```bash
sudo systemctl start postgresql
```

### Step 2 — Open PostgreSQL

```bash
sudo -u postgres psql
```

### Step 3 — Create a database

```sql
CREATE DATABASE auth_db;
```

### Step 4 — Connect to it

```sql
\c auth_db
```

### Step 5 — Create a users table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);
```

### Step 6 — Check the table

```sql
\dt
```

### Step 7 — Insert data

```sql
INSERT INTO users (name, email, password)
VALUES (
    'Harendra',
    'harendra@gmail.com',
    'hashed_password'
);
```

### Step 8 — Read data

```sql
SELECT * FROM users;
```

### Step 9 — Exit

```sql
\q
```

---

# 22. Important Notes for Node.js Projects

When connecting PostgreSQL with Node.js, the commonly used connection information is:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=auth_db
DB_USER=postgres
DB_PASSWORD=your_password
```

The default PostgreSQL port is:

```text
5432
```

For real authentication systems, **never store plain-text passwords**. Hash passwords with a password-hashing library such as `bcrypt` before storing them.

---

## Quick Memory Trick

Think of database work as:

```text
DATABASE
   ↓
TABLE
   ↓
INSERT → Add data
SELECT → Read data
UPDATE → Change data
DELETE → Remove data
```

And PostgreSQL terminal navigation as:

```text
\l  → databases
\c  → connect
\dt → tables
\d  → table structure
\du → users
\q  → quit
```
