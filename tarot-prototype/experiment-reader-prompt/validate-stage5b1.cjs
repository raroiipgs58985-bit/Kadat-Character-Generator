// One bounded prompt-only pass. The final clean-checkpoint check is continued separately.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "../..");
const prefix = "tarot-prototype/experiment-reader-prompt/";
const baseline = "865423f7f4c3bbc6710c28408d91f71582a01539";
const approvedMain = "31d7755b68768a7bc1461afa63592fb945e6c743";
const review = path.join(__dirname, "review-stage5b1");
const reportFile = path.join(review, "validation.json");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();

if (process.argv.includes("--finish-checkpoint")) {
  // Check 40 only. No fixture, prompt generator, interpretation, or network is run again.
  const previous = JSON.parse(fs.readFileSync(reportFile, "utf8"));
  if (previous.checks.length !== 39 || previous.passed !== 39) throw new Error("Checks 1–39 must already pass");
  const clean = git("status", "--porcelain") === "";
  const correctBranch = git("branch", "--show-current") === "experiment/imperial-tarot-reader-prompt";
  const preservedMain = git("rev-parse", "refs/heads/main") === approvedMain;
  const upstreamMatches = git("rev-parse", "HEAD") === git("rev-parse", "@{upstream}");
  const scoped = git("diff", "--name-only", baseline, "HEAD").split("\n").filter(Boolean).every(file => file.startsWith(prefix));
  execFileSync("git", ["merge-base", "--is-ancestor", approvedMain, "HEAD"], { cwd: root });
  const passed = clean && correctBranch && preservedMain && upstreamMatches && scoped;
  console.log(JSON.stringify({ result: passed ? "PASS" : "FAIL", passed: passed ? 40 : 39, total: 40,
    checkpoint: git("rev-parse", "HEAD"), check40: { name: "working tree clean after checkpoint", passed, clean, correctBranch, preservedMain, upstreamMatches, scoped },
    repeatedChecks: 0, promptsRegenerated: 0, externalCalls: 0 }, null, 2));
  if (!passed) process.exitCode = 1;
  return;
}

