/* Read-only bridge from a completed Stage 3 session. Not loaded by production. */
(function (host, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else host.ImperialTarotInterpretationSessionV1 = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function reject(code, message) {
    const problem = new Error(message);
    problem.name = "InterpretationSessionError";
    problem.code = code;
    throw problem;
  }
  function fromCompletedSession(engine, session, production, options = {}) {
    if (!engine || typeof engine.interpret !== "function" || engine.dataVersion !== "1.0.0")
      reject("ENGINE", "A Stage 4B-1 engine with Data V1.0.0 is required");
    if (!production || typeof production.getCard !== "function" || !Array.isArray(production.spreads))
      reject("PRODUCTION_DATA", "Stage 3 production data is required");
    if (!session || session.version !== 2 || session.data_version !== production.version)
      reject("SESSION_VERSION", "Session version or production data identity does not match");
    if (typeof session.session_id !== "string" || !session.session_id || typeof session.question !== "string")
      reject("SESSION_METADATA", "Session identity and display question must be preserved");
    const spread = production.spreads.find((row) => row.spread_id === session.spread_id);
    if (!spread || spread.startable === false || !Number.isInteger(spread.card_count))
      reject("SESSION_SPREAD", "This spread is not enabled in Stage 3");
    if (!Array.isArray(session.draws) || session.draws.length !== spread.card_count)
      reject("SESSION_CARDS", "The session has an invalid draw count");
    const progress = session.progress;
    if (!progress || progress.finished !== true || progress.opened_count !== session.draws.length ||
        !Number.isInteger(progress.current_index) || progress.current_index < 0 || progress.current_index >= session.draws.length)
      reject("SESSION_UNFINISHED", "Interpretation requires a fully revealed, completed session");
    const cards = session.draws.map((draw) => {
      const card = production.getCard(draw.card_id);
      if (!card || draw.type !== card.type) reject("SESSION_CARD_ID", "Session card identity does not match production");
      let state;
      if (card.type === "major") {
        if (!["upright", "reversed"].includes(draw.orientation)) reject("SESSION_STATE", "Invalid Major orientation");
        state = draw.orientation;
      } else {
        if (Object.prototype.hasOwnProperty.call(draw, "orientation")) reject("SESSION_STATE", "Minor orientation must be absent");
        state = "standard";
      }
      const art = card.type === "major" ? card[state] : card;
      if (draw.image !== art.image || draw.artwork_id !== art.artwork_id || draw.identity_id !== art.identity_id)
        reject("SESSION_ARTWORK", "Session artwork identity does not match the existing assignment");
      return { cardId: card.card_id, state };
    });
    return engine.interpret({ spreadId: session.spread_id, cards,
      seed: options.seed ?? session.session_id, question: session.question });
  }
  return Object.freeze({ fromCompletedSession });
});
