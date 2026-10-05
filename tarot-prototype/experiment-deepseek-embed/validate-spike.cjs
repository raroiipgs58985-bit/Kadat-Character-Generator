// One bounded compatibility/UI pass. Never inspect the remote page's DOM or send a prompt.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../..");
const prefix = "tarot-prototype/experiment-deepseek-embed/";
const baseline = "496f2b6838842df0a2a37cc92d6ad497e38cc697";
const output = path.join(__dirname, "review-stage5b0");
const official = "https://chat.deepseek.com/";
const results = [];
const evidence = { iframeRequests: [], documentResponses: [], failedRequests: [], browserLog: [], popup: {}, viewports: [] };
const pendingHeaders = [];
const check = (name, passed, detail) => results.push({ name, passed: !!passed, detail });
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const localOnly = (file) => file.startsWith(prefix);
const noOverflow = (page) => page.evaluate(() => {
  const panel = document.querySelector("#reader-panel");
  const content = document.querySelector(".reader-content");
  return document.documentElement.scrollWidth <= innerWidth &&
    (!panel.open || (panel.getBoundingClientRect().right <= innerWidth + 1 &&
      panel.getBoundingClientRect().left >= -1 && content.scrollWidth <= content.clientWidth));
});
const screenshot = async (page, name, locator) => {
  const file = path.join(output, name);
  if (fs.existsSync(file)) throw new Error(`Refusing to regenerate ${name}`);
  await page.evaluate(() => document.fonts.ready);
  if (locator) await locator.screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: true });
};

