// CS543 - Assignment 8: Tasks service (Multi-Agent AI Workspace) as a REST API.
// Data lives in an in-memory array (a real DB is optional for this assignment).
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parses the JSON body of POST requests into req.body.
app.use(express.json());

// Serves public/index.html and public/style.css.
app.use(express.static(path.join(__dirname, 'public')));

// ---- In-memory "database": source of truth (3-4 seed records) ----
const items = [
  { id: 1, title: 'Summarise project requirements', assignedAgent: 'Research Agent', status: 'done',        priority: 2 },
  { id: 2, title: 'Generate REST API boilerplate',  assignedAgent: 'Code Agent',     status: 'in_progress', priority: 3 },
  { id: 3, title: 'Write unit tests for auth',      assignedAgent: 'Test Agent',     status: 'pending',     priority: 1 },
  { id: 4, title: 'Draft deployment notes',         assignedAgent: 'Docs Agent',     status: 'pending',     priority: 1 },
];
let nextId = 5;

const ALLOWED_STATUS = ['pending', 'in_progress', 'done'];

// GET /items  -> 200 + list
app.get('/items', (req, res) => {
  res.json(items);
});

// GET /items/:id -> 200 + one item, or 404 if absent
app.get('/items/:id', (req, res) => {
  const id = Number(req.params.id);            // id comes from the URL
  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: `item ${req.params.id} not found` });
  res.json(item);
});

// POST /items -> 201 + created item, or 422 if a required field is missing/invalid
app.post('/items', (req, res) => {
  const { title, assignedAgent, status, priority } = req.body || {};   // data comes from the JSON body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(422).json({ error: 'title required' });
  }
  if (status !== undefined && !ALLOWED_STATUS.includes(status)) {
    return res.status(422).json({ error: `status must be one of: ${ALLOWED_STATUS.join(', ')}` });
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

app.listen(PORT, () => console.log(`Tasks REST API running on http://localhost:${PORT}`));
