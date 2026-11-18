# CS543 Assignment 8 - Tasks service as a REST API (Multi-Agent AI Workspace)

**Team:** <Roll No. - Name>, <Roll No. - Name>, <Roll No. - Name>, <Roll No. - Name>

**How to run:** `npm install && npm start`, then open <http://localhost:3000>.

**Demo:** <Google Drive link to demo video> &middot; Screenshots: `screenshots/before.png`, `screenshots/after.png`

## Answers

### 1. Which service did you pick, and what are its routes?
The **Tasks** service of our Multi-Agent AI Workspace project (a task is created in a workspace and delegated to an AI agent). This is the equivalent of the Menu/Catalogue entity in the assignment (the CampusEats example is used only as a guide).

| Method | Path | Purpose |
|---|---|---|
| GET  | `/items`     | list all tasks |
| GET  | `/items/:id` | fetch one task |
| POST | `/items`     | create a task |

### 2. Which status codes did you return?
| Code | Outcome |
|---|---|
| 200 | `GET /items`, `GET /items/:id` found |
| 201 | `POST /items` created a new task |
| 404 | `GET /items/:id` with an id that does not exist |
| 422 | `POST /items` with missing/blank `title` (or invalid `status`) |

### 3. Where did you use `req.params` and `req.body`? Why `express.json()`?
- `req.params.id` - in `GET /items/:id`, to read the `:id` from the URL path.
- `req.body` - in `POST /items`, to read the JSON the client sent (`title`, `assignedAgent`, ...).
- A POST body arrives as a raw stream of bytes. `express.json()` reads it and parses it into a JavaScript object on `req.body`; without it `req.body` is `undefined`.
