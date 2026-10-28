const test = require("node:test");
const assert = require("node:assert");
test("Multi-Agent project docs expose runTask", () => {
  const fs = require("fs");
  const s = fs.readFileSync("docs/assignment-2/design.md", "utf8");
  assert.ok(s.includes("runTask"));
});
