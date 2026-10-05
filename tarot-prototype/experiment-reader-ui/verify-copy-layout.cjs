// Minimum targeted verification only: clipboard assertion + 320px heading/overflow.
const fs = require("node:fs"), path = require("node:path");
const { chromium } = require("playwright");
const { specs, completedSession } = require("../experiment-reader-prompt/fixtures.cjs");
const generator = require("../experiment-reader-prompt/reader-prompt.js");
const review = path.join(__dirname, "review-stage5b2");
const reportPath = path.join(review, "validation.json");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
if (report.passed !== 39 || report.errors.length || report.checks.filter(c => !c.passed).map(c => c.number).join() !== "14")
  throw new Error("This targeted continuation applies only to the recorded 39/40 pass");
const initialReport = path.join(review, "validation-initial-ui.json");
if (fs.existsSync(initialReport)) throw new Error("Targeted continuation already recorded; do not repeat");
fs.copyFileSync(reportPath, initialReport);
const session = completedSession(specs[5]), expected = generator.fromCompletedSession(session);
const targeted = [], errors = [];
let browser, server;
process.argv[2] = "4193";
server = require(path.resolve(__dirname, "../../scripts/serve.cjs"));
async function pageFor(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const origin = "http://127.0.0.1:4193";
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  await context.route("**/*", route => route.request().url().startsWith(origin + "/") ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.addInitScript(session => sessionStorage.setItem("imperial-tarot.experiment.convergence.stage5a.v1", JSON.stringify({ session, question: session.question })), session);
  await page.goto(origin + "/tarot-prototype/experiment-convergence/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Запросить толкование", exact: true }).click();
  return { page, context };
}
(async () => {
  try {
    if (!server.listening) await new Promise(resolve => server.once("listening", resolve));
    browser = await chromium.launch({ executablePath: process.env.READER_UI_CHROMIUM || "/workspace/scratch/df03253c6aec/browser-runtime-stage5b2/chromium", headless: true, args: ["--disable-gpu", "--disable-dev-shm-usage"] });
    const desktop = await pageFor(1366, 1000), page = desktop.page;
    await page.locator("#cv-copy-dossier").click();
    await page.getByText("+++ ДОСЬЕ ЧТЕЦА СКОПИРОВАНО +++", { exact: true }).waitFor();
    const first = await page.evaluate(() => navigator.clipboard.readText());
    await page.locator("#cv-copy-dossier").click();
    const second = await page.evaluate(() => navigator.clipboard.readText());
    await page.evaluate(() => navigator.clipboard.writeText = () => Promise.reject(new Error("test refusal")));
    await page.locator("#cv-copy-dossier").click();
    await page.getByText("Автокопирование недоступно. Скопируйте выделенное досье вручную.", { exact: true }).waitFor();
    const selection = await page.evaluate(() => ({ rendered: getSelection().toString(), range: getSelection().getRangeAt(0).toString(), preview: document.querySelector(".cv-dossier-text").textContent }));
    const passed = first === expected && second === expected && selection.range === expected && selection.preview === expected &&
      (selection.rendered === expected || selection.rendered === expected.replace(/\n$/, ""));
    targeted.push({ number: 14, passed, actualClipboardBytesExact: first === expected && second === expected, rangeExact: selection.range === expected,
      questionVerbatim: selection.rendered.includes(session.question), renderedTerminalLF: selection.rendered.endsWith("\n") });
    // Improve the existing preview review reference once, without retesting other desktop behavior.
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Запросить толкование", exact: true }).click();
    await page.locator(".cv-dossier-details summary").click();
    await page.locator(".cv-dossier-text").evaluate(element => element.scrollIntoView({ block: "center" }));
    await page.screenshot({ path: path.join(review, "screenshots/03-desktop-prompt-preview.png") });
    await desktop.context.close();
    const mobile = await pageFor(320, 850);
    const metric = await mobile.page.evaluate(() => {
      const panel = document.getElementById("cv-external-reader"), heading = panel.querySelector("h2");
      const start = heading.firstChild.textContent.indexOf("императорского");
      const range = document.createRange(); range.setStart(heading.firstChild, start); range.setEnd(heading.firstChild, start + "императорского".length);
      const rect = panel.getBoundingClientRect();
      return { width: rect.width, left: rect.x, titleFont: getComputedStyle(heading).fontSize, titleWordLines: range.getClientRects().length,
        overflow: document.documentElement.scrollWidth > innerWidth || panel.scrollWidth > panel.clientWidth,
        targetFits: [...panel.querySelectorAll("button, a")].every(element => { const r = element.getBoundingClientRect(); return r.height >= 44 && r.left >= rect.left && r.right <= rect.right; }) };
    });
    targeted.push({ number: 36, passed: metric.width === 320 && metric.left === 0 && metric.titleWordLines === 1 && metric.targetFits, evidence: metric });
    await mobile.page.locator(".cv-dossier-details summary").click();
    const previewOverflow = await mobile.page.locator(".cv-dossier-text").evaluate(element => element.scrollWidth > element.clientWidth);
    targeted.push({ number: 38, passed: !metric.overflow && !previewOverflow, evidence: "Changed 320px heading only; 414/1366 previous evidence retained" });
    await mobile.page.locator(".cv-dossier-details summary").click();
    await mobile.page.locator("#cv-external-reader").evaluate(element => element.scrollTop = 0);
    await mobile.page.screenshot({ path: path.join(review, "screenshots/04-mobile-320-reader.png") });
    await mobile.context.close();
    if (!targeted.every(check => check.passed) || errors.length) throw new Error("Targeted verification failed");
    for (const result of targeted) {
      const check = report.checks.find(check => check.number === result.number);
      check.passed = true; check.targetedVerification = result;
    }
    report.passed = report.checks.filter(check => check.passed).length;
    report.result = report.passed === 40 ? "PASS" : "FAIL";
    report.targetedContinuations = [{ checks: targeted, reason: "Browser rendered selection omits terminal LF; actual clipboard/Range remain byte-exact. Adjusted 320px heading to avoid a split word.", fullSuiteRerun: false, screenshotUpdates: ["03-desktop-prompt-preview.png", "04-mobile-320-reader.png"] }];
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
    fs.writeFileSync(path.join(review, "targeted-copy-layout.json"), JSON.stringify({ result: report.result, checks: targeted, errors, fullSuiteRerun: false }, null, 2) + "\n");
    console.log(JSON.stringify({ result: report.result, passed: report.passed, total: 40, targetedChecks: targeted.map(check => check.number), fullSuiteRerun: false }, null, 2));
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})();
