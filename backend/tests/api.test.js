// Automated API tests. Needs a running PostgreSQL with the schema applied and these env vars
// (normally from .env): DATABASE_URL, JWT_SECRET, SERVICE_API_KEY.   Run:  npm test
const test = require('node:test');
const assert = require('node:assert');

process.env.SERVICE_API_KEY = process.env.SERVICE_API_KEY || 'test-service-key';
delete process.env.AGENT_SERVICE_URL; // runs must stay 'running' until the callback

const app = require('../server');
const pool = require('../src/config/db');

let server;
let base;
const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const state = {};

async function call(method, path, { token, body, headers } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
  return { status: response.status, body: json };
}

test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('auth: register, duplicate, validation, login, me, logout', async () => {
  const email = `alice_${stamp}@example.com`;
  state.aliceEmail = email;

  let r = await call('POST', '/api/auth/register', { body: { name: 'Alice', email, password: 'Passw0rd!' } });
  assert.strictEqual(r.status, 201);
  assert.ok(r.body.token);
  assert.strictEqual(r.body.user.password_hash, undefined);

  r = await call('POST', '/api/auth/register', { body: { name: 'Alice', email, password: 'Passw0rd!' } });
  assert.strictEqual(r.status, 409);

  r = await call('POST', '/api/auth/register', { body: { name: 'A', email: 'nope', password: 'Passw0rd!' } });
  assert.strictEqual(r.status, 400);

  r = await call('POST', '/api/auth/login', { body: { email, password: 'wrong-password' } });
  assert.strictEqual(r.status, 401);

  r = await call('POST', '/api/auth/login', { body: { email, password: 'Passw0rd!' } });
  assert.strictEqual(r.status, 200);
  state.alice = r.body.token;

  r = await call('GET', '/api/auth/me', { token: state.alice });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.user.email, email);

  r = await call('GET', '/api/auth/me');
  assert.strictEqual(r.status, 401);

  // two logins in the same second must be independent sessions
  const second = await call('POST', '/api/auth/login', { body: { email, password: 'Passw0rd!' } });
  r = await call('POST', '/api/auth/logout', { token: second.body.token });
  assert.strictEqual(r.status, 204);
  r = await call('GET', '/api/auth/me', { token: second.body.token });
  assert.strictEqual(r.status, 401);
  r = await call('GET', '/api/auth/me', { token: state.alice });
  assert.strictEqual(r.status, 200);
});

test('workspaces and members', async () => {
  state.bobEmail = `bob_${stamp}@example.com`;
  let r = await call('POST', '/api/auth/register', { body: { name: 'Bob', email: state.bobEmail, password: 'Passw0rd!' } });
  state.bob = r.body.token;

  r = await call('POST', '/api/workspaces', { token: state.alice, body: { name: 'Test WS' } });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.body.role, 'Owner');
  state.ws = r.body.id;

  r = await call('POST', '/api/workspaces', { token: state.alice, body: {} });
  assert.strictEqual(r.status, 400);

  r = await call('GET', `/api/workspaces/${state.ws}`, { token: state.bob });
  assert.strictEqual(r.status, 404, 'non-members must not learn the workspace exists');

  r = await call('PATCH', `/api/workspaces/${state.ws}`, { token: state.alice, body: { name: 'Renamed' } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.name, 'Renamed');

  r = await call('POST', `/api/workspaces/${state.ws}/invite`, { token: state.alice, body: { email: state.bobEmail } });
  assert.strictEqual(r.status, 201);
  state.invite = r.body.id;

  r = await call('POST', `/api/workspaces/${state.ws}/invite`, { token: state.alice, body: { email: state.bobEmail } });
  assert.strictEqual(r.status, 409);

  r = await call('POST', `/api/invites/${state.invite}/accept`, { token: state.alice });
  assert.strictEqual(r.status, 404, 'only the invited user can accept');

  r = await call('POST', `/api/invites/${state.invite}/accept`, { token: state.bob });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.role, 'Member');

  r = await call('PATCH', `/api/workspaces/${state.ws}/members/${state.invite}`, { token: state.bob, body: { role: 'Admin' } });
  assert.strictEqual(r.status, 403);
  r = await call('PATCH', `/api/workspaces/${state.ws}/members/${state.invite}`, { token: state.alice, body: { role: 'Admin' } });
  assert.strictEqual(r.status, 200);
  r = await call('PATCH', `/api/workspaces/${state.ws}/members/${state.invite}`, { token: state.alice, body: { role: 'Member' } });
  assert.strictEqual(r.status, 200);

  r = await call('GET', `/api/workspaces/${state.ws}/members`, { token: state.alice });
  const owner = r.body.find((m) => m.role === 'Owner');
  r = await call('DELETE', `/api/workspaces/${state.ws}/members/${owner.id}`, { token: state.alice });
  assert.strictEqual(r.status, 403, 'owner cannot be removed');
});