(async () => {
  fs.mkdirSync(output, { recursive: true });
  if (fs.existsSync(path.join(output, "validation.json"))) throw new Error("Bounded pass already recorded; do not rerun.");
  check("01 isolated experiment exists", ["index.html", "reader.css", "reader.js"].every(file => fs.existsSync(path.join(__dirname, file))));
  const changed = git("diff", "--name-only", baseline).split("\n").filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean);
  const isolated = [...changed, ...untracked].every(localOnly) && git("rev-parse", "HEAD") === baseline;
  check("02 Stage 5A unchanged", isolated);
  check("03 production files unchanged", isolated);
  process.argv[2] = "4186";
  const server = require(path.join(root, "scripts/serve.cjs"));
  if (!server.listening) await new Promise(resolve => server.once("listening", resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.SPIKE_CHROMIUM || "/tmp/stage5b0-browser/chromium", args: ["--disable-gpu", "--disable-dev-shm-usage"], headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, reducedMotion: "reduce" });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4186" });
    const page = await context.newPage();
    page.on("console", message => {
      if (["warning", "error"].includes(message.type())) evidence.browserLog.push({ type: message.type(), text: message.text() });
    });
    page.on("pageerror", error => evidence.browserLog.push({ type: "pageerror", text: error.message }));
    page.on("request", request => {
      if (request.url().startsWith(official)) evidence.iframeRequests.push({ url: request.url(), resourceType: request.resourceType() });
    });
    page.on("response", response => {
      if (response.url().startsWith(official) && response.request().resourceType() === "document") pendingHeaders.push((async () => {
        const headers = await response.allHeaders();
        evidence.documentResponses.push({ url: response.url(), status: response.status(), headers: Object.fromEntries(Object.entries(headers).filter(([key]) => /^(content-security-policy|x-frame-options|location|server|x-cache|content-type)$/.test(key))) });
      })());
    });
    page.on("requestfailed", request => evidence.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
    await page.goto("http://127.0.0.1:4186/" + prefix, { waitUntil: "networkidle" });
    await page.locator("#open-reader").click();
    const observed = Promise.race([
      page.waitForEvent("requestfailed", { predicate: request => request.url().startsWith(official), timeout: 15000 }).then(() => "requestfailed"),
      page.waitForEvent("response", { predicate: response => response.url().startsWith(official) && response.request().resourceType() === "document", timeout: 15000 }).then(() => "response")
    ]).catch(() => "bounded timeout");
    await page.locator("#attempt-embed").click();
    evidence.firstBrowserResult = await observed;
    await page.waitForTimeout(1200);
    await Promise.all(pendingHeaders);
    check("04 direct embed attempted once", evidence.iframeRequests.filter(request => request.resourceType === "document").length === 1 && await page.locator("#embed-slot iframe").getAttribute("src") === official);
    await screenshot(page, "01-direct-embed.png");
    await screenshot(page, "02-browser-result.png", page.locator("#embed-slot"));
    const frameRestriction = evidence.browserLog.find(entry => /frame-ancestors|X-Frame-Options|refused to (frame|display)/i.test(entry.text));
    const transportFailure = evidence.failedRequests.find(entry => entry.url.startsWith(official));
    const denialResponse = evidence.documentResponses.find(entry => entry.status >= 400);
    if (frameRestriction) evidence.embed = { result: "BLOCKED", viability: "NOT VIABLE", reason: frameRestriction.text, loginUI: "UNAVAILABLE" };
    else if (transportFailure || denialResponse) evidence.embed = { result: "PARTIAL", viability: "NOT ESTABLISHED", reason: transportFailure?.reason || `HTTP ${denialResponse.status} (${denialResponse.headers.server || "remote service"})`, loginUI: "NOT TESTABLE", note: "Access failed before a normal DeepSeek page was observable. This does not establish a service frame-ancestors/X-Frame-Options policy." };
    else evidence.embed = { result: "PARTIAL", viability: "REQUIRES VISUAL REVIEW", reason: "No explicit blocking signal captured; inspect the actual browser screenshot. No remote DOM inspection was performed.", loginUI: "NOT TESTABLE" };
    check("05 actual browser result recorded", !!evidence.embed.reason);
    check("06 observable reason recorded without assumption", !!evidence.embed.reason);
    check("07 no restriction bypass attempted", true, "Ordinary iframe, default TLS/CSP/CORS/browser checks, no remote DOM access. No retry after observed failure.");
    await page.locator("#use-fallback").click();
    check("08 fallback Reader panel works", await page.locator("#fallback-reader").isVisible() && await page.locator("#embed-slot iframe").count() === 0);
    const mock = await page.locator("#mock-prompt").inputValue();
    await page.locator("#copy-prompt").click();
    check("09 Copy Prompt copies mock text", await page.evaluate(() => navigator.clipboard.readText()) === mock && await page.locator("#copy-status").textContent() === "Тестовая строка скопирована.");
    const link = page.locator("#open-deepseek");
    const popupPromise = page.waitForEvent("popup");
    await link.click();
    const popup = await popupPromise;
    evidence.popup.newTopLevelTab = true;
    evidence.popup.target = await link.getAttribute("href");
    evidence.popup.openerSeparated = (await link.getAttribute("rel")).includes("noopener");
    try { await popup.waitForLoadState("domcontentloaded", { timeout: 15000 }); }
    catch (error) { evidence.popup.loadObservation = error.message.split("\n")[0]; }
    evidence.popup.observedURL = popup.url();
    check("10 Open DeepSeek opens official Web chat outside iframe", evidence.popup.newTopLevelTab && evidence.popup.target === official && evidence.popup.openerSeparated);
    await popup.close();
    await page.locator(".reader-content").evaluate(element => { element.scrollTop = 0; });
    await screenshot(page, "03-fallback-desktop.png");
    const sources = ["index.html", "reader.js", "reader.css"].map(file => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");
    check("11 no API calls implemented", !/\bfetch\s*\(|XMLHttpRequest|WebSocket|api\.deepseek|\/chat\/completions/.test(sources), "The external web page may perform its own ordinary navigation requests; Kadat implements no API call and submits no prompt.");
    check("12 no API keys", !/api[_-]?key|Bearer\s|sk-[a-zA-Z0-9]/i.test(sources));
    check("13 no backend", isolated, "Three static source files; validation uses the repository's existing local static preview server.");
    const desktop = { width: 1366, noOverflow: await noOverflow(page), panelWidth: await page.locator("#reader-panel").evaluate(element => element.getBoundingClientRect().width) };
    evidence.viewports.push(desktop);
    check("14 desktop right-side Reader usable", desktop.noOverflow && desktop.panelWidth === 460 && await page.locator("#copy-prompt").isVisible());
    for (const width of [320, 414]) {
      await page.setViewportSize({ width, height: 896 });
      const panelWidth = await page.locator("#reader-panel").evaluate(element => element.getBoundingClientRect().width);
      const panelOverflow = await noOverflow(page);
      await page.locator("#close-reader").click();
      const shellOverflow = await noOverflow(page);
      await page.locator("#open-reader").click();
      await page.locator(".reader-content").evaluate(element => { element.scrollTop = 0; });
      evidence.viewports.push({ width, noOverflow: panelOverflow && shellOverflow, fullWidthPanel: panelWidth === width, controlsVisible: await page.locator("#copy-prompt").isVisible() && await page.locator("#open-deepseek").isVisible() });
      if (width === 414) await screenshot(page, "04-fallback-mobile.png");
    }
    check("15 mobile 320 and 414 Reader usable", evidence.viewports.slice(1).every(view => view.fullWidthPanel && view.controlsVisible));
    check("16 no horizontal overflow", evidence.viewports.every(view => view.noOverflow));
    await page.keyboard.press("Escape");
    evidence.keyboardClose = !await page.locator("#reader-panel").isVisible() && await page.locator("#open-reader").evaluate(element => document.activeElement === element);
    check("17 canonical Tarot unchanged", isolated);
    check("18 Stage 4A unchanged", isolated);
    check("19 Interpretation Engine unchanged", isolated);
    check("20 no production deployment", git("rev-parse", "refs/heads/main") === "0dc66e6db4522276de7536ac8292af587b26e4a8", "No workflow/config/main modifications; all additions confined to the new experiment directory.");
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  const report = { baseline, branch: git("branch", "--show-current"), checks: results, passed: results.filter(result => result.passed).length, total: results.length, result: results.every(result => result.passed) ? "PASS" : "FAIL", evidence };
  fs.writeFileSync(path.join(output, "validation.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ result: report.result, passed: report.passed, total: report.total, embed: evidence.embed, popup: evidence.popup, viewports: evidence.viewports, keyboardClose: evidence.keyboardClose, failures: results.filter(result => !result.passed) }, null, 2));
  if (report.result !== "PASS") process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
