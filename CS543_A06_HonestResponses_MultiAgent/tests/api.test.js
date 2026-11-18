// Run with: npm test   (Node's built-in test runner)
// Part 1 checks the new A06 behaviour. Part 2 re-runs the A05 checks (D4: no regressions).
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const AUTH = { Authorization: 'Bearer test-token' };
const J = { 'Content-Type': 'application/json' };
const GOOD = { title: 'Write release notes', workspaceId: 'ws-1', steps: [{ agent: 'Docs Agent', attempts: 1 }] };
const W = { ...J, ...AUTH };
const TYPE = 'https://api.multiagent.example/problems/';

let server, base;
test.before(async () => {
  server = createApp({ rateLimit: 1000 }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}`;
});
test.after(() => server.close());

const call = (method, path, { headers = {}, body } = {}) =>
  fetch(base + path, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });

async function expectProblem(r, status, key) {
  assert.equal(r.status, status);
  assert.equal(r.headers.get('content-type'), 'application/problem+json; charset=utf-8');
  const p = await r.json();
  assert.equal(p.type, TYPE + key);
  assert.equal(p.status, status);
  assert.equal(typeof p.title, 'string');
  assert.equal(typeof p.detail, 'string');
  return p;
}

// ---------------- Part 1: A06 ----------------
test('A1/A2/A3 success statuses: 201 + Location, 200, 204', async () => {
  const r = await call('POST', '/tasks', { headers: W, body: GOOD });
  assert.equal(r.status, 201);
  const t = await r.json();
  assert.equal(r.headers.get('location'), `/tasks/${t.id}`);
  assert.equal((await call('GET', `/tasks/${t.id}`)).status, 200);
  assert.equal((await call('DELETE', `/tasks/${t.id}`, { headers: AUTH })).status, 204);
});

test('B1/B2 every failure is Problem Details with a stable type', async () => {
  await expectProblem(await call('GET', '/tasks/999'), 404, 'task-not-found');
  await expectProblem(await call('POST', '/tasks', { headers: J, body: GOOD }), 401, 'unauthorized');
  await expectProblem(await call('POST', '/tasks', { headers: W, body: '{"title": ' }), 400, 'malformed-json');
  await expectProblem(await call('GET', '/nope'), 404, 'route-not-found');
  await expectProblem(await call('DELETE', '/tasks', { headers: AUTH }), 405, 'method-not-allowed');
  await expectProblem(await call('POST', '/tasks', { headers: { ...AUTH, 'Content-Type': 'text/plain' }, body: 'hi' }), 415, 'unsupported-media-type');
  await expectProblem(await call('GET', '/tasks?status=bogus&limit=0'), 400, 'invalid-query');
});

test('B2 empty-steps (our empty-cart)', async () => {
  const p = await expectProblem(await call('POST', '/tasks', { headers: W, body: { ...GOOD, steps: [] } }), 422, 'empty-steps');
  assert.equal(p.errors[0].field, 'steps');
});

test('B3/C2 field-level 422 reports ALL bad fields at once', async () => {
  const p = await expectProblem(await call('POST', '/tasks', {
    headers: W,
    body: { title: '   ', steps: [{ agent: 'Code Agent', attempts: 0 }, { agent: 'Ghost Agent', attempts: 1.5 }] },
  }), 422, 'validation-error');
  const fields = p.errors.map((e) => e.field);
  assert.deepEqual(fields, ['title', 'workspaceId', 'steps[0].attempts', 'steps[1].agent', 'steps[1].attempts']);
  assert.ok(p.errors.every((e) => e.message));
});

test('B2 validate before acting: an invalid POST creates nothing', async () => {
  const before = (await (await call('GET', '/tasks?limit=100')).json()).total;
  await call('POST', '/tasks', { headers: W, body: { ...GOOD, steps: [{ agent: 'Code Agent', attempts: -1 }] } });
  const after = (await (await call('GET', '/tasks?limit=100')).json()).total;
  assert.equal(before, after);
});

test('B2 agent-unavailable (our item-unavailable) for an offline agent', async () => {
  const p = await expectProblem(await call('POST', '/tasks', { headers: W, body: { ...GOOD, steps: [{ agent: 'Deploy Agent', attempts: 1 }] } }), 422, 'agent-unavailable');
  assert.equal(p.agent, 'Deploy Agent');
});

test('B2 execution-declined (our payment-declined) when the workspace quota is exhausted', async () => {
  const t = await (await call('POST', '/tasks', { headers: W, body: { ...GOOD, workspaceId: 'ws-exhausted' } })).json();
  await expectProblem(await call('POST', `/tasks/${t.id}/start`, { headers: AUTH }), 422, 'execution-declined');
  assert.equal((await (await call('GET', `/tasks/${t.id}`)).json()).status, 'pending');   // nothing changed
});

test('B2 illegal-transition: complete a pending task, delete a running task', async () => {
  const t = await (await call('POST', '/tasks', { headers: W, body: GOOD })).json();
  const p = await expectProblem(await call('POST', `/tasks/${t.id}/complete`, { headers: AUTH }), 409, 'illegal-transition');
  assert.equal(p.currentStatus, 'pending');
  await call('POST', `/tasks/${t.id}/start`, { headers: AUTH });
  await expectProblem(await call('DELETE', `/tasks/${t.id}`, { headers: AUTH }), 409, 'illegal-transition');
});

test('B4 internal failures are mapped to a clean 500 and nothing leaks', async () => {
  const t = await (await call('POST', '/tasks', { headers: W, body: { ...GOOD, workspaceId: 'ws-crash' } })).json();
  const r = await call('POST', `/tasks/${t.id}/start`, { headers: AUTH });
  const text = await r.text();
  assert.equal(r.status, 500);
  const p = JSON.parse(text);
  assert.equal(p.type, TYPE + 'internal-error');
  assert.ok(p.reference);
  for (const secret of ['ECONNREFUSED', '10.0.3.14', 'app_user', 'password', 'at ', '.js:']) assert.ok(!text.includes(secret), `leaked: ${secret}`);
});

test('C3 content negotiation: JSON default, XML when asked, 406 otherwise', async () => {
  let r = await call('GET', '/tasks/1');
  assert.match(r.headers.get('content-type'), /^application\/json; charset=utf-8$/);
  r = await call('GET', '/tasks/1', { headers: { Accept: 'application/xml' } });
  assert.equal(r.headers.get('content-type'), 'application/xml; charset=utf-8');
  const xml = await r.text();
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<task><id>1<\/id>/);
  assert.match(xml, /<steps><step><agent>Research Agent<\/agent>/);
  assert.match(r.headers.get('vary'), /Accept/);
  await expectProblem(await call('GET', '/tasks/1', { headers: { Accept: 'text/html' } }), 406, 'not-acceptable');
  r = await call('GET', '/tasks', { headers: { Accept: 'application/xml' } });
  assert.match(await r.text(), /<tasks>.*<data><task>/s);
});

test('C4 Content-Type + charset on every response, errors included', async () => {
  const rs = [
    await call('GET', '/tasks'), await call('GET', '/tasks/1'), await call('GET', '/tasks/999'),
    await call('POST', '/tasks', { headers: J, body: GOOD }), await call('GET', '/nope'),
  ];
  for (const r of rs) assert.match(r.headers.get('content-type'), /charset=utf-8/i);
});

test('A4 429 carries Retry-After and the Problem Details body', async () => {
  const s = createApp({ rateLimit: 1 }).listen(0);
  await new Promise((r) => s.once('listening', r));
  const url = `http://localhost:${s.address().port}/tasks/1`;
  await fetch(url);
  const r = await fetch(url);
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers.get('retry-after')) > 0);
  assert.equal((await r.json()).type, TYPE + 'rate-limited');
  s.close();
});

