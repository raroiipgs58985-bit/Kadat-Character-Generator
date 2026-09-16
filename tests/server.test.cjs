const assert = require("node:assert/strict"),
  { once } = require("node:events");
process.argv[2] = "0";
const server = require("../scripts/serve.cjs");
(async () => {
  if (!server.listening) await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const response = await fetch(base);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
    const html = await response.text();
    const paths = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
      .map((m) => m[1])
      .filter((p) => !p.includes("://"));
    for (const p of paths) {
      const r = await fetch(`${base}/${p}`);
      assert.equal(r.status, 200, p);
      assert((await r.text()).length > 0, p);
    }
    assert.equal((await fetch(`${base}/.git/config`)).status, 403);
    assert.equal((await fetch(`${base}/missing.js`)).status, 404);
    console.log(
      `HTTP: running application and ${paths.length} assets served, correct MIME and missing/private file handling OK.`,
    );
  } finally {
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  server.close();
  console.error(e);
  process.exit(1);
});