test('tasks: create, list, filter, update, status rules', async () => {
  let r = await call('POST', `/api/workspaces/${state.ws}/tasks`, { token: state.alice, body: { title: 'Task A', description: 'first' } });
  assert.strictEqual(r.status, 201);
  assert.strictEqual(r.body.status, 'pending');
  state.a = r.body.id;

  r = await call('POST', '/api/tasks', { token: state.bob, body: { workspaceId: state.ws, title: 'Task B' } });
  assert.strictEqual(r.status, 201, 'flat POST /api/tasks works for members');
  state.b = r.body.id;

  r = await call('POST', `/api/workspaces/${state.ws}/tasks`, { token: state.alice, body: { title: 'Task C' } });
  state.c = r.body.id;

  r = await call('POST', `/api/workspaces/${state.ws}/tasks`, { token: state.alice, body: {} });
  assert.strictEqual(r.status, 400);

  r = await call('GET', `/api/tasks?workspaceId=${state.ws}&status=pending`, { token: state.alice });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.length, 3);

  r = await call('GET', `/api/tasks?status=pending`, { token: state.alice });
  assert.strictEqual(r.status, 400, 'workspaceId required on the flat route');

  r = await call('GET', `/api/workspaces/${state.ws}/tasks?status=bogus`, { token: state.alice });
  assert.strictEqual(r.status, 400);

  r = await call('PATCH', `/api/tasks/${state.a}`, { token: state.alice, body: { title: 'Task A v2' } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.title, 'Task A v2');

  r = await call('PATCH', `/api/tasks/${state.a}`, { token: state.alice, body: { status: 'running' } });
  assert.strictEqual(r.status, 409, 'running can only be reached through /run');

  r = await call('GET', `/api/tasks/${state.a}`, { token: 'garbage' });
  assert.strictEqual(r.status, 401);
});

test('dependencies: duplicate, self, cycles', async () => {
  const dep = (task, on, token = state.alice) => call('POST', `/api/tasks/${task}/dependencies`, { token, body: { dependsOnTaskId: on } });

  assert.strictEqual((await dep(state.b, state.a)).status, 201);
  assert.strictEqual((await dep(state.b, state.a)).status, 409);
  assert.strictEqual((await dep(state.a, state.a)).status, 400);
  assert.strictEqual((await dep(state.a, state.b)).status, 409, 'direct cycle');
  assert.strictEqual((await dep(state.c, state.b)).status, 201);
  assert.strictEqual((await dep(state.a, state.c)).status, 409, 'indirect cycle');

  const r = await call('GET', `/api/tasks/${state.b}/dependencies`, { token: state.alice });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.length, 1);
});

test('runs: blocked by dependency, single active run, service callback', async () => {
  let r = await call('POST', `/api/tasks/${state.b}/run`, { token: state.alice });
  assert.strictEqual(r.status, 409);
  assert.ok(Array.isArray(r.body.blockedBy));

  r = await call('POST', `/api/tasks/${state.a}/run`, { token: state.alice });
  assert.strictEqual(r.status, 202);
  state.run = r.body.run.id;

  // two simultaneous run requests on a fresh task: exactly one may win
  const [x, y] = await Promise.all([
    call('POST', `/api/tasks/${state.c}/run`, { token: state.alice }),
    call('POST', `/api/tasks/${state.c}/run`, { token: state.alice }),
  ]);
  // c depends on b (not completed) so both are blocked: create a separate free task for the race
  assert.deepStrictEqual([x.status, y.status], [409, 409]);
  r = await call('POST', `/api/workspaces/${state.ws}/tasks`, { token: state.alice, body: { title: 'Race task' } });
  const race = r.body.id;
  const results = await Promise.all([
    call('POST', `/api/tasks/${race}/run`, { token: state.alice }),
    call('POST', `/api/tasks/${race}/run`, { token: state.alice }),
  ]);
  assert.deepStrictEqual(results.map((o) => o.status).sort(), [202, 409]);

  r = await call('DELETE', `/api/tasks/${state.a}`, { token: state.alice });
  assert.strictEqual(r.status, 409, 'running task cannot be deleted');

  r = await call('GET', `/api/runs/${state.run}`, { token: state.alice });
  assert.strictEqual(r.status, 200);

  r = await call('PATCH', `/api/runs/${state.run}`, { body: { status: 'completed' } });
  assert.strictEqual(r.status, 401, 'callback needs the service key');

  const key = { 'X-Service-Key': process.env.SERVICE_API_KEY };
  r = await call('PATCH', `/api/runs/${state.run}`, { headers: key, body: { status: 'bogus' } });
  assert.strictEqual(r.status, 400);
  r = await call('PATCH', `/api/runs/${state.run}`, { headers: key, body: { status: 'completed', result: { output: 'ok' } } });
  assert.strictEqual(r.status, 200);
  r = await call('PATCH', `/api/runs/${state.run}`, { headers: key, body: { status: 'failed' } });
  assert.strictEqual(r.status, 409, 'a finished run cannot be changed again');

  r = await call('GET', `/api/tasks/${state.a}`, { token: state.alice });
  assert.strictEqual(r.body.status, 'completed');

  r = await call('POST', `/api/tasks/${state.b}/run`, { token: state.alice });
  assert.strictEqual(r.status, 202, 'dependency finished, B can run now');
});

test('cleanup: delete task, leave, delete workspace, global errors', async () => {
  let r = await call('DELETE', `/api/tasks/${state.c}`, { token: state.bob });
  assert.strictEqual(r.status, 403, 'a member cannot delete a task they did not create');
  r = await call('DELETE', `/api/tasks/${state.c}`, { token: state.alice });
  assert.strictEqual(r.status, 204);

  r = await call('POST', `/api/workspaces/${state.ws}/leave`, { token: state.alice });
  assert.strictEqual(r.status, 403);
  r = await call('POST', `/api/workspaces/${state.ws}/leave`, { token: state.bob });
  assert.strictEqual(r.status, 204);
  r = await call('DELETE', `/api/workspaces/${state.ws}`, { token: state.alice });
  assert.strictEqual(r.status, 204);

  r = await call('GET', '/api/does-not-exist', { token: state.alice });
  assert.strictEqual(r.status, 404);

  const raw = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json' });
  assert.strictEqual(raw.status, 400);

  r = await call('POST', '/api/auth/logout-all', { token: state.alice });
  assert.strictEqual(r.status, 204);
  r = await call('GET', '/api/auth/me', { token: state.alice });
  assert.strictEqual(r.status, 401);
});
