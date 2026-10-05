/* One bounded navigation/UI pass. No earlier Stage validation suite is invoked. */
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { chromium } = require("playwright");

const repo = path.resolve(__dirname, "../..");
const baseline = "e7c9835bc585fe10bb027090aeba4ddb68ad138c";
const review = path.join(__dirname, "review-stage5b3");
const screenshots = path.join(review, "screenshots");
fs.mkdirSync(screenshots, { recursive: true });
const report = {
  stage: "5B-3", branch: "experiment/imperial-tarot-astro-entry", baseline,
  bounded_passes: 1, targeted_rechecks: [], checks: [], screenshots: [],
  browser_errors: [], external_requests: [], interpretation_calls: 0,
};
const save = () => fs.writeFileSync(path.join(review, "validation.json"), JSON.stringify(report, null, 2) + "\n");
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const unchanged = (...paths) => git("diff", "--name-only", baseline, "--", ...paths) === "";
const original = file => execFileSync("git", ["show", baseline + ":" + file], {cwd:repo,encoding:"utf8"});
function check(id, name, condition, evidence) {
  const row = {id, name, result:condition ? "PASS" : "FAIL"};
  if (evidence !== undefined) row.evidence = evidence;
  report.checks.push(row); save(); console.log(JSON.stringify(row));
}
function requireThat(condition, message) { if (!condition) throw new Error(message); }

