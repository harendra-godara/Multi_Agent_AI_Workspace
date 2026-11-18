// CS543 - Assignment 9: Securing the Tasks API (Multi-Agent AI Workspace).
// Same service as Assignment 8 (GET/POST /items) + login (JWT), authenticate and requireRole middleware.
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;            // secret is NOT in the code
if (!SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set a value.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// ---- Users: two roles. Only the bcrypt HASH is stored, never the plain password ----
const users = [
  { id: 1, username: 'member1', role: 'member', passwordHash: bcrypt.hashSync('member123', 10) },
  { id: 2, username: 'admin1',  role: 'admin',  passwordHash: bcrypt.hashSync('admin123',  10) },
];

// ---- Same in-memory tasks as Assignment 8 ----
const items = [
  { id: 1, title: 'Summarise project requirements', assignedAgent: 'Research Agent', status: 'done',        priority: 2 },
  { id: 2, title: 'Generate REST API boilerplate',  assignedAgent: 'Code Agent',     status: 'in_progress', priority: 3 },
  { id: 3, title: 'Write unit tests for auth',      assignedAgent: 'Test Agent',     status: 'pending',     priority: 1 },
  { id: 4, title: 'Draft deployment notes',         assignedAgent: 'Docs Agent',     status: 'pending',     priority: 1 },
];
let nextId = 5;

// ---- POST /login: verify password, return a signed JWT (id + role, with expiry) ----
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username === username);
  // Same 401 for "no such user" and "wrong password" so attackers cannot learn which usernames exist.
  if (!user || !password || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// ---- Guard 1: authenticate - "who are you?" (401 if token missing / invalid / expired) ----
function auth(req, res, next) {
  const token = (req.get('Authorization') || '').split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}

// ---- Guard 2: authorize - "may you?" (403 if the role is not allowed) ----
const requireRole = (...ok) => (req, res, next) =>
  ok.includes(req.user.role) ? next() : res.status(403).json({ error: 'forbidden' });

// ---- Routes ----
// Read routes: authentication only (any logged-in user)
app.get('/items', auth, (req, res) => res.json(items));

app.get('/items/:id', auth, (req, res) => {
  const item = items.find((i) => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: `item ${req.params.id} not found` });
  res.json(item);
});

// Write route: authentication + role (only 'admin' may create)
app.post('/items', auth, requireRole('admin'), (req, res) => {
  const { title, assignedAgent, status, priority } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(422).json({ error: 'title required' });
  }
  const item = {
    id: nextId++,
    title: title.trim(),
    assignedAgent: assignedAgent || 'Unassigned',
    status: status || 'pending',
    priority: Number.isInteger(priority) ? priority : 1,
  };
  items.push(item);
  res.status(201).json(item);
});

app.listen(PORT, () => console.log(`Secured Tasks API running on http://localhost:${PORT}`));
