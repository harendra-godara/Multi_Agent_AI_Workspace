// CS543 - Assignment 6: honest responses. The SAME Tasks service as Assignment 5, now with
// correct status codes, one error shape (RFC 9457 Problem Details), field-level validation,
// content negotiation (JSON / XML) and no leaked internals.
'use strict';
const express = require('express');
const compression = require('compression');
const crypto = require('crypto');

const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex');

const AGENTS = {                       // true = online, false = offline
  'Research Agent': true, 'Code Agent': true, 'Test Agent': true,
  'Docs Agent': true, 'QA Agent': true, 'Deploy Agent': false,
};
const STATUSES = ['pending', 'running', 'completed', 'cancelled'];

const ROUTES = [
  [/^\/tasks\/?$/, 'GET, HEAD, POST, OPTIONS'],
  [/^\/tasks\/\d+\/?$/, 'GET, HEAD, PUT, PATCH, DELETE, OPTIONS'],
  [/^\/tasks\/\d+\/(start|complete|cancel)\/?$/, 'POST, OPTIONS'],
];
const allowFor = (p) => (ROUTES.find(([re]) => re.test(p)) || [])[1];

// ETag differs per representation (JSON vs XML are different bytes)
const etagOf = (t, rep = 'json') => `"${sha1(JSON.stringify(t) + rep).slice(0, 16)}"`;
const tagList = (h) => String(h).split(',').map((s) => s.trim().replace(/^W\//, ''));
const noneMatch = (h, t, rep) => !!h && (h.trim() === '*' || tagList(h).includes(etagOf(t, rep)));
const ifMatchOk = (h, t) => !h || h.trim() === '*' || tagList(h).some((x) => x === etagOf(t, 'json') || x === etagOf(t, 'xml'));

// ============================================================================
// B1/B2 - ONE error shape. The stable type catalogue (key -> [status, title]).
// ============================================================================
const TYPE_BASE = 'https://api.multiagent.example/problems/';
const PROBLEMS = {
  // the five required by the assignment, mapped to the Tasks domain
  'empty-steps':           [422, 'Task has no steps'],                 // was: empty-cart
  'agent-unavailable':     [422, 'Agent is unavailable'],              // was: item-unavailable
  'execution-declined':    [422, 'Execution declined'],                // was: payment-declined
  'task-not-found':        [404, 'Task not found'],                    // was: order-not-found
  'illegal-transition':    [409, 'Illegal state transition'],          // was: illegal-transition
  // supporting types
  'validation-error':      [422, 'Request validation failed'],
  'idempotency-key-reuse': [422, 'Idempotency-Key reused with a different body'],
  'precondition-failed':   [412, 'Precondition failed'],
  'malformed-json':        [400, 'Malformed JSON'],
  'bad-request':           [400, 'Bad request'],
  'invalid-query':         [400, 'Invalid query parameters'],
  'unauthorized':          [401, 'Authentication required'],
  'route-not-found':       [404, 'Route not found'],
  'method-not-allowed':    [405, 'Method not allowed'],
  'not-acceptable':        [406, 'Not acceptable'],
  'payload-too-large':     [413, 'Payload too large'],
  'unsupported-media-type':[415, 'Unsupported media type'],
  'rate-limited':          [429, 'Too many requests'],
  'internal-error':        [500, 'Internal error'],
  'service-unavailable':   [503, 'Service temporarily unavailable'],
};

// Every failure goes through this helper: type / title / status / detail (+ instance, errors[], extensions).
function problem(res, key, detail, extra = {}) {
  const [status, title] = PROBLEMS[key];
  res.status(status)
    .set('Content-Type', 'application/problem+json; charset=utf-8')
    .send(JSON.stringify({ type: TYPE_BASE + key, title, status, detail, instance: res.req.originalUrl, ...extra }));
}

// ---------- XML representation (C3) ----------
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const SINGULAR = { steps: 'step', data: 'task' };
function toXml(name, v) {
  if (Array.isArray(v)) return `<${name}>${v.map((x) => toXml(SINGULAR[name] || 'item', x)).join('')}</${name}>`;
  if (v && typeof v === 'object') return `<${name}>${Object.entries(v).map(([k, x]) => toXml(k, x)).join('')}</${name}>`;
  return `<${name}>${esc(v)}</${name}>`;
}
const xmlDoc = (root, v) => `<?xml version="1.0" encoding="UTF-8"?>\n${toXml(root, v)}`;

// send a success body in the negotiated format, always with Content-Type + charset (C4)
function represent(req, res, status, root, obj) {
  if (req.rep === 'xml') return res.status(status).set('Content-Type', 'application/xml; charset=utf-8').send(xmlDoc(root, obj));
  return res.status(status).set('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(obj));
}

// simulated agent executor. A broken dependency throws a message we must NEVER show a client (B4).
function runAgents(task) {
  if (task.workspaceId === 'ws-crash') {
    throw new Error('connect ECONNREFUSED 10.0.3.14:5432 - password authentication failed for user "app_user"');
  }
}

function createApp(opts = {}) {
  const RATE_LIMIT = Number(opts.rateLimit ?? process.env.RATE_LIMIT_MAX ?? 100);
  const WINDOW_MS = Number(opts.windowMs ?? 60000);
  const MAINTENANCE = opts.maintenance ?? process.env.MAINTENANCE === '1';

  const T0 = '2026-01-10T09:00:00.000Z';
  const tasks = new Map();
  [
    { id: 1, title: 'Summarise project requirements', workspaceId: 'ws-1', steps: [{ agent: 'Research Agent', attempts: 1 }], status: 'pending' },
    { id: 2, title: 'Generate REST API boilerplate', workspaceId: 'ws-1', steps: [{ agent: 'Code Agent', attempts: 2 }, { agent: 'Test Agent', attempts: 1 }], status: 'running' },
    { id: 3, title: 'Draft deployment notes', workspaceId: 'ws-2', steps: [{ agent: 'Docs Agent', attempts: 1 }], status: 'completed' },
  ].forEach((t) => tasks.set(t.id, { ...t, version: 1, createdAt: T0, updatedAt: T0 }));
  let nextId = 4;
  const idem = new Map();
  const buckets = new Map();

  const app = express();
  app.disable('x-powered-by');
  app.set('etag', false);

  // ---- headers on every response ----
  app.use((req, res, next) => {
    res.set({
      Server: 'multi-agent-tasks/1.0',
      'X-Content-Type-Options': 'nosniff',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Location, ETag, Retry-After, Allow, X-Total-Count, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Idempotent-Replayed',
    });
    next();
  });

  // ---- per-client rate limit; 429 carries Retry-After (A4) ----
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
    if (b.count > RATE_LIMIT) {
      res.set('Retry-After', String(secs));
      return problem(res, 'rate-limited', `This client has used its ${RATE_LIMIT} requests for the current window. Retry after ${secs} seconds.`, { retryAfter: secs });
    }
    next();
  });

  app.use(compression({ threshold: 256 }));

  // ---- OPTIONS: Allow + CORS preflight ----
  app.options(/.*/, (req, res) => {
    const allow = allowFor(req.path);
    if (req.get('Origin') && req.get('Access-Control-Request-Method')) {
      res.set({
        'Access-Control-Allow-Methods': allow || 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Idempotency-Key, If-Match, If-None-Match, X-HTTP-Method-Override, X-Client-Id',
        'Access-Control-Max-Age': '600',
      });
      return res.status(204).end();
    }
    if (!allow) return problem(res, 'route-not-found', `No route matches ${req.path}.`);
    res.set('Allow', allow);
    res.status(204).end();
  });

  // ---- X-HTTP-Method-Override (fallback only) ----
  app.use((req, res, next) => {
    const o = req.get('X-HTTP-Method-Override');
    if (req.method === 'POST' && o) {
      const m = o.toUpperCase();
      if (!['PUT', 'PATCH', 'DELETE'].includes(m)) return problem(res, 'bad-request', 'X-HTTP-Method-Override must be PUT, PATCH or DELETE.');
      req.method = m;
    }
    next();
  });

  // ---- 503 + Retry-After while in maintenance: only writes are refused (A4) ----
  app.use('/tasks', (req, res, next) => {
    if (MAINTENANCE && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      res.set('Retry-After', '30');
      return problem(res, 'service-unavailable', 'The service is in maintenance mode and temporarily refuses changes. Retry after 30 seconds.', { retryAfter: 30 });
    }
    next();
  });

  // ---- authentication for writes ----
  app.use('/tasks', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const [scheme, token] = (req.get('Authorization') || '').trim().split(/\s+/);
    if (!/^bearer$/i.test(scheme || '') || !token) {
      res.set('WWW-Authenticate', 'Bearer realm="tasks"');
      return problem(res, 'unauthorized', 'Send a non-empty "Authorization: Bearer <token>" header to change data.');
    }
    next();
  });

  // ---- C3: content negotiation. JSON by default, XML if asked, 406 otherwise ----
  app.use('/tasks', (req, res, next) => {
    const best = req.accepts(['application/json', 'application/xml']);
    if (!best) {
      return problem(res, 'not-acceptable', 'This API can produce application/json and application/xml only.', { available: ['application/json', 'application/xml'] });
    }
    req.rep = best === 'application/xml' ? 'xml' : 'json';
    res.vary('Accept');
    next();
  });

  app.use(express.json({ limit: '100kb' }));

  // ---- helpers ----
  function readBody(req, res) {
    const ct = req.is('application/json');
    if (ct === null) { problem(res, 'bad-request', 'A JSON request body is required.'); return null; }
    if (ct === false) { problem(res, 'unsupported-media-type', 'Send the body as Content-Type: application/json.'); return null; }
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) { problem(res, 'bad-request', 'The body must be a JSON object.'); return null; }
    return req.body;
  }

  // C1/C2: describe the body and COLLECT ALL errors, not just the first.
  //   title: non-empty string | workspaceId: non-empty string (our "address")
  //   steps: non-empty array; each step { agent: known agent, attempts: integer >= 1 } (our "qty")
  function check(b, partial = false) {
    const errors = [];
    let emptySteps = false;
    const add = (field, message) => errors.push({ field, message });
    const has = (k) => !partial || k in b;
    if (has('title') && (typeof b.title !== 'string' || !b.title.trim())) add('title', 'is required and must be a non-empty string');
    if (has('workspaceId') && (typeof b.workspaceId !== 'string' || !b.workspaceId.trim())) add('workspaceId', 'is required and must be a non-empty string');
    if (has('steps')) {
      if (!Array.isArray(b.steps)) add('steps', 'is required and must be an array of { agent, attempts }');
      else if (b.steps.length === 0) { emptySteps = true; add('steps', 'must contain at least one step'); }
      else {
        b.steps.forEach((s, i) => {
          if (!s || typeof s !== 'object') return add(`steps[${i}]`, 'must be an object { agent, attempts }');
          if (typeof s.agent !== 'string' || !s.agent.trim()) add(`steps[${i}].agent`, 'is required');
          else if (!Object.hasOwn(AGENTS, s.agent)) add(`steps[${i}].agent`, `unknown agent "${s.agent}"`);
          if (!Number.isInteger(s.attempts) || s.attempts < 1) add(`steps[${i}].attempts`, 'must be an integer >= 1');
        });
      }
    }
    return { errors, emptySteps };
  }

  // validate -> 422 (one response, all errors). Returns true if the body was refused.
  function refuseInvalid(res, { errors, emptySteps }) {
    if (!errors.length) return false;
    if (emptySteps) problem(res, 'empty-steps', 'A task needs at least one step.', { errors });
    else problem(res, 'validation-error', `${errors.length} field${errors.length > 1 ? 's' : ''} failed validation.`, { errors });
    return true;
  }

  // domain rule after validation: an offline agent cannot be assigned
  function refuseOffline(res, steps) {
    const off = steps.find((s) => AGENTS[s.agent] === false);
    if (!off) return false;
    problem(res, 'agent-unavailable', `Agent "${off.agent}" is offline and cannot be assigned work right now.`, { agent: off.agent });
    return true;
  }

  function find(req, res) {
    const t = /^\d+$/.test(req.params.id) ? tasks.get(Number(req.params.id)) : undefined;
    if (!t) { problem(res, 'task-not-found', `No task with id "${req.params.id}" exists.`); return null; }
    return t;
  }
  const touch = (t) => { t.version += 1; t.updatedAt = new Date().toISOString(); };

  // ---- GET /tasks ----
  app.get('/tasks', (req, res) => {
    const q = req.query;
    const status = q.status === undefined ? undefined : String(q.status);
    const sort = String(q.sort ?? 'id');
    const order = String(q.order ?? 'asc');
    const page = parseInt(q.page ?? '1', 10);
    const limit = parseInt(q.limit ?? '10', 10);
    const errors = [];
    if (status && !STATUSES.includes(status)) errors.push({ field: 'status', message: `must be one of ${STATUSES.join(', ')}` });
    if (!['id', 'title', 'createdAt'].includes(sort)) errors.push({ field: 'sort', message: 'must be id, title or createdAt' });
    if (!['asc', 'desc'].includes(order)) errors.push({ field: 'order', message: 'must be asc or desc' });
    if (!(page >= 1)) errors.push({ field: 'page', message: 'must be an integer >= 1' });
    if (!(limit >= 1 && limit <= 100)) errors.push({ field: 'limit', message: 'must be an integer between 1 and 100' });
    if (errors.length) return problem(res, 'invalid-query', `${errors.length} query parameter(s) are invalid.`, { errors });

    let list = [...tasks.values()];
    if (status) list = list.filter((t) => t.status === status);
    if (q.agent) list = list.filter((t) => t.steps.some((s) => s.agent === String(q.agent)));
    if (q.workspaceId) list = list.filter((t) => t.workspaceId === String(q.workspaceId));
    list.sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0) * (order === 'desc' ? -1 : 1));
    const total = list.length;
    res.set({ 'Cache-Control': 'no-cache', 'X-Total-Count': String(total) });
    represent(req, res, 200, 'tasks', { data: list.slice((page - 1) * limit, page * limit), page, limit, total });
  });

  // ---- GET /tasks/:id ----
  app.get('/tasks/:id', (req, res) => {
    const t = find(req, res); if (!t) return;
    const etag = etagOf(t, req.rep);
    res.set({ ETag: etag, 'Cache-Control': 'private, max-age=30, must-revalidate' });
    if (noneMatch(req.get('If-None-Match'), t, req.rep)) return res.status(304).end();
    represent(req, res, 200, 'task', t);
  });

  // ---- POST /tasks : validate, THEN act (C2). 201 + Location (A3) ----
  app.post('/tasks', (req, res) => {
    const body = readBody(req, res); if (!body) return;
    const key = req.get('Idempotency-Key');
    const scope = `${req.get('Authorization')}|${key}`;
    const fp = sha1(JSON.stringify(body));
    if (key) {
      const prev = idem.get(scope);
      if (prev) {
        if (prev.fp !== fp) return problem(res, 'idempotency-key-reuse', 'This Idempotency-Key was already used with a different request body. Use a new key for a new request.');
        res.set({ Location: prev.location, ETag: etagOf(prev.body, req.rep), 'Idempotent-Replayed': 'true' });
        return represent(req, res, 201, 'task', prev.body);
      }
    }
    const result = check(body);
    if (refuseInvalid(res, result)) return;
    if (refuseOffline(res, body.steps)) return;

    const now = new Date().toISOString();
    const t = {
      id: nextId++, title: body.title.trim(), workspaceId: body.workspaceId.trim(),
      steps: body.steps.map((s) => ({ agent: s.agent, attempts: s.attempts })),
      status: 'pending', version: 1, createdAt: now, updatedAt: now,
    };
    tasks.set(t.id, t);
    const location = `/tasks/${t.id}`;
    if (key) idem.set(scope, { fp, location, body: JSON.parse(JSON.stringify(t)) });
    res.set({ Location: location, ETag: etagOf(t, req.rep) });
    represent(req, res, 201, 'task', t);
  });

  // ---- PUT / PATCH ----
  function update(partial) {
    return (req, res) => {
      const t = find(req, res); if (!t) return;
      if (!ifMatchOk(req.get('If-Match'), t)) return problem(res, 'precondition-failed', 'The task changed since you read it (If-Match does not match the current ETag). Nothing was overwritten; re-read the task and retry.');
      const body = readBody(req, res); if (!body) return;
      const result = check(body, partial);
      if ('status' in body) result.errors.push({ field: 'status', message: 'cannot be set directly; use POST /tasks/{id}/start, /complete or /cancel' });
      if (partial && !['title', 'workspaceId', 'steps'].some((k) => k in body) && !('status' in body)) {
        return problem(res, 'bad-request', 'Send at least one of title, workspaceId, steps.');
      }
      if (refuseInvalid(res, result)) return;
      if ('steps' in body && refuseOffline(res, body.steps)) return;
      if ('title' in body) t.title = body.title.trim();
      if ('workspaceId' in body) t.workspaceId = body.workspaceId.trim();
      if ('steps' in body) t.steps = body.steps.map((s) => ({ agent: s.agent, attempts: s.attempts }));
      touch(t);
      res.set('ETag', etagOf(t, req.rep));
      represent(req, res, 200, 'task', t);
    };
  }
  app.put('/tasks/:id', update(false));
  app.patch('/tasks/:id', update(true));

  // ---- DELETE ----
  app.delete('/tasks/:id', (req, res) => {
    const t = find(req, res); if (!t) return;
    if (t.status === 'running') return problem(res, 'illegal-transition', 'A running task cannot be deleted. Cancel it first with POST /tasks/{id}/cancel.', { currentStatus: t.status });
    tasks.delete(t.id);
    res.status(204).end();
  });

  // ---- actions ----
  function action(name, from, to) {
    app.post(`/tasks/:id/${name}`, (req, res) => {
      const t = find(req, res); if (!t) return;
      if (name === 'cancel' && t.status === 'cancelled') { res.set('ETag', etagOf(t, req.rep)); return represent(req, res, 200, 'task', t); }
      if (!from.includes(t.status)) {
        return problem(res, 'illegal-transition', `A task that is "${t.status}" cannot be ${name === 'start' ? 'started' : name === 'complete' ? 'completed' : 'cancelled'}. Allowed from: ${from.join(', ')}.`, { currentStatus: t.status, allowedFrom: from });
      }
      if (name === 'start') {
        if (t.workspaceId === 'ws-exhausted') return problem(res, 'execution-declined', 'The workspace has no execution quota left, so the agents were not started.', { workspaceId: t.workspaceId });
        // B4: risky work in try/catch. Log the detail server-side, return a clean mapped error.
        try {
          runAgents(t);
        } catch (e) {
          const reference = crypto.randomUUID();
          console.error(`[${reference}] failed to start task ${t.id}:`, e);          // full detail stays in OUR log
          return problem(res, 'internal-error', 'The task could not be started because of an internal error. Nothing was changed. Quote the reference if you contact support.', { reference });
        }
      }
      t.status = to; touch(t);
      res.set('ETag', etagOf(t, req.rep));
      represent(req, res, 200, 'task', t);
    });
  }
  action('start', ['pending'], 'running');
  action('complete', ['running'], 'completed');
  action('cancel', ['pending', 'running'], 'cancelled');

  // ---- fall-through ----
  app.use((req, res) => {
    const allow = allowFor(req.path);
    if (allow) { res.set('Allow', allow); return problem(res, 'method-not-allowed', `${req.method} is not allowed on ${req.path}. Allowed: ${allow}.`); }
    problem(res, 'route-not-found', `No route matches ${req.path}.`);
  });

  // ---- last-resort error handler: map, never leak ----
  // eslint-disable-next-line no-unused-vars
  app.use((e, req, res, next) => {
    if (e.type === 'entity.parse.failed') return problem(res, 'malformed-json', 'The request body is not valid JSON.');
    if (e.type === 'entity.too.large') return problem(res, 'payload-too-large', 'The request body is larger than 100 kB.');
    const reference = crypto.randomUUID();
    console.error(`[${reference}] unhandled error on ${req.method} ${req.originalUrl}:`, e);
    problem(res, 'internal-error', 'An internal error occurred. Quote the reference if you contact support.', { reference });
  });

  return app;
}

module.exports = { createApp };
