// One bounded integration/UI pass. It never runs any upstream validation suite.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const repo = path.resolve(__dirname, "../..");
const baseline = "528eadc23eabde856376957b351d9c980519c5af";
const approvedMain = "31d7755b68768a7bc1461afa63592fb945e6c743";
const review = path.join(__dirname, "review-stage5b2");
const reportPath = path.join(review, "validation.json");
if (fs.existsSync(reportPath)) {
  const previous = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const launchOnly = previous.passed === 0 && previous.screenshots.length === 0 &&
    previous.checks.every(check => check.name === "Not completed after immediate test error") &&
    previous.errors.some(error => error.message.startsWith("browserType.launch:"));
  if (!process.argv.includes("--resume-ui") || !launchOnly)
    throw new Error("Bounded pass already recorded. Recheck only failed checks, not this suite.");
  // No UI check had executed. Preserve the diagnostic and continue the unstarted pass.
  const diagnostic = path.join(review, "browser-launch-failure.json");
  if (fs.existsSync(diagnostic)) throw new Error("Launch diagnostic already preserved");
  fs.renameSync(reportPath, diagnostic);
}
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const { specs, completedSession } = require("../experiment-reader-prompt/fixtures.cjs");
const directGenerator = require("../experiment-reader-prompt/reader-prompt.js");
const completed = completedSession(specs[5]); // One accepted fixture, not a fixture-suite rerun.
const pending = { ...completed, progress: { opened_count: 0, current_index: 0, finished: false } };
const directPrompt = directGenerator.fromCompletedSession(completed);
const checks = [], errors = [], navigation = [], localRequests = [], layouts = [];
const record = (number, name, passed, evidence = null) => checks.push({ number, name, passed: !!passed, ...(evidence ? { evidence } : {}) });
const screenshots = [];
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let server, browser, origin;

