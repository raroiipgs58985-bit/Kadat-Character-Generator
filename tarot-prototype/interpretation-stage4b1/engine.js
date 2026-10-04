/* Imperial Tarot Stage 4B-1. Pure local synthesis; no UI or ritual mutations. */
(function (host, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else host.ImperialTarotInterpretationV1 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const ENGINE_VERSION = "4b1.1.0.0";
  const DATA_VERSION = "1.0.0";
  const SUPPORTED_SPREADS = ["imperator", "branch", "throne_of_terra", "haloed_rosette", "astro_horoscope"];
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  function error(code, message) {
    const problem = new Error(message);
    problem.name = "InterpretationError";
    problem.code = code;
    throw problem;
  }
  function stableHash(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
    return hash >>> 0;
  }
  // These are narrative organization conventions, not additional Tarot meanings.
  const PLANS = freeze({
    imperator: [
      { id: "origin_present", nodes: [1, 2] },
      { id: "solution", nodes: [3] },
    ],
    branch: [
      { id: "origin_present", nodes: [1, 2] },
      { id: "forces_options", nodes: [3, 4], group: "branch.forces_options" },
      { id: "alternative_futures", nodes: [5, 6], group: "branch.branching_future", alternatives: true },
    ],
    throne_of_terra: [
      { id: "origin_present", nodes: [1, 2] },
      { id: "hidden_obstacle", nodes: [3, 4] },
      { id: "environment_advice", nodes: [5, 6] },
      { id: "conditional_outcome", nodes: [7] },
    ],
    haloed_rosette: [
      { id: "foundations", nodes: [3, 4] },
      { id: "situation_challenge", nodes: [1, 7, 2] },
      { id: "inner_outer_expectations", nodes: [8, 9] },
      { id: "possible_near_future", nodes: [5, 6] },
      { id: "final_outcome", nodes: [10] },
    ],
  });
  const HEURISTIC_EDGES = freeze({
    imperator: [[1, 2, "origin_to_present"], [2, 3, "problem_to_possible_solution"]],
    branch: [[1, 2, "origin_to_present"]],
    throne_of_terra: [[1, 2, "origin_to_present"], [3, 4, "hidden_to_obstacle"], [5, 6, "environment_to_advice"]],
    haloed_rosette: [
      [3, 4, "temporal_narrative"], [4, 1, "temporal_narrative"],
      [1, 6, "temporal_narrative"], [6, 10, "temporal_narrative"],
      [1, 2, "situation_challenge"], [7, 8, "internal_external"],
      [5, 10, "best_possible_vs_final"],
    ],
  });

  function createEngine(inputData) {
    if (!inputData || inputData.dataVersion !== DATA_VERSION) error("DATA_VERSION", "Data V1.0.0 is required");
    const data = freeze(copy(inputData));
    for (const key of ["card_semantics", "interpretation_fragments", "spread_semantics", "suit_semantics", "synthesis_templates"])
      if (data[key]?.schema_version !== DATA_VERSION) error("DATA_DOCUMENT_VERSION", "Unsupported data document: " + key);
    const cards = new Map(data.card_semantics.cards.map((x) => [x.card_id, x]));
    const spreads = new Map(data.spread_semantics.spreads.map((x) => [x.spread_id, x]));
    const roles = new Map(data.spread_semantics.position_roles.map((x) => [x.role_id, x]));
    const suits = new Map(data.suit_semantics.suits.map((x) => [x.suit_id, x]));
    const templates = new Map(data.synthesis_templates.templates.map((x) => [x.template_id, x]));
    const fragments = new Map(data.interpretation_fragments.fragments.map((x) => [x.fragment_id, x]));
    const stateFragments = new Map();
    for (const [id, ids] of Object.entries(data.interpretation_fragments.state_fragment_ids)) {
      const entries = ids.map((fragmentId) => fragments.get(fragmentId));
      if (entries.some((x) => !x || x.state_id !== id)) error("DATA_FRAGMENT_REFERENCE", "Unresolved fragment index: " + id);
      stateFragments.set(id, new Map(entries.map((x) => [x.category, x])));
    }
    if (cards.size !== 78 || spreads.size !== 5 || stateFragments.size !== 100 || fragments.size !== 300)
      error("DATA_INDEX", "Frozen data catalog cannot be indexed");
    for (const card of cards.values()) {
      for (const meaning of [card.upright_meaning, card.reversed_meaning].filter(Boolean))
        if (!stateFragments.get(meaning.state_id)?.has("core")) error("DATA_CORE", "Missing semantic anchor: " + meaning.state_id);
      if (card.arcana_type === "minor" && (card.reversed_meaning !== null || card.upright_meaning.orientation !== "standard"))
        error("DATA_MINOR_STATE", "Individual Minor reversals are unsupported");
      if (card.suit_id && !suits.has(card.suit_id)) error("DATA_SUIT", "Unknown suit");
    }
    for (const spread of spreads.values()) {
      for (const node of [...spread.positions, ...spread.position_groups])
        if (node.role_id && (!roles.has(node.role_id) || !templates.has("role_frame." + node.role_id)))
          error("DATA_ROLE", "Unresolved position framing: " + node.role_id);
    }

    function normalize(input) {
      if (!input || typeof input !== "object") error("INPUT", "Interpretation input must be an object");
      const spread = spreads.get(input.spreadId);
      if (!spread) error("SPREAD_ID", "Unknown interpretation spread");
      const rawSeed = input.seed ?? "0";
      if (!(typeof rawSeed === "string" || (typeof rawSeed === "number" && Number.isSafeInteger(rawSeed))))
        error("SEED", "Seed must be a string or safe integer");
      if (input.question != null && typeof input.question !== "string") error("QUESTION_TYPE", "Display question must be text");
      if (!Array.isArray(input.cards) || input.cards.length !== spread.card_count) error("CARD_COUNT", "Wrong number of cards for spread");
      const seen = new Set();
      const draws = input.cards.map((draw, index) => {
        const card = cards.get(draw?.cardId);
        if (!card) error("CARD_ID", "Unknown production card ID");
        if (seen.has(card.card_id)) error("DUPLICATE_CARD", "Draws must preserve without-replacement identities");
        seen.add(card.card_id);
        if (!card.orientation_applicability.supported_states.includes(draw.state)) error("CARD_STATE", "Unsupported card state: " + card.card_id);
        if (draw.positionId != null && draw.positionId !== spread.position_ids[index]) error("POSITION_ID", "Card order and position ID disagree");
        const meaning = draw.state === "reversed" ? card.reversed_meaning : card.upright_meaning;
        if (!meaning || meaning.orientation !== draw.state) error("MEANING_STATE", "No source meaning for state");
        return { card, state: draw.state, meaning, position: spread.positions[index] };
      });
      return { spread, draws, seed: String(rawSeed) };
    }

    function interpret(input) {
      const { spread, draws, seed } = normalize(input);
      // Display context never enters a seed, index, relation, plan, or text selection.
      const question = input.question ?? "";
      const identity = JSON.stringify([spread.spread_id, seed, draws.map((x) => [x.card.card_id, x.state, x.position.position_id])]);
      const choose = (ids, scope) => {
        const candidates = ids.map((id) => templates.get(id)).filter(Boolean);
        if (!candidates.length) error("TEMPLATE_ID", "No declared template for " + scope);
        return candidates[stableHash(identity + "|" + scope) % candidates.length];
      };
      const groupMap = new Map(spread.position_groups.map((g) => [g.group_id, g]));
      const isDeferred = spread.spread_id === "astro_horoscope";
      const signs = draws.map(({ card, state, meaning, position }) => {
        const group = position.group_id ? groupMap.get(position.group_id) : null;
        const roleId = position.role_id || group?.role_id || null;
        const role = roleId ? roles.get(roleId) : null;
        const available = stateFragments.get(meaning.state_id);
        const selected = isDeferred ? [] : [available.get("core")];
        if (!isDeferred) {
          let extra = null;
          if (roleId === "advice") extra = available.get("advice");
          else if (["obstacle", "immediate_challenge"].includes(roleId)) extra = available.get("warning");
          else if (["solution_or_outcome", "conditional_outcome", "final_outcome"].includes(roleId)) {
            // The core is already the anchor of this outcome; another outcome
            // paraphrase would repeat it. Explicit adverse cautions remain useful.
            if (meaning.tendency?.value === "adverse") extra = available.get("warning");
          }
          if (extra) selected.push(extra);
        }
        const frame = roleId ? templates.get("role_frame." + roleId) : null;
        const fragmentText = selected.map((f) => f.text_ru).join(" ");
        return {
          position: position.number, positionId: position.position_id,
          cardId: card.card_id, nameEn: card.name_en, nameRu: card.name_ru,
          arcanaType: card.arcana_type, suitId: card.suit_id, rank: copy(card.rank), state, stateId: meaning.state_id,
          sourceConflictIds: [...card.source_conflict_ids], unresolvedItemIds: [...card.unresolved_item_ids],
          positionProvenance: copy(position.provenance), cardProvenance: copy(card.provenance),
          role: role ? { roleId, nameRu: role.name_ru, meaningRu: role.meaning_ru,
            scope: group ? "group" : "position", individualRoleId: position.role_id,
            groupId: group?.group_id || null, sharedPositionIds: group ? [...group.position_ids] : [],
            provenance: copy(role.provenance) } : null,
          semanticAnchor: { stateId: meaning.state_id, keywordsEn: [...meaning.keywords_en], keywordsRu: [...meaning.keywords_ru],
            themesRu: [...meaning.semantic_themes_ru], tags: [...meaning.interpretation_tags],
            tendency: copy(meaning.tendency), provenance: copy(meaning.provenance) },
          suitContext: card.suit_id ? copy(suits.get(card.suit_id)) : null,
          selectedFragments: selected.map((f) => ({ fragmentId: f.fragment_id, category: f.category, textRu: f.text_ru, provenance: copy(f.provenance) })),
          framing: frame ? { templateId: frame.template_id, templateTextRu: frame.text_ru, provenance: copy(frame.provenance) } : null,
          renderedInterpretation: frame && !isDeferred ? frame.text_ru.replace("{{fragment}}", fragmentText) : null,
          omenRestriction: meaning.tendency?.value === "adverse" ? { adverse: true, scope: meaning.tendency.scope, provenance: copy(meaning.tendency.provenance) } : null,
          relations: [], mainParagraphIds: [],
        };
      });
      const result = {
        spreadId: spread.spread_id, seed, question,
        interpretationMode: isDeferred ? "deferred_complex_reading" : "position_based",
        prophecy: { paragraphs: [] }, sections: [], signs, relations: [],
        metadata: { engineVersion: ENGINE_VERSION, dataVersion: DATA_VERSION, deterministic: true,
          questionPolicy: "display_context_only", seedAlgorithm: "FNV-1a-32 over canonical spread/state/seed identities and local scope",
          structuralPlanOrigin: "engine_synthesis_heuristic", sourceInterpretationReadiness: spread.interpretation_readiness,
          limitations: isDeferred ? ["The source does not define individual position roles or reading order for the 24 cards."] :
            spread.spread_id === "branch" ? ["Positions 3–6 retain group semantics; no individual roles or loyal/traitor labels are assigned."] : [],
        },
      };
      if (isDeferred) return result;
      const byPosition = new Map(signs.map((s) => [s.positionId, s]));
      const byNumber = new Map(signs.map((s) => [s.position, s]));
      const relationMap = new Map();
      function comparison(left, right) {
        const a = left.semanticAnchor, b = right.semanticAnchor;
        const values = [a.tendency?.value || null, b.tendency?.value || null];
        const sharedTags = a.tags.filter((t) => b.tags.includes(t)).sort();
        if (values.includes("favourable") && values.includes("adverse"))
          return { type: "TENSION", basis: "opposed_explicit_source_tendencies", sharedTags, tendencies: values };
        if (sharedTags.length)
          return { type: "REINFORCEMENT", basis: "shared_existing_theme_tags_only", sharedTags, tendencies: values };
        return { type: "CONTINUATION", basis: "insufficient_structured_basis_neutral", sharedTags: [], tendencies: values };
      }
      function attach(relation) {
        if (relationMap.has(relation.relationId)) error("RELATION_ID", "Duplicate relation ID");
        relationMap.set(relation.relationId, relation);
        for (const nodeId of relation.nodeIds) {
          const group = groupMap.get(nodeId);
          for (const pid of group ? group.position_ids : [nodeId]) byPosition.get(pid)?.relations.push(relation.relationId);
        }
      }
      for (const relation of spread.relationships) {
        const row = { relationId: relation.relationship_id, nodeIds: [...relation.node_ids], purpose: relation.kind,
          origin: "source_explicit", sourceRefs: [...relation.provenance.source_refs], type: "CONTINUATION", evidence: { basis: "source_structure" } };
        if (relation.kind === "outcome_conditioned_on_advice") {
          row.type = "TRANSITION_TO_OUTCOME";
          row.condition = { kind: "advice_is_heeded", advicePositionId: row.nodeIds[0], outcomePositionId: row.nodeIds[1] };
        } else if (relation.kind === "options_then_alternative_futures") row.type = "TRANSITION_TO_OUTCOME";
        else if (relation.kind === "alternative_futures") row.sequencing = "alternatives_not_chronology";
        else if (relation.kind === "compare_internal_factors_with_present") {
          const evidence = comparison(byPosition.get(row.nodeIds[0]), byPosition.get(row.nodeIds[1]));
          row.type = evidence.type; row.evidence = evidence;
        }
        attach(row);
      }
      for (const [a, b, purpose] of HEURISTIC_EDGES[spread.spread_id]) {
        const left = byNumber.get(a), right = byNumber.get(b);
        const evidence = comparison(left, right);
        let type = evidence.type;
        if (right.role?.roleId === "advice") type = "TRANSITION_TO_ADVICE";
        else if (right.role?.roleId === "final_outcome") type = "CONCLUSION";
        else if (right.role?.roleId === "solution_or_outcome") type = "TRANSITION_TO_OUTCOME";
        else if (["immediate_challenge", "obstacle"].includes(right.role?.roleId) && right.selectedFragments.some((f) => f.category === "warning")) type = "WARNING";
        attach({ relationId: "heuristic." + spread.spread_id + "." + a + "_" + b,
          type, nodeIds: [left.positionId, right.positionId], purpose, origin: "engine_synthesis_heuristic", evidence });
      }
      result.relations = [...relationMap.values()];
      // Stage 4B-1.1 changes presentation only, after the unchanged Astro return.
      // These short frames express existing roles; they are not card meanings.
      const contextualFrames = {
        past_origin: ["У истоков нынешнего положения ", "В прошлом "],
        present_problem: ["Теперь ", "В нынешнем положении "],
        present_situation: ["Теперь ", "В настоящем "],
        solution_or_outcome: ["Решение может открыться в том, что ", "Возможный исход таков: "],
        hidden_influence: ["За видимым ходом событий ", "За завесой происходящего "],
        obstacle: ["Препятствие связано с тем, что ", "Трудность пути состоит в том, что "],
        immediate_challenge: ["Испытание состоит в том, что ", "Ближайшее испытание связано с тем, что "],
        surroundings: ["Среди окружающих обстоятельств ", "Вокруг дела "],
        advice: ["Действуй, учитывая, что ", "Выбирай путь с учётом того, что "],
        conditional_outcome: ["Если последовать этому совету, ", "При следовании этому совету "],
        distant_past: ["У давних истоков ", "В далёком прошлом "],
        recent_past: ["В недавних событиях ", "Незадолго до нынешних событий "],
        best_possible_outcome: ["В лучшем из возможных исходов ", "Лучшее, на что можно надеяться: "],
        near_future: ["В ближайшем будущем ", "Впереди, в ближайшем будущем, "],
        internal_factors: ["Внутри ", "Во внутренних силах "],
        external_uncontrolled: ["Извне, вне твоей власти, ", "За пределами твоего контроля "],
        hopes_fears: ["В надеждах и страхах ", "В ожиданиях и сомнениях "],
        final_outcome: ["На исходе этого пути ", "Завершиться этот путь может тем, что "],
      };
      const renderingTrace = [];
      const sourceTemplateTrace = [];
      const themeLabels = new Map(data.card_semantics.tag_vocabulary.map((t) => [t.tag_id, t.label_ru]));
      const usedThemeTags = new Set();
      function variant(options, scope) {
        const index = stableHash(identity + "|render.v1.1|" + scope) % options.length;
        return { text: options[index], index };
      }
      function record(templateId, members, detail = {}) {
        renderingTrace.push({ templateId, origin: "engine_synthesis_heuristic",
          positionIds: members.map((s) => s.positionId), roleIds: members.map((s) => s.role.roleId),
          basisFragmentIds: members.flatMap((s) => s.selectedFragments.map((f) => f.fragmentId)), ...detail });
      }
      // Orthography only: lower a sentence initial and remove its final full stop
      // when joining clauses. Exact card names retain their capitals. No parsing,
      // inflection, keyword classification, or semantic comparison of prose.
      function clause(text, sign) {
        const body = text.endsWith(".") ? text.slice(0, -1) : text;
        return body.startsWith(sign.nameRu) ? body : body.charAt(0).toLowerCase() + body.slice(1);
      }
      function fragmentsClause(sign) {
        return sign.selectedFragments.map((f) => clause(f.textRu, sign)).join("; ");
      }
      function renderSign(sign) {
        const roleId = sign.role.roleId;
        if (["obstacle", "immediate_challenge"].includes(roleId) &&
            sign.semanticAnchor.tendency?.value === "favourable" && sign.semanticAnchor.themesRu.length > 1) {
          // Nominal source themes give a cautious challenge context without
          // inventing why a favourable sign obstructs the course of events.
          const names = sign.semanticAnchor.themesRu.map((x) => x.charAt(0).toLowerCase() + x.slice(1));
          const themes = names.slice(0, -1).join(", ") + " и " + names[names.length - 1];
          const frame = variant(["В центре испытания — {{themes}}.", "{{themes}} становятся средоточием испытания."], roleId + ".favourable");
          let text = frame.text.replace("{{themes}}", themes);
          text = text.charAt(0).toUpperCase() + text.slice(1);
          record("engine.context." + roleId + ".favourable." + frame.index, [sign],
            { basis: "existing_semantic_themes_and_explicit_favourable_tendency", sourceThemesRu: [...sign.semanticAnchor.themesRu], causalExplanation: null });
          return text;
        }
        const frame = variant(contextualFrames[roleId], roleId);
        const linked = result.relations.find((r) => roleId === "conditional_outcome" ? r.condition?.outcomePositionId === sign.positionId :
          roleId === "final_outcome" && r.type === "CONCLUSION" && r.nodeIds[1] === sign.positionId);
        record("engine.context." + roleId + "." + frame.index, [sign], {
          ...(linked ? { relationId: linked.relationId, relationOrigin: linked.origin } : {}),
          ...(sign.selectedFragments.some((f) => f.category === "warning") ? { warningIntegrated: true } : {}) });
        return frame.text + fragmentsClause(sign) + ".";
      }
      function renderPair(left, right, relation, temporal) {
        const type = relation?.type || "CONTINUATION";
        if (type === "REINFORCEMENT") {
          const shared = relation.evidence.sharedTags.filter((t) => themeLabels.has(t) && !usedThemeTags.has(t));
          if (shared.length) {
            const tag = shared[stableHash(identity + "|render.theme|" + relation.relationId) % shared.length];
            usedThemeTags.add(tag);
            const label = themeLabels.get(tag).toLowerCase();
            const frame = temporal ? "В давних истоках и недавних событиях повторяется мотив «" + label + "»: " :
              "В настоящем и внутренних силах повторяется мотив «" + label + "»: ";
            record(temporal ? "engine.reinforcement.temporal" : "engine.reinforcement.present_inner", [left, right],
              { relationId: relation.relationId, relationOrigin: relation.origin, sharedTag: tag, basis: relation.evidence.basis, compression: "one_shared_frame_two_distinct_clauses" });
            const leftClause = fragmentsClause(left), repeatedLabel = label + " ";
            const join = temporal ? "; недавно " : "; внутри ";
            // Literal surface deduplication after a tag was independently
            // established: reuse its existing subject, retain every predicate.
            if (leftClause.startsWith(repeatedLabel))
              return themeLabels.get(tag) + (temporal ? " у давних истоков " : " в настоящем ") +
                leftClause.slice(repeatedLabel.length) + join + fragmentsClause(right) + ".";
            return frame + leftClause + join + fragmentsClause(right) + ".";
          }
        }
        if (!temporal) {
          const frame = variant(contextualFrames.present_situation, "present_inner.present");
          const bridge = variant(type === "TENSION" ? ["; однако внутри ", "; но внутри "] : ["; рядом с этим внутри ", "; внутри же "], "present_inner." + type);
          record("engine.compare.present_inner." + type + "." + bridge.index, [left, right],
            { relationId: relation.relationId, relationOrigin: relation.origin, basis: relation.evidence.basis });
          return frame.text + fragmentsClause(left) + bridge.text + fragmentsClause(right) + ".";
        }
        return renderSign(left) + " " + renderSign(right);
      }
      const plans = PLANS[spread.spread_id];
      for (let index = 0; index < plans.length; index++) {
        const plan = plans[index];
        const members = plan.nodes.map((n) => byNumber.get(n));
        const sectionId = spread.spread_id + "." + plan.id;
        let text;
        const alternatives = [];
        if (plan.alternatives) {
          // An ordinal label distinguishes alternatives, never canonical moral paths.
          text = "Будущее расходится на два возможных направления. ";
          members.forEach((sign, i) => {
            const label = i === 0 ? "Первое направление" : "Второе направление";
            const fragmentText = sign.selectedFragments.map((f) => f.textRu).join(" ");
            alternatives.push({ alternativeId: "branch.direction_" + (i + 1), positionIds: [sign.positionId],
              groupId: plan.group, individualRoleId: null, selected: false, textRu: fragmentText });
            text += label + ": " + fragmentText + (i === 0 ? " " : "");
          });
        } else if (plan.group) {
          const frame = templates.get("role_frame." + groupMap.get(plan.group).role_id);
          text = frame.text_ru.replace("{{fragment}}", members.map((s) => s.selectedFragments.map((f) => f.textRu).join(" ")).join(" "));
        } else {
          if (spread.spread_id === "haloed_rosette" && plan.id === "situation_challenge") {
            const relation = result.relations.find((r) => r.purpose === "compare_internal_factors_with_present");
            text = renderPair(members[0], members[1], relation, false) + " " + renderSign(members[2]);
          } else if (spread.spread_id === "haloed_rosette" && plan.id === "foundations") {
            const relation = result.relations.find((r) => r.nodeIds[0] === members[0].positionId && r.nodeIds[1] === members[1].positionId);
            text = renderPair(members[0], members[1], relation, true);
          } else if (plan.id === "origin_present") {
            const first = renderSign(members[0]);
            const second = renderSign(members[1]);
            text = first.slice(0, -1) + "; " + second.charAt(0).toLowerCase() + second.slice(1);
          } else text = members.map(renderSign).join(" ");
        }
        // Branch's accepted paired forces and two future paragraphs stay intact.
        if (spread.spread_id === "branch" && index === plans.length - 1) {
          const closing = choose(["closing_01", "closing_02"], "closing");
          text += " " + closing.text_ru;
          sourceTemplateTrace.push({ templateId: closing.template_id, scope: "closing" });
        }
        const relevant = result.relations.filter((r) => r.nodeIds.some((id) => members.some((s) => s.positionId === id) || id === plan.group));
        result.prophecy.paragraphs.push(text);
        result.sections.push({ sectionId, positionIds: members.map((s) => s.positionId), groupId: plan.group || null,
          narrativeOrigin: "engine_synthesis_heuristic", textRu: text, alternatives,
          relationIds: relevant.map((r) => r.relationId),
          condition: relevant.find((r) => r.condition)?.condition || null });
        for (const sign of members) sign.mainParagraphIds.push(sectionId);
      }
      result.metadata.selectedSynthesisTemplates = sourceTemplateTrace;
      result.metadata.connectorCount = 0;
      result.metadata.synthesisVersion = "4b1.1.1";
      result.metadata.renderingTrace = renderingTrace;
      return result;
    }
    return Object.freeze({ engineVersion: ENGINE_VERSION, dataVersion: DATA_VERSION, supportedSpreads: Object.freeze([...SUPPORTED_SPREADS]), interpret });
  }
  return Object.freeze({ createEngine, stableHash, engineVersion: ENGINE_VERSION, dataVersion: DATA_VERSION });
});
