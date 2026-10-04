"use strict";
// One bounded final pass over cached fixtures. No PDF/XLSX audit or random draws.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { TextDecoder } = require("node:util");
const root = path.resolve(__dirname, "..");
const repo = path.resolve(root, "../..");
const review = path.join(root, "review");
const reportPath = path.join(review, "validation_report.json");
if (fs.existsSync(reportPath)) throw new Error("Final validation has already completed. Read the checkpoint report; do not run a second full pass.");
const checks = [];
function check(id, fn) {
  try { fn(); checks.push({ id, status: "PASS" }); }
  catch (problem) { checks.push({ id, status: "FAIL", message: problem.message }); }
}
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const clone = (value) => JSON.parse(JSON.stringify(value));
const withoutQuestion = (value) => { const result = clone(value); delete result.question; return result; };
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const data = require("../data-v1.0.0.js");
const api = require("../engine.js");
const adapter = require("../session-adapter.js");
const engine = api.createEngine(data);
const production = require("../../production-data.js");
const fixtures = require("./fixtures.cjs");
const outputs = read(path.join(review, "fixture_outputs.json"));
const generation = read(path.join(review, "generation_record.json"));
const baseline = read(path.join(review, "scope_baseline.json"));
const lock = read(path.join(root, "frozen-data/LOCK.json"));
const fixtureMap = new Map(fixtures.map((f) => [f.id, f]));
const outputMap = new Map(outputs.map((r) => [r.fixtureId, r.output]));
const cardMap = new Map(data.card_semantics.cards.map((c) => [c.card_id, c]));
const spreadMap = new Map(data.spread_semantics.spreads.map((s) => [s.spread_id, s]));
const fragmentMap = new Map(data.interpretation_fragments.fragments.map((f) => [f.fragment_id, f]));
const templateMap = new Map(data.synthesis_templates.templates.map((t) => [t.template_id, t]));
const roleMap = new Map(data.spread_semantics.position_roles.map((r) => [r.role_id, r]));
const expectedMainCounts = { imperator: 2, branch: 3, throne_of_terra: 4, haloed_rosette: 5, astro_horoscope: 0 };
let additionalInterpretationCalls = 0;
const run = (input) => { additionalInterpretationCalls++; return engine.interpret(input); };
const f01 = fixtureMap.get("F01").input;
const inputBefore = JSON.stringify(f01), dataBefore = JSON.stringify(data);
const stateMeaning = (sign) => sign.state === "reversed" ? cardMap.get(sign.cardId).reversed_meaning : cardMap.get(sign.cardId).upright_meaning;
function rejection(code, input) { assert.throws(() => run(input), (problem) => problem.code === code); }
function sessionFor(input) {
  return { version: 2, data_version: production.version, session_id: "fixture-session-v2", spread_id: input.spreadId,
    question: input.question, question_status: "QUESTION_STATED",
    draws: input.cards.map((draw) => {
      const card = production.getCard(draw.cardId);
      const art = card.type === "major" ? card[draw.state] : card;
      return { card_id: card.card_id, type: card.type,
        ...(card.type === "major" ? { orientation: draw.state } : {}),
        image: art.image, artwork_id: art.artwork_id, identity_id: art.identity_id };
    }), progress: { opened_count: input.cards.length, current_index: input.cards.length - 1, finished: true } };
}

