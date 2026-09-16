const assert = require("node:assert/strict"),
  S = require("../src/services/storage.js");
const errors = [],
  raw = new Map([["broken", "{bad"]]);
const backend = {
  getItem: (k) => raw.get(k) ?? null,
  setItem() {
    throw new Error("QuotaExceededError");
  },
  removeItem: (k) => raw.delete(k),
};
const storage = S.create(backend, (...e) => errors.push(e));
assert.equal(storage.read("broken", null), null);
assert.equal(raw.get("broken"), "{bad");
assert.equal(storage.write("draft", { a: 1 }), false);
assert.equal(errors.length, 2);
assert.match(errors[1][0], /JSON/);
assert.throws(() =>
  S.parseBackup('{"format":"kadat-workspace","version":3,"data":{}}'),
);
assert.throws(() =>
  S.parseBackup(
    '{"format":"kadat-workspace","version":2,"data":{"__proto__":{}}}',
  ),
);
assert.throws(() => S.parseBackup(" ".repeat(5000001)));
console.log(
  "Storage: corruption retained, quota errors reported, unsupported versions and malformed backup rejected.",
);
