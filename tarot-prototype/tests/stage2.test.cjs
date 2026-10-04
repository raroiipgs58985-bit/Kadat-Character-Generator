"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const data = require("../stage2-data.js");
const fixture = require("./fixtures/large-spread.js");
const engine = require("../ritual-session.js");
const sessionData = { ...data, spreads: [...data.spreads, fixture] };
const fixed = data.spreads.filter((s) => s.startable !== false);
const dir = path.resolve(__dirname, "..");
const storageKey = "imperial-tarot.prototype.stage2.session.v1";
const fixtureKey = "imperial-tarot.prototype.stage2.fixture.large-spread.v1";
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

function engineChecks() {
  assert.equal(data.cards.length, 28);
  assert.deepEqual(
    fixed.map((s) => s.card_count),
    [3, 6, 7, 10],
  );
  const astro = data.spreads.find((s) => s.spread_id === "astro_horoscope");
  assert.equal(astro.source_status, "SOURCE_FLEXIBLE");
  assert.equal(astro.card_count, null);
  assert.equal(astro.startable, false);
  assert.equal(astro.positions.length, 0);
  assert.throws(() => engine.createSession(data, astro.spread_id));
  assert.equal(fixture.card_count, 24);
  assert(fixture.internal_fixture && Object.isFrozen(fixture));
  assert(!data.spreads.includes(fixture));
  assert(
    fixture.positions.every((p) => p.name_en === null && p.name_ru === null),
  );
  let calls = 0;
  assert.equal(
    engine.randomBelow(3, () => (++calls === 1 ? 0xffffffff : 2)),
    2,
  );
  assert.equal(calls, 2, "Sampling rejects the incomplete upper interval");
  for (const value of [0, 1, 2, 3, 0xfffffffe, 0xffffffff])
    assert.equal(
      engine.randomBelow(2, () => value),
      value % 2,
    );
  calls = 0;
  const question =
    "  Что ожидает экспедицию?\n<текст> & «цитата»  " + "я".repeat(650);
  let s = engine.createSession(sessionData, fixture.spread_id, question, {
    sessionId: "test",
    randomUint32: () => (calls++ < 24 ? 0 : calls % 2),
  });
  assert.equal(
    calls,
    30,
    "24 identities, six independent Major coins, no Minor coins",
  );
  const draws = s.draws;
  assert.equal(s.question, question, "No trimming or silent truncation");
  assert.equal(s.question_status, "QUESTION_STATED");
  assert.equal(new Set(draws.map((d) => d.card_id)).size, 24);
  assert.deepEqual(
    draws.slice(0, 6).map((d) => d.orientation),
    ["reversed", "upright", "reversed", "upright", "reversed", "upright"],
  );
  for (const draw of draws) {
    const c = data.cards.find((x) => x.card_id === draw.card_id);
    if (c.type === "major") {
      assert.notEqual(c.upright.image, c.reversed.image);
      assert.equal(draw.image, c[draw.orientation].image);
    } else {
      assert(!Object.hasOwn(draw, "orientation"));
      assert(!Object.hasOwn(c, "reversed"));
    }
  }
  assert(
    Object.isFrozen(s) &&
      Object.isFrozen(draws) &&
      draws.every(Object.isFrozen),
  );
  assert.throws(() => {
    draws[0].orientation = "upright";
  }, TypeError);
  for (const action of ["reveal", "focus"])
    assert.equal(engine.update(s, action, 2), s);
  for (const action of ["next", "finish"])
    assert.equal(engine.update(s, action), s);
  for (let i = 0; i < 24; i++) {
    s = engine.update(s, "reveal", i);
    assert.equal(s.progress.opened_count, i + 1);
    assert.equal(
      s.progress.current_index,
      i,
      "Reveal never advances automatically",
    );
    assert.equal(engine.update(s, "reveal", i), s, "No double-click reroll");
    assert.equal(s.draws, draws);
    assert.equal(s.question, question);
    if (i < 23) s = engine.update(s, "next");
  }
  s = engine.update(s, "finish");
  assert(s.progress.finished);
  s = engine.update(s, "focus", 0);
  assert.equal(s.draws, draws);
  assert.deepEqual(engine.restore(JSON.stringify(s), sessionData), s);
  const legacy = JSON.parse(JSON.stringify(s));
  delete legacy.question_status;
  legacy.spread_id = "astro_horoscope";
  assert.equal(engine.restore(legacy, sessionData), null);
  const migrated = engine.restore(legacy, sessionData, {
    spreadAliases: { astro_horoscope: fixture.spread_id },
  });
  assert.deepEqual(
    migrated,
    s,
    "Legacy 24-position session migrates without changing question/draws",
  );
  function invalid(mutate) {
    const x = JSON.parse(JSON.stringify(s));
    mutate(x);
    assert.equal(engine.restore(x, sessionData), null);
  }
  invalid((x) => {
    x.draws[1] = x.draws[0];
  });
  invalid((x) => {
    x.draws[0].image = "wrong.svg";
  });
  invalid((x) => {
    x.draws[6].orientation = "reversed";
  });
  invalid((x) => {
    x.progress.opened_count = 25;
  });
  invalid((x) => {
    x.data_version = "obsolete";
  });
  for (const spread of [...fixed, fixture]) {
    const sample = engine.createSession(sessionData, spread.spread_id);
    assert.equal(
      new Set(sample.draws.map((x) => x.card_id)).size,
      spread.card_count,
    );
    assert.equal(sample.question, "");
    assert.equal(sample.question_status, "QUESTION_UNSPOKEN");
    assert.deepEqual(engine.restore(sample, sessionData), sample);
  }
  assert(!JSON.stringify(data).match(/meaning|confidence|LOCKED|JB-LX|JB-VK/));
}

