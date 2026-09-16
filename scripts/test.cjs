const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
for (const file of [
  "scripts/check.cjs",
  ...fs
    .readdirSync("tests")
    .filter((f) => /\.test\.cjs$/.test(f))
    .sort()
    .map((f) => "tests/" + f),
]) {
  const r = spawnSync(process.execPath, [file], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
}
