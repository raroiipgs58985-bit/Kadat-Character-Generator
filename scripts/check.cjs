const fs = require("node:fs"),
  path = require("node:path"),
  { spawnSync } = require("node:child_process");
let count = 0;
function check(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (/\.(?:cjs|mjs|js)$/.test(file)) {
      const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8",
      });
      if (result.status) throw new Error(result.stderr);
      count++;
    }
  }
}
check("src");
check("scripts");
check("tests");
const html = fs.readFileSync("index.html", "utf8"),
  assets = [...html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)]
    .map((m) => m[1])
    .filter((v) => !v.includes("://"));
for (const asset of assets)
  if (!fs.existsSync(asset)) throw new Error(`Missing ${asset}`);
if (
  /\b(?:eval|Function)\s*\(/.test(
    fs.readFileSync("src/domain/regiment-origin.js", "utf8"),
  )
)
  throw new Error("Dynamic execution in regiment bridge");
console.log(
  `Syntax: ${count} files; assets: ${assets.length}; no runtime code decompression.`,
);