function boot(saved = null, refuseRandom = false, developer = false) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(fs.readFileSync(path.join(dir, "index.html"), "utf8"), {
    url:
      "https://example.test/tarot-prototype/?concept=d" +
      (developer ? "&fixture=large-spread" : ""),
    runScripts: "outside-only",
    virtualConsole: vc,
  });
  const w = dom.window;
  const key = developer ? fixtureKey : storageKey;
  w.scrollTo = () => {};
  w.matchMedia = () => ({ matches: true });
  w.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new w.Event("close"));
  };
  if (saved) w.sessionStorage.setItem(key, saved);
  let call = 0;
  w.crypto.getRandomValues = (array) => {
    if (refuseRandom)
      throw new Error("Restoring/navigation must not request entropy");
    array[0] = developer && call++ >= 24 ? call % 2 : 0;
    return array;
  };
  for (const name of [
    "stage2-data.js",
    "tests/fixtures/large-spread.js",
    "ritual-session.js",
    "stage2.js",
    "prototype.js",
  ])
    w.eval(fs.readFileSync(path.join(dir, name), "utf8"));
  const q = (s) => w.document.querySelector(s);
  const click = (s) => {
    const el = q(s);
    assert(el, "Missing " + s);
    el.click();
  };
  const state = () => JSON.parse(w.sessionStorage.getItem(key));
  return { dom, w, q, click, state, errors, key };
}
function type(x, question, sendInput = true) {
  x.q("#ritual-question").value = question;
  if (sendInput)
    x.q("#ritual-question").dispatchEvent(
      new x.w.Event("input", { bubbles: true }),
    );
}
function questionIs(x, text) {
  assert.equal(x.state().session.question, text);
  assert.equal(
    x.state().session.question_status,
    text.length ? "QUESTION_STATED" : "QUESTION_UNSPOKEN",
  );
  const blocks = x.w.document.querySelectorAll(".stage2-question");
  if (text.length) {
    assert(blocks.length);
    blocks.forEach((b) => assert.equal(b.textContent, text));
  } else assert(x.q('[data-question-status="QUESTION_UNSPOKEN"]'));
}
function overviewIs(x, selector) {
  const s = x.state().session;
  const positions = x.w.document.querySelectorAll(selector);
  assert.equal(positions.length, s.draws.length);
  positions.forEach((p, i) => {
    const open = i < s.progress.opened_count,
      draw = s.draws[i];
    assert.equal(
      p.querySelector("img").getAttribute("src"),
      open ? draw.image : "assets/card-back-d.svg",
    );
    assert.equal(p.dataset.cardId, open ? draw.card_id : undefined);
    assert.equal(
      p.querySelector("img").classList.contains("is-reversed"),
      open && draw.orientation === "reversed",
    );
    assert.equal(
      p.classList.contains("is-current"),
      i === s.progress.current_index,
    );
    assert(!p.textContent.includes("✓"));
  });
}