test('A4 503 carries Retry-After; reads still work during maintenance', async () => {
  const s = createApp({ maintenance: true }).listen(0);
  await new Promise((r) => s.once('listening', r));
  const b = `http://localhost:${s.address().port}`;
  const r = await fetch(b + '/tasks', { method: 'POST', headers: W, body: JSON.stringify(GOOD) });
  assert.equal(r.status, 503);
  assert.equal(r.headers.get('retry-after'), '30');
  assert.equal((await r.json()).type, TYPE + 'service-unavailable');
  assert.equal((await fetch(b + '/tasks/1')).status, 200);
  s.close();
});

// ---------------- Part 2: A05 checks still hold (D4) ----------------
test('D4 idempotency: same key + same body -> original; different body -> 422', async () => {
  const h = { ...W, 'Idempotency-Key': 'k-1' };
  const a = await call('POST', '/tasks', { headers: h, body: GOOD });
  const b = await call('POST', '/tasks', { headers: h, body: GOOD });
  assert.equal(b.headers.get('idempotent-replayed'), 'true');
  assert.equal((await a.json()).id, (await b.json()).id);
  await expectProblem(await call('POST', '/tasks', { headers: h, body: { ...GOOD, title: 'other' } }), 422, 'idempotency-key-reuse');
});

test('D4 ETag/304 and If-Match/412', async () => {
  const etag = (await call('GET', '/tasks/1')).headers.get('etag');
  const r304 = await call('GET', '/tasks/1', { headers: { 'If-None-Match': etag } });
  assert.equal(r304.status, 304);
  assert.equal(await r304.text(), '');
  const t = await (await call('POST', '/tasks', { headers: W, body: GOOD })).json();
  const tag1 = (await call('GET', `/tasks/${t.id}`)).headers.get('etag');
  assert.equal((await call('PATCH', `/tasks/${t.id}`, { headers: { ...W, 'If-Match': tag1 }, body: { title: 'New' } })).status, 200);
  await expectProblem(await call('PUT', `/tasks/${t.id}`, { headers: { ...W, 'If-Match': tag1 }, body: GOOD }), 412, 'precondition-failed');
});

test('D4 OPTIONS Allow, CORS preflight, method override, security headers, rate-limit headers', async () => {
  let r = await call('OPTIONS', '/tasks/1');
  assert.equal(r.headers.get('allow'), 'GET, HEAD, PUT, PATCH, DELETE, OPTIONS');
  r = await call('OPTIONS', '/tasks', { headers: { Origin: 'http://x.test', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  const t = await (await call('POST', '/tasks', { headers: W, body: GOOD })).json();
  assert.equal((await call('POST', `/tasks/${t.id}`, { headers: { ...AUTH, 'X-HTTP-Method-Override': 'DELETE' } })).status, 204);
  r = await call('GET', '/tasks/1');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(r.headers.get('strict-transport-security'));
  assert.ok(r.headers.get('x-ratelimit-remaining'));
});

test('D4 timeouts: the server sets request and header timeouts', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(src, /requestTimeout/);
  assert.match(src, /headersTimeout/);
});