let browser, server, currentAction;
(async () => {
  process.argv[2] = "0";
  server = require(path.join(repo, "scripts/serve.cjs"));
  await new Promise(resolve => server.listening ? resolve() : server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const tarot = base + "/tarot-prototype/";
  const forms = tarot + "astro-horoscope/";
  const convergence = tarot + "experiment-convergence/";
  browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH, args:["--disable-gpu","--disable-dev-shm-usage"]});
  const context = await browser.newContext({viewport:{width:1366,height:900},reducedMotion:"reduce"});
  await context.grantPermissions(["clipboard-read","clipboard-write"], {origin:base});
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", e => {report.browser_errors.push({type:"pageerror",message:e.message,url:page.url()});save();});
  page.on("console", m => {if(m.type()==="error"){report.browser_errors.push({type:"console",message:m.text(),url:page.url()});save();}});
  page.on("requestfailed", r => {report.browser_errors.push({type:"resource",url:r.url(),message:r.failure()?.errorText});save();});
  page.on("request", r => {if(!r.url().startsWith(base+"/")){report.external_requests.push(r.url());save();}});
  await page.addInitScript(() => {
    window.addEventListener("load", () => {
      const engine = window.ImperialTarotInterpretation;
      if (engine) window.__stage5b3InterpretationLoaded = true;
    });
  });
  const shot = async name => {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({path:path.join(screenshots,name),fullPage:true,animations:"disabled"});
    report.screenshots.push("screenshots/"+name); save();
  };
  const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth>innerWidth);
  const visibleWithinViewport = async locator => {
    await locator.scrollIntoViewIfNeeded();
    const box=await locator.boundingBox(), size=page.viewportSize();
    return box && box.x>=0 && box.x+box.width<=size.width && box.y>=0 && box.y+box.height<=size.height;
  };
  const isForms = async () => page.url()===forms && await page.locator(".astro-form[data-astro-form='convergence']").count()===1;
  const mainView = () => page.evaluate(() => document.body.dataset.s2View);
  let noOverflow = true;

  currentAction="Tarot landing and spread selection";
  const response=await page.goto(tarot,{waitUntil:"networkidle"});
  check(1,"Imperial Tarot loads",response.status()===200 && await page.locator('[data-s2="choose"]').isVisible());
  await page.locator('[data-s2="choose"]').click();
  check(2,"Main spread selection loads",await mainView()==="spreads");
  const choices=await page.locator(".stage2-spread-option").evaluateAll(nodes=>nodes.map(e=>e.dataset.spread));
  check(3,"Five existing top-level choices remain",JSON.stringify(choices)===JSON.stringify(["imperator","branch","throne_of_terra","haloed_rosette","astro_horoscope"]),choices);
  check(4,"No sixth Convergence entry in main list",choices.length===5 && !choices.includes("convergence") && await page.locator('.stage2-spread-option[data-spread="convergence"]').count()===0);
  await shot("01-main-spread-selection.png");
  noOverflow = noOverflow && !(await overflow());
  for(const [id,spread,name,count] of [[5,"imperator","Imperator",3],[6,"branch","Branch",6],[7,"throne_of_terra","Throne of Terra",7],[8,"haloed_rosette","Haloed Rosette",10]]) {
    currentAction=name+" unchanged preparation entry";
    await page.locator('.stage2-spread-option[data-spread="'+spread+'"]').click();
    const record=await page.locator(".stage2-chosen").innerText();
    check(id,name+" still opens",await mainView()==="question" && record.includes(count+" карт") && await page.locator("#ritual-question").isVisible(),record.replace(/\n/g," · "));
    await page.locator('[data-s2="choose"]').click();
  }

  currentAction="Astro-Horoscope production entry";
  await page.locator('.stage2-spread-option[data-spread="astro_horoscope"]').click();
  await page.waitForURL(forms);
  check(9,"Astro opens new form-selection screen",await isForms() && await page.getByRole("heading",{name:"Астро-гороскоп",exact:true}).isVisible());
  check(10,"Form selection displays Convergence",await page.getByRole("heading",{name:"Схождение",exact:true}).isVisible());
  check(11,"Convergence says 16 cards",await page.locator(".astro-card-count").innerText()==="16 КАРТ");
  const formText=await page.locator(".astro-form-copy").innerText();
  check(12,"Five paths of three represented",formText.includes("Пять путей по три карты") && await page.locator(".astro-path-dots circle").count()===15);
  check(13,"XVI is a separate final sign",formText.includes("XVI") && formText.includes("открывается отдельно, после первых пятнадцати карт"));
  check(14,"No fixed path themes invented",formText.includes("У путей нет заранее назначенных тем") && !/дипломатическ|военный путь|политический путь|духовный путь/i.test(formText));
  check(15,"No fixed intra-path roles invented",formText.includes("фиксированных ролей") && !/прошлое|настоящее|будущее|препятствие|совет|решение/i.test(formText));
  check(16,"No future forms invented",await page.locator("[data-astro-form]").count()===1 && await page.locator(".astro-enter").count()===1 && !/спираль|spiral|aquila|заглушк|скоро|недоступн/i.test(await page.locator("#main").innerText()));
  noOverflow = noOverflow && !(await overflow());
  check(29,"Desktop 1366 selection usable",page.viewportSize().width===1366 && !await overflow() && await visibleWithinViewport(page.locator(".astro-enter")) && await page.locator(".astro-back").count()===1);
  await page.evaluate(()=>scrollTo(0,0));
  await shot("02-astro-form-desktop-1366.png");

  for (const [width,id,file] of [[320,30,"03-astro-form-mobile-320.png"],[414,31,"04-astro-form-mobile-414.png"]]) {
    currentAction="Astro navigation at "+width;
    await page.setViewportSize({width,height:896});
    await page.locator(".astro-back").click();
    await page.waitForURL(tarot+"index.html");
    const backLoadsSelection=await mainView()==="spreads";
    const astroChoice=page.locator('.stage2-spread-option[data-spread="astro_horoscope"]');
    const choiceUsable=await visibleWithinViewport(astroChoice);
    noOverflow=noOverflow && !await overflow();
    await astroChoice.click();
    await page.waitForURL(forms);
    const usable=backLoadsSelection && choiceUsable && await isForms() && !await overflow() && await visibleWithinViewport(page.locator(".astro-enter")) && await page.locator(".astro-back").count()===1;
    check(id,"Mobile "+width+" selection and entry usable",usable,{width,formBodyFont:await page.locator(".astro-form-copy").evaluate(e=>getComputedStyle(e).fontSize)});
    noOverflow=noOverflow && !await overflow();
    await page.evaluate(()=>scrollTo(0,0));
    await shot(file);
  }

  currentAction="Enter authoritative Convergence";
  await page.locator(".astro-enter").click();
  await page.waitForURL(convergence);
  const imports=await page.locator("script[src]").evaluateAll(nodes=>nodes.map(e=>e.getAttribute("src")));
  check(17,"Selection opens existing Convergence",page.url()===convergence && await page.locator("#cv-start").isVisible() && imports.includes("convergence.js") && imports.includes("../experiment-reader-ui/reader.js"));
  const question="Как сохранить единство отряда, не приняв опасного соглашения?";
  await page.locator("#cv-question").fill(question);
  await page.locator("#cv-start").click();
  const session=()=>page.evaluate(()=>window.ImperialTarotConvergenceUI.getSession());
  const reader=page.getByRole("button",{name:"Запросить толкование",exact:true});
  const locked=async()=>!await reader.count() || !await reader.isEnabled();
  check(18,"Question handling works",(await session()).question===question);
  noOverflow=noOverflow && !await overflow();
  await page.evaluate(()=>scrollTo(0,0));
  await shot("05-convergence-from-navigation.png");
  let inOrder=true, readerLocked=await locked();
  currentAction="One sequential Convergence reading";
  for(let n=1;n<=15;n++) {
    await page.locator('[data-cv="reveal-path"]').click();
    const state=await session();
    inOrder=inOrder && state.progress.opened_count===n;
    readerLocked=readerLocked && await locked();
    if(n<15) await page.locator('[data-cv="next"]').click();
  }
  check(19,"Cards 01–15 reveal in order",inOrder && (await session()).progress.opened_count===15);
  check(20,"XVI requires separate explicit reveal",await page.evaluate(()=>document.body.dataset.cvPhase)==="awaiting_convergence" && await page.locator('[data-cv="reveal-convergence"]').isVisible());
  check(21,"Reader locked before XVI",readerLocked && await locked() && await page.locator("#cv-copy-dossier").count()===0);
  await page.locator('[data-cv="reveal-convergence"]').click();
  await reader.waitFor({state:"visible"});
  check(22,"Reader available after XVI",await reader.isEnabled() && (await session()).progress.finished && (await session()).progress.opened_count===16);
  noOverflow=noOverflow && !await overflow();
  await page.setViewportSize({width:1366,height:900});
  await page.evaluate(()=>scrollTo(0,0));
  await shot("06-completed-convergence-reader-available.png");
  await reader.click();
  await page.locator("#cv-external-reader[open]").waitFor({state:"visible"});
  currentAction="Existing Reader clipboard and preview";
  await page.locator("#cv-copy-dossier").click();
  await page.locator("#cv-copy-status").filter({hasText:"ДОСЬЕ ЧТЕЦА СКОПИРОВАНО"}).waitFor({state:"visible"});
  const prompt=await page.locator(".cv-dossier-text").textContent();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  check(23,"Copy Prompt works",prompt.length>1000 && copied===prompt,{characters:prompt.length});
  await page.getByText("Просмотреть промт",{exact:true}).click();
  check(24,"Prompt Preview works",await page.locator(".cv-dossier-text").isVisible() && await page.locator(".cv-dossier-text").textContent()===copied);
  for(const [id,name,url] of [[25,"DeepSeek","https://chat.deepseek.com/"],[26,"ChatGPT","https://chatgpt.com/"]]) {
    const link=page.getByRole("link",{name:"Открыть "+name+" ↗",exact:true});
    check(id,name+" navigation present",await link.isVisible() && await link.getAttribute("href")===url && await link.getAttribute("target")==="_blank");
  }
  noOverflow=noOverflow && !await overflow();
  await page.getByRole("button",{name:"Закрыть Чтеца и вернуться к раскладу",exact:true}).click();
  const completed=JSON.stringify(await session());
  currentAction="Hierarchy back navigation";
  await page.getByRole("link",{name:"← АСТРО-ГОРОСКОП",exact:true}).click();
  await page.waitForURL(forms);
  check(27,"Back Convergence → Astro selection",await isForms());
  await page.locator(".astro-back").click();
  await page.waitForURL(tarot+"index.html");
  check(28,"Back Astro selection → main spreads",await mainView()==="spreads" && await page.locator(".stage2-spread-option").count()===5);
  await page.locator('.stage2-spread-option[data-spread="astro_horoscope"]').click();
  await page.waitForURL(forms);
  await page.locator(".astro-enter").click();
  await page.waitForURL(convergence);
  requireThat(JSON.stringify(await session())===completed,"Back navigation changed completed Convergence");
  noOverflow=noOverflow && !await overflow();
  check(32,"No horizontal overflow",noOverflow);

  currentAction="Frozen upstream scope check";
  check(33,"Stage 4A unchanged",unchanged("tarot-prototype/interpretation-stage4a","tarot-prototype/interpretation-stage4b1/data-v1.0.0.js","tarot-prototype/data"));
  check(34,"Interpretation Engine unchanged",unchanged("tarot-prototype/interpretation-stage4b1","tarot-prototype/interpretation-ui.js"));
  check(35,"Reader Prompt Generator unchanged",unchanged("tarot-prototype/experiment-reader-prompt") && unchanged("tarot-prototype/experiment-reader-ui"));
  check(36,"Artwork mappings unchanged",unchanged("tarot-prototype/assets","tarot-prototype/production-data.js"));
  const stage2=fs.readFileSync(path.join(repo,"tarot-prototype/stage2.js"),"utf8"), before=original("tarot-prototype/stage2.js");
  const sameBetween=(start,end)=>stage2.slice(stage2.indexOf(start),stage2.indexOf(end))===before.slice(before.indexOf(start),before.indexOf(end));
  check(37,"Canonical fixed spreads mechanics unchanged",unchanged("tarot-prototype/ritual-session.js","tarot-prototype/data/content.js","tarot-prototype/experiment-convergence/session.js","tarot-prototype/experiment-convergence/convergence.js","tarot-prototype/experiment-convergence/convergence.css") && sameBetween("  function askQuestion()","  function showInfo(which)") && sameBetween("  function reset(target", "  function handle(event)") && sameBetween('      case "select":','      case "archive":'));
  check(38,"Archive unchanged",sameBetween("  function showInfo(which)","  function openMap()") && original("tarot-prototype/index.html").replace("stage2.js?v=stage4b2","stage2.js?v=stage5b3")===fs.readFileSync(path.join(repo,"tarot-prototype/index.html"),"utf8"));
  check(39,"Four Kadat generators unchanged",unchanged("index.html","src","styles","data","scripts","tests","package.json","package-lock.json"));
  const changed=git("diff","--name-only",baseline).split("\n").filter(Boolean);
  const untracked=git("ls-files","--others","--exclude-standard").split("\n").filter(Boolean);
  const allowed=file=>["tarot-prototype/stage2.js","tarot-prototype/index.html","tarot-prototype/experiment-convergence/index.html"].includes(file) || file.startsWith("tarot-prototype/astro-horoscope/");
  check(40,"Unrelated files absent",[...changed,...untracked].every(allowed) && !changed.some(file=>file.endsWith("adeptio_07.jpg")),{changed,untracked});
  requireThat(report.browser_errors.length===0,"Browser errors: "+JSON.stringify(report.browser_errors));
  requireThat(report.external_requests.length===0,"Unexpected external requests");
  report.checks.sort((a,b)=>a.id-b.id);
  report.passed=report.checks.filter(c=>c.result==="PASS").length;
  report.status=report.passed===40 && report.checks.length===40 ? "PASS" : "FAIL";
  save(); console.log(JSON.stringify({status:report.status,passed:report.passed,total:report.checks.length,screenshots:report.screenshots.length,browser_errors:report.browser_errors.length,external_requests:report.external_requests.length}));
  if(report.status!=="PASS")process.exitCode=1;
})().catch(error=>{
  report.status="FAIL";report.failure={action:currentAction,message:error.message};save();console.error(JSON.stringify(report.failure));process.exitCode=1;
}).finally(async()=>{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));});
