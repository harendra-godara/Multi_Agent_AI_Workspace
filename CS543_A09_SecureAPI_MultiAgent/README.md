# CS543 Assignment 9 - Securing the API (Multi-Agent AI Workspace)

**Team:** <Roll No. - Name>, <Roll No. - Name>, <Roll No. - Name>, <Roll No. - Name>

This secures the **Tasks** REST service from Assignment 8 (the same routes and data) with a JWT login, an `auth` middleware and a `requireRole` middleware.

**How to run**
```bash
npm install
cp .env.example .env        # then put a long random value in JWT_SECRET
npm start                   # http://localhost:3000
bash demo.sh                # in another terminal: runs the 5 cases (401 / login / 200 / 201 / 403)
```

**Demo users** (passwords are stored only as bcrypt hashes)

| Username | Password | Role |
|---|---|---|
| member1 | member123 | member |
| admin1  | admin123  | admin |

**Demo:** <Google Drive link to demo video> &middot; Screenshots of the five cases: `screenshots/`

## Answers

### 1. Which routes need only authentication, and which also need a role?
| Method + path | Needs | Role allowed |
|---|---|---|
| `POST /login` | nothing (public) | - |
| `GET /items` | authentication only | any logged-in user (member, admin) |
| `GET /items/:id` | authentication only | any logged-in user (member, admin) |
| `POST /items` | authentication + role | `admin` only |

### 2. One 401 and one 403 - why that code?
- **401** - `GET /items` with no `Authorization` header: the server does not know *who* the caller is (no valid token), so authentication failed.
- **403** - `POST /items` by `member1` with a valid token: the server knows who the caller is, but a `member` is *not allowed* to change data, so it is a permission failure, not an identity failure.

### 3. What is inside the JWT payload? Why trust `role`? Why keep the secret out of the code?
- Payload: `{ "id": <user id>, "role": "<member|admin>", "iat": <issued at>, "exp": <expiry> }`. No password is stored in it.
- The role claim is safe to trust because the token is **signed** with `JWT_SECRET`. `jwt.verify` recomputes the signature, so if a client edits the payload (e.g. changes `member` to `admin`) the signature no longer matches and the request is rejected with 401. Only the server knows the secret, so only the server can create valid tokens.
- The secret must stay out of the code (in `.env`, git-ignored) because anyone who sees it, for example in a public GitHub repo, can sign their own token with `role: "admin"` and the server would accept it.
