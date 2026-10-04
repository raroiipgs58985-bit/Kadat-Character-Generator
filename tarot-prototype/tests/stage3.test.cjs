/* Frozen production content and ritual regression checks; no network or art curation. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { JSDOM, VirtualConsole } = require("jsdom");
const data = require("../production-data.js");
const content = require("../data/content.js");
const engine = require("../ritual-session.js");
const fixture = require("./fixtures/large-spread.js");
const root = path.resolve(__dirname, "..");
const read = (file) =>
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const digest = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const assignments = read("data/assignment-manifest.json");
const files = read("data/artwork-manifest.json");
const sessionData = { ...data, spreads: [...data.spreads, fixture] };
const fixed = data.spreads.filter((s) => s.startable !== false);
const storageKey = "imperial-tarot.prototype.stage2.session.v1";
const fixtureKey = "imperial-tarot.prototype.stage2.fixture.large-spread.v1";
const plain = (x) => JSON.parse(JSON.stringify(x));

function contentChecks() {
  assert.deepEqual(content.cards, read("data/cards.json"));
  assert.deepEqual(content.spreads, read("data/spreads.json"));
  assert.equal(data.cards.length, 78);
  assert.equal(new Set(data.cards.map((c) => c.id)).size, 78);
  assert.equal(data.cards.filter((c) => c.arcana === "major").length, 22);
  assert.equal(data.cards.filter((c) => c.arcana === "minor").length, 56);
  assert.equal(assignments.length, 100);
  assert.equal(assignments.filter((a) => a.state).length, 44);
  assert.equal(assignments.filter((a) => !a.state).length, 56);
  assert.equal(new Set(assignments.map((a) => a.artwork_id)).size, 99);
  assert.equal(new Set(assignments.map((a) => a.identity_id)).size, 99);
  assert.equal(files.length, 99);
  assert.equal(fs.readdirSync(path.join(root, "assets/artworks")).length, 99);
  // Independent frozen fingerprints of the supplied final package mappings/bytes.
  assert.equal(
    digest(
      JSON.stringify(
        assignments.map((x) => [
          x.card_id,
          x.state,
          x.artwork_id,
          x.identity_id,
          x.package_file,
        ]),
      ),
    ),
    "0449d310268f66f426d57767047695dc62d73eca493d5884dc4ea6836f6494c4",
  );
  assert.equal(
    digest(JSON.stringify(files.map((x) => [x.image, x.sha256]))),
    "c8efe7094eb2f0eaf58258a0310b8848ee0e1c6668d2f66d7a358fef074bcd5f",
  );
  files.forEach((f) => {
    assert.equal(digest(fs.readFileSync(path.join(root, f.image))), f.sha256);
    assert(f.width > 0 && f.height > 0 && ["PNG", "JPEG"].includes(f.format));
  });
  for (const card of data.cards) {
    assert(card.name_en && card.name_ru && card.source_image_description_en);
    assert(Object.isFrozen(card) && card.id === card.card_id);
    if (card.arcana === "major") {
      for (const state of ["upright", "reversed"]) {
        const m = data.getMeaning(card.id, state);
        assert(m.meaning_en && m.meaning_ru);
        const a = assignments.find(
          (x) => x.card_id === card.id && x.state === state,
        );
        assert.equal(card[state].artwork_id, a.artwork_id);
        assert.equal(card[state].image, a.image);
        assert(card[state].object_fit === "contain");
      }
      assert(!Object.hasOwn(card, "symbolizes_en"));
      assert.throws(() => data.getMeaning(card.id));
    } else {
      const m = data.getMeaning(card.id);
      assert(m.symbolizes_en && m.symbolizes_ru);
      const a = assignments.find((x) => x.card_id === card.id);
      assert.equal(card.artwork_id, a.artwork_id);
      assert.equal(card.image, a.image);
      for (const key of Object.keys(card))
        assert(!/reversed|orientation/.test(key));
      assert.throws(() => data.getMeaning(card.id, "upright"));
    }
  }
  for (const suit of ["Adeptio", "Discordia", "Excuteria", "Mandatio"])
    assert.equal(data.cards.filter((c) => c.suit === suit).length, 14);
  const hulk = data.getCard("major_16"),
    speaker = data.getCard("mandatio_07");
  assert.equal(hulk.upright.artwork_id, "JB-LX-073");
  assert.equal(speaker.artwork_id, "JB-LX-073");
  assert.equal(hulk.upright.image, speaker.image);
  assert.equal(hulk.upright.identity_id, speaker.identity_id);
  assert.equal(files.filter((f) => f.artwork_id === "JB-LX-073").length, 1);
  assert.equal(
    files.find((f) => f.artwork_id === "JB-LX-073").assignments.length,
    2,
  );
  assert.deepEqual(
    fixed.map((s) => s.card_count),
    [3, 6, 7, 10],
  );
  for (const spread of fixed)
    spread.positions.forEach((p, i) => {
      assert.equal(p.position, i + 1);
      assert(p.meaning_en && p.meaning_ru && p.source.pdf_pages.length);
    });
  const astro = data.spreads.find((s) => s.spread_id === "astro_horoscope");
  assert.equal(astro.source_status, "SOURCE_FLEXIBLE");
  assert.equal(astro.card_count, null);
  assert.equal(astro.startable, false);
  assert.deepEqual(astro.positions, []);
  assert.throws(() => engine.createSession(data, astro.spread_id));
  assert.equal(fixture.card_count, 24);
  assert.equal(fixture.source_status, "INTERNAL_TEST_FIXTURE");
  const checkKeys = (value) => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      assert(!/LOCKED|confidence|rejected_candidates|reserve/.test(key));
      checkKeys(child);
    }
  };
  checkKeys(content);
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert(!html.includes('src="stage2-data.js'));
  assert(html.includes('src="production-data.js'));
}

function sessionChecks() {
  // The probability is established by the two equal uint32 residues, not a sample ratio.
  assert.equal(
    engine.randomBelow(2, () => 0),
    0,
  );
  assert.equal(
    engine.randomBelow(2, () => 0xffffffff),
    1,
  );
  assert.equal(
    engine.randomBelow(2, () => 0xfffffffe),
    0,
  );
  const stats = {
    sessions: 1000,
    draws: 0,
    upright: 0,
    reversed: 0,
    minor: 0,
    spread_counts: {},
  };
  const spreads = [...fixed, fixture];
  for (let run = 0; run < 1000; run++) {
    const spread = spreads[run % spreads.length];
    stats.spread_counts[spread.spread_id] =
      (stats.spread_counts[spread.spread_id] || 0) + 1;
    let s = engine.createSession(
      sessionData,
      spread.spread_id,
      "Что ожидает экспедицию?",
    );
    const draws = s.draws;
    assert.equal(new Set(draws.map((d) => d.card_id)).size, spread.card_count);
    assert.equal(s.version, 2);
    assert.equal(s.data_version, data.version);
    assert(Object.isFrozen(draws));
    for (const [i, d] of draws.entries()) {
      const card = data.getCard(d.card_id);
      const art = engine.resolveCard(card, d.orientation);
      assert.equal(d.image, art.image);
      assert.equal(d.artwork_id, art.artwork_id);
      assert.equal(d.identity_id, art.identity_id);
      if (d.type === "major") {
        stats[d.orientation]++;
        assert(Object.isFrozen(d));
      } else {
        stats.minor++;
        assert(!Object.hasOwn(d, "orientation"));
      }
      stats.draws++;
      if (!spread.internal_fixture) {
        const context = data.getReadingContext(s, i);
        assert.equal(context.artwork.artwork_id, art.artwork_id);
        assert.equal(context.position.position, i + 1);
        assert.equal(context.question, s.question);
        if (d.type === "minor") assert(!Object.hasOwn(context, "orientation"));
      }
    }
    assert.strictEqual(engine.update(s, "reveal", 1), s);
    assert.strictEqual(engine.update(s, "finish"), s);
    for (let i = 0; i < draws.length; i++) {
      if (i) s = engine.update(s, "next");
      assert.equal(s.progress.current_index, i);
      assert.strictEqual(engine.update(s, "focus", i + 1), s);
      s = engine.update(s, "reveal", i);
      assert.strictEqual(engine.update(s, "reveal", i), s);
      assert.strictEqual(engine.update(s, "reroll", i), s);
      assert.strictEqual(s.draws, draws);
      assert.deepEqual(engine.restore(s, sessionData), s);
    }
    s = engine.update(s, "finish");
    assert(s.progress.finished);
    const restored = engine.restore(JSON.stringify(s), sessionData);
    assert.deepEqual(restored, s);
    assert.strictEqual(engine.update(restored, "reveal", 0), restored);
  }
  // Tampered, old-data, and stale demo sessions must fail closed without drawing anything.
  const original = engine.createSession(data, "imperator");
  for (const mutate of [
    (s) => {
      s.version = 1;
    },
    (s) => {
      s.data_version = "imperial-tarot-demo-v1";
    },
    (s) => {
      s.draws[0].image = "assets/demo-pilgrim.svg";
    },
    (s) => {
      s.draws[0].artwork_id = "JB-VK-138";
    },
    (s) => {
      s.draws[0].identity_id = "wrong";
    },
    (s) => {
      s.draws[1] = s.draws[0];
    },
    (s) => {
      s.draws[0].card_id = "unknown";
    },
  ]) {
    const bad = plain(original);
    mutate(bad);
    assert.equal(engine.restore(bad, data), null);
  }
  console.log("PRODUCTION_SESSION_STATS " + JSON.stringify(stats));
}

function boot(saved = null, refuseRandom = false, developer = false) {
  const errors = [],
    vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(
    fs.readFileSync(path.join(root, "index.html"), "utf8"),
    {
      url:
        "https://example.test/tarot-prototype/?concept=d" +
        (developer ? "&fixture=large-spread" : ""),
      runScripts: "outside-only",
      virtualConsole: vc,
    },
  );
  const w = dom.window,
    key = developer ? fixtureKey : storageKey;
  w.scrollTo = () => {};
  w.matchMedia = () => ({ matches: true });
  w.HTMLImageElement.prototype.decode = () => Promise.resolve();
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new w.Event("close"));
  };
  if (saved) w.sessionStorage.setItem(key, saved);
  w.crypto.getRandomValues = (array) => {
    if (refuseRandom) throw new Error("No entropy on navigation/restoration");
    array[0] = 0;
    return array;
  };
  for (const name of [
    "data/content.js",
    "production-data.js",
    "tests/fixtures/large-spread.js",
    "ritual-session.js",
    "stage2.js",
    "prototype.js",
  ])
    w.eval(fs.readFileSync(path.join(root, name), "utf8"));
  const q = (selector) => w.document.querySelector(selector);
  const click = (selector) => {
    const el = q(selector);
    assert(el, selector);
    el.click();
  };
  const state = () => JSON.parse(w.sessionStorage.getItem(key));
  return { dom, w, key, q, click, state, errors };
}
const tick = () => new Promise((r) => setTimeout(r, 10));
async function uiChecks() {
  const text = "\n Что ожидает экспедицию?\n<img> & «текст»  ";
  for (const spread of [...fixed, fixture]) {
    const x = boot(null, false, !!spread.internal_fixture);
    if (spread.internal_fixture) x.click('[data-s2="stress"]');
    else {
      x.click('[data-s2="choose"]');
      x.click(`[data-spread="${spread.spread_id}"]`);
    }
    x.q("#ritual-question").value = text;
    x.click('[data-s2="question-continue"]');
    assert.equal(x.state().session, null);
    x.click('[data-s2="start"]');
    const initial = x.state().session;
    assert.equal(initial.question, text);
    assert.equal(x.q(".stage2-question img"), null);
    for (let i = 0; i < spread.card_count; i++) {
      if (i) x.click('[data-s2="next"]');
      assert.equal(x.q(".stage2-focus .card-front"), null);
      const future = x.q(`[data-s2="map-focus"][data-index="${i + 1}"]`);
      if (future) assert(future.disabled);
      assert.equal(x.q('[data-s2="interpret"]'), null);
      x.click('[data-s2="reveal"]');
      await tick();
      const s = x.state().session;
      assert.equal(s.question, text);
      assert.deepEqual(s.draws, initial.draws);
      assert.equal(
        x.q(".stage2-focus .card-art").getAttribute("src"),
        s.draws[i].image,
      );
      const positions = [
        ...x.w.document.querySelectorAll(
          ".stage2-map-aside .stage2-map-position",
        ),
      ];
      positions.forEach((p, j) => {
        assert.equal(
          p.querySelector("img").getAttribute("src"),
          j <= i ? s.draws[j].image : "assets/card-back-d.svg",
        );
        assert.equal(p.dataset.cardId, j <= i ? s.draws[j].card_id : undefined);
      });
      // The available source meanings and position functions never enter ritual DOM.
      const markup = x.q("#main").textContent;
      const card = data.getCard(s.draws[i].card_id);
      const meaning =
        card.arcana === "major"
          ? card[s.draws[i].orientation + "_meaning_ru"]
          : card.symbolizes_ru;
      assert(!markup.includes(meaning));
    }
    x.click('[data-s2="finish"]');
    assert.equal(
      x.w.document.querySelectorAll(".stage2-completed-spread [data-card-id]")
        .length,
      spread.card_count,
    );
    x.click('[data-s2="interpret"]');
    assert(x.q(".stage2-placeholder"));
    const restored = boot(
      x.w.sessionStorage.getItem(x.key),
      true,
      !!spread.internal_fixture,
    );
    assert.deepEqual(restored.state().session, x.state().session);
    restored.click('[data-s2="resume"]');
    restored.click('[data-s2="view"][data-target="home"]');
    restored.click('[data-concept="c"]');
    restored.click('[data-concept="d"]');
    restored.click('[data-s2="resume"]');
    assert.equal(restored.state().session.question, text);
    restored.click('[data-s2="reset"]');
    restored.q("#ritual-reset-dialog").close();
    assert.deepEqual(restored.state().session.draws, initial.draws);
    restored.click('[data-s2="reset"]');
    restored.click("#confirm-reset");
    assert.equal(restored.state().question, "");
    assert.equal(restored.state().session, null);
    assert.deepEqual(restored.errors, []);
    restored.dom.window.close();
    assert.deepEqual(x.errors, []);
    x.dom.window.close();
  }
  const old = {
    session: {
      version: 1,
      data_version: "demo-v1",
      session_id: "legacy",
      spread_id: "imperator",
      question: text,
      draws: [{ card_id: "major_16", image: "assets/demo-pilgrim.svg" }],
      progress: { current_index: 0, opened_count: 0, finished: false },
    },
    selectedSpread: "imperator",
    question: "",
    view: "ritual",
  };
  const stale = boot(JSON.stringify(old), true);
  assert.equal(stale.state().session, null);
  assert.equal(stale.state().question, text);
  assert(stale.q('[role="status"]').textContent.includes("прежней версии"));
  assert.equal(stale.q('[data-s2="resume"]'), null);
  stale.click('[data-s2="choose"]');
  stale.click('[data-spread="imperator"]');
  assert.equal(stale.q("#ritual-question").value, text);
  assert.equal(stale.state().session, null);
  assert.deepEqual(stale.errors, []);
  stale.dom.window.close();
  // An interrupted decode/flip leaves the committed state intact and cannot replay.
  const x = boot();
  x.click('[data-s2="choose"]');
  x.click('[data-spread="imperator"]');
  x.click('[data-s2="unspoken"]');
  x.click('[data-s2="start"]');
  const initial = x.state().session;
  x.click('[data-s2="reveal"]');
  x.click('[data-s2="view"][data-target="home"]');
  await tick();
  x.click('[data-s2="resume"]');
  assert.equal(x.state().session.progress.opened_count, 1);
  assert.deepEqual(x.state().session.draws, initial.draws);
  assert.equal(x.state().session.question_status, "QUESTION_UNSPOKEN");
  assert.deepEqual(x.errors, []);
  x.dom.window.close();
}
contentChecks();
sessionChecks();
uiChecks()
  .then(() =>
    console.log(
      "Stage 3 PASS: frozen 78 / 100 / 99 content, bytes and source fields; 1,000 immutable sessions; production UI, question/restore/reset, stale-demo safety, sequence and interpretation placeholder.",
    ),
  )
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
