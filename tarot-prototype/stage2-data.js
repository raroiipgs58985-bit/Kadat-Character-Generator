/* Stage II demo only. Names from The Emperor's Tarot v1.30;
   no meanings, final assignments, or Blanche images are included. */
(function (host, factory) {
  const data = factory();
  if (typeof module === "object" && module.exports) module.exports = data;
  else host.ImperialTarotDemo = data;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const illustrations = [
    {
      image: "assets/demo-pilgrim.svg",
      alt: "Демонстрационная SVG-гравюра: путник перед готической аркой.",
    },
    {
      image: "assets/demo-prophet.svg",
      alt: "Демонстрационная SVG-гравюра: человек с книгой и поднятой рукой.",
    },
    {
      image: "assets/demo-astronomican.svg",
      alt: "Демонстрационная SVG-гравюра: высокая башня с лучом света.",
    },
  ];
  const majors = [
    ["major_00", "0", "The Pilgrim", "Пилигрим"],
    ["major_01", "I", "The Astropath (the Sorcerer)", "Астропат (колдун)"],
    ["major_02", "II", "The Prophet", "Пророк"],
    ["major_11", "XI", "The Titan", "Титан"],
    ["major_16", "XVI", "The Hulk", "Остов (Халк)"],
    ["major_17", "XVII", "The Astronomican", "Астрономикон"],
  ].map(([card_id, number, name_en, name_ru], i) => ({
    card_id,
    type: "major",
    number,
    name_en,
    name_ru,
    upright: illustrations[i % 3],
    reversed: illustrations[(i + 1) % 3],
  }));
  const minorNames = [
    ["Adeptio", "Ace", "The Inquisitor", "Инквизитор"],
    ["Adeptio", "2", "The Scribe", "Писарь"],
    ["Adeptio", "3", "The Administrator", "Администратор"],
    ["Adeptio", "4", "The Arbitrator", "Арбитр"],
    ["Adeptio", "5", "The Sanctioned Psyker", "Санкционированный псайкер"],
    ["Adeptio", "6", "The Tech-priest", "Техножрец"],
    [
      "Adeptio",
      "7",
      "The Sister of Battle (the Templar)",
      "Сестра Битвы (Храмовник)",
    ],
    ["Adeptio", "8", "The Assassin", "Ассассин"],
    ["Adeptio", "9", "The Preacher", "Проповедник"],
    ["Adeptio", "10", "The Angel of Death", "Ангел Смерти"],
    ["Adeptio", "Servant", "The Custodian", "Кустодий"],
    ["Adeptio", "Champion", "The Primarch", "Примарх"],
    ["Adeptio", "Lord", "The Regent (the Sigillite)", "Регент (Сигилит)"],
    ["Adeptio", "Master", "The Warmaster", "Мастер Войны"],
    ["Discordia", "Ace", "The Harlequin", "Арлекин"],
    ["Discordia", "2", "The Xeno", "Ксенос"],
    ["Discordia", "3", "The Heretic", "Еретик"],
    ["Discordia", "4", "The Mutant", "Мутант"],
    ["Discordia", "5", "The Witch/Warlock", "Ведьма / колдун"],
    ["Discordia", "6", "The Vile Serpent", "Гнусный Змей"],
    ["Discordia", "7", "The Unclean One", "Нечистый"],
    ["Discordia", "8", "The Lord of Blood", "Лорд Крови"],
  ];
  const cards = [
    ...majors,
    ...minorNames.map(([suit, rank, name_en, name_ru], i) => ({
      card_id: `${suit.toLowerCase()}_${String(suit === "Adeptio" ? i + 1 : i - 13).padStart(2, "0")}`,
      type: "minor",
      suit,
      rank,
      name_en,
      name_ru,
      ...illustrations[i % 3],
    })),
  ];
  const position = (name_ru, name_en, x, y, horizontal = false) => ({
    name_ru,
    name_en,
    x,
    y,
    horizontal,
  });
  const spreads = [
    {
      spread_id: "imperator",
      name_en: "The Imperator",
      name_ru: "Император",
      card_count: 3,
      purpose_ru: "Простой, конкретный вопрос. Три карты в ряд, слева направо.",
      source_status: "SOURCE_SUPPORTED",
      source_pages: [20],
      map_width: 300,
      map_height: 130,
      layout_note_ru: "Три позиции в ряд.",
      positions: [
        position("Прошлое", "Past", 50, 65),
        position("Настоящее / вопрос", "Present / problem", 150, 65),
        position(
          "Император / возможный исход",
          "Imperator / suggested solution or possible outcome",
          250,
          65,
        ),
      ],
    },
    {
      spread_id: "branch",
      name_en: "The Branch (Traitor or True)",
      name_ru: "Ветвь",
      card_count: 6,
      purpose_ru: "Два возможных выбора и два направления будущего.",
      source_status: "SOURCE_SUPPORTED",
      source_pages: [20],
      map_width: 340,
      map_height: 320,
      layout_note_ru:
        "III–IV описаны совместно как силы и варианты; V–VI — как два направления. Отдельные функции внутри пар не заданы.",
      positions: [
        position("Прошлое", "Past", 40, 160),
        position("Настоящее / вопрос", "Present / problem", 115, 160),
        position(
          "Силы и варианты · III",
          "Forces / options (shared pair)",
          195,
          220,
        ),
        position(
          "Силы и варианты · IV",
          "Forces / options (shared pair)",
          195,
          95,
        ),
        position(
          "Направление будущего · V",
          "Branching future (shared pair)",
          290,
          275,
        ),
        position(
          "Направление будущего · VI",
          "Branching future (shared pair)",
          290,
          45,
        ),
      ],
    },
    {
      spread_id: "throne_of_terra",
      name_en: "The Throne of Terra",
      name_ru: "Трон Терры",
      card_count: 7,
      purpose_ru: "Более подробное рассмотрение вопроса. Перевёрнутая V.",
      source_status: "SOURCE_SUPPORTED",
      source_pages: [21],
      map_width: 400,
      map_height: 290,
      layout_note_ru: "Схема и порядок соответствуют рисунку источника.",
      positions: [
        position("Прошлое", "Past", 35, 250),
        position("Настоящее", "Present", 90, 180),
        position("Скрытые влияния", "Hidden influences", 145, 110),
        position("Препятствия", "Obstacles / challenges", 200, 40),
        position("Окружение", "Surroundings", 255, 110),
        position("Совет", "Advice", 310, 180),
        position(
          "Исход при следовании совету",
          "Outcome if advice is followed",
          365,
          250,
        ),
      ],
    },
    {
      spread_id: "haloed_rosette",
      name_en: "The Haloed Rosette",
      name_ru: "Ореол Росетты",
      card_count: 10,
      purpose_ru: "Развёрнутый расклад: крест и четыре позиции над ним.",
      source_status: "SOURCE_SUPPORTED",
      source_pages: [22],
      map_width: 320,
      map_height: 380,
      layout_note_ru:
        "I–II занимают общую центральную область. Их кнопки немного разнесены для удобного выбора; II пересекает I на рисунке источника.",
      positions: [
        position("Текущая ситуация", "Present situation", 160, 207),
        position(
          "Ближайшее препятствие",
          "Immediate challenge",
          160,
          261,
          true,
        ),
        position(
          "Далёкое прошлое / основа",
          "Distant past / foundation",
          160,
          345,
        ),
        position("Недавнее прошлое", "Recent past", 75, 245),
        position("Лучший возможный исход", "Best hoped-for outcome", 245, 245),
        position("Ближайшее будущее", "Immediate future", 160, 126),
        position(
          "Факторы / внутренние чувства",
          "Factors / inner feelings",
          45,
          35,
        ),
        position("Внешние влияния", "External influences", 122, 35),
        position("Надежды / страхи", "Hopes / fears", 199, 35),
        position("Итог", "Final outcome", 276, 35),
      ],
    },
    {
      spread_id: "astro_horoscope",
      name_en: "The Astro-Horoscope",
      name_ru: "Астро-гороскоп",
      card_count: null,
      startable: false,
      purpose_ru: "Свободный сложный расклад.",
      source_status: "SOURCE_FLEXIBLE",
      source_pages: [21],
      map_width: null,
      map_height: null,
      layout_note_ru:
        "Источник не задаёт единого количества карт или фиксированной схемы. Допускаются ряды и столбцы, большой круг, концентрические круги, звезда и другие формы. Запуск пока недоступен.",
      positions: [],
    },
  ];
  function freeze(value) {
    if (value && typeof value === "object") {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  return freeze({
    version: "stage2-demo-v1",
    cards,
    spreads,
    source: "The Emperor's Tarot v1.30 (provided PDF; PDF pages 7, 20–22)",
    demo_note:
      "28 card identities, three reused local SVG illustrations. Illustrations do not represent final curation.",
  });
});
