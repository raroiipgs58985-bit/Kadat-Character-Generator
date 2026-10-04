/* One bounded Stage 4B-2 browser integration pass. Never runs prior stage suites. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const production = require("../production-data.js");
const root = path.resolve(__dirname, "../..");
const review = path.resolve(__dirname, "../review-stage4b2");
const recordPath = path.join(review, "stage4b2_validation.json");
const baseline = "28de1159097b7814e6733dfead7c3e08bf69ba09";
if (fs.existsSync(recordPath)) throw new Error("Bounded pass already recorded. Use saved evidence; do not rerun.");
fs.mkdirSync(path.join(review, "screenshots"), { recursive: true });

const major = (cardId, state = "upright") => ({ cardId, state });
const minor = (cardId) => ({ cardId, state: "standard" });
const cases = [
  { id: "imperator", title: "Imperator — complete normal flow", spread: "imperator",
    cards: [major("major_00"), minor("adeptio_05"), major("major_17")],
    question: "Что ожидает экспедицию за пределами света Астрономикона?" },
  { id: "imperator-reversed", title: "Imperator — reversed Major / no question", spread: "imperator",
    cards: [major("major_02", "reversed"), minor("mandatio_03"), major("major_18")], question: "" },
  { id: "branch", title: "Branch — shared forces and two alternatives", spread: "branch",
    cards: [minor("mandatio_01"), major("major_17"), major("major_08"), minor("discordia_02"),
      major("major_13", "reversed"), major("major_19")], question: "Какие пути остаются открытыми?" },
  { id: "throne", title: "Throne — advice and conditional outcome", spread: "throne_of_terra",
    cards: [major("major_00"), minor("adeptio_05"), major("major_18"), minor("discordia_03"),
      minor("excuteria_10"), major("major_12"), major("major_21")], question: "" },
  { id: "rosette", title: "Rosette — ten signs, positive challenge, present/internal comparison", spread: "haloed_rosette",
    cards: [major("major_15"), major("major_17"), minor("mandatio_01"), minor("excuteria_10"),
      major("major_21"), minor("adeptio_07"), major("major_19"), major("major_18", "reversed"),
      minor("discordia_03"), major("major_16")],
    question: "Что скрывается за этим знамением?\n<знамение> " + "А".repeat(140) },
  { id: "astro", title: "Astro — deferred result / 24 revealed cards", spread: "astro_horoscope",
    cards: [...production.cards.slice(0, 8).map((card, i) => major(card.card_id, i % 2 ? "reversed" : "upright")),
      ...production.cards.filter((card) => card.type === "minor").slice(0, 16).map((card) => minor(card.card_id))],
    question: "Что хранит сложное знамение?" },
];
const checks = [];
const evidence = [];
const errors = [];
function check(id, fn) {
  try { fn(); checks.push({ id, status: "PASS" }); }
  catch (error) { checks.push({ id, status: "FAIL", message: error.message }); }
}
function drawQueue(cards) {
  const pool = production.cards.map((card) => card.card_id);
  const queue = cards.map((card, i) => {
    const j = pool.indexOf(card.cardId, i);
    assert.ok(j >= i);
    [pool[i], pool[j]] = [pool[j], pool[i]];
    return j - i;
  });
  for (const card of cards) if (card.state !== "standard") queue.push(card.state === "reversed" ? 1 : 0);
  return queue;
}
async function layout(page, width) {
  await page.setViewportSize({ width, height: width < 800 ? 860 : 1000 });
  return page.evaluate(() => {
    const paragraphs = [...document.querySelectorAll(".stage4b2-prophecy p, .stage4b2-deferred > p")];
    const thumbnails = [...document.querySelectorAll(".stage4b2-sign img")];
    return {
      width: innerWidth, bodyWidth: document.documentElement.scrollWidth,
      prose: paragraphs.map((p) => ({ width: p.getBoundingClientRect().width, font: parseFloat(getComputedStyle(p).fontSize) })),
      thumbnails: thumbnails.map((img) => ({ width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height })),
      clipped: [...document.querySelectorAll(".stage4b2-reading h1, .stage4b2-question blockquote, .stage4b2-sign h3, .stage4b2-sign-state")]
        .filter((el) => el.clientWidth && el.scrollWidth > el.clientWidth + 1).length,
    };
  });
}
async function screenshot(page, name) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].filter((img) => {
      const box = img.getBoundingClientRect();
      return box.width && box.top < innerHeight && box.bottom > 0;
    }).map((img) => img.decode().catch(() => {})));
  });
  await page.screenshot({ path: path.join(review, "screenshots", name), fullPage: false });
}

(async () => {
  // Keep the local static server in the test process; a detached scratch
  // session may disappear before the browser can reach it.
  const server = require("../../scripts/serve.cjs");
  if (!server.listening) await new Promise((resolve) => server.once("listening", resolve));
  const preflight = await fetch("http://127.0.0.1:4173/tarot-prototype/?concept=d");
  assert.equal(preflight.status, 200, "Local UI server preflight");
  const browser = await chromium.launch({
    executablePath: process.env.TAROT_UI_CHROMIUM || undefined,
    args: ["--disable-gpu", "--disable-dev-shm-usage"],
    headless: true,
  });
  try {
    for (const fixture of cases) {
      const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      const external = [], consoleErrors = [], resourceErrors = [];
      page.on("pageerror", (error) => consoleErrors.push(error.message));
      page.on("response", (response) => { if (response.status() >= 400) resourceErrors.push(response.url()); });
      await page.route("**/*", (route) => {
        const url = route.request().url();
        if (url.startsWith("http://127.0.0.1:4173/")) return route.continue();
        external.push(url); return route.abort();
      });
      await page.addInitScript(({ queue, id }) => {
        const capture = window.__tarotUiReview = { calls: 0, created: null, input: null, reading: null };
        let ritualApi, interpretationApi;
        Object.defineProperty(window, "ImperialTarotSession", {
          configurable: true, get: () => ritualApi,
          set(api) {
            ritualApi = Object.freeze({ ...api, createSession(data, spread, question, options = {}) {
              const values = [...queue];
              const session = api.createSession(data, spread, question, { ...options,
                randomUint32: () => { if (!values.length) throw new Error("Test draw queue exhausted"); return values.shift(); },
                sessionId: "stage4b2-ui-" + id });
              capture.created = JSON.parse(JSON.stringify(session));
              return session;
            } });
          },
        });
        Object.defineProperty(window, "ImperialTarotInterpretationV1", {
          configurable: true, get: () => interpretationApi,
          set(api) {
            interpretationApi = Object.freeze({ ...api, createEngine(data) {
              const original = api.createEngine(data);
              return Object.freeze({ ...original, interpret(input) {
                capture.calls++;
                const reading = original.interpret(input);
                capture.input = JSON.parse(JSON.stringify(input));
                capture.reading = JSON.parse(JSON.stringify(reading));
                return reading;
              } });
            } });
          },
        });
      }, { queue: drawQueue(fixture.cards), id: fixture.id });
      const item = { id: fixture.id, title: fixture.title, status: "PASS", layouts: [] };
      try {
        await page.goto("http://127.0.0.1:4173/tarot-prototype/?concept=d", { waitUntil: "load" });
        await page.locator('[data-s2="choose"]').first().click();
        await page.locator(`[data-s2="select"][data-spread="${fixture.spread}"]`).click();
        await page.locator("#ritual-question").fill(fixture.question);
        await page.locator('[data-s2="question-continue"]').click();
        await page.locator('[data-s2="start"]').click();
        item.start = await page.evaluate(() => JSON.parse(sessionStorage.getItem("imperial-tarot.prototype.stage2.session.v1")).session);
        item.closedCardsHidden = await page.locator(".card-front, .card-name-ru").count() === 0;
        item.futureSlotsLocked = await page.locator('[data-s2="map-focus"][data-index="1"]').first().isDisabled();
        item.noLeaks = true;
        item.callsDuringReveal = 0;
        item.reversedDuringReveal = [];
        for (let i = 0; i < fixture.cards.length; i++) {
          if (await page.locator('[data-s2="interpret"], .stage4b2-prophecy, .stage4b2-signs, .stage4b2-sign-text').count()) item.noLeaks = false;
          await page.locator('[data-s2="reveal"]').click();
          await page.waitForFunction(() => document.querySelector(".stage2-continue"));
          if (fixture.cards[i].state === "reversed") {
            item.reversedDuringReveal.push(await page.locator(".stage2-focus-card .card-art").evaluate((img) => ({ transform: getComputedStyle(img).transform, src: img.getAttribute("src") })));
            assert.match(await page.locator(".stage2-focus-card .card-state").innerText(), /Перевёрнутое положение/);
          }
          if (await page.locator(".stage4b2-prophecy, .stage4b2-signs, .stage4b2-sign-text").count()) item.noLeaks = false;
          item.callsDuringReveal += await page.evaluate(() => window.__tarotUiReview.calls);
          if (i < fixture.cards.length - 1) await page.locator('[data-s2="next"]').click();
        }
        item.transition = await page.locator(".stage4b2-transition").innerText();
        item.actionAvailable = await page.locator('[data-s2="interpret"]').isEnabled();
        await page.locator('[data-s2="interpret"]').click();
        await page.locator(".stage4b2-reading").waitFor();
        item.capture = await page.evaluate(() => window.__tarotUiReview);
        item.finish = await page.evaluate(() => JSON.parse(sessionStorage.getItem("imperial-tarot.prototype.stage2.session.v1")).session);
        item.paragraphs = await page.locator(".stage4b2-prophecy > p").allTextContents();
        item.question = await page.locator(".stage4b2-question blockquote").allTextContents();
        item.collapsed = !(await page.locator(".stage4b2-signs").evaluate((details) => details.open));
        item.mode = item.capture.reading.interpretationMode;
        item.preDetailsText = await page.locator("#main").innerText();
        item.htmlInjected = await page.locator("#main script, #main iframe").count();
        if (fixture.id !== "astro") {
          await screenshot(page, fixture.id + "-desktop.png");
          await page.locator(".stage4b2-signs summary").focus();
          await page.locator(".stage4b2-signs summary").press("Enter");
          item.focusVisible = await page.locator(".stage4b2-signs summary").evaluate((el) => getComputedStyle(el).outlineStyle !== "none");
          assert.equal(await page.locator(".stage4b2-signs").evaluate((el) => el.open), true);
        }
        item.signs = await page.locator(".stage4b2-sign").evaluateAll((elements) => elements.map((el) => ({
          position: Number(el.dataset.signPosition), name: el.querySelector("h3").textContent,
          role: el.querySelector(".stage4b2-sign-role").textContent,
          state: el.querySelector(".stage4b2-sign-state").textContent,
          text: el.querySelector(".stage4b2-sign-text")?.textContent || null,
          note: el.querySelector(".stage4b2-relation-note")?.textContent || null,
          image: el.querySelector("img").getAttribute("src"), transform: getComputedStyle(el.querySelector("img")).transform,
        })));
        item.groups = await page.locator(".stage4b2-sign-group").evaluateAll((groups) => groups.map((group) => ({
          title: group.querySelector("h2").textContent,
          description: group.querySelector("p").textContent,
          positions: [...group.querySelectorAll(".stage4b2-sign")].map((sign) => Number(sign.dataset.signPosition)),
        })));
        item.visibleText = await page.locator("#main").innerText();
        item.reduced = await page.evaluate(() => ({
          preference: matchMedia("(prefers-reduced-motion: reduce)").matches,
          scroll: getComputedStyle(document.documentElement).scrollBehavior,
          transition: getComputedStyle(document.querySelector(".stage4b2-signs summary")).transitionDuration,
        }));
        for (const width of [320, 414, 1366]) item.layouts.push(await layout(page, width));
        if (fixture.id === "rosette") {
          await page.locator(".stage4b2-signs summary").scrollIntoViewIfNeeded();
          await screenshot(page, "rosette-details-desktop.png");
          await page.setViewportSize({ width: 320, height: 860 });
          await page.locator(".stage4b2-signs summary").scrollIntoViewIfNeeded();
          await screenshot(page, "rosette-details-mobile-320.png");
        }
        if (fixture.id === "imperator-reversed") {
          await page.setViewportSize({ width: 414, height: 896 });
          await page.locator(".stage4b2-signs summary").press("Enter");
          await page.evaluate(() => scrollTo(0, 0));
          await screenshot(page, "imperator-mobile-414.png");
          const expected = item.capture.reading;
          await page.reload({ waitUntil: "load" });
          await page.locator(".stage4b2-prophecy").waitFor();
          item.reloadReading = await page.evaluate(() => window.__tarotUiReview.reading);
          item.reloadIdentical = JSON.stringify(expected) === JSON.stringify(item.reloadReading);
        }
        if (fixture.id === "astro") {
          await page.evaluate(() => scrollTo(0, 0));
          await screenshot(page, "astro-deferred-desktop.png");
          await page.setViewportSize({ width: 320, height: 860 });
          await screenshot(page, "astro-deferred-mobile-320.png");
          await page.locator('.stage4b2-signs > summary').press("Enter");
        }
        await page.locator('[data-s2="resume"]').last().click();
        item.returnedDraws = await page.evaluate(() => JSON.parse(sessionStorage.getItem("imperial-tarot.prototype.stage2.session.v1")).session.draws);
        await page.setViewportSize({ width: 320, height: 860 });
        await page.locator('[data-s2="map"]').click();
        item.mapModal = await page.locator("#ritual-map-dialog").evaluate((dialog) => ({
          height: dialog.getBoundingClientRect().height, viewport: innerHeight,
          overflow: getComputedStyle(dialog).overflowY, scrollHeight: dialog.scrollHeight, clientHeight: dialog.clientHeight,
        }));
        await page.locator('#ritual-map-dialog .dialog-done').click();
        await page.locator('[data-s2="view"][data-target="spreads"]').click();
        await page.locator(`[data-s2="select"][data-spread="${fixture.spread === "imperator" ? "branch" : "imperator"}"]`).click();
        item.changeRequiresReset = await page.locator("#ritual-reset-dialog").evaluate((dialog) => dialog.open);
        await page.locator('#ritual-reset-dialog form button').click();
        await page.locator('[data-s2="view"][data-target="ritual"]').click();
        await page.locator('[data-s2="interpret"]').click();
        await page.locator('[data-s2="reset"]').last().click();
        await page.locator("#confirm-reset").click();
        item.reset = await page.evaluate(() => {
          const saved = JSON.parse(sessionStorage.getItem("imperial-tarot.prototype.stage2.session.v1"));
          return { session: saved.session, question: saved.question, view: saved.view, hasReading: !!document.querySelector(".stage4b2-reading") };
        });
        item.externalRequests = external;
        item.consoleErrors = consoleErrors;
        item.resourceErrors = resourceErrors;
      } catch (error) {
        item.status = "FAIL"; item.error = error.message; errors.push({ fixture: fixture.id, message: error.message });
      }
      evidence.push(item);
      console.log(`${fixture.id}: ${item.status}`);
      await context.close();
    }
  } finally { await browser.close(); server.close(); }

  const all = (predicate) => { assert.equal(evidence.length, 6); evidence.forEach((item) => assert.ok(predicate(item), item.id)); };
  const byId = (id) => evidence.find((item) => item.id === id);
  check("six_representative_ritual_flows", () => all((item) => item.status === "PASS"));
  check("closed_faces_and_future_cards_unavailable", () => all((item) => item.closedCardsHidden && item.futureSlotsLocked));
  check("no_meanings_or_engine_calls_during_reveal", () => all((item) => item.noLeaks && item.callsDuringReveal === 0));
  check("last_reveal_ceremonial_transition_one_action", () => all((item) => item.actionAvailable && item.transition.includes("+++ РАСКЛАД ЗАВЕРШЁН +++")));
  check("accepted_adapter_used_once_for_completed_reading", () => all((item) => item.capture.calls === 1 && item.finish.progress.finished));
  check("main_prophecy_exact_paragraphs_from_engine", () => evidence.forEach((item) => assert.deepEqual(item.paragraphs, item.capture.reading.prophecy.paragraphs)));
  check("question_shown_verbatim_or_omitted_and_html_escaped", () => evidence.forEach((item, i) => {
    assert.deepEqual(item.question, cases[i].question ? [`«${cases[i].question}»`] : []); assert.equal(item.htmlInjected, 0);
  }));
  check("question_display_only_integration", () => {
    const sandbox = { window: { ImperialTarotProduction: production,
      ImperialTarotInterpretationDataV1: require("../interpretation-stage4b1/data-v1.0.0.js"),
      ImperialTarotInterpretationV1: require("../interpretation-stage4b1/engine.js"),
      ImperialTarotInterpretationSessionV1: require("../interpretation-stage4b1/session-adapter.js") } };
    vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, "../interpretation-ui.js"), "utf8"), sandbox);
    const before = JSON.parse(JSON.stringify(byId("imperator").capture.reading));
    const after = JSON.parse(JSON.stringify(sandbox.window.ImperialTarotReadingUI.readCompleted({ ...byId("imperator").finish, question: "Совершенно другой вопрос" })));
    delete before.question; delete after.question; assert.deepEqual(after, before);
  });
  check("optional_signs_collapsed_by_default", () => evidence.filter((item) => item.id !== "astro").forEach((item) => assert.equal(item.collapsed, true)));
  check("keyboard_disclosure_and_visible_focus", () => evidence.filter((item) => item.id !== "astro").forEach((item) => assert.ok(item.focusVisible)));
  check("signs_use_structured_engine_text_and_production_art", () => evidence.forEach((item) => item.signs.forEach((sign, i) => {
    const source = item.capture.reading.signs[i];
    assert.equal(sign.name, source.nameRu); assert.equal(sign.text, source.renderedInterpretation);
    assert.equal(sign.image, item.finish.draws[i].image);
  })));
  check("no_internal_ids_trace_or_provenance_visible", () => all((item) => !/fragmentId|stateId|relationId|source_explicit|engine_synthesis_heuristic|major_\d+|astro_horoscope\.p|FNV-1a/.test(item.visibleText)));
  check("reversed_major_assigned_art_upright_and_labelled", () => evidence.forEach((item) => {
    item.reversedDuringReveal.forEach((art) => assert.equal(art.transform, "none"));
    item.signs.forEach((sign, i) => { if (item.finish.draws[i].orientation === "reversed") {
      assert.equal(sign.transform, "none"); assert.match(sign.state, /Перевёрнутое положение/);
      assert.equal(sign.image, production.getCard(item.finish.draws[i].card_id).reversed.image);
    } });
  }));
  check("minor_standard_only_without_orientation_control", () => evidence.forEach((item) => item.finish.draws.forEach((draw, i) => {
    if (draw.type === "minor") { assert.equal(Object.hasOwn(draw, "orientation"), false); assert.equal(item.capture.reading.signs[i].state, "standard"); }
  })));
  check("branch_shared_forces_and_two_unselected_futures", () => {
    const item = byId("branch"); assert.deepEqual(item.groups.map((group) => group.positions), [[3, 4], [5, 6]]);
    const alternatives = item.capture.reading.sections.flatMap((section) => section.alternatives);
    assert.equal(alternatives.length, 2); alternatives.forEach((alternative) => assert.equal(alternative.selected, false));
    assert.match(item.groups[1].description, /Ни одно не выбрано/);
    assert.doesNotMatch(item.visibleText, /Предатель|Истинный путь|3\s*→\s*5|4\s*→\s*6/);
  });
  check("throne_outcome_conditional_on_advice", () => {
    const item = byId("throne"); assert.match(item.signs[6].role, /Исход при следовании совету/);
    assert.match(item.signs[6].text, /Если прежнему совету последовать/);
    assert.ok(item.capture.reading.sections.some((section) => section.condition));
  });
  check("rosette_ten_signs_positive_card_stays_challenge", () => {
    const item = byId("rosette"); assert.equal(item.signs.length, 10); assert.match(item.signs[1].role, /испытание/);
    assert.match(item.signs[1].text, /ближайшее испытание/);
  });
  check("rosette_present_internal_relation_from_engine", () => {
    const item = byId("rosette"); assert.match(item.signs[6].note, /сопоставляется с настоящим/);
    assert.ok(item.capture.reading.relations.some((relation) => relation.purpose === "compare_internal_factors_with_present"));
  });
  check("astro_deferred_no_fake_prophecy_roles_or_framing", () => {
    const item = byId("astro"); assert.equal(item.mode, "deferred_complex_reading"); assert.equal(item.paragraphs.length, 0);
    assert.equal(item.signs.length, 24); item.capture.reading.signs.forEach((sign) => { assert.equal(sign.role, null); assert.equal(sign.renderedInterpretation, null); });
    assert.match(item.preDetailsText, /Карты сохранены как единое сложное знамение/);
  });
  check("return_to_cards_keeps_draws_and_change_requires_reset", () => all((item) => JSON.stringify(item.returnedDraws) === JSON.stringify(item.start.draws) && item.changeRequiresReset));
  check("new_reading_clears_entire_session_and_question", () => all((item) => item.reset.session === null && item.reset.question === "" && item.reset.view === "spreads" && !item.reset.hasReading));
  check("same_input_seed_output_after_reload", () => assert.equal(byId("imperator-reversed").reloadIdentical, true));
  check("no_external_interpretation_or_resource_dependency", () => all((item) => item.externalRequests.length === 0 && item.consoleErrors.length === 0 && item.resourceErrors.length === 0));
  check("320_414_and_desktop_layouts_no_overflow_or_clipping", () => all((item) => item.layouts.length === 3 && item.layouts.every((row) => row.bodyWidth <= row.width + 1 && row.clipped === 0 && row.prose.every((p) => p.width <= 696 && p.font >= 19))));
  check("readable_artwork_thumbnails_all_screen_widths", () => all((item) => item.layouts.every((row) => row.thumbnails.every((img) => img.width >= 70 && img.height >= 110))));
  check("phone_review_dialog_bounded_and_scrollable", () => all((item) => item.mapModal.height <= item.mapModal.viewport - 24 && item.mapModal.overflow === "auto"));
  check("reduced_motion_no_new_transition_or_smooth_scroll", () => all((item) => item.reduced.preference && item.reduced.scroll === "auto" && item.reduced.transition === "0s"));
  check("frozen_engine_stage4a_artwork_and_four_generators_unchanged", () => {
    const files = execFileSync("git", ["diff", "--name-only", baseline], { cwd: root, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    assert.ok(files.every((file) => ["tarot-prototype/index.html", "tarot-prototype/stage2.js"].includes(file)));
    assert.equal(execFileSync("git", ["rev-parse", "refs/heads/main"], { cwd: root, encoding: "utf8" }).trim(), "84a5afd4eac4dd5ed14e5ed9f74c55ed66edc0da");
  });
  const passed = checks.filter((item) => item.status === "PASS").length;
  const result = { status: passed === checks.length ? "PASS" : "FAIL", baseline,
    branch: "prototype/imperial-tarot-stage4b2", boundedPasses: 1, representativeFlows: evidence.filter((item) => item.status === "PASS").length,
    checksPassed: passed, checksTotal: checks.length, previousStageSuitesRun: 0,
    interpretationCalls: "6 UI reads + 1 reload replay + 1 display-only question check",
    viewports: [320, 414, 1366], checks, errors, evidence };
  fs.writeFileSync(recordPath, JSON.stringify(result, null, 2) + "\n");
  console.log(`${result.status}: ${passed}/${checks.length} checks; ${result.representativeFlows}/6 flows`);
  process.exitCode = result.status === "PASS" ? 0 : 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
