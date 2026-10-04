/* Targeted keyboard assertion recheck: uses a cached reading, zero engine calls. */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const review = path.resolve(__dirname, "../review-stage4b2");
const recordPath = path.join(review, "stage4b2_validation.json");
const report = JSON.parse(fs.readFileSync(recordPath, "utf8"));
const checkId = "keyboard_disclosure_and_visible_focus";
assert.equal(report.status, "FAIL");
assert.equal(report.representativeFlows, 6);
assert.deepEqual(report.checks.filter((check) => check.status === "FAIL").map((check) => check.id), [checkId]);
assert.equal(report.targetedRechecks, undefined, "Targeted recheck already recorded");
const cached = report.evidence.find((item) => item.id === "imperator");
(async () => {
  const server = require("../../scripts/serve.cjs");
  if (!server.listening) await new Promise((resolve) => server.once("listening", resolve));
  const browser = await chromium.launch({ executablePath: process.env.TAROT_UI_CHROMIUM || undefined,
    args: ["--disable-gpu", "--disable-dev-shm-usage"], headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 860 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.addInitScript(({ session, reading }) => {
      sessionStorage.setItem("imperial-tarot.prototype.stage2.session.v1",
        JSON.stringify({ session, view: "interpretation", selectedSpread: session.spread_id, question: session.question }));
      let api;
      window.__focusRecheckCalls = 0;
      Object.defineProperty(window, "ImperialTarotReadingUI", {
        configurable: true, get: () => api,
        set(original) { api = Object.freeze({ ...original, readCompleted(current) {
          if (!current.progress.finished || current.session_id !== session.session_id) throw new Error("Invalid cached UI session");
          // Present the already validated output; never interpret another input.
          return reading;
        } }); },
      });
      let interpretationApi;
      Object.defineProperty(window, "ImperialTarotInterpretationV1", {
        configurable: true, get: () => interpretationApi,
        set(original) { interpretationApi = Object.freeze({ ...original, createEngine(data) {
          const engine = original.createEngine(data);
          return Object.freeze({ ...engine, interpret() { window.__focusRecheckCalls++; throw new Error("No interpretation calls permitted in focus recheck"); } });
        } }); },
      });
    }, { session: cached.finish, reading: cached.capture.reading });
    await page.goto("http://127.0.0.1:4173/tarot-prototype/?concept=d", { waitUntil: "load" });
    const summary = page.locator(".stage4b2-signs summary");
    await summary.focus();
    await summary.press("Enter");
    const evidence = await summary.evaluate((el) => ({
      focusVisible: el.matches(":focus-visible"), outline: getComputedStyle(el).outlineStyle,
      expanded: el.parentElement.open, calls: window.__focusRecheckCalls,
    }));
    assert.equal(evidence.focusVisible, true);
    assert.notEqual(evidence.outline, "none");
    assert.equal(evidence.expanded, true);
    assert.equal(evidence.calls, 0);
    await summary.press("Space");
    assert.equal(await page.locator(".stage4b2-signs").evaluate((el) => el.open), false);
    const correction = { checkId, status: "PASS", reason: "Measure focus after the keyboard event, not after pointer-mode programmatic focus.",
      fullSuiteRerun: false, fixturesRerun: false, interpretationCalls: 0, evidence };
    const check = report.checks.find((entry) => entry.id === checkId);
    report.initialResult = { status: report.status, checksPassed: report.checksPassed, checksTotal: report.checksTotal,
      failedCheck: { ...check } };
    check.status = "PASS"; delete check.message;
    report.targetedRechecks = [correction];
    report.status = "PASS"; report.checksPassed = report.checksTotal;
    fs.writeFileSync(path.join(review, "stage4b2_focus_recheck.json"), JSON.stringify(correction, null, 2) + "\n");
    fs.writeFileSync(recordPath, JSON.stringify(report, null, 2) + "\n");
    console.log(`PASS ${report.checksPassed}/${report.checksTotal}; targeted keyboard assertion only; zero new interpretation calls.`);
    await context.close();
  } finally { await browser.close(); server.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
