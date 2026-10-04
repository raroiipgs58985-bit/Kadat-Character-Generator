/* One bounded Stage 5A pass. Never invokes previous-stage suites or any reader. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const flow = require("./session.js");
const production = require("../production-data.js");
const repo = path.resolve(__dirname, "../..");
const review = path.join(__dirname, "review-stage5a");
const resultFile = path.join(review, "stage5a_validation.json");
const continuation = fs.existsSync(resultFile) && process.env.CONVERGENCE_CONTINUE_UI === "1"
  ? JSON.parse(fs.readFileSync(resultFile, "utf8")) : null;
if (fs.existsSync(resultFile) && !continuation)
  throw new Error("Bounded pass already recorded; use targeted verification only.");
if (continuation && (continuation.status !== "FAIL" || continuation.screenshots.length ||
    continuation.checks.some(c => c.status !== "PASS") || continuation.continuedUiOnly ||
    !continuation.errors.some(e => /browserType.launch/.test(e.message))))
  throw new Error("Continuation is allowed only after a launch failure before any UI flow.");
const screenshotDir = path.join(review, "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });
const baseline = "0dc66e6db4522276de7536ac8292af587b26e4a8";
const report = continuation || {
  baseline, branch: "experiment/imperial-tarot-convergence", status: "RUNNING",
  checks: [], layouts: [], screenshots: [], errors: [],
  interpretationCalls: 0, aiApiCalls: 0, previousStageSuitesRerun: false,
  note: "Local HTTP only. One complete UI session reused across viewports; reset is checked by starting a new unrevealed session. Test-only uint32 stream includes a reversed Major and a Minor.",
};
if (continuation) {
  fs.copyFileSync(resultFile, path.join(review, "initial_browser_launch_failure.json"));
  report.continuedUiOnly = true;
  report.passedStructuralChecksRetained = report.checks.map(c => c.id);
  report.infrastructureRecovery = "Previous scratch Chromium was truncated to 69,928,960 bytes; re-extracted the existing vendor Brotli payload to a temporary complete binary. No application changes or passed checks rerun.";
  report.errors = [];
  report.status = "RUNNING";
}
async function check(id, name, fn) {
  if (report.checks.some(c => c.id === id && c.status === "PASS")) return;
  try { await fn(); report.checks.push({ id, name, status: "PASS" }); }
  catch (e) { report.checks.push({ id, name, status: "FAIL", error: e.message }); }
}
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
function unchanged(...paths) { assert.equal(git("diff", "--name-only", baseline, "--", ...paths), ""); }
function uint32Stream() {
  let calls = 0;
  return () => { const i = calls++; return i < 16 ? (i === 1 ? 22 : 0) : 1; };
}
const goal = "Как Келусу получить археотех Штрассе?";
const initial = continuation ? null : flow.create(goal, { randomUint32: uint32Stream(), sessionId: "stage5a-structure-review" });
let unit = initial;
let awaiting, finished, uiContract, uiStart, questionRestored = false;
let allRevealScreensClean = true, desktopEvidence, active320, active414;
const noReaderText = (text) => !/fragment[_-]|deferred_complex_reading|renderedInterpretation|provenance|"card_id"|ПРОРОЧЕСТВО|Ключевые слова/i.test(text);
async function layout(page, label, width) {
  await page.setViewportSize({ width, height: width < 800 ? 960 : 1000 });
  const evidence = await page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height, top: r.top, left: r.left,
        fontSize: parseFloat(getComputedStyle(el).fontSize) };
    };
    return {
      viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      art: box(".cv-focus > .cv-focus-card .cv-art-frame"),
      rail: box(".cv-current-path"), question: box(".cv-question-block blockquote"),
      board: box(".cv-desktop-board .cv-board"),
      pathCount: document.querySelectorAll(".cv-desktop-board .cv-path").length,
      threadCount: document.querySelectorAll(".cv-desktop-board .cv-threads path").length,
      knot: box(".cv-desktop-board .cv-convergence-knot"),
      lastPathCard: box('.cv-desktop-board [data-index="14"]'),
      clipped: Array.from(document.querySelectorAll("h1,h2,.cv-state,.cv-gate-status p,blockquote,.primary"))
        .filter(el => el.getClientRects().length && el.scrollWidth > el.clientWidth + 1).length,
    };
  });
  report.layouts.push({ label, ...evidence });
  assert.ok(evidence.scrollWidth <= width, `${label}: page overflow ${evidence.scrollWidth}/${width}`);
  assert.equal(evidence.clipped, 0, `${label}: clipped text`);
  return evidence;
}
async function shot(page, fileName, selector) {
  const target = path.join(screenshotDir, fileName);
  assert.ok(!fs.existsSync(target), "Do not regenerate screenshots");
  await page.evaluate(() => document.fonts.ready.then(() => true));
  for (const image of await page.locator("img").all()) {
    if (await image.isVisible()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(el => el.decode());
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  if (selector) await page.locator(selector).screenshot({ path: target });
  else await page.screenshot({ path: target, fullPage: true });
  report.screenshots.push(`tarot-prototype/experiment-convergence/review-stage5a/screenshots/${fileName}`);
}
(async () => {
  let browser, server;
  try {
    await check(1, "exactly 16 unique production cards", () => {
      assert.equal(initial.draws.length, 16);
      assert.equal(new Set(initial.draws.map(d => d.card_id)).size, 16);
      assert.ok(initial.draws.every(d => production.getCard(d.card_id)));
    });
    await check(2, "exactly five paths", () => assert.equal(Object.keys(initial.paths).length, 5));
    await check(3, "three ordered cards per path", () => {
      Object.values(initial.paths).forEach((cards, i) => {
        assert.equal(cards.length, 3);
        assert.deepEqual(cards, initial.draws.slice(i * 3, i * 3 + 3));
      });
    });
    await check(4, "XVI separate from paths", () => {
      assert.equal(initial.convergence, initial.draws[15]);
      assert.ok(!Object.values(initial.paths).flat().includes(initial.convergence));
    });
    await check(5, "strict path order 01 through 15", () => {
      for (let i = 0; i < 15; i++) {
        assert.equal(flow.update(unit, "reveal-path", i + 1), unit, "Cannot skip a card");
        assert.equal(flow.update(unit, "inspect", i + 1), unit, "Closed card cannot be focused");
        const before = unit;
        unit = flow.update(unit, "reveal-path", i);
        assert.equal(unit.progress.opened_count, i + 1);
        assert.equal(unit.draws, before.draws, "Draw/state identities stay fixed");
        unit = flow.update(unit, "next");
      }
      awaiting = unit;
      assert.equal(flow.phase(awaiting), "awaiting_convergence");
    });
    await check(6, "XVI blocked before all paths", () => {
      assert.equal(flow.update(initial, "reveal-convergence"), initial);
      assert.equal(flow.update(initial, "reveal-path", 15), initial);
      assert.equal(flow.toReaderInput(initial), null);
    });
    await check(7, "XVI requires the distinct explicit action", () => {
      assert.equal(awaiting.progress.opened_count, 15);
      assert.equal(flow.update(awaiting, "next"), awaiting);
      assert.equal(flow.update(awaiting, "reveal-path", 15), awaiting);
      assert.equal(flow.update(awaiting, "inspect", 15), awaiting);
      assert.equal(flow.toReaderInput(awaiting), null);
      finished = flow.update(awaiting, "reveal-convergence");
      assert.equal(finished.progress.opened_count, 16);
      assert.equal(finished.progress.finished, true);
    });
    await check(9, "no fixed semantic roles", () => {
      assert.ok(!Object.hasOwn(flow.definition, "positions"));
      for (const p of flow.definition.paths) assert.deepEqual(Object.keys(p).sort(), ["id", "indexes"]);
      const contract = flow.toReaderInput(finished);
      for (const card of [...Object.values(contract.paths).flat(), contract.convergence])
        assert.ok(Object.keys(card).every(k => ["position", "card_id", "type", "orientation"].includes(k)));
    });
    await check(10, "paths have no predefined themes", () => {
      assert.deepEqual(flow.definition.paths.map(p => p.id), ["path_1", "path_2", "path_3", "path_4", "path_5"]);
      const source = fs.readFileSync(path.join(__dirname, "convergence.js"), "utf8");
      assert.ok(!/дипломатическ|политическ|духовн.{0,15}путь|военный путь|violent|diplomatic/i.test(source));
    });
    await check(14, "Minor has no invented reverse state", () => {
      assert.ok(initial.draws.some(d => d.type === "minor"));
      for (const d of initial.draws.filter(d => d.type === "minor")) assert.ok(!Object.hasOwn(d, "orientation"));
      const tampered = JSON.parse(JSON.stringify(initial));
      tampered.draws.find(d => d.type === "minor").orientation = "reversed";
      assert.equal(flow.restore(tampered), null);
    });
    // Local test browser: no remote browser, certificate bypass, or production deployment.
    process.argv[2] = "4185";
    server = require(path.join(repo, "scripts/serve.cjs"));
    if (!server.listening) await new Promise(resolve => server.once("listening", resolve));
    browser = await chromium.launch({
      executablePath: process.env.CONVERGENCE_CHROMIUM || "/workspace/scratch/df03253c6aec/browser-runtime/chromium",
      args: ["--disable-gpu", "--disable-dev-shm-usage"], headless: true,
    });
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const network = [];
    page.setDefaultTimeout(7000);
    page.on("pageerror", e => report.errors.push({ kind: "pageerror", message: e.message }));
    page.on("console", m => { if (m.type() === "error") report.errors.push({ kind: "console", message: m.text() }); });
    page.on("response", r => { if (r.status() >= 400) report.errors.push({ kind: "resource", status: r.status(), url: r.url() }); });
    page.on("request", r => network.push({ url: r.url(), method: r.method() }));
    await page.addInitScript(() => {
      let calls = 0;
      Object.defineProperty(crypto, "getRandomValues", { value(array) {
        for (let j = 0; j < array.length; j++) {
          const i = calls++; array[j] = i < 16 ? (i === 1 ? 22 : 0) : 1;
        }
        return array;
      } });
      if (!sessionStorage.getItem("imperial-tarot.prototype.stage2.session.v1"))
        sessionStorage.setItem("imperial-tarot.prototype.stage2.session.v1", "existing-v1-session");
    });
    await page.goto("http://127.0.0.1:4185/tarot-prototype/experiment-convergence/", { waitUntil: "load" });
    await page.locator("#cv-question").fill(goal);
    await layout(page, "entry_320", 320);
    await layout(page, "entry_414", 414);
    await layout(page, "entry_1366", 1366);
    await shot(page, "01_entry_start.png");
    await page.locator("#cv-start").click();
    uiStart = await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession());
    assert.equal(uiStart.draws.length, 16);
    assert.equal(await page.locator('.cv-focus [data-cv="reveal-convergence"]').count(), 0);
    for (let index = 0; index < 15; index++) {
      const before = await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession().progress);
      assert.equal(before.current_index, index);
      assert.equal(before.opened_count, index);
      assert.equal(await page.locator(".cv-reader-placeholder").count(), 0);
      allRevealScreensClean &&= noReaderText(await page.locator("#main").innerText());
      await page.locator('[data-cv="reveal-path"]').click();
      const current = await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession());
      assert.equal(current.progress.opened_count, index + 1);
      assert.deepEqual(current.draws, uiStart.draws);
      allRevealScreensClean &&= noReaderText(await page.locator("#main").innerText());
      if (index === 0) {
        await check(13, "reversed artwork remains upright and labelled", async () => {
          const art = production.getCard(current.draws[0].card_id).reversed;
          assert.equal(current.draws[0].orientation, "reversed");
          assert.equal(await page.locator(".cv-focus-card .cv-art").getAttribute("src"), "../" + art.image);
          assert.equal(await page.locator(".cv-focus-card .cv-state").innerText(), "Перевёрнутое положение");
          const transforms = await page.locator(".cv-focus-card .cv-art").evaluate(el => {
            const result = [];
            for (let node = el; node && node !== document.body; node = node.parentElement)
              result.push(getComputedStyle(node).transform);
            return result;
          });
          assert.ok(transforms.every(t => t === "none"));
        });
        active320 = await layout(page, "active_path_320", 320);
        await shot(page, "07_mobile_320.png");
        active414 = await layout(page, "active_path_414", 414);
        await shot(page, "08_mobile_414.png");
        desktopEvidence = await layout(page, "active_path_1366", 1366);
        await shot(page, "02_active_path_I.png");
      }
      if (index === 2) {
        assert.equal(await page.locator(".cv-path-completion").innerText(), "+++ ПУТЬ I ОТКРЫТ +++");
        await shot(page, "03_path_transition.png");
        await page.reload({ waitUntil: "load" });
        const restored = await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession());
        assert.deepEqual(restored.draws, uiStart.draws);
        questionRestored = restored.question === goal && restored.progress.opened_count === 3;
      }
      if (index < 14) await page.locator('[data-cv="next"]').click();
    }
    assert.equal(await page.locator("body").getAttribute("data-cv-phase"), "awaiting_convergence");
    assert.equal(await page.locator('.cv-focus-card .cv-art').first().getAttribute("src"), "../assets/card-back-d.svg");
    assert.equal(await page.locator('[data-cv="reveal-path"]').count(), 0);
    assert.equal(await page.locator('[data-cv="next"]').count(), 0);
    assert.equal(await page.locator('[data-cv="reveal-convergence"]').count(), 1);
    await shot(page, "04_five_paths_XVI_closed.png");
    await layout(page, "gate_320", 320);
    await layout(page, "gate_414", 414);
    await page.setViewportSize({ width: 1366, height: 1000 });
    await page.locator('[data-cv="reveal-convergence"]').click();
    await page.locator('.cv-reader-placeholder .primary').waitFor({ state: "visible" });
    await shot(page, "05_convergence_reveal.png", ".cv-focus > .cv-focus-card");
    await shot(page, "06_completed_spread.png");
    await shot(page, "09_desktop_1366.png", ".cv-ritual-layout");
    const uiFinish = await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession());
    uiContract = await page.evaluate(() => window.ImperialTarotConvergenceUI.getReaderInput());
    fs.writeFileSync(path.join(review, "session_contract_example.json"), JSON.stringify(uiContract, null, 2) + "\n");
    await check(8, "no interpretation during any reveal", () => assert.ok(allRevealScreensClean));
    await check(11, "question persists including reload and completion", async () => {
      assert.ok(questionRestored);
      assert.equal(uiFinish.question, goal);
      assert.equal(uiContract.question, goal);
      assert.equal(await page.locator(".cv-question-block blockquote").innerText(), `«${goal}»`);
    });
    await check(15, "desktop five paths converge to one card", () => {
      assert.equal(desktopEvidence.pathCount, 5);
      assert.equal(desktopEvidence.threadCount, 5);
      assert.ok(desktopEvidence.knot.left > desktopEvidence.lastPathCard.left + desktopEvidence.lastPathCard.width);
      assert.ok(desktopEvidence.art.width >= 280);
    });
    await check(16, "mobile current-path focus is readable at 320 and 414", () => {
      for (const e of [active320, active414]) {
        assert.ok(e.art.width >= 260);
        assert.ok(e.rail.width >= 260);
        assert.ok(e.question.fontSize >= 19);
      }
    });
    await check(18, "completed state contains five paths and XVI", async () => {
      assert.equal(uiFinish.progress.finished, true);
      assert.equal(await page.locator(".cv-desktop-board .cv-path").count(), 5);
      assert.equal(await page.locator(".cv-desktop-board .cv-slot.is-open").count(), 16);
      assert.ok(await page.locator(".cv-reader-placeholder .primary").isDisabled());
      assert.ok((await page.locator(".cv-gate-status").innerText()).includes("СХОЖДЕНИЕ ЗАВЕРШЕНО"));
    });
    await check(19, "Stage 5B contract exposes ordered stable references only", () => {
      assert.equal(uiContract.spread, "convergence");
      const refs = [...Object.values(uiContract.paths).flat(), uiContract.convergence];
      assert.deepEqual(refs.map(r => r.position), Array.from({ length: 16 }, (_, i) => i + 1));
      assert.deepEqual(refs.map(r => r.card_id), uiStart.draws.map(d => d.card_id));
      assert.ok(refs.filter(r => r.type === "minor").every(r => !Object.hasOwn(r, "orientation")));
      assert.ok(!/meaning|fragment|semantics|theme|role/.test(JSON.stringify(uiContract)));
    });
    await check(17, "no mobile page overflow including completed inspection", async () => {
      for (const width of [320, 414]) {
        await layout(page, `completed_${width}`, width);
        assert.equal(await page.locator(".cv-mobile-gallery .cv-gallery-path").count(), 5);
        await page.locator('.cv-mobile-gallery [data-cv="inspect"][data-index="0"]').click();
        const e = await layout(page, `inspection_${width}`, width);
        assert.ok(e.art.width >= 260);
        assert.equal(await page.locator(".cv-focus-card .cv-name-ru").innerText(), production.getCard(uiStart.draws[0].card_id).name_ru);
      }
      assert.ok(report.layouts.every(e => e.scrollWidth <= e.viewport && !e.clipped));
    });
    await check(12, "reset clears/replaces the whole session only", async () => {
      const oldId = uiFinish.session_id;
      await page.locator('[data-cv="reset"]').click();
      await page.locator("#cv-confirm-reset").click();
      assert.equal(await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession()), null);
      assert.equal(await page.locator("#cv-question").inputValue(), "");
      await page.locator("#cv-question").fill("Как достигнуть новой цели?");
      await page.locator("#cv-start").click();
      const fresh = await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession());
      assert.equal(fresh.draws.length, 16);
      assert.equal(fresh.progress.opened_count, 0);
      assert.notEqual(fresh.session_id, oldId);
      assert.equal(await page.evaluate(() => sessionStorage.getItem("imperial-tarot.prototype.stage2.session.v1")), "existing-v1-session");
      assert.equal(await page.locator('[data-cv="reroll"], [data-cv="replace"]').count(), 0);
    });
    await check(20, "no AI/API/network reader or runtime interpretation", async () => {
      const code = ["session.js", "convergence.js"].map(file => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");
      assert.ok(!/getMeaning|readCompleted|interpret\s*\(|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/.test(code));
      assert.ok(network.every(r => r.method === "GET" && r.url.startsWith("http://127.0.0.1:4185/")));
      assert.ok(!network.some(r => /interpretation-stage4b1|interpretation-ui|stage2\.js/.test(r.url)));
      assert.equal(await page.evaluate(() => typeof window.ImperialTarotInterpretationV1), "undefined");
      assert.deepEqual(report.errors, []);
      assert.ok(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches));
    });
    await check(21, "Stage 4A data unchanged", () => unchanged("tarot-prototype/interpretation-stage4b1/frozen-data", "tarot-prototype/interpretation-stage4b1/data-v1.0.0.js"));
    await check(22, "frozen interpretation and production session modules unchanged", () => unchanged("tarot-prototype/interpretation-stage4b1/engine.js", "tarot-prototype/interpretation-stage4b1/session-adapter.js", "tarot-prototype/ritual-session.js"));
    await check(23, "artwork/data mappings unchanged", () => unchanged("tarot-prototype/data", "tarot-prototype/assets", "tarot-prototype/production-data.js"));
    await check(24, "four canonical spreads and V1 entry unchanged", () => unchanged("tarot-prototype/data/spreads.json", "tarot-prototype/stage2.js", "tarot-prototype/prototype.js", "tarot-prototype/index.html", "tarot-prototype/interpretation-ui.js", "tarot-prototype/interpretation-ui.css"));
    await check(25, "Archive unchanged", () => unchanged("tarot-prototype/stage2.js", "tarot-prototype/prototype.css", "tarot-prototype/concept-d.css", "tarot-prototype/stage2.css"));
    await check(26, "four Kadat generators and deployment unchanged", () => {
      assert.equal(git("diff", "--name-only", baseline, "--", ":(exclude)tarot-prototype/experiment-convergence"), "");
    });
  } catch (e) {
    report.errors.push({ kind: "validation-infrastructure-or-flow", message: e.stack });
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    report.checks.sort((a, b) => a.id - b.id);
    report.passed = report.checks.filter(c => c.status === "PASS").length;
    report.total = 26;
    report.status = report.passed === 26 && !report.errors.length ? "PASS" : "FAIL";
    fs.writeFileSync(resultFile, JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify({ status: report.status, passed: report.passed, total: report.total,
      screenshots: report.screenshots.length, failures: report.checks.filter(c => c.status === "FAIL"), errors: report.errors }, null, 2));
    process.exitCode = report.status === "PASS" ? 0 : 1;
  }
})();
