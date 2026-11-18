// CS543 - Assignment 5: HTTP methods & headers.
// Tasks service of the Multi-Agent AI Workspace (a task is delegated to one or more AI agents).
'use strict';
const express = require('express');
const compression = require('compression');
const crypto = require('crypto');

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

// Agent registry: true = online, false = offline.
const AGENTS = {
  'Research Agent': true, 'Code Agent': true, 'Test Agent': true,
  'Docs Agent': true, 'QA Agent': true, 'Deploy Agent': false,
};
const STATUSES = ['pending', 'running', 'completed', 'cancelled'];

// Which methods each URL shape supports (used by OPTIONS -> Allow, and by 405).
const ROUTES = [
  [/^\/tasks\/?$/, 'GET, HEAD, POST, OPTIONS'],
  [/^\/tasks\/\d+\/?$/, 'GET, HEAD, PUT, PATCH, DELETE, OPTIONS'],
  [/^\/tasks\/\d+\/(start|complete|cancel)\/?$/, 'POST, OPTIONS'],
];
const allowFor = (p) => (ROUTES.find(([re]) => re.test(p)) || [])[1];

const etagOf = (t) => `"${sha1(JSON.stringify(t)).slice(0, 16)}"`;          // changes whenever the task changes
const tagList = (h) => String(h).split(',').map((s) => s.trim().replace(/^W\//, ''));
const noneMatch = (h, etag) => !!h && (h.trim() === '*' || tagList(h).includes(etag));
const ifMatchOk = (h, etag) => !h || h.trim() === '*' || tagList(h).includes(etag);

const err = (res, status, message) => res.status(status).json({ error: message });

function createApp(opts = {}) {
  const RATE_LIMIT = Number(opts.rateLimit ?? process.env.RATE_LIMIT_MAX ?? 100);
  const WINDOW_MS = Number(opts.windowMs ?? 60000);

  // ---- in-memory data (fixed timestamps so the seed ETags are stable) ----
  const T0 = '2026-01-10T09:00:00.000Z';
  const tasks = new Map();
  [
    { id: 1, title: 'Summarise project requirements', workspaceId: 'ws-1', steps: [{ agent: 'Research Agent', attempts: 1 }], status: 'pending' },
    { id: 2, title: 'Generate REST API boilerplate', workspaceId: 'ws-1', steps: [{ agent: 'Code Agent', attempts: 2 }, { agent: 'Test Agent', attempts: 1 }], status: 'running' },
    { id: 3, title: 'Draft deployment notes', workspaceId: 'ws-2', steps: [{ agent: 'Docs Agent', attempts: 1 }], status: 'completed' },
  ].forEach((t) => tasks.set(t.id, { ...t, version: 1, createdAt: T0, updatedAt: T0 }));
  let nextId = 4;
  const idem = new Map();      // Idempotency-Key store
  const buckets = new Map();   // per-client rate-limit counters

  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);      // we set ETags ourselves

  // ---- B7 + B6 + defaults: headers on every response ----
  app.use((req, res, next) => {
    res.set({
      Server: 'multi-agent-tasks/1.0',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Cache-Control': 'no-store',                                   // safe default; GET handlers relax it
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Location, ETag, Retry-After, Allow, X-Total-Count, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Idempotent-Replayed',
    });
    next();
  });

  // ---- B5: per-client rate limit (client = X-Client-Id header, else IP) ----
  app.use((req, res, next) => {
    const key = req.get('X-Client-Id') || req.ip;
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) { b = { count: 0, resetAt: now + WINDOW_MS }; buckets.set(key, b); }
    b.count += 1;
    const secs = Math.ceil((b.resetAt - now) / 1000);
    res.set({
      'X-RateLimit-Limit': String(RATE_LIMIT),
      'X-RateLimit-Remaining': String(Math.max(0, RATE_LIMIT - b.count)),
      'X-RateLimit-Reset': String(secs),
    });
    if (b.count > RATE_LIMIT) { res.set('Retry-After', String(secs)); return err(res, 429, 'rate limit exceeded for this client'); }
    next();
  });

  // ---- B1: gzip large bodies (Content-Encoding: gzip when the client sends Accept-Encoding) ----
  app.use(compression({ threshold: 256 }));

  // ---- A5 + B6: OPTIONS -> Allow header, and the CORS preflight ----
  app.options(/.*/, (req, res) => {
    const allow = allowFor(req.path);
    if (req.get('Origin') && req.get('Access-Control-Request-Method')) {        // CORS preflight
      res.set({
        'Access-Control-Allow-Methods': allow || 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Idempotency-Key, If-Match, If-None-Match, X-HTTP-Method-Override, X-Client-Id',
        'Access-Control-Max-Age': '600',
      });
      return res.status(204).end();
    }
    if (!allow) return err(res, 404, 'route not found');
    res.set('Allow', allow);
    res.status(204).end();
  });

  // ---- A5: X-HTTP-Method-Override (documented fallback for clients that can only POST) ----
  app.use((req, res, next) => {
    const o = req.get('X-HTTP-Method-Override');
    if (req.method === 'POST' && o) {
      const m = o.toUpperCase();
      if (!['PUT', 'PATCH', 'DELETE'].includes(m)) return err(res, 400, 'X-HTTP-Method-Override must be PUT, PATCH or DELETE');
      req.method = m;
    }
    next();
  });

  // ---- B3: protected endpoints (everything that changes data) need Authorization: Bearer <token> ----
  app.use('/tasks', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const [scheme, token] = (req.get('Authorization') || '').trim().split(/\s+/);
    if (!/^bearer$/i.test(scheme || '') || !token) {
      res.set('WWW-Authenticate', 'Bearer realm="tasks"');
      return err(res, 401, 'missing or empty bearer token');
    }
    next();
  });

  // ---- B1: content negotiation - only JSON is available ----
  app.use('/tasks', (req, res, next) => {
    if (!req.accepts('application/json')) return err(res, 406, 'this API only produces application/json');
    next();
  });

  app.use(express.json({ limit: '100kb' }));

  // ---- helpers ----
  function readBody(req, res) {
    const ct = req.is('application/json');
    if (ct === null) { err(res, 400, 'request body required'); return null; }
    if (ct === false) { err(res, 415, 'Content-Type must be application/json'); return null; }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) { err(res, 400, 'body must be a JSON object'); return null; }
    return req.body;
  }

  // returns [status, message] for the first problem, or null
  function validate(b, partial = false) {
    const has = (k) => !partial || k in b;
    if (has('title') && (typeof b.title !== 'string' || !b.title.trim())) return [422, 'title must be a non-empty string'];
    if (has('workspaceId') && (typeof b.workspaceId !== 'string' || !b.workspaceId.trim())) return [422, 'workspaceId must be a non-empty string'];
    if (has('steps')) {
      if (!Array.isArray(b.steps) || b.steps.length === 0) return [422, 'steps must be a non-empty array'];
      for (const [i, s] of b.steps.entries()) {
        if (!s || typeof s.agent !== 'string' || !s.agent.trim()) return [422, `steps[${i}].agent is required`];
        if (!Number.isInteger(s.attempts) || s.attempts < 1) return [422, `steps[${i}].attempts must be an integer >= 1`];
        if (!Object.hasOwn(AGENTS, s.agent)) return [422, `unknown agent "${s.agent}"`];
        if (!AGENTS[s.agent]) return [422, `agent "${s.agent}" is offline`];
      }
    }
    return null;
  }

  function find(req, res) {
    const t = /^\d+$/.test(req.params.id) ? tasks.get(Number(req.params.id)) : undefined;
    if (!t) { err(res, 404, `task ${req.params.id} not found`); return null; }
    return t;
  }

  const touch = (t) => { t.version += 1; t.updatedAt = new Date().toISOString(); };

  // ---- GET /tasks : pure read with filter / sort / paginate in the query string (A4) ----
  app.get('/tasks', (req, res) => {
    const q = req.query;
    const status = q.status === undefined ? undefined : String(q.status);
    const sort = String(q.sort ?? 'id');
    const order = String(q.order ?? 'asc');
    const page = parseInt(q.page ?? '1', 10);
    const limit = parseInt(q.limit ?? '10', 10);
    if (status && !STATUSES.includes(status)) return err(res, 400, `status must be one of ${STATUSES.join(', ')}`);
    if (!['id', 'title', 'createdAt'].includes(sort)) return err(res, 400, 'sort must be id, title or createdAt');
    if (!['asc', 'desc'].includes(order)) return err(res, 400, 'order must be asc or desc');
    if (!(page >= 1) || !(limit >= 1 && limit <= 100)) return err(res, 400, 'page must be >= 1 and limit between 1 and 100');

    let list = [...tasks.values()];
    if (status) list = list.filter((t) => t.status === status);
    if (q.agent) list = list.filter((t) => t.steps.some((s) => s.agent === String(q.agent)));
    if (q.workspaceId) list = list.filter((t) => t.workspaceId === String(q.workspaceId));
    list.sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0) * (order === 'desc' ? -1 : 1));
    const total = list.length;
    res.set({ 'Cache-Control': 'no-cache', 'X-Total-Count': String(total) });
    res.json({ data: list.slice((page - 1) * limit, page * limit), page, limit, total });
  });

  // ---- GET /tasks/:id : Cache-Control + ETag, conditional GET -> 304 (B4, C1) ----
  app.get('/tasks/:id', (req, res) => {
    const t = find(req, res); if (!t) return;
    const etag = etagOf(t);
    res.set({ ETag: etag, 'Cache-Control': 'private, max-age=30, must-revalidate' });
    if (noneMatch(req.get('If-None-Match'), etag)) return res.status(304).end();
    res.json(t);
  });

  // ---- POST /tasks : 201 + Location, Idempotency-Key makes the retry safe (C3) ----
  app.post('/tasks', (req, res) => {
    const body = readBody(req, res); if (!body) return;
    const key = req.get('Idempotency-Key');
    const scope = `${req.get('Authorization')}|${key}`;
    const fp = sha1(JSON.stringify(body));
    if (key) {
      const prev = idem.get(scope);
      if (prev) {
        if (prev.fp !== fp) return err(res, 422, 'Idempotency-Key was already used with a different request body');
        res.set({ Location: prev.location, ETag: prev.etag, 'Idempotent-Replayed': 'true' });
        return res.status(201).json(prev.body);
      }
    }
    const bad = validate(body);
    if (bad) return err(res, bad[0], bad[1]);
    const t = {
      id: nextId++, title: body.title.trim(), workspaceId: body.workspaceId.trim(),
      steps: body.steps.map((s) => ({ agent: s.agent, attempts: s.attempts })),
      status: 'pending', version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    tasks.set(t.id, t);
    const location = `/tasks/${t.id}`;
    res.set({ Location: location, ETag: etagOf(t) });
    if (key) idem.set(scope, { fp, location, etag: etagOf(t), body: t });
    res.status(201).json(t);
  });

  // ---- PUT / PATCH : conditional write with If-Match -> 412 (C2) ----
  function update(partial) {
    return (req, res) => {
      const t = find(req, res); if (!t) return;
      if (!ifMatchOk(req.get('If-Match'), etagOf(t))) return err(res, 412, 'the task changed since you read it (ETag mismatch); re-read and retry');
      const body = readBody(req, res); if (!body) return;
      if ('status' in body) return err(res, 422, 'status cannot be set directly; use POST /tasks/:id/start, /complete or /cancel');
      if (partial && !['title', 'workspaceId', 'steps'].some((k) => k in body)) return err(res, 400, 'nothing to update');
      const bad = validate(body, partial);
      if (bad) return err(res, bad[0], bad[1]);
      if ('title' in body) t.title = body.title.trim();
      if ('workspaceId' in body) t.workspaceId = body.workspaceId.trim();
      if ('steps' in body) t.steps = body.steps.map((s) => ({ agent: s.agent, attempts: s.attempts }));
      touch(t);
      res.set('ETag', etagOf(t));
      res.json(t);
    };
  }
  app.put('/tasks/:id', update(false));
  app.patch('/tasks/:id', update(true));

  // ---- DELETE : 204 ----
  app.delete('/tasks/:id', (req, res) => {
    const t = find(req, res); if (!t) return;
    if (t.status === 'running') return err(res, 409, 'a running task cannot be deleted; cancel it first');
    tasks.delete(t.id);
    res.status(204).end();
  });

  // ---- non-CRUD actions = POST to a sub-resource (A2) ----
  function action(name, from, to) {
    app.post(`/tasks/:id/${name}`, (req, res) => {
      const t = find(req, res); if (!t) return;
      if (name === 'cancel' && t.status === 'cancelled') { res.set('ETag', etagOf(t)); return res.json(t); }   // repeat = same effect
      if (!from.includes(t.status)) return err(res, 409, `cannot ${name} a task that is ${t.status}`);
      if (name === 'start' && t.workspaceId === 'ws-exhausted') return err(res, 422, 'workspace has no execution quota left');
      t.status = to; touch(t);
      res.set('ETag', etagOf(t));
      res.json(t);
    });
  }
  action('start', ['pending'], 'running');
  action('complete', ['running'], 'completed');
  action('cancel', ['pending', 'running'], 'cancelled');

  // ---- fall-through: 405 (path exists, method does not) or 404 ----
  app.use((req, res) => {
    const allow = allowFor(req.path);
    if (allow) { res.set('Allow', allow); return err(res, 405, `${req.method} is not allowed on ${req.path}`); }
    err(res, 404, 'route not found');
  });

  // ---- error handler ----
  // eslint-disable-next-line no-unused-vars
  app.use((e, req, res, next) => {
    if (e.type === 'entity.parse.failed') return err(res, 400, 'malformed JSON body');
    if (e.type === 'entity.too.large') return err(res, 413, 'body too large');
    console.error(e);
    err(res, 500, 'internal server error');
  });

  return app;
}

module.exports = { createApp };
