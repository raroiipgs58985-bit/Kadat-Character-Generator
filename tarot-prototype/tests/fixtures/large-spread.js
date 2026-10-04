/* Internal developer fixture. Not an Emperor's Tarot source spread. */
(function (host, factory) {
  const fixture = factory();
  if (typeof module === "object" && module.exports) module.exports = fixture;
  else host.ImperialTarotStressFixture = fixture;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return Object.freeze({
    spread_id: "LARGE_SPREAD_STRESS_TEST",
    name_en: "LARGE_SPREAD_STRESS_TEST",
    name_ru: "Технический тест · 24 позиции",
    internal_fixture: true,
    card_count: 24,
    source_status: "INTERNAL_TEST_FIXTURE",
    source_pages: [],
    map_width: 300,
    map_height: 390,
    layout_note_ru:
      "Внутренняя конфигурация 4 × 6 для проверки движка и UX. Не является каноническим раскладом. У позиций нет функций или толкований.",
    positions: Object.freeze(
      Array.from({ length: 24 }, (_, i) =>
        Object.freeze({
          name_ru: null,
          name_en: null,
          x: 42 + (i % 4) * 72,
          y: 35 + Math.floor(i / 4) * 64,
          horizontal: false,
        }),
      ),
    ),
  });
});
