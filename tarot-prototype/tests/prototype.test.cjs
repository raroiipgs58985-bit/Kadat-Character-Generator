const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const dir = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
const script = fs.readFileSync(path.join(dir, "prototype.js"), "utf8");
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));
(async () => {
  for (const concept of ["a", "b", "c", "d", null]) {
    const errors = [];
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => errors.push(e.message));
    const dom = new JSDOM(html, {
      url: `https://example.test/tarot-prototype/${concept ? `?concept=${concept}` : ""}`,
      runScripts: "outside-only",
      virtualConsole: vc,
    });
    const w = dom.window;
    w.scrollTo = () => {};
    w.matchMedia = () => ({ matches: true });
    w.HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    w.HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      this.dispatchEvent(new w.Event("close"));
    };
    w.eval(script);
    const q = (s) => w.document.querySelector(s),
      click = (s) => q(s).click();
    assert.equal(
      q(
        '.concept-switch [data-concept="b"], .concept-option[data-concept="b"]',
      ),
      null,
    );
    if (concept === null) {
      assert.equal(w.document.body.dataset.concept, "comparison");
      assert.deepEqual(
        Array.from(
          w.document.querySelectorAll(".concept-option"),
          (e) => e.dataset.concept,
        ),
        ["a", "c", "d"],
      );
      click('[data-concept="d"]');
      assert.equal(w.document.body.dataset.concept, "d");
      assert.equal(
        q(".deck img").getAttribute("src"),
        "assets/card-back-d.svg",
      );
      dom.window.close();
      continue;
    }
    assert.equal(w.document.body.dataset.concept, concept);
    assert.equal(q("h1").textContent.replace(/\s/g, ""), "ИмператорскоеТаро");
    click('[data-action="archive"]');
    assert(q("#info-dialog").hasAttribute("open"));
    q("#info-dialog").close();
    click('[data-action="transition"]');
    assert(q("#transition-dialog").hasAttribute("open"));
    q("#transition-dialog").close();
    click('[data-view="cards"]');
    assert(q(".showcase-space .is-reversed"));
    assert.equal(
      w.document.querySelectorAll(".showcase-space .card-label").length,
      2,
    );
    click('[data-action="begin"]');
    assert(!q('[data-flip="0"]').disabled);
    assert(q('[data-flip="1"]').disabled);
    assert(q('[data-flip="2"]').disabled);
    assert.equal(
      w.document.querySelectorAll('.card-front[aria-hidden="true"]').length,
      3,
    );
    // Attempt future-card event bypassing the native disabled state: sequence must still hold.
    q('[data-flip="2"]').dispatchEvent(
      new w.MouseEvent("click", { bubbles: true }),
    );
    await tick();
    assert.equal(w.document.querySelectorAll(".is-revealed").length, 0);
    assert.equal(q(".meaning-placeholder"), null);
    for (let i = 0; i < 3; i++) {
      click(`[data-focus="${i}"]`);
      click(`[data-flip="${i}"]`);
      await tick();
      assert.equal(w.document.querySelectorAll(".is-revealed").length, i + 1);
      assert.equal(q(".meaning-placeholder"), null);
      assert(q(`[data-slot="${i}"] .card-label`));
    }
    click('[data-action="finish"]');
    assert(q(".meaning-placeholder"));
    click('[data-action="begin"]');
    assert.equal(w.document.querySelectorAll(".is-revealed").length, 0);
    // Theme navigation does not expose or load any production dataset.
    click('[data-concept="' + (concept === "a" ? "c" : "a") + '"]');
    assert(q(".deck"));
    assert.deepEqual(errors, []);
    dom.window.close();
  }
  assert(!/fetch\(|localStorage|tarot_cards\.json|KadatFeatures/.test(script));
  console.log(
    "Stage I: active A/C/D comparison, archived B, all four demo routes, strict I→II→III reveal, labels, reversed artwork, finish-only summary and reset PASS. No production data or Kadat storage access.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
