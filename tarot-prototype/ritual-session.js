/* Pure session engine. No DOM, interpretation, network, or Kadat storage. */
(function (host, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  else host.ImperialTarotSession = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const VERSION = 1;
  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  function uint32() {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
  }
  function randomBelow(size, random = uint32) {
    if (!Number.isInteger(size) || size < 1 || size > 0x100000000)
      throw new Error("Invalid random range");
    // Rejection sampling avoids modulo bias in the without-replacement draw.
    const limit = Math.floor(0x100000000 / size) * size;
    let value;
    do {
      value = random();
      if (!Number.isInteger(value) || value < 0 || value >= 0x100000000)
        throw new Error("Invalid uint32");
    } while (value >= limit);
    return value % size;
  }
  function resolveCard(card, orientation) {
    return card.type === "major" ? card[orientation] : card;
  }
  function questionStatus(text) {
    return text.length ? "QUESTION_STATED" : "QUESTION_UNSPOKEN";
  }
  function createSession(data, spreadId, question = "", options = {}) {
    const spread = data.spreads.find((x) => x.spread_id === spreadId);
    if (
      !spread ||
      spread.startable === false ||
      !Number.isInteger(spread.card_count) ||
      spread.card_count < 1 ||
      spread.card_count > data.cards.length ||
      new Set(data.cards.map((x) => x.card_id)).size !== data.cards.length
    )
      throw new Error("Invalid deck or spread");
    const random = options.randomUint32 || uint32;
    const pool = [...data.cards];
    // All card identities are selected first; independent orientation draws follow.
    for (let i = 0; i < spread.card_count; i++) {
      const j = i + randomBelow(pool.length - i, random);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const draws = pool.slice(0, spread.card_count).map((card) => {
      const draw = { card_id: card.card_id, type: card.type };
      if (card.type === "major")
        draw.orientation =
          randomBelow(2, random) === 0 ? "upright" : "reversed";
      const art = resolveCard(card, draw.orientation);
      draw.image = art.image;
      return draw;
    });
    const questionText = question == null ? "" : String(question);
    return freeze({
      version: VERSION,
      data_version: data.version,
      session_id: options.sessionId || globalThis.crypto.randomUUID(),
      spread_id: spreadId,
      question: questionText,
      question_status: questionStatus(questionText),
      draws,
      progress: { opened_count: 0, current_index: 0, finished: false },
    });
  }
  function update(session, action, index) {
    const p = session.progress,
      n = session.draws.length;
    let progress;
    switch (action) {
      case "reveal":
        if (
          p.finished ||
          index !== p.current_index ||
          index !== p.opened_count ||
          index >= n
        )
          return session;
        progress = { ...p, opened_count: p.opened_count + 1 };
        break;
      case "focus":
        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= n ||
          index > p.opened_count
        )
          return session;
        progress = { ...p, current_index: index };
        break;
      case "next":
        if (p.current_index >= p.opened_count || p.opened_count >= n)
          return session;
        progress = { ...p, current_index: p.opened_count };
        break;
      case "finish":
        if (p.opened_count !== n || p.finished) return session;
        progress = { ...p, finished: true };
        break;
      default:
        return session;
    }
    // Original draws (including orientations and art state) are reused verbatim.
    return freeze({ ...session, progress });
  }
  function restore(raw, data, options = {}) {
    try {
      const s = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (
        !s ||
        s.version !== VERSION ||
        s.data_version !== data.version ||
        typeof s.session_id !== "string" ||
        !s.session_id ||
        typeof s.question !== "string"
      )
        return null;
      const spreadId = options.spreadAliases?.[s.spread_id] || s.spread_id;
      const spread = data.spreads.find((x) => x.spread_id === spreadId);
      if (
        !spread ||
        spread.startable === false ||
        !Number.isInteger(spread.card_count) ||
        spread.card_count < 1 ||
        !Array.isArray(s.draws) ||
        s.draws.length !== spread.card_count ||
        new Set(s.draws.map((x) => x.card_id)).size !== s.draws.length
      )
        return null;
      const draws = s.draws.map((draw) => {
        const card = data.cards.find((x) => x.card_id === draw.card_id);
        if (!card || card.type !== draw.type) throw new Error("Unknown card");
        if (
          card.type === "major"
            ? !["upright", "reversed"].includes(draw.orientation)
            : Object.hasOwn(draw, "orientation")
        )
          throw new Error("Invalid orientation");
        if (draw.image !== resolveCard(card, draw.orientation).image)
          throw new Error("Wrong artwork state");
        const result = {
          card_id: draw.card_id,
          type: draw.type,
        };
        if (card.type === "major") result.orientation = draw.orientation;
        result.image = draw.image;
        return result;
      });
      const p = s.progress,
        n = draws.length;
      if (
        !p ||
        !Number.isInteger(p.opened_count) ||
        p.opened_count < 0 ||
        p.opened_count > n ||
        !Number.isInteger(p.current_index) ||
        p.current_index < 0 ||
        p.current_index >= n ||
        p.current_index > p.opened_count ||
        typeof p.finished !== "boolean" ||
        (p.finished && p.opened_count !== n)
      )
        return null;
      return freeze({
        version: VERSION,
        data_version: data.version,
        session_id: s.session_id,
        spread_id: spreadId,
        question: s.question,
        question_status: questionStatus(s.question),
        draws,
        progress: {
          opened_count: p.opened_count,
          current_index: p.current_index,
          finished: p.finished,
        },
      });
    } catch {
      return null;
    }
  }
  return Object.freeze({
    createSession,
    update,
    restore,
    randomBelow,
    resolveCard,
    questionStatus,
  });
});