check("frozen_data_version_loads", () => {
  assert.equal(engine.dataVersion, "1.0.0"); assert.equal(data.manifest.schema_version, "1.0.0");
  assert.equal(engine.engineVersion, "4b1.1.0.0");
});
check("production_card_ids_resolve", () => {
  assert.equal(cardMap.size, 78);
  assert.equal(data.card_semantics.cards.filter((c) => c.arcana_type === "major").length, 22);
  assert.equal(data.card_semantics.cards.filter((c) => c.arcana_type === "minor").length, 56);
  for (const c of cardMap.values()) assert.equal(production.getCard(c.card_id)?.type, c.arcana_type);
});
check("source_states_index_without_new_minor_states", () => {
  const ids = new Set();
  for (const c of cardMap.values()) {
    assert.deepEqual(c.orientation_applicability.supported_states, c.arcana_type === "major" ? ["upright", "reversed"] : ["standard"]);
    if (c.arcana_type === "minor") assert.equal(c.reversed_meaning, null);
    for (const m of [c.upright_meaning, c.reversed_meaning].filter(Boolean)) {
      ids.add(m.state_id); assert.ok(data.interpretation_fragments.state_fragment_ids[m.state_id]);
    }
  }
  assert.equal(ids.size, 100);
});
check("bounded_sixteen_fixed_fixtures", () => {
  assert.equal(fixtures.length, 16); assert.equal(fixtureMap.size, 16); assert.equal(outputMap.size, 16);
  assert.deepEqual([...new Set(fixtures.map((f) => f.input.spreadId))].sort(), engine.supportedSpreads.slice().sort());
  assert.equal(generation.generationPasses, 1);
  assert.equal(generation.targetedRepairs.length, 1);
  assert.equal(generation.targetedRepairs[0].fixtureIds.length, 7);
});
check("cached_outputs_match_current_source_hashes", () => {
  for (const [file, hash] of Object.entries(generation.sourceSha256)) assert.equal(sha(path.join(root, file)), hash, file);
  assert.equal(sha(path.join(review, "fixture_outputs.json")), generation.outputsSha256);
  assert.equal(sha(path.join(review, "stage4b1_interpretation_samples.md")), generation.samplesSha256);
});
check("fixtures_cover_required_edges", () => {
  const coverage = new Set(fixtures.flatMap((f) => f.coverage));
  for (const tag of ["mostly_favourable_major", "adverse_major", "reversed_major", "daemon", "immaterium", "discordia_heavy", "mixed_major_minor", "positive_challenge", "adverse_advice", "advice_outcome_condition", "different_final_paths", "inner_present_comparison", "repeated_themes", "explicit_tension", "apparent_tension_neutral_fallback", "reproducibility_reference", "different_seed_same_semantics", "astro_deferred"])
    assert.ok(coverage.has(tag), tag);
});
check("fixture_inputs_and_outputs_preserve_identities_and_states", () => {
  for (const f of fixtures) {
    const o = outputMap.get(f.id), spread = spreadMap.get(f.input.spreadId);
    assert.equal(o.spreadId, f.input.spreadId); assert.equal(o.seed, String(f.input.seed));
    assert.equal(o.question, f.input.question); assert.equal(o.signs.length, spread.card_count);
    assert.equal(new Set(o.signs.map((s) => s.cardId)).size, spread.card_count);
    o.signs.forEach((s, i) => {
      assert.equal(s.positionId, spread.position_ids[i]); assert.equal(s.position, i + 1);
      assert.equal(s.cardId, f.input.cards[i].cardId); assert.equal(s.state, f.input.cards[i].state);
      assert.ok(cardMap.get(s.cardId).orientation_applicability.supported_states.includes(s.state));
    });
  }
});
check("semantic_anchors_equal_frozen_state_meanings", () => {
  for (const { output: o } of outputs) for (const s of o.signs) {
    const m = stateMeaning(s); assert.equal(s.stateId, m.state_id);
    assert.deepEqual(s.semanticAnchor.keywordsEn, m.keywords_en);
    assert.deepEqual(s.semanticAnchor.keywordsRu, m.keywords_ru);
    assert.deepEqual(s.semanticAnchor.tags, m.interpretation_tags);
    assert.deepEqual(s.semanticAnchor.themesRu, m.semantic_themes_ru);
    assert.deepEqual(s.semanticAnchor.tendency, m.tendency);
    assert.deepEqual(s.semanticAnchor.provenance, m.provenance);
  }
});
check("authored_fragments_resolve_verbatim_and_provenance", () => {
  for (const { output: o } of outputs) for (const s of o.signs) for (const selected of s.selectedFragments) {
    const f = fragmentMap.get(selected.fragmentId); assert.ok(f);
    assert.equal(f.state_id, s.stateId); assert.equal(f.card_id, s.cardId);
    assert.equal(selected.textRu, f.text_ru); assert.equal(selected.category, f.category);
    assert.deepEqual(selected.provenance, f.provenance);
    assert.equal(selected.provenance.type, "authored_derivative");
  }
});
check("position_frames_match_frozen_templates", () => {
  for (const { output: o } of outputs) for (const s of o.signs) if (s.role) {
    const template = templateMap.get(s.framing.templateId); assert.ok(roleMap.has(s.role.roleId));
    assert.equal(s.framing.templateId, "role_frame." + s.role.roleId);
    assert.equal(s.framing.templateTextRu, template.text_ru);
    assert.equal(s.renderedInterpretation, template.text_ru.replace("{{fragment}}", s.selectedFragments.map((f) => f.textRu).join(" ")));
  }
});
check("selective_core_plus_at_most_one_context_fragment", () => {
  for (const { output: o } of outputs) if (o.interpretationMode === "position_based") for (const s of o.signs) {
    assert.equal(s.selectedFragments[0].category, "core");
    assert.ok(s.selectedFragments.length <= 2);
    if (["past_origin", "distant_past", "recent_past"].includes(s.role.roleId)) assert.equal(s.selectedFragments.length, 1);
    if (s.role.roleId === "advice") assert.equal(s.selectedFragments[1].category, "advice");
  }
});
check("source_meaning_and_authored_framing_separate", () => {
  for (const { output: o } of outputs) for (const s of o.signs) {
    assert.equal(s.semanticAnchor.provenance.type, "source_derived");
    if (s.framing) assert.equal(s.framing.provenance.type, "authored_derivative");
    assert.deepEqual(s.sourceConflictIds, cardMap.get(s.cardId).source_conflict_ids);
    assert.deepEqual(s.unresolvedItemIds, cardMap.get(s.cardId).unresolved_item_ids);
  }
});
check("all_positions_participate_in_main_prophecy", () => {
  for (const { output: o } of outputs) if (o.interpretationMode === "position_based") {
    assert.equal(o.prophecy.paragraphs.length, expectedMainCounts[o.spreadId]);
    assert.deepEqual(o.sections.map((s) => s.textRu), o.prophecy.paragraphs);
    const main = o.prophecy.paragraphs.join(" ");
    for (const s of o.signs) {
      assert.equal(s.mainParagraphIds.length, 1);
      for (const f of s.selectedFragments) assert.ok(main.includes(f.textRu));
    }
  }
});
check("synthesis_templates_resolve_and_connectors_bounded", () => {
  for (const { output: o } of outputs) if (o.interpretationMode === "position_based") {
    assert.ok(o.metadata.connectorCount <= (o.spreadId === "haloed_rosette" ? 2 : 1));
    const connectorTypes = [];
    for (const trace of o.metadata.selectedSynthesisTemplates) {
      assert.ok(templateMap.has(trace.templateId));
      assert.ok(o.prophecy.paragraphs.join(" ").includes(templateMap.get(trace.templateId).text_ru));
      if (trace.relationId) connectorTypes.push(o.relations.find((r) => r.relationId === trace.relationId).type);
    }
    assert.equal(new Set(connectorTypes).size, connectorTypes.length);
  }
});
check("all_relation_and_section_references_resolve", () => {
  for (const { output: o } of outputs) {
    const positions = new Set(o.signs.map((s) => s.positionId));
    const groups = new Set(spreadMap.get(o.spreadId).position_groups.map((g) => g.group_id));
    const relations = new Set(o.relations.map((r) => r.relationId));
    assert.equal(relations.size, o.relations.length);
    for (const r of o.relations) for (const id of r.nodeIds) assert.ok(positions.has(id) || groups.has(id));
    for (const s of o.signs) for (const id of s.relations) assert.ok(relations.has(id));
    for (const section of o.sections) {
      for (const id of section.positionIds) assert.ok(positions.has(id));
      for (const id of section.relationIds) assert.ok(relations.has(id));
    }
  }
});
check("source_relations_and_engine_heuristics_distinguished", () => {
  for (const { output: o } of outputs) for (const r of o.relations) {
    assert.ok(["source_explicit", "engine_synthesis_heuristic"].includes(r.origin));
    if (r.origin === "source_explicit") {
      const source = spreadMap.get(o.spreadId).relationships.find((x) => x.relationship_id === r.relationId); assert.ok(source);
      assert.deepEqual(r.nodeIds, source.node_ids); assert.deepEqual(r.sourceRefs, source.provenance.source_refs);
    } else assert.ok(r.relationId.startsWith("heuristic."));
  }
});
check("imperator_structure_is_past_present_solution", () => {
  for (const { output: o } of outputs) if (o.spreadId === "imperator") {
    assert.deepEqual(o.signs.map((s) => s.role.roleId), ["past_origin", "present_problem", "solution_or_outcome"]);
    assert.deepEqual(o.sections.map((s) => s.positionIds), [["imperator.p01", "imperator.p02"], ["imperator.p03"]]);
    assert.ok(o.relations.some((r) => r.relationId === "imperator.sequence" && r.origin === "source_explicit"));
  }
});
check("branch_pairs_retain_group_only_roles", () => {
  for (const { output: o } of outputs) if (o.spreadId === "branch") {
    for (const s of o.signs.slice(2)) { assert.equal(s.role.scope, "group"); assert.equal(s.role.individualRoleId, null); }
    assert.deepEqual(o.signs.slice(2).map((s) => s.role.roleId), ["forces_and_options", "forces_and_options", "branching_futures", "branching_futures"]);
    assert.equal(o.sections[1].groupId, "branch.forces_options");
    assert.equal(o.sections[2].groupId, "branch.branching_future");
  }
});
check("branch_alternatives_not_a_sequential_or_selected_future", () => {
  for (const { output: o } of outputs) if (o.spreadId === "branch") {
    const alternatives = o.sections[2].alternatives;
    assert.equal(alternatives.length, 2);
    assert.deepEqual(alternatives.map((a) => a.selected), [false, false]);
    assert.deepEqual(alternatives.map((a) => a.individualRoleId), [null, null]);
    assert.equal(o.relations.find((r) => r.relationId === "branch.alternatives").sequencing, "alternatives_not_chronology");
    assert.ok(!o.relations.some((r) => ["heuristic.branch.3_5", "heuristic.branch.4_6", "heuristic.branch.5_6"].includes(r.relationId)));
    assert.ok(o.prophecy.paragraphs[2].includes("Первое направление:") && o.prophecy.paragraphs[2].includes("Второе направление:"));
  }
});
check("branch_different_paths_preserve_both_source_tendencies", () => {
  const o = outputMap.get("F05");
  assert.equal(o.signs[4].semanticAnchor.tendency.value, "favourable");
  assert.equal(o.signs[5].semanticAnchor.tendency.value, "adverse");
  assert.equal(o.sections[2].alternatives.filter((a) => a.selected).length, 0);
});
check("throne_roles_are_source_supported", () => {
  for (const { output: o } of outputs) if (o.spreadId === "throne_of_terra")
    assert.deepEqual(o.signs.map((s) => s.role.roleId), ["past_origin", "present_problem", "hidden_influence", "obstacle", "surroundings", "advice", "conditional_outcome"]);
});
check("throne_six_to_seven_outcome_is_conditional", () => {
  for (const { output: o } of outputs) if (o.spreadId === "throne_of_terra") {
    const r = o.relations.find((row) => row.relationId === "throne_of_terra.advice_outcome");
    assert.equal(r.origin, "source_explicit");
    assert.deepEqual(r.condition, { kind: "advice_is_heeded", advicePositionId: "throne_of_terra.p06", outcomePositionId: "throne_of_terra.p07" });
    assert.deepEqual(o.sections[3].condition, r.condition);
    assert.ok(o.prophecy.paragraphs[3].startsWith("Если прежнему совету последовать"));
    for (const index of [5, 6]) assert.ok(o.signs[index].relations.includes(r.relationId));
  }
});
check("adverse_advice_does_not_become_a_favourable_card", () => {
  for (const id of ["F08", "F09", "F16"]) {
    const s = outputMap.get(id).signs[5]; assert.equal(s.role.roleId, "advice");
    assert.equal(s.omenRestriction.adverse, true); assert.equal(s.semanticAnchor.tendency.value, "adverse");
    assert.deepEqual(s.selectedFragments.map((f) => f.category), ["core", "advice"]);
  }
});
check("rosette_all_roles_and_temporal_plan_preserved", () => {
  for (const { output: o } of outputs) if (o.spreadId === "haloed_rosette") {
    assert.deepEqual(o.signs.map((s) => s.role.roleId), ["present_situation", "immediate_challenge", "distant_past", "recent_past", "best_possible_outcome", "near_future", "internal_factors", "external_uncontrolled", "hopes_fears", "final_outcome"]);
    assert.deepEqual(o.sections.map((s) => s.positionIds.map((id) => Number(id.slice(-2)))), [[3, 4], [1, 2], [7, 8, 9], [5, 6], [10]]);
    assert.ok(o.sections.every((s) => s.narrativeOrigin === "engine_synthesis_heuristic"));
  }
});
check("positive_rosette_card_two_remains_challenge", () => {
  const s = outputMap.get("F10").signs[1]; assert.equal(s.cardId, "major_17");
  assert.equal(s.semanticAnchor.tendency.value, "favourable"); assert.equal(s.role.roleId, "immediate_challenge");
  assert.equal(s.framing.templateId, "role_frame.immediate_challenge");
  assert.ok(s.renderedInterpretation.startsWith("Здесь карта означает ближайшее испытание."));
  assert.deepEqual(s.selectedFragments.map((f) => f.category), ["core"]);
});
check("positive_throne_card_four_remains_obstacle", () => {
  const s = outputMap.get("F09").signs[3]; assert.equal(s.cardId, "major_17");
  assert.equal(s.role.roleId, "obstacle"); assert.equal(s.semanticAnchor.tendency.value, "favourable");
  assert.ok(s.renderedInterpretation.startsWith("Этот знак описывает предстоящее препятствие."));
});
check("rosette_seven_present_comparison_source_explicit", () => {
  for (const { output: o } of outputs) if (o.spreadId === "haloed_rosette") {
    const r = o.relations.find((x) => x.relationId === "haloed_rosette.inner_present");
    assert.deepEqual(r.nodeIds, ["haloed_rosette.p07", "haloed_rosette.p01"]);
    assert.equal(r.origin, "source_explicit");
    for (const index of [0, 6]) assert.ok(o.signs[index].relations.includes(r.relationId));
    assert.ok(o.prophecy.paragraphs[2].includes("сопоставления с настоящим"));
  }
});
check("rosette_extra_relations_are_heuristics", () => {
  const o = outputMap.get("F10");
  for (const [a, b] of [[3, 4], [4, 1], [1, 6], [6, 10], [1, 2], [7, 8], [5, 10]])
    assert.equal(o.relations.find((r) => r.relationId === "heuristic.haloed_rosette." + a + "_" + b).origin, "engine_synthesis_heuristic");
});
check("astro_is_controlled_deferred_without_invented_positions", () => {
  const o = outputMap.get("F14"); assert.equal(o.interpretationMode, "deferred_complex_reading");
  assert.equal(o.signs.length, 24); assert.deepEqual(o.prophecy.paragraphs, []); assert.deepEqual(o.sections, []); assert.deepEqual(o.relations, []);
  for (const s of o.signs) { assert.equal(s.role, null); assert.equal(s.framing, null); assert.equal(s.renderedInterpretation, null); assert.deepEqual(s.selectedFragments, []); }
  assert.ok(o.metadata.limitations.length);
});
check("reinforcement_requires_existing_shared_tags", () => {
  let seen = false;
  for (const { output: o } of outputs) for (const r of o.relations) if (r.type === "REINFORCEMENT") {
    seen = true; assert.equal(r.evidence.basis, "shared_existing_theme_tags_only"); assert.ok(r.evidence.sharedTags.length);
    const [a, b] = r.nodeIds.map((id) => o.signs.find((s) => s.positionId === id));
    for (const tag of r.evidence.sharedTags) assert.ok(a.semanticAnchor.tags.includes(tag) && b.semanticAnchor.tags.includes(tag));
  }
  assert.ok(seen);
});
check("tension_requires_opposed_explicit_source_tendencies", () => {
  let seen = false;
  for (const { output: o } of outputs) for (const r of o.relations) if (r.type === "TENSION") {
    seen = true; assert.equal(r.evidence.basis, "opposed_explicit_source_tendencies");
    assert.ok(r.evidence.tendencies.includes("favourable") && r.evidence.tendencies.includes("adverse"));
    for (const id of r.nodeIds) assert.equal(o.signs.find((s) => s.positionId === id).semanticAnchor.tendency.provenance.type, "source_derived");
  }
  assert.ok(seen);
  assert.equal(outputMap.get("F11").relations.find((r) => r.relationId === "haloed_rosette.inner_present").type, "TENSION");
});
check("apparent_tension_uses_neutral_fallback", () => {
  const r = outputMap.get("F13").relations.find((x) => x.relationId === "haloed_rosette.inner_present");
  assert.equal(r.type, "CONTINUATION"); assert.equal(r.evidence.basis, "insufficient_structured_basis_neutral");
});
check("daemon_immaterium_adverse_in_both_orientations", () => {
  const covered = new Set();
  for (const { output: o } of outputs) for (const s of o.signs) if (["major_15", "major_18"].includes(s.cardId)) {
    covered.add(s.cardId + "." + s.state); assert.equal(s.omenRestriction.adverse, true);
    assert.equal(s.omenRestriction.scope, "card_in_any_orientation"); assert.equal(s.semanticAnchor.tendency.value, "adverse");
    assert.ok(!s.selectedFragments.some((f) => f.category === "constructive"));
  }
  assert.equal(covered.size, 4);
});
check("discordia_stays_suit_context_and_minor_standard", () => {
  const o = outputMap.get("F06");
  for (const s of o.signs) {
    assert.equal(s.state, "standard"); assert.equal(s.suitId, "discordia"); assert.ok(!s.stateId.endsWith("reversed"));
    assert.deepEqual(s.suitContext, data.suit_semantics.suits.find((suit) => suit.suit_id === "discordia"));
  }
  assert.ok(new Set(o.signs.map((s) => s.selectedFragments[0].textRu)).size > 1);
});
check("major_reversed_uses_separate_source_meaning", () => {
  const upright = outputMap.get("F01").signs[0], reversed = outputMap.get("F03").signs[0];
  assert.equal(upright.cardId, reversed.cardId); assert.notDeepEqual(upright.semanticAnchor.keywordsRu, reversed.semanticAnchor.keywordsRu);
  assert.equal(reversed.selectedFragments[0].fragmentId, "major_00.reversed.core");
});
check("stable_hash_known_vectors", () => {
  assert.equal(api.stableHash(""), 0x811c9dc5); assert.equal(api.stableHash("a"), 0xe40c292c); assert.equal(api.stableHash("hello"), 0x4f9f2cab);
});
check("same_input_seed_byte_identical", () => assert.equal(JSON.stringify(run(f01)), JSON.stringify(outputMap.get("F01"))));
check("reload_same_input_seed_byte_identical", () => {
  delete require.cache[require.resolve("../engine.js")];
  additionalInterpretationCalls++;
  const reloaded = require("../engine.js").createEngine(data);
  assert.equal(JSON.stringify(reloaded.interpret(clone(f01))), JSON.stringify(outputMap.get("F01")));
});
check("question_display_only_no_semantic_effect", () => {
  const changed = run({ ...f01, question: "Слова о войне, любви и золоте; ПОБЕДА или поражение? 🕯️" });
  assert.equal(changed.question, "Слова о войне, любви и золоте; ПОБЕДА или поражение? 🕯️");
  assert.deepEqual(withoutQuestion(changed), withoutQuestion(outputMap.get("F01")));
});
check("different_seed_changes_wording_not_core_meaning", () => {
  const a = outputMap.get("F01"), b = outputMap.get("F15");
  assert.notDeepEqual(a.prophecy.paragraphs, b.prophecy.paragraphs);
  assert.deepEqual(a.signs, b.signs); assert.deepEqual(a.relations, b.relations);
  assert.deepEqual(a.sections.map(({ textRu, ...rest }) => rest), b.sections.map(({ textRu, ...rest }) => rest));
});
check("numeric_seed_has_stable_string_identity", () => {
  const f = fixtureMap.get("F03").input;
  assert.equal(JSON.stringify(run({ ...f, seed: "403" })), JSON.stringify(outputMap.get("F03")));
});
check("unknown_card_rejected", () => rejection("CARD_ID", { ...f01, cards: [{ cardId: "invented_card", state: "upright" }, ...f01.cards.slice(1)] }));
check("minor_reversed_and_upright_rejected", () => {
  const f = fixtureMap.get("F04").input;
  for (const state of ["reversed", "upright"]) rejection("CARD_STATE", { ...f, cards: [{ ...f.cards[0], state }, ...f.cards.slice(1)] });
});
check("major_standard_or_missing_state_rejected", () => {
  for (const state of ["standard", undefined]) rejection("CARD_STATE", { ...f01, cards: [{ cardId: "major_00", state }, ...f01.cards.slice(1)] });
});
check("unknown_spread_wrong_count_duplicate_and_position_rejected", () => {
  rejection("SPREAD_ID", { ...f01, spreadId: "invented_spread" });
  rejection("CARD_COUNT", { ...f01, cards: f01.cards.slice(0, 2) });
  rejection("DUPLICATE_CARD", { ...f01, cards: [f01.cards[0], f01.cards[0], f01.cards[2]] });
  rejection("POSITION_ID", { ...f01, cards: [{ ...f01.cards[0], positionId: "imperator.p03" }, ...f01.cards.slice(1)] });
});
check("nonportable_seed_rejected", () => rejection("SEED", { ...f01, seed: 0.1 }));
check("completed_stage3_session_adapter_preserves_draws", () => {
  const f = fixtureMap.get("F04").input, session = sessionFor(f), before = JSON.stringify(session);
  additionalInterpretationCalls++;
  const output = adapter.fromCompletedSession(engine, session, production, { seed: f.seed });
  assert.deepEqual(output, outputMap.get("F04")); assert.equal(JSON.stringify(session), before);
  for (const draw of session.draws.filter((d) => d.type === "minor")) assert.ok(!Object.hasOwn(draw, "orientation"));
});
check("adapter_default_seed_uses_saved_session_id", () => {
  const session = sessionFor(f01); additionalInterpretationCalls++;
  assert.equal(adapter.fromCompletedSession(engine, session, production).seed, session.session_id);
});
check("adapter_rejects_unfinished_version_artwork_and_minor_orientation", () => {
  const s = sessionFor(fixtureMap.get("F04").input);
  const rejects = (code, value) => assert.throws(() => adapter.fromCompletedSession(engine, value, production), (e) => e.code === code);
  rejects("SESSION_UNFINISHED", { ...s, progress: { ...s.progress, finished: false } });
  rejects("SESSION_UNFINISHED", { ...s, progress: { ...s.progress, opened_count: 2 } });
  rejects("SESSION_VERSION", { ...s, data_version: "wrong" });
  const art = clone(s); art.draws[0].image = "wrong-image"; rejects("SESSION_ARTWORK", art);
  const minor = clone(s); minor.draws[0].orientation = undefined; rejects("SESSION_STATE", minor);
});
check("adapter_does_not_enable_disabled_production_astro", () => {
  assert.throws(() => adapter.fromCompletedSession(engine, { ...sessionFor(f01), spread_id: "astro_horoscope" }, production), (e) => e.code === "SESSION_SPREAD");
});
check("browser_umd_parity_with_network_and_randomness_blocked", () => {
  const prohibited = () => { throw new Error("Forbidden runtime capability invoked"); };
  const localMath = Object.create(Math); localMath.random = prohibited;
  const browser = vm.createContext({ Math: localMath, fetch: prohibited, XMLHttpRequest: prohibited, WebSocket: prohibited,
    crypto: { getRandomValues: prohibited, randomUUID: prohibited }, Date: prohibited });
  for (const file of ["data-v1.0.0.js", "engine.js", "session-adapter.js"])
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), browser, { filename: file });
  additionalInterpretationCalls++;
  const browserEngine = browser.ImperialTarotInterpretationV1.createEngine(browser.ImperialTarotInterpretationDataV1);
  assert.equal(JSON.stringify(browserEngine.interpret(clone(f01))), JSON.stringify(outputMap.get("F01")));
  assert.equal(typeof browser.ImperialTarotInterpretationSessionV1.fromCompletedSession, "function");
});
check("engine_does_not_mutate_input_or_data", () => { assert.equal(JSON.stringify(f01), inputBefore); assert.equal(JSON.stringify(data), dataBefore); });
check("runtime_has_no_external_api_nlp_or_nondeterministic_capabilities", () => {
  const runtime = ["engine.js", "session-adapter.js"].map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
  assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|Worker|sendBeacon|eval)\s*\(|\b(?:Math\.random|Date\.now|crypto\.|localStorage|sessionStorage|document\.|window\.|require\s*\(|import\s*\()/u.test(runtime));
  assert.ok(!/https?:\/\/|openai|embedding|sentiment|tokeniz|\bnew\s+(?:Date|Function)\b/iu.test(runtime));
  assert.ok(!/(?:input|session)\.question\s*\.\s*(?:match|includes|split|search|toLowerCase|replace)/u.test(runtime));
});
check("bundle_equals_all_frozen_json_documents", () => {
  for (const file of Object.keys(lock.files_sha256)) {
    const doc = read(path.join(root, "frozen-data", file));
    const key = file === "manifest.json" ? "manifest" : path.basename(file, ".json");
    assert.deepEqual(data[key], doc);
  }
});
check("frozen_files_and_original_stage4a_bytes_unchanged", () => {
  const original = path.resolve(repo, "../imperial_tarot_stage4a");
  for (const [file, hash] of Object.entries(lock.files_sha256)) {
    assert.equal(sha(path.join(root, "frozen-data", file)), hash, file);
    assert.equal(sha(path.join(original, file)), hash, file);
  }
  const archive = process.env.STAGE4B1_SOURCE_ARCHIVE || path.resolve(repo, "../imperial_tarot_stage4a.zip");
  assert.equal(sha(archive), lock.source_archive_sha256);
  assert.equal(lock.source_archive_sha256, baseline.data_archive_sha256);
});
check("all_new_json_and_artifacts_parse_utf8", () => {
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(file));
        if (file.endsWith(".json")) JSON.parse(text);
      }
    }
  }
  walk(root);
});
check("all_preexisting_tracked_files_unchanged", () => {
  assert.equal(Object.keys(baseline.protected_tracked_files_sha256).length, 198);
  for (const [file, hash] of Object.entries(baseline.protected_tracked_files_sha256)) assert.equal(sha(path.join(repo, file)), hash, file);
  assert.equal(git("diff", "--name-only", baseline.base_commit), "");
});
check("production_ui_artwork_and_four_generators_untouched", () => {
  for (const file of ["tarot-prototype/index.html", "tarot-prototype/production-data.js", "tarot-prototype/ritual-session.js", "tarot-prototype/stage2.js", "index.html", "package.json", ".github/workflows/check.yml"])
    assert.equal(sha(path.join(repo, file)), baseline.protected_tracked_files_sha256[file]);
  for (const file of Object.keys(baseline.protected_tracked_files_sha256).filter((file) => file.startsWith("src/") || file.startsWith("tarot-prototype/assets/")))
    assert.equal(sha(path.join(repo, file)), baseline.protected_tracked_files_sha256[file]);
});
check("isolated_branch_and_only_new_stage4b1_files", () => {
  assert.equal(git("branch", "--show-current"), baseline.branch);
  assert.equal(git("rev-parse", "HEAD"), baseline.base_commit);
  for (const file of git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean))
    assert.ok(file.startsWith("tarot-prototype/interpretation-stage4b1/"), file);
});
check("human_review_artifact_contains_all_main_prophecies_and_trace", () => {
  const text = fs.readFileSync(path.join(review, "stage4b1_interpretation_samples.md"), "utf8");
  for (const { fixtureId, output } of outputs) {
    assert.ok(text.includes("## " + fixtureId + " —"));
    for (const paragraph of output.prophecy.paragraphs) assert.ok(text.includes(paragraph));
    for (const s of output.signs) for (const fragment of s.selectedFragments) assert.ok(text.includes(fragment.fragmentId));
  }
  assert.equal((text.match(/### MAIN PROPHECY/g) || []).length, 16);
  assert.equal((text.match(/### Technical trace/g) || []).length, 16);
});

const failed = checks.filter((c) => c.status === "FAIL");
const report = { status: failed.length ? "FAIL" : "PASS", finalValidationPasses: 1, fixtureCount: fixtures.length,
  checkCount: checks.length, passedChecks: checks.length - failed.length, failedChecks: failed.length,
  additionalBoundedInterpretationCalls: additionalInterpretationCalls, fullFixtureRegenerations: 0,
  targetedSampleRepairsBeforeValidation: generation.targetedRepairs,
  engineVersion: engine.engineVersion, dataVersion: engine.dataVersion, baseCommit: baseline.base_commit, branch: baseline.branch,
  stage4aModified: false, productionUiModified: false, artworkMappingsModified: false, fourKadatGeneratorsModified: false,
  externalAiApi: "NONE", githubPagesPublication: "NO", stage4b2: "NOT_STARTED", checks };
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
const md = ["# Stage 4B-1 — bounded final validation", "", "**" + report.status + "** — " + report.passedChecks + "/" + report.checkCount + " checks.", "",
  "Engine " + report.engineVersion + "; Data " + report.dataVersion + "; 16 fixed fixture outputs. Final pass: **1**. Full fixture regeneration: **0**.", "",
  "One initial sample generation; seven outputs were repaired locally before final validation to remove repeated wording. Cached outputs were reused; additional bounded calls verify reproducibility, reload/browser parity, question independence, adapter and input rejection. No random fuzzing or Stage 4A semantic audit.", "",
  "Protected scope: 198 pre-existing tracked files unchanged; frozen Stage 4A copies and authoritative archive bytes unchanged. Production UI, artwork and four Kadat generators unchanged. No publication, external AI/API or Stage 4B-2.", "",
  "| Check | Status |", "| --- | --- |", ...checks.map((c) => "| " + c.id + " | " + c.status + (c.message ? ": " + c.message.replaceAll("|", "\\|").replaceAll("\n", " ") : "") + " |"), "",
  "Checkpoint is ready for human review. Do not run a second full validation pass in this work session.", ""];
fs.writeFileSync(path.join(review, "validation_report.md"), md.join("\n"), "utf8");
process.stdout.write(JSON.stringify({ status: report.status, checks: report.checkCount, passed: report.passedChecks, failed: failed.map((c) => ({ id: c.id, message: c.message })), fixtures: report.fixtureCount, finalValidationPasses: 1 }) + "\n");
if (failed.length) process.exitCode = 1;