if (fs.existsSync(reportFile)) throw new Error("Bounded pass already recorded; do not repeat it");
const production = require("../production-data.js");
const convergence = require("../experiment-convergence/session.js");
const data = require("../interpretation-stage4b1/data-v1.0.0.js");
const { specs, completedSession } = require("./fixtures.cjs");
const generator = require("./reader-prompt.js");
const cards = new Map(data.card_semantics.cards.map(card => [card.card_id, card]));
const fragmentMap = new Map(data.interpretation_fragments.fragments.map(fragment => [fragment.fragment_id, fragment]));
const checks = [];
function check(number, name, run) {
  try {
    if (!run()) throw new Error("Assertion failed");
    checks.push({ number, name, passed: true });
  } catch (error) { checks.push({ number, name, passed: false, error: error.message }); }
}
const clone = value => JSON.parse(JSON.stringify(value));
const rejects = (run, code) => { try { run(); return false; } catch (error) { return error.code === code; } };
const sourceSnapshot = JSON.stringify(data);
const runtimeCalls = { network: 0, random: 0 };
const originalFetch = globalThis.fetch, originalRandom = Math.random;
globalThis.fetch = () => { runtimeCalls.network++; throw new Error("Network forbidden in prompt generation"); };
Math.random = () => { runtimeCalls.random++; throw new Error("Randomness forbidden in prompt generation"); };
let records;
try {
  records = specs.map(spec => {
    const session = completedSession(spec);
    const input = convergence.toReaderInput(session);
    const prompt = generator.fromCompletedSession(session);
    return { spec, session, input, prompt, sha256: crypto.createHash("sha256").update(prompt).digest("hex") };
  });
  const all = test => records.every(test);
  const referenceList = record => [...Object.values(record.input.paths).flat(), record.input.convergence];
  const idsInPrompt = record => [...record.prompt.matchAll(/^ID: (.+)$/gm)].map(match => match[1]);
  const cardBodies = record => [...record.prompt.matchAll(/^ID: ([^\n]+)\n([\s\S]*?)(?=^ID: |^\+\+\+ READER PROTOCOL|$(?![\s\S]))/gm)].map(match => ({ id: match[1], text: match[2] }));
  const meaningLine = reference => {
    const card = cards.get(reference.card_id);
    const meaning = reference.orientation === "reversed" ? card.reversed_meaning : card.upright_meaning;
    return `SEMANTICS (Stage 4A): ${meaning.keywords_ru.join("; ")}.`;
  };
  const first = records[0].input;
  check(1, "exactly 16 cards accepted; other counts and unfinished sessions rejected", () => {
    const short = clone(first); short.paths.path_5.pop();
    const long = clone(first); long.paths.path_5.push(clone(long.convergence));
    const incomplete = clone(records[0].session); incomplete.progress.opened_count = 15; incomplete.progress.finished = false;
    return all(record => idsInPrompt(record).length === 16) && rejects(() => generator.fromReaderInput(short), "COUNT") && rejects(() => generator.fromReaderInput(long), "COUNT") && rejects(() => generator.fromCompletedSession(incomplete), "UNFINISHED");
  });
  check(2, "exactly five triples and a separate XVI", () => {
    const extra = clone(first); extra.paths.path_6 = extra.paths.path_1;
    return all(record => Object.keys(record.input.paths).length === 5 && Object.values(record.input.paths).every(value => value.length === 3) && record.input.convergence.position === 16) && rejects(() => generator.fromReaderInput(extra), "PATHS");
  });
  check(3, "ordered card references and positions preserved", () => {
    const swapped = clone(first); [swapped.paths.path_1[0], swapped.paths.path_1[1]] = [swapped.paths.path_1[1], swapped.paths.path_1[0]];
    return all(record => JSON.stringify(idsInPrompt(record)) === JSON.stringify(referenceList(record).map(reference => reference.card_id))) && rejects(() => generator.fromReaderInput(swapped), "ORDER");
  });
  check(4, "question preserved verbatim, including spaces and newline", () => all(record => record.prompt.includes(`QUESTION (verbatim; context only):\n${record.spec.question}\n\nSTRUCTURAL RULES:`) && record.input.question === record.spec.question));
  check(5, "only drawn identities/states and used suit context included", () => all(record => {
    const actualIds = idsInPrompt(record);
    const expectedIds = referenceList(record).map(reference => reference.card_id);
    return actualIds.length === 16 && actualIds.every(id => expectedIds.includes(id)) &&
      referenceList(record).every(reference => record.prompt.includes(meaningLine(reference))) &&
      data.suit_semantics.suits.every(suit => referenceList(record).some(reference => cards.get(reference.card_id).suit_id === suit.suit_id) || !record.prompt.includes(`${suit.name_high_gothic} / ${suit.name_ru}:`)) &&
      !/artwork_id|identity_id|assets\/|\.webp|fragment_id|interpretation_tags/.test(record.prompt);
  }));
  check(6, "production IDs valid and unknown/repeated identity rejected", () => {
    const unknown = clone(first); unknown.paths.path_1[0].card_id = "not-a-card";
    const duplicate = clone(first); duplicate.paths.path_1[1].card_id = duplicate.paths.path_1[0].card_id;
    return all(record => referenceList(record).every(reference => !!production.getCard(reference.card_id))) && rejects(() => generator.fromReaderInput(unknown), "CARD") && rejects(() => generator.fromReaderInput(duplicate), "DUPLICATE");
  });
  check(7, "semantics and selected core framing resolve from frozen 1.0.0", () => all(record => referenceList(record).every(reference => {
    const state = reference.orientation || "standard";
    const meaning = state === "reversed" ? cards.get(reference.card_id).reversed_meaning : cards.get(reference.card_id).upright_meaning;
    const core = data.interpretation_fragments.state_fragment_ids[meaning.state_id].map(id => fragmentMap.get(id)).find(fragment => fragment.category === "core");
    return meaning.state_id === `${reference.card_id}.${state}` && record.prompt.includes(core.text_ru);
  })) && data.dataVersion === "1.0.0" && JSON.stringify(data) === sourceSnapshot);
  check(8, "Major Upright source semantics used", () => records.some(record => referenceList(record).some(reference => reference.type === "major" && reference.orientation === "upright")) && all(record => referenceList(record).filter(reference => reference.orientation === "upright").every(reference => record.prompt.includes(meaningLine(reference)))));
  check(9, "Major Reversed uses its own authored state", () => records[2].input.paths.path_2[2].orientation === "reversed" && all(record => referenceList(record).filter(reference => reference.orientation === "reversed").every(reference => record.prompt.includes(meaningLine(reference)))));
  check(10, "no mechanical inversion or leaked upright core in Reversed blocks", () => all(record => cardBodies(record).every(body => {
    const ref = referenceList(record).find(reference => reference.card_id === body.id);
    if (ref?.orientation !== "reversed") return true;
    const card = cards.get(body.id);
    return body.text.includes(meaningLine(ref)) && !body.text.includes(`SEMANTICS (Stage 4A): ${card.upright_meaning.keywords_ru.join("; ")}.`);
  })) && records[2].prompt.includes(cards.get("major_15").contextual_note.text_ru));
  check(11, "Minor reverse rejected; Rogue Trader variations remain unenumerated", () => {
    const reversedMinor = clone(records[1].input); reversedMinor.paths.path_1[0].orientation = "reversed";
    return rejects(() => generator.fromReaderInput(reversedMinor), "STATE") && all(record => referenceList(record).filter(reference => reference.type === "minor").every(reference => !Object.hasOwn(reference, "orientation") && record.prompt.includes(meaningLine(reference)))) && records[1].prompt.includes("VARIATION LIMIT: источник упоминает вариации, но Stage 4A не перечисляет их; не изобретать.");
  });
  check(12, "no fixed themes assigned to Path I–V", () => all(record => record.prompt.includes("У Путей I–V нет заранее назначенных тем.") && !/^PATH [IV]+: (дипломатия|насилие|знание|жертва|власть|скрытность)/im.test(record.prompt)));
  check(13, "no fixed intra-path roles assigned", () => {
    const role = clone(first); role.paths.path_1[0].role = "obstacle";
    return rejects(() => generator.fromReaderInput(role), "REFERENCE") && all(record => record.prompt.includes("у его трёх позиций нет заранее назначенных семантических ролей") && !/^ROLE:/m.test(record.prompt));
  });
  check(14, "XVI explicitly marked shared Convergence", () => all(record => record.prompt.includes("+++ XVI // CONVERGENCE +++\n[16] ОБЩАЯ КАРТА СХОЖДЕНИЯ") && record.prompt.includes(`ID: ${record.input.convergence.card_id}`)));
  check(15, "XVI not defined as guaranteed outcome", () => all(record => record.prompt.includes("Это не автоматически гарантированный исход, успех, провал, финальное событие, шестой путь или универсальное решение.")));
  check(16, "Reader protocol reads five paths and comparison before XVI", () => all(record => {
    const protocol = record.prompt.split("+++ READER PROTOCOL +++")[1];
    const steps = Array.from({ length: 9 }, (_, i) => protocol.indexOf(`STEP ${i + 1} —`));
    return steps.every((offset, i) => offset >= 0 && (!i || offset > steps[i - 1])) && protocol.indexOf("STEP 8 — CONVERGENCE XVI") > protocol.indexOf("STEP 7 — RELATIONSHIPS");
  }));
  check(17, "cross-path comparison requested without forced categories", () => all(record => record.prompt.includes("сопоставь все пять путей") && record.prompt.includes("Не заставляй существовать каждую категорию")));
  check(18, "best path not forced", () => all(record => record.prompt.includes("Не выбирай «лучший путь» только потому, что путей пять") && record.prompt.includes("отсутствие явно доминирующего пути")));
  check(19, "uncertainty and unsupported date permitted", () => all(record => record.prompt.includes("Разрешено признать неоднозначность") && record.prompt.includes("Если расклад не устанавливает конкретный срок или дату, прямо скажи об этом")));
  check(20, "invented factual events and guaranteed future prohibited", () => all(record => record.prompt.includes("Не выдумывай факты, события, должности, мотивы, даты или условия") && record.prompt.includes("Не выдавай символический вывод за фактическое знание") && record.prompt.includes("Не представляй неопределённое будущее гарантированным фактом")));
  check(21, "unified Russian literary Imperial prophecy requested", () => all(record => record.prompt.includes("+++ ПРОРОЧЕСТВО +++") && record.prompt.includes("одно связное литературное толкование полного расклада") && record.prompt.includes("Warhammer 40,000")));
  check(22, "secondary paths, convergence and meaningful relations requested without private reasoning", () => all(record => ["+++ ИЗУЧИТЬ ПУТИ +++", "+++ СХОЖДЕНИЕ +++", "+++ СВЯЗИ МЕЖДУ ПУТЯМИ +++", "Выполни анализ внутренне.", "Не раскрывай private chain-of-thought"].every(text => record.prompt.includes(text))));
  check(23, "generated path titles explicitly non-canonical Reader output", () => all(record => record.prompt.includes("Выведенные названия путей — только результат этого ответа, не канонические и не сохранённые значения")));
  check(24, "prompt byte determinism; CLI equals copied artifact; session metadata ignored", () => all(record => {
    const changedNoise = { ...record.input, session_id: "different-metadata" };
    const sameSession = generator.fromCompletedSession(record.session);
    return sameSession === record.prompt && generator.fromReaderInput(changedNoise) === record.prompt && generator.fromReaderInput(record.input) === record.prompt;
  }));
  const generatorSource = fs.readFileSync(path.join(__dirname, "reader-prompt.js"), "utf8");
  check(25, "no timestamps, random selection or session noise in prompt", () => runtimeCalls.random === 0 && !/Date\(|Date\.now|Math\.random|randomUUID|session_id/.test(generatorSource) && all(record => !record.prompt.includes(record.session.session_id)));
  check(26, "no AI or interpretation calls", () => !/engine\.js|\.interpret\(|openai|ollama|transformers/i.test(generatorSource) && !Object.keys(require.cache).some(file => file.endsWith("interpretation-stage4b1/engine.js")));
  check(27, "no DeepSeek calls", () => runtimeCalls.network === 0 && !/chat\.deepseek|api\.deepseek|deepseek\.com/.test(generatorSource));
  check(28, "no API or cross-origin dependency", () => runtimeCalls.network === 0 && !/fetch\s*\(|XMLHttpRequest|WebSocket|postMessage|contentWindow/.test(generatorSource));
  check(29, "no API keys", () => !/api[_-]?key|Bearer\s|sk-[a-zA-Z0-9]/i.test(generatorSource));
  check(30, "no backend", () => !/node:http|node:https|express|createServer|listen\(/.test(generatorSource + fs.readFileSync(path.join(__dirname, "generate.cjs"), "utf8")));
  const changedFiles = [git("diff", "--name-only", baseline), git("ls-files", "--others", "--exclude-standard")].flatMap(value => value.split("\n")).filter(Boolean);
  const isolated = changedFiles.every(file => file.startsWith(prefix));
  check(31, "Stage 4A unchanged; original frozen JSON/bundle authority retained", () => isolated && JSON.stringify(data.card_semantics) === JSON.stringify(require("../interpretation-stage4b1/frozen-data/data/card_semantics.json")) && JSON.stringify(data.suit_semantics) === JSON.stringify(require("../interpretation-stage4b1/frozen-data/data/suit_semantics.json")) && JSON.stringify(data.interpretation_fragments) === JSON.stringify(require("../interpretation-stage4b1/frozen-data/data/interpretation_fragments.json")));
  check(32, "Interpretation Engine unchanged", () => isolated);
  check(33, "Stage 5A behavior and files unchanged; adapter result preserved", () => isolated && all(record => JSON.stringify(convergence.toReaderInput(record.session)) === JSON.stringify(record.input)));
  check(34, "production Tarot unchanged", () => isolated);
  check(35, "four canonical spreads unchanged", () => isolated);
  check(36, "Archive unchanged", () => isolated);
  check(37, "four Kadat generators unchanged", () => isolated);
  check(38, "artwork mappings unchanged; artwork metadata excluded from prompts", () => isolated && all(record => !/artwork_id|identity_id|assets\//.test(record.prompt)));
  check(39, "no publication/main change; approved live-test retained exactly", () => isolated && git("rev-parse", "refs/heads/main") === approvedMain && git("rev-parse", ":tarot-prototype/experiment-deepseek-embed/live-test/index.html") === "234076091a7a834af9e24bc54462973fef0ff886");
} finally {
  globalThis.fetch = originalFetch;
  Math.random = originalRandom;
}

const passed = checks.filter(check => check.passed).length;
if (passed !== 39) {
  console.log(JSON.stringify({ result: "FAIL", passed, total: 39, failures: checks.filter(check => !check.passed) }, null, 2));
  process.exitCode = 1;
  return;
}
fs.mkdirSync(path.join(review, "prompts"), { recursive: true });
fs.mkdirSync(path.join(review, "inputs"), { recursive: true });
for (const record of records) {
  const promptFile = path.join(review, "prompts", `${record.spec.id}.txt`);
  const inputFile = path.join(review, "inputs", `${record.spec.id}.json`);
  if (fs.existsSync(promptFile) || fs.existsSync(inputFile)) throw new Error("Existing fixture output must not be overwritten");
  fs.writeFileSync(promptFile, record.prompt);
  fs.writeFileSync(inputFile, JSON.stringify(record.input, null, 2) + "\n");
  // Exercise the real CLI against the stored reader contract, without another fixture run.
  const cliOutput = execFileSync(process.execPath, [path.join(__dirname, "generate.cjs"), inputFile], { encoding: "utf8" });
  if (cliOutput !== record.prompt) throw new Error("CLI output differs from copied artifact");
}
const selected = [records[0], records[2]];
fs.writeFileSync(path.join(review, "two-complete-prompts.md"), "# Two complete copy/paste prompts\n\nThese are assembled dossiers, not AI interpretations. Copy only the text inside one block.\n\n" + selected.map(record => `## ${record.spec.id}\n\n\`\`\`text\n${record.prompt}\`\`\`\n`).join("\n"));
const summary = ["# Stage 5B-1 — Convergence Reader prompt review", "", "Branch: `experiment/imperial-tarot-reader-prompt`", "", `Functional baseline: \`${baseline}\` (includes accepted Stage 5A). Approved main \`${approvedMain}\` is also preserved as a commit parent.`, "", "Stage 4A source: `1.0.0 / FROZEN`, existing `interpretation-stage4b1/data-v1.0.0.js` and its original JSON authority. No new semantic dataset.", "", "Six representative completed sessions. These are fixed valid fixtures restored by the unchanged Stage 5A adapter; no production draw or meaning was changed. Fixture labels describe review coverage, not stored path themes.", "", "[Two full prompts, ready to copy](two-complete-prompts.md). All six standalone TXT files below are complete prompts; no application is needed to paste one manually into an external chat.", "", "One bounded prompt validation pass: checks 1–39 PASS. Check 40 is the clean/synced checkpoint verification performed at delivery with `--finish-checkpoint`; it does not rerun fixtures or prompts. The final 40/40 result is reported with the delivered checkpoint.", "", "No AI/API calls, keys or backend. No external interpretation has been generated or evaluated. Model compliance with these instructions will require the user's later manual review."];
for (const record of records) {
  summary.push("", `## ${record.spec.id} — ${record.spec.label}`, "", "Question, verbatim:", "", "```text", record.spec.question, "```", "", `Prompt: [${record.spec.id}.txt](prompts/${record.spec.id}.txt) · [Stage 5A input](inputs/${record.spec.id}.json)`, "", `UTF-8 bytes: ${Buffer.byteLength(record.prompt)} · SHA-256: \`${record.sha256}\``, "", "| Group | Ordered cards / actual state |", "| --- | --- |");
  const describe = reference => {
    const card = production.getCard(reference.card_id);
    return `${String(reference.position).padStart(2, "0")} ${card.name_ru} (\`${card.card_id}\`, ${reference.orientation || "standard"})`;
  };
  Object.entries(record.input.paths).forEach(([key, references], i) => summary.push(`| Путь ${["I", "II", "III", "IV", "V"][i]} | ${references.map(describe).join(" → ")} |`));
  summary.push(`| XVI — Схождение | ${describe(record.input.convergence)} |`);
}
summary.push("", "## Boundaries retained", "", "Major Reversed uses its own frozen state and core framing; upright-only core meanings are not reused. Contextual notes and existing source limitations are retained without correction, including the Demon and unenumerated Rogue Trader variations. Only used suits appear as supplementary context; Discordia tendencies do not create Minor reverse states.", "", "The question is included byte-for-byte and is not classified or interpreted locally. Five paths and their card order are preserved. No themes or roles are assigned. The Reader protocol reads all paths, compares them, then interprets XVI, then synthesizes. Titles requested from the Reader are explicitly non-canonical output.", "", "Generated outputs contain no artwork paths/IDs, CSS, UI metadata, session IDs, dates, random prose, fragment IDs or full undrawn-card data. The model is asked for final prophecy and concise explanations, never private chain-of-thought.", "", "Main/live-test, Stage 5A, Stage 5B fallback, frozen Stage 4A, engine, canonical Tarot, Archive, artwork mappings and the four generators are untouched. Publication: NONE. Stage 5B-2: NOT STARTED.", "");
fs.writeFileSync(path.join(review, "stage5b1_prompt_review.md"), summary.join("\n"));
const report = { baseline, approvedMain, branch: git("branch", "--show-current"), sourceVersion: "1.0.0", passed, totalBeforeCheckpoint: 39, targetTotal: 40,
  checks, check40: { status: "DEFERRED_UNTIL_CHECKPOINT", command: "node validate-stage5b1.cjs --finish-checkpoint", writesFiles: false, rerunsFixtures: false },
  fixtureCount: records.length, externalCalls: runtimeCalls.network,
  prompts: records.map(record => ({ fixture: record.spec.id, bytes: Buffer.byteLength(record.prompt), sha256: record.sha256, file: `prompts/${record.spec.id}.txt` })) };
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ result: "PASS", passed, totalBeforeCheckpoint: 39, check40: "final clean-checkpoint check deferred", fixtureCount: records.length, externalCalls: runtimeCalls.network, prompts: report.prompts }, null, 2));
