"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const data = require("../stage2-data.js");
const engine = require("../ritual-session.js");
const dir = path.resolve(__dirname, "..");
const storageKey = "imperial-tarot.prototype.stage2.session.v1";
const tick = () => new Promise((resolve) => setTimeout(resolve, 15));

function engineChecks() {
  assert.equal(data.cards.length, 28);
  assert.deepEqual(
    data.spreads.map((s) => s.card_count),
    [3, 6, 7, 10, 24],
  );
  assert.equal(data.spreads[4].source_status, "SOURCE_INCOMPLETE");
  assert(
    data.spreads[4].positions.every(
      (p) => p.name_en === null && p.name_ru === null,
    ),
  );
  let calls = 0;
  assert.equal(
    engine.randomBelow(3, () => (++calls === 1 ? 0xffffffff : 2)),
    2,
  );
  assert.equal(
    calls,
    2,
    "Unbiased sampling rejects the incomplete upper interval",
  );
  for (const value of [0, 1, 2, 3, 0xfffffffe, 0xffffffff])
    assert.equal(
      engine.randomBelow(2, () => value),
      value % 2,
    );
  calls = 0;
  let s = engine.createSession(data, "astro_horoscope", " question ", {
    sessionId: "test",
    randomUint32: () => (calls++ < 24 ? 0 : calls % 2),
  });
  assert.equal(
    calls,
    30,
    "24 independent identity draws, six independent Major coins; no Minor coins",
  );
  const draws = s.draws;
  assert.equal(s.question, "question");
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
  assert.equal(engine.update(s, "reveal", 2), s);
  assert.equal(engine.update(s, "focus", 2), s);
  assert.equal(engine.update(s, "next"), s);
  assert.equal(engine.update(s, "finish"), s);
  for (let i = 0; i < 24; i++) {
    s = engine.update(s, "reveal", i);
    assert.equal(s.progress.opened_count, i + 1);
    assert.equal(s.progress.current_index, i, "Reveal never auto-advances");
    assert.equal(engine.update(s, "reveal", i), s, "No double click reroll");
    assert.equal(s.draws, draws);
    if (i < 23) s = engine.update(s, "next");
  }
  s = engine.update(s, "finish");
  assert(s.progress.finished);
  s = engine.update(s, "focus", 0);
  assert.equal(s.draws, draws);
  const restored = engine.restore(JSON.stringify(s), data);
  assert.deepEqual(restored, s);
  assert(Object.isFrozen(restored.draws[0]));
  function invalid(mutate) {
    const x = JSON.parse(JSON.stringify(s));
    mutate(x);
    assert.equal(engine.restore(x, data), null);
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
  for (const spread of data.spreads)
    for (let i = 0; i < 40; i++) {
      const sample = engine.createSession(data, spread.spread_id);
      assert.equal(sample.draws.length, spread.card_count);
      assert.equal(
        new Set(sample.draws.map((x) => x.card_id)).size,
        spread.card_count,
      );
      assert.deepEqual(engine.restore(sample, data), sample);
    }
  assert(!JSON.stringify(data).match(/meaning|confidence|LOCKED|JB-LX|JB-VK/));
}

function boot(saved = null, refuseRandom = false) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e.message));
  const dom = new JSDOM(fs.readFileSync(path.join(dir, "index.html"), "utf8"), {
    url: "https://example.test/tarot-prototype/?concept=d",
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
  if (saved) w.sessionStorage.setItem(storageKey, saved);
  let call = 0;
  w.crypto.getRandomValues = (array) => {
    if (refuseRandom)
      throw new Error("Restoring/navigation must not request entropy");
    // First 24 calls select the first 24 demo cards; following coins alternate.
    array[0] = call++ < 24 ? 0 : call % 2;
    return array;
  };
  for (const name of [
    "stage2-data.js",
    "ritual-session.js",
    "stage2.js",
    "prototype.js",
  ])
    w.eval(fs.readFileSync(path.join(dir, name), "utf8"));
  const q = (s) => w.document.querySelector(s);
  const click = (s) => {
    const el = q(s);
    assert(el, `Missing ${s}`);
    el.click();
  };
  const state = () => JSON.parse(w.sessionStorage.getItem(storageKey));
  return { dom, w, q, click, state, errors };
}

async function uiChecks() {
  const { dom, w, q, click, state, errors } = boot();
  click('[data-s2="choose"]');
  assert.equal(w.document.querySelectorAll(".stage2-spread-option").length, 5);
  click('[data-spread="astro_horoscope"]');
  q("#ritual-question").value = '<img src=x onerror="alert(1)"> Как поступить?';
  q("#ritual-question").dispatchEvent(new w.Event("input", { bubbles: true }));
  click('[data-s2="question-continue"]');
  assert.equal(
    q(".stage2-question img"),
    null,
    "Questions are plain escaped text",
  );
  assert.equal(state().session, null, "Preparation does not draw cards");
  click('[data-s2="start"]');
  const original = JSON.stringify(state().session.draws),
    id = state().session.session_id;
  assert.equal(
    q(".card-front"),
    null,
    "Closed cards do not leak their images/names into DOM",
  );
  assert(q('[data-s2="map-focus"][data-index="23"]').disabled);
  q('[data-s2="map-focus"][data-index="23"]').dispatchEvent(
    new w.MouseEvent("click", { bubbles: true }),
  );
  assert.equal(state().session.progress.current_index, 0);
  click('[data-s2="reveal"]');
  await tick();
  assert.equal(state().session.progress.opened_count, 1);
  assert.equal(state().session.progress.current_index, 0);
  assert(q(".card-art.is-reversed"));
  assert.equal(
    q(".card-art").getAttribute("src"),
    state().session.draws[0].image,
  );
  const saved = w.sessionStorage.getItem(storageKey);
  const second = boot(saved, true);
  assert.equal(JSON.stringify(second.state().session.draws), original);
  assert.equal(second.state().session.progress.opened_count, 1);
  second.click('[data-s2="view"][data-target="home"]');
  second.click('[data-concept="c"]');
  second.click('[data-concept="d"]');
  second.click('[data-s2="resume"]');
  assert.equal(JSON.stringify(second.state().session.draws), original);
  assert.deepEqual(second.errors, []);
  second.dom.window.close();
  click('[data-s2="map"]');
  assert(q("#ritual-map-dialog").open);
  q("#ritual-map-dialog").close();
  click('[data-s2="reset"]');
  q("#ritual-reset-dialog").close();
  assert.equal(
    state().session.session_id,
    id,
    "Cancel preserves the whole session",
  );
  for (let i = 1; i < 24; i++) {
    click('[data-s2="next"]');
    assert.equal(q(".card-front"), null);
    click('[data-s2="reveal"]');
    await tick();
    assert.equal(state().session.progress.opened_count, i + 1);
    assert.equal(JSON.stringify(state().session.draws), original);
    assert.equal(q(".stage2-placeholder"), null);
    if (i >= 6) {
      assert.equal(q(".is-reversed"), null);
      assert.equal(q(".card-state"), null);
      assert(q(".card-rank"));
    }
  }
  assert.equal(
    q('[data-s2="next"]'),
    null,
    "No next button after the last card",
  );
  assert.equal(q('[data-s2="interpret"]'), null);
  click('[data-s2="finish"]');
  assert(state().session.progress.finished);
  assert.equal(q(".stage2-placeholder"), null);
  click('[data-s2="interpret"]');
  assert(q(".stage2-placeholder"));
  assert(q("h1").textContent.includes("Толкование"));
  click('[data-s2="resume"]');
  click('[data-s2="reset"]');
  click("#confirm-reset");
  assert.equal(state().session, null);
  assert.equal(w.document.body.dataset.s2View, "spreads");
  click('[data-spread="imperator"]');
  click('[data-s2="unspoken"]');
  click('[data-s2="start"]');
  assert.notEqual(state().session.session_id, id);
  assert.equal(state().session.question, "");
  assert.equal(state().session.draws.length, 3);
  assert.deepEqual(errors, []);
  dom.window.close();
  // Exercise every supported spread's optional-question path and complete lifecycle.
  for (const spread of data.spreads.slice(0, 4)) {
    const x = boot();
    x.click('[data-s2="choose"]');
    x.click(`[data-spread="${spread.spread_id}"]`);
    x.click('[data-s2="unspoken"]');
    x.click('[data-s2="start"]');
    for (let i = 0; i < spread.card_count; i++) {
      if (i) x.click('[data-s2="next"]');
      x.click('[data-s2="reveal"]');
      await tick();
    }
    x.click('[data-s2="finish"]');
    x.click('[data-s2="interpret"]');
    assert.equal(x.state().session.draws.length, spread.card_count);
    assert.deepEqual(x.errors, []);
    x.dom.window.close();
  }
  console.log(
    "Stage II PASS: all five spreads; strict sequence; without replacement; unbiased independent 50/50 Major coins; immutable draws/art states; Minor single state; escaped optional question; 24-card lifecycle; restoration without entropy; reference navigation; reset cancel/confirm; interpretation placeholder only.",
  );
}
engineChecks();
uiChecks().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