async function uiChecks() {
  const x = boot();
  x.click('[data-s2="choose"]');
  assert.equal(
    x.w.document.querySelectorAll(".stage2-spread-option").length,
    5,
  );
  const astro = x.q('[data-spread="astro_horoscope"]');
  assert(astro.disabled && astro.textContent.includes("SOURCE_FLEXIBLE"));
  assert(!astro.textContent.includes("24") && !astro.querySelector("svg"));
  astro.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true }));
  assert.equal(x.w.document.body.dataset.s2View, "spreads");
  assert.equal(x.q('[data-s2="stress"]'), null);
  x.click('[data-spread="haloed_rosette"]');
  const question =
    '\n  Что ожидает экспедицию?\n<img src=x onerror="alert(1)"> «&»  ' +
    "я".repeat(650);
  type(x, question);
  assert(x.q('[data-s2="unspoken"]').hidden);
  x.click('[data-s2="question-continue"]');
  assert.equal(x.q(".stage2-question").textContent, question);
  assert.equal(
    x.q(".stage2-question img"),
    null,
    "Question is escaped plain text",
  );
  assert.equal(x.state().session, null, "Preparation does not draw cards");
  x.click('[data-s2="edit-question"]');
  assert.equal(
    x.q("#ritual-question").value,
    question,
    "Leading newline survives UI rendering",
  );
  x.click('[data-s2="question-continue"]');
  x.click('[data-s2="start"]');
  questionIs(x, question);
  assert(
    !x.q(".stage2-question-mobile").open,
    "Mobile question starts collapsed",
  );
  const original = JSON.stringify(x.state().session.draws),
    id = x.state().session.session_id;
  assert.equal(x.q(".stage2-focus .card-front"), null);
  overviewIs(x, ".stage2-map-aside .stage2-map-position");
  const future = x.q('[data-s2="map-focus"][data-index="9"]');
  assert(future.disabled);
  future.dispatchEvent(new x.w.MouseEvent("click", { bubbles: true }));
  assert.equal(x.state().session.progress.current_index, 0);
  x.click('[data-s2="reveal"]');
  await tick();
  questionIs(x, question);
  overviewIs(x, ".stage2-map-aside .stage2-map-position");
  const restored = boot(x.w.sessionStorage.getItem(storageKey), true);
  assert.equal(JSON.stringify(restored.state().session.draws), original);
  questionIs(restored, question);
  restored.click('[data-s2="view"][data-target="home"]');
  restored.click('[data-concept="c"]');
  restored.click('[data-concept="d"]');
  restored.click('[data-s2="resume"]');
  questionIs(restored, question);
  assert.deepEqual(restored.errors, []);
  restored.dom.window.close();
  x.click('[data-s2="map"]');
  overviewIs(x, "#ritual-map-dialog .stage2-map-position");
  x.q("#ritual-map-dialog").close();
  x.click('[data-s2="reset"]');
  x.q("#ritual-reset-dialog").close();
  assert.equal(
    x.state().session.session_id,
    id,
    "Reset cancellation preserves question and session",
  );
  for (let i = 1; i < 10; i++) {
    x.click('[data-s2="next"]');
    assert.equal(x.q(".stage2-focus .card-front"), null);
    x.click('[data-s2="reveal"]');
    await tick();
    assert.equal(x.state().session.progress.current_index, i);
    assert.equal(JSON.stringify(x.state().session.draws), original);
    questionIs(x, question);
    overviewIs(x, ".stage2-map-aside .stage2-map-position");
    assert.equal(x.q(".stage2-placeholder"), null);
    if (i >= 6) {
      assert.equal(x.q(".stage2-focus .is-reversed"), null);
      assert.equal(x.q(".stage2-focus .card-state"), null);
      assert(x.q(".stage2-focus .card-rank"));
    }
  }
  assert.equal(x.q('[data-s2="next"]'), null);
  assert.equal(x.q('[data-s2="interpret"]'), null);
  x.click('[data-s2="finish"]');
  overviewIs(x, ".stage2-completed-spread .stage2-map-position");
  questionIs(x, question);
  x.click('[data-s2="interpret"]');
  assert(x.q(".stage2-placeholder"));
  x.click('[data-s2="resume"]');
  x.click('[data-s2="reset"]');
  x.click("#confirm-reset");
  assert.equal(x.state().session, null);
  assert.equal(x.state().question, "");
  x.click('[data-spread="imperator"]');
  assert.equal(x.q("#ritual-question").value, "");
  x.click('[data-s2="unspoken"]');
  x.click('[data-s2="start"]');
  questionIs(x, "");
  assert.notEqual(x.state().session.session_id, id);
  const unspokenRestored = boot(x.w.sessionStorage.getItem(storageKey), true);
  questionIs(unspokenRestored, "");
  unspokenRestored.dom.window.close();
  assert.deepEqual(x.errors, []);
  x.dom.window.close();

  // Native submission reads the actual field even without an input event (autofill/IME).
  const autofill = boot();
  autofill.click('[data-s2="choose"]');
  autofill.click('[data-spread="imperator"]');
  type(autofill, "Что ожидает экспедицию?", false);
  autofill.click('[data-s2="question-continue"]');
  autofill.click('[data-s2="start"]');
  questionIs(autofill, "Что ожидает экспедицию?");
  autofill.dom.window.close();

  for (const spread of [...fixed, fixture]) {
    const y = boot(null, false, !!spread.internal_fixture);
    if (spread.internal_fixture) y.click('[data-s2="stress"]');
    else {
      y.click('[data-s2="choose"]');
      y.click('[data-spread="' + spread.spread_id + '"]');
    }
    y.click('[data-s2="unspoken"]');
    y.click('[data-s2="start"]');
    const originalDraws = JSON.stringify(y.state().session.draws);
    for (let i = 0; i < spread.card_count; i++) {
      if (i) y.click('[data-s2="next"]');
      y.click('[data-s2="reveal"]');
      await tick();
      assert.equal(JSON.stringify(y.state().session.draws), originalDraws);
      overviewIs(y, ".stage2-map-aside .stage2-map-position");
    }
    y.click('[data-s2="finish"]');
    overviewIs(y, ".stage2-completed-spread .stage2-map-position");
    if (spread.internal_fixture) {
      const legacy = y.state();
      legacy.session.spread_id = "astro_horoscope";
      delete legacy.session.question_status;
      legacy.session.question = "Сохранённый вопрос";
      legacy.question = "";
      legacy.selectedSpread = "astro_horoscope";
      const old = boot(JSON.stringify(legacy), true);
      questionIs(old, "Сохранённый вопрос");
      assert.equal(old.state().session.spread_id, fixture.spread_id);
      assert.equal(JSON.stringify(old.state().session.draws), originalDraws);
      assert(
        old.q(".stage2-fixture-notice").textContent.includes("внутренний"),
      );
      old.click('[data-s2="view"][data-target="spreads"]');
      assert(old.q('[data-spread="astro_horoscope"]').disabled);
      assert.deepEqual(old.errors, []);
      old.dom.window.close();
    }
    y.click('[data-s2="interpret"]');
    assert(y.q(".stage2-placeholder"));
    assert.deepEqual(y.errors, []);
    y.dom.window.close();
  }
  console.log(
    "Stage 2.1 PASS: exact optional question / submission / navigation / restore / reset; actual overview artwork and reversed state; four fixed spreads; flexible disabled Astro; internal 24 lifecycle and legacy migration; preserved sequence, immutable draw, unbiased Major coins, Minor single state and placeholder.",
  );
}
engineChecks();
uiChecks().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
