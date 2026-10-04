"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const review = path.join(root, "review");
const recordPath = path.join(review, "generation_record.json");
const repair = process.argv[2] === "--repair" ? new Set(process.argv.slice(3)) : null;
const previous = fs.existsSync(recordPath) ? JSON.parse(fs.readFileSync(recordPath, "utf8")) : null;
if (previous && !repair) throw new Error("Samples already exist. Do not repeat the completed fixture generation pass.");
if (repair && (!previous || !repair.size || fs.existsSync(path.join(review, "validation_report.json"))))
  throw new Error("Targeted repairs require generated samples and must precede final validation.");
const fixtures = require("./fixtures.cjs");
const data = require("../data-v1.0.0.js");
const engine = require("../engine.js").createEngine(data);
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const sourceSha256 = Object.fromEntries(["engine.js", "session-adapter.js", "data-v1.0.0.js", "tests/fixtures.cjs"].map((file) => [file, sha(path.join(root, file))]));
if (repair && [...repair].some((id) => !fixtures.some((f) => f.id === id))) throw new Error("Unknown repair fixture ID");
const cached = previous ? JSON.parse(fs.readFileSync(path.join(review, "fixture_outputs.json"), "utf8")) : [];
const outputs = fixtures.map((f) => repair && !repair.has(f.id) ? cached.find((row) => row.fixtureId === f.id) :
  ({ fixtureId: f.id, output: engine.interpret(f.input) }));
const escape = (text) => String(text).replaceAll("|", "\\|").replaceAll("\n", " ");
const lines = ["# Imperial Tarot — Stage 4B-1: примеры для ручного review", "",
  "16 фиксированных чтений. Engine 4b1.1.0.0; замороженный Data V1.0.0.", "",
  "Основное prophecy отделено от технического trace. Вопрос сохранён как display context и не участвует в чтении.", "",
  "`source_explicit` — подтверждённая структура Stage 4A. `engine_synthesis_heuristic` — организация повествования и сравнение существующих metadata; это не новые канонические правила.", "",
  "Тема, общая для карт, означает повтор темы, а не обязательно благоприятное согласие. При отсутствии структурированного основания связь остаётся нейтральной.", "",
  "До ручного review эти примеры не подключены к UI. Проверить связность, уместность framing, сдержанный тон и сохранение двух альтернатив Ветви.", ""];
for (let i = 0; i < fixtures.length; i++) {
  const f = fixtures[i], output = outputs[i].output;
  const spread = data.spread_semantics.spreads.find((s) => s.spread_id === output.spreadId);
  lines.push("## " + f.id + " — " + f.title, "",
    "Расклад: **" + spread.name_ru + "** (`" + output.spreadId + "`). Seed: `" + output.seed + "`. Режим: `" + output.interpretationMode + "`.", "",
    "Coverage: " + f.coverage.map((tag) => "`" + tag + "`").join(", ") + ".", "",
    "| Позиция | Production ID / карта | State | Роль | Выбранные fragments |", "| --- | --- | --- | --- | --- |");
  for (const s of output.signs) {
    const role = s.role ? s.role.nameRu + (s.role.scope === "group" ? " (общая роль пары; индивидуальная не установлена)" : "") : "Не установлена источником";
    lines.push("| " + s.position + " | `" + s.cardId + "` — " + escape(s.nameRu) + " | `" + s.state + "` | " + escape(role) + " | " + s.selectedFragments.map((frag) => "`" + frag.fragmentId + "`").join(", ") + " |");
  }
  lines.push("", "### MAIN PROPHECY", "");
  if (output.prophecy.paragraphs.length) {
    for (const paragraph of output.prophecy.paragraphs) lines.push(paragraph, "");
  } else lines.push("Полное толкование намеренно отложено: источник не устанавливает индивидуальных ролей и порядка чтения 24 позиций. Prophecy, sections и relations пусты; в output сохранены source anchors 24 карт.", "");
  lines.push("### Technical trace", "");
  if (output.relations.length) {
    lines.push("| Relation | Узлы | Тип / основание | Происхождение |", "| --- | --- | --- | --- |");
    for (const r of output.relations) lines.push("| `" + r.relationId + "` | " + r.nodeIds.map((id) => "`" + id + "`").join(" ↔ ") + " | " + r.type + " / " + r.evidence.basis + (r.evidence.sharedTags?.length ? "; tags: " + r.evidence.sharedTags.join(", ") : "") + (r.condition ? "; исход при следовании совету" : "") + " | `" + r.origin + "` |");
  } else lines.push("Relations не назначены.");
  lines.push("", "Synthesis templates: " + (output.metadata.selectedSynthesisTemplates || []).map((t) => "`" + t.templateId + "` (" + t.scope + ")").join(", ") + ".", "");
  if (output.spreadId === "branch") lines.push("Финальная пара — два направления, оба `selected: false`; соответствие 3→5 / 4→6 не утверждается.", "");
  if (output.spreadId === "throne_of_terra") lines.push("Условие: `throne_of_terra.p06 → throne_of_terra.p07`; последняя карта не является безусловным будущим.", "");
  if (output.spreadId === "haloed_rosette") lines.push("Позиция 2 сохраняет challenge; 7↔1 сравниваются по source-explicit relation. Остальные структурные связи имеют отдельную heuristic provenance.", "");
  const restricted = output.signs.filter((s) => s.omenRestriction);
  if (restricted.length) lines.push("Явное adverse ограничение сохранено: " + restricted.map((s) => "`" + s.cardId + "/" + s.state + "`").join(", ") + ".", "");
}
fs.mkdirSync(review, { recursive: true });
fs.writeFileSync(path.join(review, "fixture_outputs.json"), JSON.stringify(outputs, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(review, "stage4b1_interpretation_samples.md"), lines.join("\n"), "utf8");
fs.writeFileSync(recordPath, JSON.stringify({ fixtureCount: fixtures.length, generationPasses: 1, sourceSha256,
  targetedRepairs: [...(previous?.targetedRepairs || []), ...(repair ? [{ fixtureIds: [...repair], reason: "Remove redundant outcome paraphrases and repeated Rosette comparison/connective wording before final validation." }] : [])],
  outputsSha256: sha(path.join(review, "fixture_outputs.json")), samplesSha256: sha(path.join(review, "stage4b1_interpretation_samples.md")) }, null, 2) + "\n", "utf8");
process.stdout.write(repair ? "Updated only " + repair.size + " affected cached samples; no full fixture rerun.\n" :
  "Generated " + fixtures.length + " fixed samples once. Final validation has not run.\n");
