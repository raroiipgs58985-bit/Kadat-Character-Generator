/* Isolated Stage 5A structure/gate adapter. The production draw module is reused unchanged. */
(function (host, factory) {
  const node = typeof module === "object" && module.exports;
  const api = factory(
    node ? require("../production-data.js") : host.ImperialTarotProduction,
    node ? require("../ritual-session.js") : host.ImperialTarotSession,
  );
  if (node) module.exports = api;
  else host.ImperialTarotConvergence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (production, ritual) {
  "use strict";
  const freeze = (value) => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };
  // These are sequence/grouping coordinates, never meanings or thematic roles.
  const definition = freeze({
    spread_id: "convergence", card_count: 16, experimental: true,
    paths: Array.from({ length: 5 }, (_, i) => ({
      id: `path_${i + 1}`, indexes: [i * 3, i * 3 + 1, i * 3 + 2],
    })),
    convergence_index: 15,
  });
  const sessionData = freeze({
    version: production.version, cards: production.cards, spreads: [definition],
  });
  function structure(base) {
    return freeze({
      ...base,
      paths: Object.fromEntries(definition.paths.map((path) =>
        [path.id, path.indexes.map((i) => base.draws[i])])),
      convergence: base.draws[15],
    });
  }
  function create(question, options = {}) {
    if (typeof question !== "string" || !question.trim())
      throw new Error("A reader question is required");
    return structure(ritual.createSession(sessionData, "convergence", question, options));
  }
  function phase(session) {
    if (!session) return "entry";
    if (session.progress.opened_count === 16) return "complete";
    return session.progress.opened_count === 15 ? "awaiting_convergence" : "paths";
  }
  function update(session, action, index) {
    if (!session) return session;
    const p = session.progress;
    let next = session;
    switch (action) {
      case "reveal-path":
        if (p.opened_count < 15 && index === p.opened_count)
          next = ritual.update(session, "reveal", index);
        break;
      case "next":
        if (p.opened_count < 15) next = ritual.update(session, "next");
        break;
      case "inspect":
        if (Number.isInteger(index) && index >= 0 && index < p.opened_count)
          next = ritual.update(session, "focus", index);
        break;
      case "reveal-convergence":
        // This distinct action is the only route to XVI; next/focus/reveal-path cannot open it.
        if (p.opened_count === 15 && !p.finished) {
          next = ritual.update(session, "focus", 15);
          next = ritual.update(next, "reveal", 15);
          next = ritual.update(next, "finish");
        }
        break;
    }
    return next === session ? session : structure(next);
  }
  function restore(raw) {
    const base = ritual.restore(raw, sessionData);
    if (!base || !base.question.trim() ||
        base.progress.finished !== (base.progress.opened_count === 16) ||
        (base.progress.opened_count < 16 && base.progress.current_index === 15)) return null;
    return structure(base);
  }
  function toReaderInput(session) {
    if (phase(session) !== "complete") return null;
    const reference = (draw, index) => ({
      position: index + 1, card_id: draw.card_id, type: draw.type,
      ...(draw.type === "major" ? { orientation: draw.orientation } : {}),
    });
    return freeze({
      contract_version: "convergence-stage5a-v1",
      spread: "convergence", experimental: true,
      data_version: session.data_version, session_id: session.session_id,
      question: session.question,
      paths: Object.fromEntries(definition.paths.map((path) =>
        [path.id, path.indexes.map((i) => reference(session.draws[i], i))])),
      convergence: reference(session.convergence, 15),
    });
  }
  return freeze({ definition, create, update, restore, phase, toReaderInput });
});