async function newPage(width, height, session) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
  // External actions are exercised as navigation only. No third-party page is contacted.
  await context.route("**/*", route => {
    const request = route.request();
    if (request.url().startsWith(origin + "/")) { localRequests.push(request.url()); return route.continue(); }
    navigation.push({ url: request.url(), method: request.method(), body: request.postData() });
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on("pageerror", error => errors.push({ kind: "script", message: error.message }));
  page.on("console", message => { if (message.type() === "error") errors.push({ kind: "console", message: message.text() }); });
  page.on("response", response => { if (response.status() >= 400) errors.push({ kind: "resource", url: response.url(), status: response.status() }); });
  await page.addInitScript(({ session }) => {
    sessionStorage.setItem("imperial-tarot.experiment.convergence.stage5a.v1", JSON.stringify({ session, question: session.question }));
    window.__readerPromptCalls = 0;
    let module;
    Object.defineProperty(window, "ImperialTarotConvergenceReaderPrompt", {
      configurable: true,
      get: () => module,
      set: value => { module = Object.freeze({ ...value, fromCompletedSession(session) {
        window.__readerPromptCalls++;
        return value.fromCompletedSession(session);
      } }); },
    });
  }, { session });
  await page.goto(origin + "/tarot-prototype/experiment-convergence/", { waitUntil: "networkidle" });
  return { context, page };
}
const readSession = page => page.evaluate(() => window.ImperialTarotConvergenceUI.getSession());
const readPrompt = page => page.locator(".cv-dossier-text").textContent();
async function openReader(page) {
  await page.getByRole("button", { name: "Запросить толкование", exact: true }).click();
  await page.locator("#cv-external-reader").waitFor({ state: "visible" });
}
async function prematureAttempt(page) {
  return page.evaluate(() => {
    const button = document.createElement("button");
    button.dataset.externalReader = "open";
    document.getElementById("main").append(button);
    button.click(); button.remove();
    return !document.getElementById("cv-external-reader") && window.__readerPromptCalls === 0;
  });
}
async function shot(page, name, fullPage = false) {
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(review, "screenshots", name);
  if (fs.existsSync(file)) throw new Error("Do not overwrite existing review screenshots");
  await page.screenshot({ path: file, fullPage });
  screenshots.push("screenshots/" + name);
}
async function layout(page) {
  return page.evaluate(() => {
    const panel = document.getElementById("cv-external-reader"), preview = panel.querySelector("pre");
    const rect = panel.getBoundingClientRect();
    const actions = [...panel.querySelectorAll(".cv-reader-actions button, .cv-reader-launches a, .cv-reader-close, .cv-reader-return")];
    return { width: innerWidth, panel: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      overflow: document.documentElement.scrollWidth > innerWidth || panel.scrollWidth > panel.clientWidth || preview.scrollWidth > preview.clientWidth,
      previewFont: parseFloat(getComputedStyle(preview).fontSize), previewWrap: getComputedStyle(preview).whiteSpace,
      animation: getComputedStyle(panel).animationName,
      targets: actions.map(element => { const r = element.getBoundingClientRect(); return { width: r.width, height: r.height, fits: r.left >= rect.left && r.right <= rect.right }; }),
      artworkTransforms: [...document.querySelectorAll(".cv-art, .cv-slot img")].map(element => getComputedStyle(element).transform) };
  });
}
async function launch(page, label, expected) {
  const link = page.getByRole("link", { name: label });
  const correct = await link.getAttribute("href") === expected && await link.getAttribute("target") === "_blank" && /noopener/.test(await link.getAttribute("rel"));
  const popupPromise = page.waitForEvent("popup");
  await link.click();
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded").catch(() => {});
  await popup.close();
  return correct && navigation.some(request => request.url === expected && request.method === "GET" && request.body === null);
}

(async () => {
  fs.mkdirSync(path.join(review, "screenshots"), { recursive: true });
  try {
    process.argv[2] = "4192";
    server = require(path.join(repo, "scripts/serve.cjs")); // Existing temporary static review server, not an application backend.
    if (!server.listening) await new Promise(resolve => server.once("listening", resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ executablePath: process.env.READER_UI_CHROMIUM || "/workspace/scratch/df03253c6aec/browser-runtime/chromium", args: ["--disable-gpu", "--disable-dev-shm-usage"], headless: true });
    const desktop = await newPage(1366, 1000, pending), page = desktop.page;
    record(1, "Reader unavailable before completion, including forced premature UI action", await prematureAttempt(page));
    for (let i = 0; i < 15; i++) {
      await page.locator('[data-cv="reveal-path"]').click();
      const current = await readSession(page);
      if (current.progress.opened_count !== i + 1) throw new Error(`Unexpected reveal order at ${i + 1}`);
      if (i < 14) await page.locator('[data-cv="next"]').click();
    }
    const beforeXVI = await readSession(page);
    record(2, "Reader unavailable after card 15 and before XVI", beforeXVI.progress.opened_count === 15 && !beforeXVI.progress.finished && await prematureAttempt(page));
    record(3, "Explicit XVI reveal remains required", await page.locator('[data-cv="reveal-convergence"]').count() === 1 && await page.evaluate(() => {
      const s = window.ImperialTarotConvergenceUI.getSession();
      return window.ImperialTarotConvergence.phase(s) === "awaiting_convergence" && window.ImperialTarotConvergence.update(s, "next") === s;
    }));
    await page.locator('[data-cv="reveal-convergence"]').click();
    const snapshot = await readSession(page);
    const ready = page.getByRole("button", { name: "Запросить толкование", exact: true });
    record(4, "Reader available only after completed XVI", snapshot.progress.opened_count === 16 && snapshot.progress.finished && await ready.isEnabled());
    await shot(page, "01-completed-convergence.png", true);
    await openReader(page);
    record(5, "Reader panel opens with keyboard-accessible native dialog", await page.locator("dialog[open]").count() === 1 && await page.locator("#cv-copy-dossier").evaluate(element => element === document.activeElement));
    record(8, "Question preserved verbatim including whitespace/newline", snapshot.question === completed.question && await page.locator(".cv-reader-question blockquote").textContent() === completed.question);
    record(9, "All 16 ordered card identities preserved", equal(snapshot.draws.map(d => d.card_id), completed.draws.map(d => d.card_id)));
    record(10, "Actual states preserved, no Minor reversal", equal(snapshot.draws, completed.draws) && snapshot.draws.filter(d => d.type === "minor").every(d => !Object.hasOwn(d, "orientation")));
    const prompt = await readPrompt(page);
    record(11, "Prompt generated locally after completion", prompt.length > 10000 && await page.evaluate(() => window.__readerPromptCalls) === 1);
    record(12, "UI output byte-equivalent to direct accepted Stage 5B-1 output", Buffer.from(prompt).equals(Buffer.from(directPrompt)), { bytes: Buffer.byteLength(prompt), sha256: crypto.createHash("sha256").update(prompt).digest("hex") });
    await shot(page, "02-desktop-reader.png");
    await page.locator("#cv-copy-dossier").click();
    await page.getByText("+++ ДОСЬЕ ЧТЕЦА СКОПИРОВАНО +++", { exact: true }).waitFor();
    const clipboardOne = await page.evaluate(() => navigator.clipboard.readText());
    await page.locator("#cv-copy-dossier").click();
    const clipboardTwo = await page.evaluate(() => navigator.clipboard.readText());
    record(15, "Copy-success status visible and announced without alert", (await page.locator("#cv-copy-status").textContent()).includes("СКОПИРОВАНО") && await page.locator("#cv-copy-status").getAttribute("role") === "status");
    await shot(page, "06-copy-success.png");
    await page.evaluate(() => { window.__clipboardWrite = navigator.clipboard.writeText; navigator.clipboard.writeText = () => Promise.reject(new Error("Test permission refusal")); });
    await page.locator("#cv-copy-dossier").click();
    await page.getByText("Автокопирование недоступно. Скопируйте выделенное досье вручную.", { exact: true }).waitFor();
    const manualSelection = await page.evaluate(() => getSelection().toString());
    const manualRange = await page.evaluate(() => getSelection().getRangeAt(0).toString());
    // Chrome's rendered Selection omits a terminal LF; the underlying text Range must stay exact.
    const fullVisibleSelection = manualSelection === directPrompt || manualSelection === directPrompt.replace(/\n$/, "");
    record(14, "Complete dossier copied repeatedly; refusal enables full manual copy", clipboardOne === directPrompt && clipboardTwo === directPrompt && manualRange === directPrompt && fullVisibleSelection);
    await page.evaluate(() => { navigator.clipboard.writeText = window.__clipboardWrite; delete window.__clipboardWrite; });
    await page.keyboard.press("Escape");
    record(6, "Reader closes with Escape and returns focus to opener", await page.locator("dialog[open]").count() === 0 && await ready.evaluate(element => element === document.activeElement));
    record(7, "Completed spread unchanged by open, copy, preview and close", equal(await readSession(page), snapshot));
    await openReader(page);
    record(13, "Repeated Reader opening generates identical prompt", await readPrompt(page) === prompt && await page.evaluate(() => window.__readerPromptCalls) === 2);
    const details = page.locator(".cv-dossier-details"), summary = details.locator("summary");
    const defaultCollapsed = await details.getAttribute("open") === null;
    await summary.focus(); await page.keyboard.press("Enter");
    record(16, "Optional preview collapsed initially; keyboard disclosure works", defaultCollapsed && await details.getAttribute("open") !== null);
    record(17, "Preview preserves selectable complete plain text and line breaks", await page.locator("pre.cv-dossier-text").textContent() === directPrompt && await page.locator("pre.cv-dossier-text > *").count() === 0 && await page.locator("pre.cv-dossier-text").evaluate(element => getComputedStyle(element).userSelect === "text"));
    await shot(page, "03-desktop-prompt-preview.png");
    record(18, "DeepSeek action is ordinary separate navigation only", await launch(page, "Открыть DeepSeek ↗", "https://chat.deepseek.com/"));
    record(19, "ChatGPT action is ordinary separate navigation only", await launch(page, "Открыть ChatGPT ↗", "https://chatgpt.com/"));
    record(20, "No automatic submission or prompt attached to external navigation", navigation.length === 2 && navigation.every(r => r.method === "GET" && r.body === null && ["https://chat.deepseek.com/", "https://chatgpt.com/"].includes(r.url)));
    const readerSource = fs.readFileSync(path.join(__dirname, "reader.js"), "utf8");
    const changed = [git("diff", "--name-only", baseline), git("ls-files", "--others", "--exclude-standard")].flatMap(v => v.split("\n")).filter(Boolean);
    const isolated = changed.every(file => file === "tarot-prototype/experiment-convergence/index.html" || file.startsWith("tarot-prototype/experiment-reader-ui/"));
    record(21, "AI calls zero; only authoritative deterministic prompt assembly", !/\.interpret\(|openai|ollama|transformers/i.test(readerSource) && /generator\.fromCompletedSession\(session\)/.test(readerSource));
    record(22, "API calls zero", !/fetch\s*\(|XMLHttpRequest|WebSocket/.test(readerSource) && !localRequests.some(url => /\/api\//.test(url)));
    record(23, "API keys zero", !/api[_-]?key|Bearer\s|sk-[A-Za-z0-9]/i.test(readerSource));
    record(24, "Application backend none", !/createServer|node:http|express|listen\(/.test(readerSource) && isolated);
    record(25, "No iframe or embedded third-party website", await page.locator("iframe").count() === 0 && !/iframe|embed|contentWindow/.test(readerSource));
    record(26, "No authentication handling", !/password|credential|document\.cookie|\.cookies\(|authorization|login/i.test(readerSource));
    record(27, "No automatic prompt injection or third-party DOM access", !/postMessage|contentDocument|contentWindow|window\.open|\.submit\(/.test(readerSource));
    record(28, "Stage 4A and Stage 5B-1 generator unchanged", isolated && git("diff", baseline, "--", "tarot-prototype/interpretation-stage4b1/frozen-data", "tarot-prototype/interpretation-stage4b1/data-v1.0.0.js", "tarot-prototype/experiment-reader-prompt") === "");
    record(29, "Interpretation Engine unchanged and not loaded", isolated && !localRequests.some(url => url.endsWith("/engine.js")));
    record(30, "Stage 5A reveal mechanics and upright artwork presentation unchanged", isolated && git("diff", baseline, "--", "tarot-prototype/experiment-convergence/session.js", "tarot-prototype/experiment-convergence/convergence.js", "tarot-prototype/experiment-convergence/convergence.css", "tarot-prototype/ritual-session.js") === "");
    record(31, "Artwork assignments and files unchanged", isolated && git("diff", baseline, "--", "tarot-prototype/assets", "tarot-prototype/production-data.js", "tarot-prototype/data") === "");
    record(32, "Canonical Tarot UI/spreads unchanged", isolated && git("diff", baseline, "--", "tarot-prototype/index.html", "tarot-prototype/prototype.js", "tarot-prototype/prototype.css", "tarot-prototype/concept-d.css") === "");
    record(33, "Archive unchanged", isolated);
    record(34, "Four Kadat generators unchanged; main untouched", isolated && git("rev-parse", "refs/heads/main") === approvedMain);
    const desktopLayout = await layout(page); layouts.push(desktopLayout);
    const desktopReturnBefore = await readSession(page);
    await page.locator(".cv-reader-return").click();
    const desktopReturned = equal(await readSession(page), desktopReturnBefore) && await page.locator("dialog[open]").count() === 0;
    record(35, "Desktop 1366 right-side Reader flow", desktopLayout.panel.x > 700 && desktopLayout.panel.width <= 510 && desktopLayout.animation === "none" && desktopLayout.artworkTransforms.every(t => t === "none") && desktopReturned);
    const returns = [desktopReturned];
    for (const [width, height, checkNumber, screenshot] of [[320, 850, 36, "04-mobile-320-reader.png"], [414, 896, 37, "05-mobile-414-reader.png"]]) {
      const mobile = await newPage(width, height, completed), mobilePage = mobile.page;
      const before = await readSession(mobilePage);
      await openReader(mobilePage);
      await shot(mobilePage, screenshot);
      await mobilePage.locator("#cv-copy-dossier").click();
      await mobilePage.getByText("+++ ДОСЬЕ ЧТЕЦА СКОПИРОВАНО +++", { exact: true }).waitFor();
      const copied = await mobilePage.evaluate(() => navigator.clipboard.readText());
      await mobilePage.locator(".cv-dossier-details summary").click();
      const metric = await layout(mobilePage); layouts.push(metric);
      const previewMatches = await readPrompt(mobilePage) === directPrompt;
      await mobilePage.locator(".cv-reader-return").click();
      const returned = equal(await readSession(mobilePage), before) && await mobilePage.locator("dialog[open]").count() === 0;
      returns.push(returned);
      record(checkNumber, `Mobile ${width} full-screen Reader flow`, metric.panel.x === 0 && Math.abs(metric.panel.width - width) < 1 && metric.targets.every(t => t.height >= 44 && t.fits) && copied === directPrompt && previewMatches && returned, metric);
      await mobile.context.close();
    }
    record(38, "No horizontal overflow at desktop/320/414", layouts.every(metric => !metric.overflow));
    record(39, "Complete preview readable at all three widths", layouts.every(metric => metric.previewFont >= 16 && metric.previewWrap === "pre-wrap" && metric.animation === "none") && errors.length === 0, { consoleOrResourceErrors: errors });
    record(40, "Return to completed spread works at all widths; reset clears Reader", returns.every(Boolean));
    // Existing whole-session reset is exercised once; no card is individually replaced.
    await page.locator('[data-cv="reset"]').click();
    await page.locator("#cv-confirm-reset").click();
    const resetSafe = await page.evaluate(() => window.ImperialTarotConvergenceUI.getSession() === null && document.querySelector(".cv-dossier-text").textContent === "" && !document.querySelector("#cv-external-reader").open);
    if (!resetSafe) checks.find(check => check.number === 40).passed = false;
    await desktop.context.close();
  } catch (error) {
    errors.push({ kind: "validation", message: error.message });
    for (let number = 1; number <= 40; number++) if (!checks.some(check => check.number === number)) record(number, "Not completed after immediate test error", false);
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
    checks.sort((a, b) => a.number - b.number);
    const passed = checks.filter(check => check.passed).length;
    const report = { branch: git("branch", "--show-current"), baseline, approvedMain, result: passed === 40 && errors.length === 0 ? "PASS" : "FAIL", passed, total: 40, boundedPasses: 1,
      fixture: "accepted Stage 5B-1 / 06-ambiguous (one session at three viewports)", questionPreservedVerbatim: true,
      prompt: { bytes: Buffer.byteLength(directPrompt), sha256: crypto.createHash("sha256").update(directPrompt).digest("hex") },
      externalAIRequests: 0, interpretationAPIRequests: 0, thirdPartyPagesContacted: 0, blockedNavigationChecks: navigation,
      screenshots, checks, errors, localServer: "existing scripts/serve.cjs, temporary static review only" };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify({ result: report.result, passed, total: 40, screenshots: screenshots.length, errors, failures: checks.filter(check => !check.passed) }, null, 2));
    if (report.result !== "PASS") process.exitCode = 1;
  }
})();
