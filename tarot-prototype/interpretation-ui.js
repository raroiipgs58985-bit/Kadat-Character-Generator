/* Stage 4B-2 presentation bridge. The accepted interpretation engine stays frozen. */
(() => {
  "use strict";
  const production = window.ImperialTarotProduction;
  const frozen = window.ImperialTarotInterpretationDataV1;
  const engine = window.ImperialTarotInterpretationV1.createEngine(frozen);
  const adapter = window.ImperialTarotInterpretationSessionV1;
  const astro = frozen.spread_semantics.spreads.find(
    (spread) => spread.spread_id === "astro_horoscope",
  );

  // Stage 3 disabled Astro before the accepted 24-card Stage 4A record existed.
  // Project that existing record into session/UI shape; do not edit source
  // definitions or assign a map, individual roles, houses or reading order.
  const sessionData = Object.freeze({
    ...production,
    spreads: Object.freeze(production.spreads.map((spread) =>
      spread.spread_id === astro.spread_id
        ? Object.freeze({
            ...spread,
            card_count: astro.card_count,
            startable: true,
            deferred_review: true,
            positions: Object.freeze(astro.positions.map((position) =>
              Object.freeze({ position: position.number, name_ru: null }),
            )),
          })
        : spread,
    )),
  });
  let cachedSession = null;
  let cachedReading = null;

  function readCompleted(session) {
    // Gate before both the cache and adapter: no interpretation calls at reveal.
    if (!session?.progress.finished ||
        session.progress.opened_count !== session.draws.length)
      throw new Error("Reading requires the final reveal");
    if (cachedSession?.session_id === session.session_id &&
        cachedSession.draws === session.draws &&
        cachedSession.question === session.question)
      return cachedReading;
    const reading = adapter.fromCompletedSession(engine, session, sessionData);
    cachedSession = session;
    cachedReading = reading;
    return reading;
  }

  function clear() {
    cachedSession = null;
    cachedReading = null;
  }
  window.ImperialTarotReadingUI = Object.freeze({ sessionData, readCompleted, clear });
})();
