/* Static production adapter. Source lookups only: no interpretation or AI. */
(function (host, factory) {
  const content =
    typeof module === "object" && module.exports
      ? require("./data/content.js")
      : host.ImperialTarotContent;
  const data = factory(content);
  if (typeof module === "object" && module.exports) module.exports = data;
  else host.ImperialTarotProduction = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function (content) {
  "use strict";
  function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  function roman(n) {
    if (n === 0) return "0";
    let text = "";
    for (const [value, glyph] of [
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ])
      while (n >= value) {
        text += glyph;
        n -= value;
      }
    return text;
  }
  const cards = content.cards.map((c) =>
    c.arcana === "major"
      ? {
          ...c,
          number: roman(c.index),
          upright: c.artwork.upright,
          reversed: c.artwork.reversed,
        }
      : { ...c, ...c.artwork },
  );
  const byId = new Map(cards.map((c) => [c.id, c]));
  function getCard(id) {
    return byId.get(id) || null;
  }
  function getMeaning(id, orientation) {
    const card = getCard(id);
    if (!card) throw new Error("Unknown production card");
    if (card.arcana === "major") {
      if (!["upright", "reversed"].includes(orientation))
        throw new Error("Major state required");
      return freeze({
        meaning_en: card[orientation + "_meaning_en"],
        meaning_ru: card[orientation + "_meaning_ru"],
        variations: card.variations,
        source: card.source,
      });
    }
    if (orientation !== undefined)
      throw new Error("Minor has no orientation state");
    return freeze({
      symbolizes_en: card.symbolizes_en,
      symbolizes_ru: card.symbolizes_ru,
      source: card.source,
    });
  }
  function getReadingContext(session, index) {
    const draw = session.draws[index];
    const spread = content.spreads.find(
      (s) => s.spread_id === session.spread_id,
    );
    if (!draw || !spread?.positions[index])
      throw new Error("Unknown source position");
    const card = getCard(draw.card_id);
    if (!card || session.data_version !== content.version)
      throw new Error("Incompatible production session");
    const artwork =
      card.arcana === "major" ? card[draw.orientation] : card.artwork;
    return freeze({
      card: {
        id: card.id,
        name_en: card.name_en,
        name_ru: card.name_ru,
        arcana: card.arcana,
        suit: card.suit,
        number_or_rank: card.number_or_rank,
      },
      ...(card.arcana === "major" ? { orientation: draw.orientation } : {}),
      artwork,
      meaning: getMeaning(card.id, draw.orientation),
      spread_id: spread.spread_id,
      position: spread.positions[index],
      question: session.question,
      question_status: session.question_status,
    });
  }
  return freeze({
    version: content.version,
    production: true,
    cards,
    spreads: content.spreads,
    getCard,
    getMeaning,
    getReadingContext,
  });
});
