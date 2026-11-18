# CS543 Assignment 7 - Tasks service in GraphQL (Multi-Agent AI Workspace)

**Team:** <Roll No. - Name>, <Roll No. - Name>, <Roll No. - Name>, <Roll No. - Name>

**How to run**
```bash
npm install
cp .env.example .env          # set DATABASE_URL (PostgreSQL)
npm run db:init               # creates the tasks table + 4 seed rows (psql "$DATABASE_URL" -f schema.sql)
npm start                     # open http://localhost:4000  (GraphQL endpoint: /graphql)
```
Fedora quick setup if PostgreSQL is not ready: `sudo dnf install postgresql-server && sudo postgresql-setup --initdb && sudo systemctl enable --now postgresql`, then create a user + database as in the main project.

**Demo:** <Google Drive link to demo video> &middot; Screenshots: `screenshots/before.png`, `screenshots/after.png`

Example operations:
```graphql
query { tasks { id title assignedAgent status priority } }

mutation {
  addTask(input: { title: "Review agent output", assignedAgent: "QA Agent" }) {
    id title status
  }
}
```

## Answers

### 1. Which service did you pick?
The **Tasks** entity of our Multi-Agent AI Workspace project (a task that is delegated to an AI agent). It plays the role of the Menu / Dish entity of the assignment (the CampusEats example is used only as a guide). Database: **PostgreSQL** (table `tasks`) via `pg`.

### 2. One field a client can skip, and one it cannot (the `!` sign)
- **Can skip:** `assignedAgent` (declared `String`, no `!`) - a task may exist before an agent is assigned, and the response returns `null` for it. In `AddTaskInput`, `assignedAgent` and `priority` are also optional.
- **Cannot skip:** `title` (declared `String!`). In `AddTaskInput` the client must send it, otherwise GraphQL rejects the request before any resolver runs; in `Task` the server promises it is never `null`. The `!` makes this a contract checked automatically by the schema.

### 3. Map it to SQL
- **WHERE:** the argument of `task(id: ID!)` becomes `WHERE id = $1` in the `Query.task` resolver (`SELECT ... FROM tasks WHERE id = $1`). The list query `tasks` has no WHERE; it is a plain `SELECT ... ORDER BY id`.
- **INSERT:** the `Mutation.addTask` resolver ran `INSERT INTO tasks (title, assigned_agent, priority) VALUES ($1, $2, COALESCE($3, 1)) RETURNING ...`, and the returned row is what the mutation responds with.
