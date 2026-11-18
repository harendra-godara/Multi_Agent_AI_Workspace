// Run with: npm test   (Node's built-in test runner, no extra dependencies)
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const AUTH = { Authorization: 'Bearer test-token' };
const J = { 'Content-Type': 'application/json' };
const GOOD = { title: 'Write release notes', workspaceId: 'ws-1', steps: [{ agent: 'Docs Agent', attempts: 1 }] };

let server, base;
test.before(async () => {
  server = createApp({ rateLimit: 1000 }).listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}`;
});
test.after(() => server.close());

const call = (method, path, { headers = {}, body } = {}) =>
  fetch(base + path, { method, headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });

test('A1/A4 GET /tasks lists, filters, sorts, paginates (pure read)', async () => {
  let r = await call('GET', '/tasks');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /application\/json/);
  assert.equal((await r.json()).total, 3);
  r = await call('GET', '/tasks?status=pending');
  assert.deepEqual((await r.json()).data.map((t) => t.id), [1]);
  r = await call('GET', '/tasks?sort=id&order=desc&limit=2&page=1');
  assert.deepEqual((await r.json()).data.map((t) => t.id), [3, 2]);
  assert.equal((await call('GET', '/tasks?status=bogus')).status, 400);
});

test('B2/B3/C3 POST creates: 401 without token, 201 + Location with token', async () => {
  let r = await call('POST', '/tasks', { headers: J, body: GOOD });
  assert.equal(r.status, 401);
  assert.match(r.headers.get('www-authenticate'), /Bearer/);
  r = await call('POST', '/tasks', { headers: { ...J, Authorization: 'Bearer ' }, body: GOOD });
  assert.equal(r.status, 401);                                   // empty token
  r = await call('POST', '/tasks', { headers: { ...J, ...AUTH }, body: GOOD });
  assert.equal(r.status, 201);
  const t = await r.json();
  assert.equal(r.headers.get('location'), `/tasks/${t.id}`);
});

test('C3 Idempotency-Key: same key + same body returns the original, no duplicate', async () => {
  const h = { ...J, ...AUTH, 'Idempotency-Key': 'k-1' };
  const a = await call('POST', '/tasks', { headers: h, body: GOOD });
  const b = await call('POST', '/tasks', { headers: h, body: GOOD });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.equal(b.headers.get('idempotent-replayed'), 'true');
  const [ta, tb] = [await a.json(), await b.json()];
  assert.equal(ta.id, tb.id);
  const c = await call('POST', '/tasks', { headers: h, body: { ...GOOD, title: 'different' } });
  assert.equal(c.status, 422);                                   // same key, different body
});

test('B2 400 malformed JSON vs 422 domain refusal', async () => {
  let r = await call('POST', '/tasks', { headers: { ...J, ...AUTH }, body: '{"title": ' });
  assert.equal(r.status, 400);
  r = await call('POST', '/tasks', { headers: { ...J, ...AUTH }, body: { ...GOOD, steps: [] } });
  assert.equal(r.status, 422);
  r = await call('POST', '/tasks', { headers: { ...J, ...AUTH }, body: { ...GOOD, steps: [{ agent: 'Deploy Agent', attempts: 1 }] } });
  assert.equal(r.status, 422);                                   // offline agent
  r = await call('POST', '/tasks', { headers: { 'Content-Type': 'text/plain', ...AUTH }, body: 'hello' });
  assert.equal(r.status, 415);
});

test('404 for a missing task', async () => {
  assert.equal((await call('GET', '/tasks/999')).status, 404);
  assert.equal((await call('GET', '/tasks/abc')).status, 404);
});

test('B1 406 when only an unsupported type is accepted; JSON for */*', async () => {
  assert.equal((await call('GET', '/tasks/1', { headers: { Accept: 'application/xml' } })).status, 406);
  assert.equal((await call('GET', '/tasks/1', { headers: { Accept: '*/*' } })).status, 200);
});

test('B4/C1 ETag + Cache-Control, If-None-Match -> 304 with no body', async () => {
  const r = await call('GET', '/tasks/1');
  const etag = r.headers.get('etag');
  assert.ok(etag);
  assert.match(r.headers.get('cache-control'), /max-age=30/);
  const r2 = await call('GET', '/tasks/1', { headers: { 'If-None-Match': etag } });
  assert.equal(r2.status, 304);
  assert.equal(await r2.text(), '');
});

test('C2 If-Match: stale ETag -> 412, fresh ETag -> 200 and the ETag changes', async () => {
  const created = await (await call('POST', '/tasks', { headers: { ...J, ...AUTH }, body: GOOD })).json();
  const url = `/tasks/${created.id}`;
  const etag1 = (await call('GET', url)).headers.get('etag');
  const ok = await call('PATCH', url, { headers: { ...J, ...AUTH, 'If-Match': etag1 }, body: { title: 'Renamed' } });
  assert.equal(ok.status, 200);
  const etag2 = ok.headers.get('etag');
  assert.notEqual(etag1, etag2);
  const stale = await call('PUT', url, { headers: { ...J, ...AUTH, 'If-Match': etag1 }, body: GOOD });
  assert.equal(stale.status, 412);
  const keep = await (await call('GET', url)).json();
  assert.equal(keep.title, 'Renamed');                           // the stale write did not overwrite
});

test('A5 OPTIONS returns Allow; unsupported method -> 405 + Allow', async () => {
  let r = await call('OPTIONS', '/tasks/1');
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('allow'), 'GET, HEAD, PUT, PATCH, DELETE, OPTIONS');
  r = await call('DELETE', '/tasks', { headers: AUTH });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('allow'), 'GET, HEAD, POST, OPTIONS');
});

test('A5 X-HTTP-Method-Override: POST + override DELETE removes the task', async () => {
  const created = await (await call('POST', '/tasks', { headers: { ...J, ...AUTH }, body: GOOD })).json();
  const r = await call('POST', `/tasks/${created.id}`, { headers: { ...AUTH, 'X-HTTP-Method-Override': 'DELETE' } });
  assert.equal(r.status, 204);
  assert.equal((await call('GET', `/tasks/${created.id}`)).status, 404);
});

test('B6 CORS preflight answers 204 with Access-Control-* headers', async () => {
  const r = await call('OPTIONS', '/tasks', { headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'POST' } });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
  assert.match(r.headers.get('access-control-allow-methods'), /POST/);
  assert.match(r.headers.get('access-control-allow-headers'), /Authorization/);
});

test('B7 security headers on every response', async () => {
  const r = await call('GET', '/tasks/1');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.match(r.headers.get('strict-transport-security'), /max-age=/);
  assert.ok(r.headers.get('date'));
  assert.ok(r.headers.get('server'));
});

test('A2/A3 actions: start -> complete, illegal transition -> 409, cancel is idempotent', async () => {
  const t = await (await call('POST', '/tasks', { headers: { ...J, ...AUTH }, body: GOOD })).json();
  const id = t.id;
  assert.equal((await call('POST', `/tasks/${id}/complete`, { headers: AUTH })).status, 409);   // not running yet
  assert.equal((await call('POST', `/tasks/${id}/start`, { headers: AUTH })).status, 200);
  assert.equal((await call('DELETE', `/tasks/${id}`, { headers: AUTH })).status, 409);          // running
  assert.equal((await call('POST', `/tasks/${id}/cancel`, { headers: AUTH })).status, 200);
  assert.equal((await call('POST', `/tasks/${id}/cancel`, { headers: AUTH })).status, 200);     // repeat, same effect
  assert.equal((await call('DELETE', `/tasks/${id}`, { headers: AUTH })).status, 204);
});

test('B5 rate limit headers and 429 + Retry-After (per client)', async () => {
  const s = createApp({ rateLimit: 2 }).listen(0);
  await new Promise((r) => s.once('listening', r));
  const url = `http://localhost:${s.address().port}/tasks/1`;
  const hit = (client) => fetch(url, { headers: { 'X-Client-Id': client } });
  let r = await hit('a');
  assert.equal(r.headers.get('x-ratelimit-limit'), '2');
  assert.equal(r.headers.get('x-ratelimit-remaining'), '1');
  await hit('a');
  r = await hit('a');
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers.get('retry-after')) > 0);
  assert.equal((await hit('b')).status, 200);                    // another client is unaffected
  s.close();
});

test('B1 gzip for large JSON when the client asks for it', async () => {
  const h = { ...J, ...AUTH };
  for (let i = 0; i < 6; i++) await call('POST', '/tasks', { headers: h, body: GOOD });
  const r = await fetch(`${base}/tasks?limit=100`, { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(r.headers.get('content-encoding'), 'gzip');
  assert.ok((await r.json()).total >= 6);
});
