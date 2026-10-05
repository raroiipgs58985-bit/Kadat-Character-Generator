// One bounded pass over our page only; never inspect or operate the DeepSeek DOM.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../../..");
const prefix = "tarot-prototype/experiment-deepseek-embed/live-test/";
const baseline = "6eecf01cb7961565f37ac5d80e729ef419e0469c";
const official = "https://chat.deepseek.com/";
const review = path.join(__dirname, "review-stage5b01");
const reportFile = path.join(review, "validation.json");
const checks = [];
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const check = (name, pass, detail) => checks.push({ name, pass: !!pass, detail });

(async () => {
  if (fs.existsSync(reportFile)) throw new Error("Bounded result already exists; do not repeat this pass.");
  fs.mkdirSync(review, { recursive: true });
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const changes = [...git("diff", "--name-only", baseline).split("\n"), ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean);
  const isolated = changes.every(file => file.startsWith(prefix)) && git("rev-parse", "HEAD") === baseline;
  check("01 isolated live-test page exists", html.includes("DEEPSEEK EMBED TEST") && isolated);
  check("02 iframe target is official chat.deepseek.com", (html.match(/<iframe\b/g) || []).length === 1 && html.includes(`src="${official}"`));
  check("03 external control link uses official chat.deepseek.com", html.includes(`href="${official}" target="_blank" rel="noopener noreferrer"`));
  check("04 no API integration", !/fetch\s*\(|XMLHttpRequest|WebSocket|api\.deepseek|chat\/completions|<script\s+src=/i.test(html));
  check("05 no API keys", !/api[_-]?key|Bearer\s|sk-[a-zA-Z0-9]/i.test(html));
  check("06 no backend", isolated, "Only a self-contained static HTML page is proposed for publication; existing local static server is used for QA.");
  check("07 no credential handling", !/<form|<input|<textarea|password|cookie|localStorage|sessionStorage/i.test(script + html.replace(/<p class="note">[\s\S]*?<\/p>/g, "")));
  check("08 no cross-origin manipulation", !/contentWindow|contentDocument|postMessage|frames\[|serviceWorker|\.evaluate|document\.cookie/i.test(script));
  check("09 Stage 5A unchanged", isolated);
  check("10 Stage 5B-0 fallback unchanged", isolated);
  check("11 production Tarot unchanged", isolated && git("rev-parse", "refs/heads/main") === "0dc66e6db4522276de7536ac8292af587b26e4a8");
  check("12 Stage 4A unchanged", isolated);
  check("13 Interpretation Engine unchanged", isolated);
  check("14 canonical spreads unchanged", isolated);
  check("15 Archive unchanged", isolated);
  check("16 four Kadat generators unchanged", isolated);

  process.argv[2] = "4187";
  const server = require(path.join(root, "scripts/serve.cjs"));
  if (!server.listening) await new Promise(resolve => server.once("listening", resolve));
  let browser;
  const observations = { documentResponses: [], failedRequests: [], console: [], pageErrors: [], viewports: [], externalControl: {} };
  try {
    browser = await chromium.launch({ executablePath: process.env.LIVE_TEST_CHROMIUM || "/tmp/stage5b01-browser/chromium", args: ["--disable-gpu", "--disable-dev-shm-usage"], headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    const page = await context.newPage();
    const pendingHeaders = [];
    page.on("response", response => {
      if (response.url().startsWith(official) && response.request().resourceType() === "document") pendingHeaders.push((async () => {
        const headers = await response.allHeaders();
        observations.documentResponses.push({ status: response.status(), headers: Object.fromEntries(Object.entries(headers).filter(([key]) => /^(content-security-policy|x-frame-options|server|location)$/.test(key))) });
      })());
    });
    page.on("requestfailed", request => observations.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
    page.on("console", message => { if (["error", "warning"].includes(message.type())) observations.console.push(message.text()); });
    page.on("pageerror", error => observations.pageErrors.push(error.message));
    const iframeObservation = Promise.race([
      page.waitForEvent("requestfailed", { predicate: request => request.url().startsWith(official), timeout: 15000 }).then(() => "requestfailed"),
      page.waitForEvent("response", { predicate: response => response.url().startsWith(official) && response.request().resourceType() === "document", timeout: 15000 }).then(() => "response")
    ]).catch(() => "bounded timeout");
    const local = "http://127.0.0.1:4187/" + prefix;
    await page.goto(local, { waitUntil: "domcontentloaded" });
    observations.iframeNavigation = await iframeObservation;
    await Promise.all(pendingHeaders);
    const control = page.locator("#external-control");
    const popupPromise = page.waitForEvent("popup");
    await control.click();
    const popup = await popupPromise;
    observations.externalControl.newTopLevelTab = true;
    observations.externalControl.target = await control.getAttribute("href");
    try { await popup.waitForLoadState("domcontentloaded", { timeout: 15000 }); }
    catch (error) { observations.externalControl.loadObservation = error.message.split("\n")[0]; }
    observations.externalControl.observedURL = popup.url();
    await popup.close();

    for (const width of [1366, 320, 414]) {
      await page.setViewportSize({ width, height: width === 1366 ? 1000 : 896 });
      await page.waitForFunction(expected => document.getElementById("viewport").textContent.startsWith(`${expected} ×`), width);
      const layout = await page.evaluate(() => {
        const frame = document.querySelector("iframe").getBoundingClientRect();
        const control = document.getElementById("external-control").getBoundingClientRect();
        return { viewport: innerWidth, noOverflow: document.documentElement.scrollWidth <= innerWidth,
          frameWidth: frame.width, frameFits: frame.left >= 0 && frame.right <= innerWidth,
          controlFits: control.left >= 0 && control.right <= innerWidth && control.height >= 52,
          origin: document.getElementById("origin").textContent,
          https: document.getElementById("https").textContent,
          browser: document.getElementById("browser").textContent };
      });
      observations.viewports.push(layout);
      check(`${width === 1366 ? "17 desktop" : width === 320 ? "18 mobile 320" : "19 mobile 414"} page usable`, layout.frameFits && layout.controlFits && layout.frameWidth >= Math.min(1100, width - 32) - 2 && layout.origin === "http://127.0.0.1:4187" && layout.browser.length > 10 && layout.https.startsWith("NO") && observations.pageErrors.length === 0);
    }
    check("20 no horizontal overflow", observations.viewports.every(view => view.noOverflow));
    // A normal page could not be reached externally here; do not infer iframe blocking.
    observations.deepseekResult = "INCONCLUSIVE";
    observations.classificationReason = "Local HTTP QA validates our page, not the required public HTTPS manual test. Work previously could not reach DeepSeek separately; no remote login or chat functionality is asserted.";
    observations.manualRealBrowserVerificationRequired = true;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  const result = { baseline, branch: git("branch", "--show-current"), checks, passed: checks.filter(item => item.pass).length, total: checks.length, result: checks.every(item => item.pass) ? "PASS" : "FAIL", observations };
  fs.writeFileSync(reportFile, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify({ result: result.result, passed: result.passed, total: result.total, deepseekResult: observations.deepseekResult, iframeNavigation: observations.iframeNavigation, failedRequests: observations.failedRequests, externalControl: observations.externalControl, viewports: observations.viewports, failures: checks.filter(item => !item.pass) }, null, 2));
  if (result.result !== "PASS") process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
