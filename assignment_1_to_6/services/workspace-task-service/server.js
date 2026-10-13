const http = require("http");
const tasks = new Map();
let n = 1;
const idem = new Map();
function send(res, s, b, h = {}) {
  res.statusCode = s;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  Object.entries(h).forEach(([k, v]) => res.setHeader(k, v));
  if (b === undefined) return res.end();
  res.end(JSON.stringify(b));
}
function problem(res, status, type, title, detail, errors) {
  const b = { type, title, status, detail };
  if (errors) b.errors = errors;
  send(res, status, b);
}
function body(req) {
  return new Promise((ok, no) => {
    let x = "";
    req.on("data", (c) => (x += c));
    req.on("end", () => {
      try {
        ok(x ? JSON.parse(x) : {});
      } catch (e) {
        no(e);
      }
    });
  });
}
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET, POST, PATCH, DELETE, OPTIONS");
    return send(res, 204);
  }
  try {
    const u = new URL(req.url, "http://localhost"),
      p = u.pathname.split("/").filter(Boolean);
    if (p[0] !== "tasks")
      return problem(
        res,
        404,
        "resource-not-found",
        "Not Found",
        "The requested resource does not exist.",
      );
    if (!req.headers.authorization)
      return problem(
        res,
        401,
        "unauthenticated",
        "Authentication Required",
        "A valid bearer token is required.",
      );
    if (req.method === "GET" && p.length === 1)
      return send(res, 200, [...tasks.values()]);
    if (req.method === "POST" && p.length === 1) {
      let b;
      try {
        b = await body(req);
      } catch (e) {
        return problem(
          res,
          400,
          "malformed-request",
          "Malformed Request",
          "Request body is not valid JSON.",
        );
      }
      let es = [];
      if (!b.title?.trim())
        es.push({ field: "title", message: "Title is required." });
      if (!b.description || b.description.trim().length < 10)
        es.push({
          field: "description",
          message: "Description must contain at least 10 characters.",
        });
      if (es.length)
        return problem(
          res,
          422,
          "validation-error",
          "Validation Failed",
          "The request contains invalid fields.",
          es,
        );
      const k = req.headers["idempotency-key"];
      if (k && idem.has(k)) return send(res, 200, idem.get(k));
      const t = {
        id: `task-${n++}`,
        title: b.title.trim(),
        description: b.description.trim(),
        status: "pending",
        version: 1,
      };
      tasks.set(t.id, t);
      if (k) idem.set(k, t);
      res.setHeader("Location", `/tasks/${t.id}`);
      return send(res, 201, t);
    }
    if (p[1] && !tasks.has(p[1]))
      return problem(
        res,
        404,
        "task-not-found",
        "Task Not Found",
        "The requested task does not exist.",
      );
    const t = tasks.get(p[1]);
    if (req.method === "GET" && p.length === 2) {
      const et = `"${t.id}-v${t.version}"`;
      res.setHeader("ETag", et);
      res.setHeader("Cache-Control", "private, max-age=30");
      if (req.headers["if-none-match"] === et) {
        res.statusCode = 304;
        return res.end();
      }
      return send(res, 200, t);
    }
    if (req.method === "PATCH" && p.length === 2) {
      if (req.headers["if-match"] !== `"${t.id}-v${t.version}"`)
        return problem(
          res,
          412,
          "precondition-failed",
          "Precondition Failed",
          "If-Match does not match the current version.",
        );
      let b;
      try {
        b = await body(req);
      } catch (e) {
        return problem(
          res,
          400,
          "malformed-request",
          "Malformed Request",
          "Request body is not valid JSON.",
        );
      }
      const es = [];
      if ("title" in b && !b.title?.trim())
        es.push({ field: "title", message: "Title cannot be empty." });
      if (
        "description" in b &&
        (!b.description || b.description.trim().length < 10)
      )
        es.push({
          field: "description",
          message: "Description must contain at least 10 characters.",
        });
      if (es.length)
        return problem(
          res,
          422,
          "validation-error",
          "Validation Failed",
          "The request contains invalid fields.",
          es,
        );
      Object.assign(t, b);
      t.version++;
      return send(res, 200, t);
    }
    if (req.method === "DELETE" && p.length === 2) {
      if (t.status === "completed")
        return problem(
          res,
          409,
          "illegal-transition",
          "Illegal Transition",
          "A completed task cannot be deleted.",
        );
      tasks.delete(t.id);
      return send(res, 204);
    }
    if (req.method === "POST" && p.length === 3 && p[2] === "run") {
      if (t.status !== "pending")
        return problem(
          res,
          409,
          "illegal-transition",
          "Illegal Transition",
          "The task cannot be started from its current state.",
        );
      t.status = "running";
      t.version++;
      res.setHeader("Location", `/tasks/${t.id}/status`);
      return send(res, 202, { id: t.id, status: t.status });
    }
    if (req.method === "GET" && p.length === 3 && p[2] === "status")
      return send(res, 200, { id: t.id, status: t.status });
    return problem(
      res,
      405,
      "method-not-allowed",
      "Method Not Allowed",
      "The method is not supported for this resource.",
    );
  } catch (e) {
    console.error(e);
    res.setHeader("Retry-After", "3");
    return problem(
      res,
      503,
      "service-unavailable",
      "Service Unavailable",
      "The service is temporarily unavailable.",
    );
  }
});
server.listen(process.env.PORT || 3000, () =>
  console.log("Multi-Agent Workspace Task Service listening on 3000"),
);
module.exports = server;
