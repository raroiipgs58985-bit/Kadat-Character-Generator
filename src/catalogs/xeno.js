(() => {
  "use strict";

  const STORAGE_KEY = "kadat.generated-xeno-race.v1";
  const EXCLUDED_HUMAN_SPECIALTY_CATEGORIES = new Set([
    "Адепта Сороритас",
    "Квесторис",
    "Астартес",
  ]);
  const STATS = ["НС", "НР", "СЛ", "ВН", "ЛВ", "ИН", "СВ", "ВС", "ОЩ"];

  const FORMS = [
    {
      id: "biped",
      min: 1,
      max: 25,
      name: "Двуногая",
      description:
        "Форма по умолчанию без дополнительных преимуществ или недостатков.",
    },
    {
      id: "animal",
      min: 26,
      max: 65,
      name: "Животная",
      description: "Звериная форма, часто многоногая и коренастая.",
    },
    {
      id: "crawler",
      min: 66,
      max: 75,
      name: "Ползучая",
      description: "Червеобразная или инсектоидная форма.",
    },
    {
      id: "flying",
      min: 76,
      max: 95,
      name: "Летучая",
      description: "Крылья, газовые пузыри или иной способ полёта и парения.",
    },
    {
      id: "amorphous",
      min: 96,
      max: 100,
      name: "Аморфная",
      description: "Существо без постоянной строгой формы.",
    },
  ];

  const SIZES = [
    {
      id: "-3",
      value: -3,
      name: "Размер −3",
      example: "Токс-скарабей",
      description: "−30 НР, 1/4 СЛ, только 1 рана",
    },
    {
      id: "-2",
      value: -2,
      name: "Размер −2",
      example: "Серво-череп, крыса",
      description: "−20 НР, 1/2 СЛ, −6 ран",
    },
    {
      id: "-1",
      value: -1,
      name: "Размер −1",
      example: "Ребёнок, карлик, пепельный червь",
      description: "−10 НР, −5 СЛ, −3 раны",
    },
    {
      id: "0",
      value: 0,
      name: "Размер 0",
      example: "Человек",
      description: "Без модификаторов",
    },
    {
      id: "1",
      value: 1,
      name: "Размер +1",
      example: "Огрин, молодой грокс, корова",
      description: "+10 НР, +10 СЛ, +10 ВН, +1к10 ран",
    },
    {
      id: "2",
      value: 2,
      name: "Размер +2",
      example: "Взрослый грокс, носорог",
      description: "Страх, +20 НР, +20 СЛ, +15 ВН, +2к10 ран",
    },
    {
      id: "3",
      value: 3,
      name: "Размер +3",
      example: "Крупный слон",
      description: "Страх, +30 НР, +20 СЛ, +20 ВН, +4к10 ран",
    },
    {
      id: "4",
      value: 4,
      name: "Размер +4",
      example: "Тиранозавр",
      description: "Страх, +35 НР, +30 СЛ, +30 ВН, +5к10 ран",
    },
    {
      id: "5",
      value: 5,
      name: "Размер +5",
      example: "Взрослый кит, спинозавр",
      description: "Страх, +40 НР, +40 СЛ, +40 ВН, +6к10 ран",
    },
    {
      id: "6",
      value: 6,
      name: "Размер +6",
      example: "Мегафауна, песчаные черви",
      description: "Страх, +50 НР, +50 СЛ, +50 ВН, +7к10 ран",
    },
  ];

  const RACE_ARCHETYPES = [
    {
      id: "atavistic",
      min: 1,
      max: 20,
      name: "Атавистические",
      description:
        "Повторите бросок по столбцу ксено-зверей, игнорируя результат «Стадные».",
    },
    {
      id: "stealthy",
      min: 21,
      max: 30,
      name: "Скрытные",
      description:
        "+10 ИН и ВС; Бдительность, Скрытность, Обман и Ловкость рук.",
    },
    {
      id: "warlike",
      min: 31,
      max: 60,
      name: "Воинственные",
      description: "+1к10 к НС, НР, СЛ и ЛВ; боевые преимущества.",
    },
    {
      id: "exotic",
      min: 61,
      max: 70,
      name: "Экзотические",
      description:
        "+10 к любым двум характеристикам, Страх (1), необычная особенность.",
    },
    {
      id: "wild",
      min: 71,
      max: 80,
      name: "Дикие",
      description: "+1к10 к НР, СЛ, ВН и ВС; −1к10 ИН; +1к10 ран.",
    },
    {
      id: "greedy",
      min: 81,
      max: 90,
      name: "Жадные",
      description: "+1к10 НС и ИН; навыки торговли и обмана.",
    },
    {
      id: "mechanical",
      min: 91,
      max: 95,
      name: "Механические",
      description: "+10 ИН, −10 ОЩ, минимум один имплант; Машина по выбору.",
    },
    {
      id: "psykers",
      min: 96,
      max: 97,
      name: "Псайкеры",
      description: "−10 НР и СЛ, +10 СВ, Пси-рейтинг 2 и пси-силы.",
    },
    {
      id: "fading",
      min: 98,
      max: 100,
      name: "Исчезающие",
      description: "Бестелесные или фазовые существа.",
    },
  ];

  const BEAST_ARCHETYPES = [
    {
      id: "herd",
      min: 1,
      max: 20,
      name: "Стадные",
      description:
        "+1к10 СЛ и ран, Пугливые и вероятностные защитные признаки.",
    },
    {
      id: "dark",
      min: 21,
      max: 30,
      name: "Живущие во тьме",
      description: "+1к10 СЛ и ВН, Слепой, Сверхчувства (30 м).",
    },
    {
      id: "predator",
      min: 31,
      max: 60,
      name: "Хищные",
      description: "Сильные хищники с природным оружием и ночным зрением.",
    },
    {
      id: "scavenger",
      min: 61,
      max: 70,
      name: "Падальщики",
      description: "+1к10 НР и ВН, сопротивление ядам и ночное зрение.",
    },
    {
      id: "arboreal",
      min: 71,
      max: 80,
      name: "Древесные",
      description: "+10 ЛВ, Акробатика +20 и таланты подвижности.",
    },
    {
      id: "apex",
      min: 81,
      max: 90,
      name: "Верховные",
      description: "+1к10 ИН и ОЩ, +5 ВС, +1к10 ран и два любых таланта.",
    },
    {
      id: "warped",
      min: 91,
      max: 95,
      name: "Искажённые",
      description: "Мутации, усиленные СЛ и ВН, Страх и Неистовство.",
    },
    {
      id: "silicate",
      min: 96,
      max: 97,
      name: "Кремниевые",
      description:
        "Кристаллическая жизнь с природной бронёй и сверххарактеристиками.",
    },
    {
      id: "gestalt",
      min: 98,
      max: 100,
      name: "Гештальт",
      description: "Колония существ, действующая как единый организм.",
    },
  ];

  const FEATURES = [
    {
      id: "keen-sense",
      min: 1,
      max: 10,
      name: "Обострённые чувства",
      description: "Выберите одно из пяти чувств.",
    },
    {
      id: "natural-armour",
      min: 11,
      max: 20,
      name: "Природная броня",
      description: "Природная броня (1к5); если уже есть, +2 к рейтингу.",
    },
    {
      id: "natural-weapon",
      min: 21,
      max: 30,
      name: "Природное оружие",
      description:
        "Когти, рога или зубы; если уже есть — Смертельное природное оружие.",
    },
    {
      id: "strong",
      min: 31,
      max: 35,
      name: "Сильное",
      description: "СЛ +1к10.",
    },
    {
      id: "tough",
      min: 36,
      max: 40,
      name: "Выносливое",
      description: "ВН +1к10.",
    },
    { id: "fast", min: 41, max: 45, name: "Быстрое", description: "ЛВ +1к10." },
    {
      id: "durable",
      min: 46,
      max: 50,
      name: "Стойкое",
      description: "Раны +1к10.",
    },
    {
      id: "night-adaptation",
      min: 51,
      max: 55,
      name: "Ночная адаптация",
      description: "Получает Ночное зрение.",
    },
    {
      id: "frightening",
      min: 56,
      max: 60,
      name: "Пугающий",
      description: "Страх (1); если уже есть, +1 к рейтингу.",
    },
    {
      id: "nimble",
      min: 61,
      max: 62,
      name: "Юркое",
      description: "Уклонение и Кошачье приземление.",
    },
    {
      id: "bio-shock",
      min: 63,
      max: 64,
      name: "Био-шоковое",
      description: "Специальная шоковая атака 1к10+бСЛ−1 Э.",
    },
    {
      id: "flexible",
      min: 65,
      max: 66,
      name: "Гибкое",
      description: "Акробатика +10.",
    },
    {
      id: "venomous",
      min: 67,
      max: 70,
      name: "Ядовитое",
      description: "Природное оружие получает Токсичное.",
    },
    {
      id: "extra-limbs",
      min: 71,
      max: 74,
      name: "Дополнительные конечности",
      description:
        "Многорукое или Многоногое, Амбидекстрия, Быстрая атака, Акробатика +20.",
    },
    {
      id: "life-sustain",
      min: 75,
      max: 77,
      name: "Поддержание жизни",
      description:
        "Может долго обходиться без кислорода и действовать в опасной среде.",
    },
    {
      id: "resistant",
      min: 78,
      max: 80,
      name: "Устойчивый",
      description: "Сопротивляемость (Яды).",
    },
    {
      id: "fear-bearer",
      min: 81,
      max: 83,
      name: "Несущий страх",
      description: "Страх (2); если уже есть, +2, максимум 5.",
    },
    {
      id: "regeneration",
      min: 84,
      max: 85,
      name: "Регенерация",
      description: "Регенерация (1/2 бВН).",
    },
    {
      id: "breath-weapon",
      min: 86,
      max: 87,
      name: "Дыхательное оружие",
      description:
        "Выстрел шипом или кислотное, токсичное либо огненное дыхание.",
    },
    {
      id: "frenzied",
      min: 88,
      max: 89,
      name: "Неистовое",
      description:
        "Неистовство, Стальная челюсть и усиление СЛ при тяжёлых ранениях.",
    },
    {
      id: "unnatural-agility",
      min: 90,
      max: 91,
      name: "Сверх ЛВ",
      description: "СверхЛВ (1/2 бЛВ).",
    },
    {
      id: "unnatural-toughness",
      min: 92,
      max: 93,
      name: "Сверх ВН",
      description: "СверхВН (1/2 бВН).",
    },
    {
      id: "unnatural-strength",
      min: 94,
      max: 95,
      name: "Сверх СЛ",
      description: "СверхСЛ (1/2 бСЛ).",
    },
    {
      id: "warp-touched",
      min: 96,
      max: 96,
      name: "Затронутые Варпом",
      description: "Получает одну мутацию.",
    },
    {
      id: "acid-blood",
      min: 97,
      max: 98,
      name: "Кислотная кровь",
      description: "При тяжёлом ранении извергает едкую кровь.",
    },
    {
      id: "innate-psyker",
      min: 99,
      max: 100,
      name: "Врождённые псайкеры",
      description: "Пси-рейтинг 1 и одна малая пси-сила.",
    },
  ];

  function findByRoll(items, roll) {
    const value = Math.max(1, Math.min(100, Number(roll) || 1));
    return items.find((item) => value >= item.min && value <= item.max) ?? null;
  }

  function isHumanSpecialtyAllowed(specialty, gender = "unspecified") {
    if (!specialty) return false;
    if (specialty.id === "none") return true;
    if (!(specialty.allowedRaces ?? []).includes("human")) return false;
    if (EXCLUDED_HUMAN_SPECIALTY_CATEGORIES.has(specialty.category))
      return false;
    if (specialty.gender && specialty.gender !== gender) return false;
    return true;
  }

  function installRace(race) {
    if (!race || !window.KADAT_DATA?.races) return null;
    const races = window.KADAT_DATA.races;
    for (let index = races.length - 1; index >= 0; index -= 1) {
      if (races[index]?.generatedXeno) races.splice(index, 1);
    }
    races.push(race);
    return race;
  }

  function saveRace(race) {
    if (
      window.KadatStorage?.local &&
      !window.KadatStorage.local.write(STORAGE_KEY, race)
    )
      return null;
    return installRace(race);
  }
  function loadRace() {
    const parsed = window.KadatStorage?.local?.read(
      STORAGE_KEY,
      null,
      (value) => window.KadatSchemas.validateXenoRace(value, STATS),
    );
    if (parsed) return installRace(parsed);
    return null;
  }

  window.KADAT_XENO_DATA = {
    STORAGE_KEY,
    stats: STATS,
    forms: FORMS,
    sizes: SIZES,
    raceArchetypes: RACE_ARCHETYPES,
    beastArchetypes: BEAST_ARCHETYPES,
    features: FEATURES,
    excludedHumanSpecialtyCategories: EXCLUDED_HUMAN_SPECIALTY_CATEGORIES,
    isHumanSpecialtyAllowed,
    findByRoll,
    installRace,
    saveRace,
    loadRace,
  };

  loadRace();
})();
