(() => {
  "use strict";

  const DATA = typeof window !== "undefined" ? window.KADAT_XENO_DATA : null;
  const STATS = ["НС", "НР", "СЛ", "ВН", "ЛВ", "ИН", "СВ", "ВС", "ОЩ"];

  const clone = value => JSON.parse(JSON.stringify(value));
  const clampStat = value => Math.max(0, Math.round(Number(value) || 0));
  const bonus = value => Math.floor(clampStat(value) / 10);

  function mulberry32(seed) {
    let value = Number(seed) >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function die(sides, rng = Math.random) {
    return Math.floor(rng() * sides) + 1;
  }

  function dice(count, sides, rng = Math.random) {
    let total = 0;
    for (let index = 0; index < count; index += 1) total += die(sides, rng);
    return total;
  }

  function d100(rng = Math.random) { return die(100, rng); }

  function baseProfile(type, rng = Math.random) {
    const isRace = type === "race";
    const stats = {
      НС: isRace ? dice(2, 10, rng) + 15 : 0,
      НР: dice(2, 10, rng) + (isRace ? 15 : 20),
      СЛ: dice(2, 10, rng) + (isRace ? 15 : 20),
      ВН: dice(2, 10, rng) + (isRace ? 15 : 20),
      ЛВ: dice(2, 10, rng) + (isRace ? 15 : 20),
      ИН: dice(2, 10, rng) + (isRace ? 20 : 0),
      СВ: dice(2, 10, rng) + 20,
      ВС: dice(2, 10, rng) + (isRace ? 20 : 25),
      ОЩ: isRace ? dice(2, 10, rng) + 5 : die(10, rng)
    };
    return {
      type,
      stats,
      wounds: die(10, rng) + (isRace ? 5 : 7)
    };
  }

  function makeContext(base) {
    return {
      type: base.type,
      name: base.name || (base.type === "race" ? "Безымянная ксено-раса" : "Безымянный ксено-зверь"),
      stats: clone(base.stats),
      wounds: Number(base.wounds) || 0,
      skills: new Map(),
      talents: new Map(),
      traits: new Map(),
      rules: [],
      equipment: [],
      implants: [],
      mutations: 0,
      psychicPowers: [],
      logs: [],
      ratings: { fear: 0, armour: 0, machine: 0 },
      naturalWeapon: false,
      deadlyNaturalWeapon: false,
      toxicNaturalWeapon: false,
      regeneration: false,
      unnatural: { СЛ: null, ВН: null, ЛВ: null }
    };
  }

  function addSkill(ctx, name, value = 0) {
    const key = String(name).trim();
    if (!key) return;
    const current = ctx.skills.get(key);
    ctx.skills.set(key, current === undefined ? value : Math.max(current, value));
  }

  function addTalent(ctx, name) {
    const text = String(name).trim();
    if (text) ctx.talents.set(text.toLocaleLowerCase("ru-RU"), text);
  }

  function addTrait(ctx, name) {
    const text = String(name).trim();
    if (text) ctx.traits.set(text.toLocaleLowerCase("ru-RU"), text);
  }

  function addRule(ctx, name, text) {
    ctx.rules.push({ name, text });
  }

  function mod(ctx, stat, value, label = "") {
    ctx.stats[stat] = clampStat((ctx.stats[stat] ?? 0) + value);
    if (label) ctx.logs.push(`${label}: ${stat} ${value >= 0 ? "+" : ""}${value}`);
  }

  function fear(ctx, rating, max = 5) {
    ctx.ratings.fear = Math.min(max, Math.max(ctx.ratings.fear, rating));
  }

  function armour(ctx, rating, addIfPresent = false) {
    if (ctx.ratings.armour > 0 && addIfPresent) ctx.ratings.armour += rating;
    else ctx.ratings.armour = Math.max(ctx.ratings.armour, rating);
  }

  function naturalWeapon(ctx, deadly = false) {
    if (ctx.naturalWeapon || deadly) ctx.deadlyNaturalWeapon = ctx.deadlyNaturalWeapon || deadly || ctx.naturalWeapon;
    ctx.naturalWeapon = true;
  }

  function chance(percent, rng) { return d100(rng) <= percent; }

  function applyForm(ctx, form, rng) {
    if (!form) return;
    ctx.form = clone(form);
    switch (form.id) {
      case "animal":
        addTrait(ctx, "Многоногое (2)");
        if (chance(25, rng)) addTalent(ctx, "Спринт");
        if (chance(50, rng)) addTrait(ctx, "Коренастое");
        break;
      case "crawler":
        if (chance(25, rng)) addTrait(ctx, "Копатель (Х)");
        break;
      case "flying":
        mod(ctx, "ВН", -10, "Летучая форма");
        addTrait(ctx, d100(rng) <= 50 ? "Парящее (СКР)" : "Летун (СКР)");
        break;
      case "amorphous":
        mod(ctx, "ВН", 10, "Аморфная форма");
        addTrait(ctx, `Сверхчувства (${dice(2, 10, rng) + 5} м)`);
        fear(ctx, 2);
        if (chance(25, rng)) ctx.regeneration = true;
        break;
      default:
        break;
    }
  }

  function setUnnatural(ctx, stat, probability, extra, rng) {
    if (probability < 100 && !chance(probability, rng)) return;
    ctx.unnatural[stat] = Math.max(ctx.unnatural[stat] ?? 0, extra);
  }

  function applySize(ctx, size, rng) {
    const value = Number(size?.value ?? size ?? 0);
    ctx.size = value;
    switch (value) {
      case -3:
        mod(ctx, "НР", -30); ctx.stats.СЛ = Math.floor(ctx.stats.СЛ / 4); ctx.wounds = 1; break;
      case -2:
        mod(ctx, "НР", -20); ctx.stats.СЛ = Math.floor(ctx.stats.СЛ / 2); ctx.wounds -= 6; break;
      case -1:
        mod(ctx, "НР", -10); mod(ctx, "СЛ", -5); ctx.wounds -= 3; break;
      case 1:
        mod(ctx, "НР", 10); mod(ctx, "СЛ", 10); mod(ctx, "ВН", 10); ctx.wounds += die(10, rng); break;
      case 2:
        fear(ctx, Math.max(1, die(5, rng) - 2)); mod(ctx, "НР", 20); mod(ctx, "СЛ", 20); mod(ctx, "ВН", 15);
        setUnnatural(ctx, "СЛ", 50, 0, rng); setUnnatural(ctx, "ВН", 50, 0, rng); ctx.wounds += dice(2, 10, rng); break;
      case 3:
        fear(ctx, die(5, rng)); mod(ctx, "НР", 30); mod(ctx, "СЛ", 20); mod(ctx, "ВН", 20);
        setUnnatural(ctx, "СЛ", 80, 0, rng); setUnnatural(ctx, "ВН", 80, 0, rng); ctx.wounds += dice(4, 10, rng); break;
      case 4:
        fear(ctx, die(5, rng) + 1); mod(ctx, "НР", 35); mod(ctx, "СЛ", 30); mod(ctx, "ВН", 30);
        setUnnatural(ctx, "СЛ", 90, 0, rng); setUnnatural(ctx, "ВН", 90, 0, rng); ctx.wounds += dice(5, 10, rng); break;
      case 5:
        fear(ctx, die(5, rng) + 1); mod(ctx, "НР", 40); mod(ctx, "СЛ", 40); mod(ctx, "ВН", 40);
        setUnnatural(ctx, "СЛ", 100, 0, rng); setUnnatural(ctx, "ВН", 100, 0, rng); ctx.wounds += dice(6, 10, rng); break;
      case 6:
        fear(ctx, die(5, rng) + 1); mod(ctx, "НР", 50); mod(ctx, "СЛ", 50); mod(ctx, "ВН", 50);
        setUnnatural(ctx, "СЛ", 100, 5, rng); setUnnatural(ctx, "ВН", 100, 5, rng); ctx.wounds += dice(7, 10, rng); break;
      default:
        break;
    }
    ctx.wounds = Math.max(1, Math.round(ctx.wounds));
  }

  function applyBeastArchetype(ctx, archetype, choices, rng, asSecondary = false) {
    if (!archetype) return;
    if (asSecondary) ctx.secondaryArchetype = clone(archetype);
    else ctx.archetype = clone(archetype);
    switch (archetype.id) {
      case "herd":
        mod(ctx, "СЛ", die(10, rng)); ctx.wounds += die(10, rng); addTrait(ctx, "Пугливые");
        if (chance(50, rng)) addTrait(ctx, "Выносливое");
        if (chance(25, rng)) naturalWeapon(ctx);
        if (chance(20, rng)) armour(ctx, die(5, rng));
        break;
      case "dark":
        mod(ctx, "СЛ", die(10, rng)); mod(ctx, "ВН", die(10, rng));
        ["Акробатика", "Бдительность", "Скрытность"].forEach(skill => addSkill(ctx, skill));
        addTrait(ctx, "Слепой"); addTrait(ctx, "Сверхчувства (30 м)");
        break;
      case "predator":
        mod(ctx, "НР", die(10, rng) + 10); mod(ctx, "СЛ", die(10, rng) + 10);
        ["ВН", "ЛВ", "ВС"].forEach(stat => mod(ctx, stat, die(10, rng)));
        addSkill(ctx, "Скрытность"); addSkill(ctx, "Выживание");
        if (chance(50, rng)) addTalent(ctx, "Спринт");
        addTrait(ctx, "Ночное зрение"); naturalWeapon(ctx);
        if (chance(25, rng)) armour(ctx, die(5, rng));
        if (chance(20, rng)) ctx.toxicNaturalWeapon = true;
        break;
      case "scavenger":
        mod(ctx, "НР", die(10, rng)); mod(ctx, "ВН", die(10, rng));
        addTalent(ctx, "Сопротивление (Яды)"); addTrait(ctx, "Ночное зрение");
        if (chance(20, rng)) ctx.toxicNaturalWeapon = true;
        break;
      case "arboreal":
        mod(ctx, "ЛВ", 10); addSkill(ctx, "Акробатика", 20);
        ["Уклонение", "Кошачье приземление", "Молниеносные рефлексы"].forEach(addTalent.bind(null, ctx));
        break;
      case "apex":
        mod(ctx, "ИН", die(10, rng)); mod(ctx, "ОЩ", die(10, rng)); mod(ctx, "ВС", 5); ctx.wounds += die(10, rng);
        (choices.apexTalents ?? []).filter(Boolean).slice(0, 2).forEach(addTalent.bind(null, ctx));
        if ((choices.apexTalents ?? []).filter(Boolean).length < 2) addRule(ctx, "Два любых таланта", "Выберите любые два таланта для верховного ксено-зверя.");
        break;
      case "warped":
        ctx.mutations += die(5, rng); mod(ctx, "СЛ", dice(2, 10, rng)); mod(ctx, "ВН", dice(2, 10, rng));
        ctx.wounds += die(10, rng); mod(ctx, "ИН", -dice(2, 10, rng)); ctx.stats.ОЩ = 0;
        addTalent(ctx, "Неистовство"); fear(ctx, die(5, rng));
        break;
      case "silicate":
        mod(ctx, "ЛВ", -10); armour(ctx, die(5, rng) + 1);
        setUnnatural(ctx, "СЛ", 100, 0, rng); setUnnatural(ctx, "ВН", 100, 0, rng);
        addRule(ctx, "Кремниевая физиология", "Не может плавать и не страдает от потери крови. Ударный и взрывной урон получает +5 к последствиям; энергетический — −5.");
        break;
      case "gestalt":
        mod(ctx, "ВН", dice(2, 10, rng)); mod(ctx, "СВ", dice(2, 10, rng)); mod(ctx, "ИН", -die(10, rng)); mod(ctx, "ОЩ", -dice(2, 10, rng));
        addRule(ctx, "Гештальт", "Не может быть оглушён и бросает дважды с лучшим результатом против контроля сознания и воздействия на разум.");
        break;
      default:
        break;
    }
  }

  function applyRaceArchetype(ctx, archetype, choices, rng, data) {
    if (!archetype) return;
    ctx.archetype = clone(archetype);
    switch (archetype.id) {
      case "atavistic": {
        let roll = d100(rng);
        while (roll <= 20) roll = d100(rng);
        const beast = data.findByRoll(data.beastArchetypes, roll);
        ctx.logs.push(`Атавистический бросок к100: ${roll} — ${beast?.name ?? "—"}`);
        applyBeastArchetype(ctx, beast, choices, rng, true);
        break;
      }
      case "stealthy":
        mod(ctx, "ИН", 10); mod(ctx, "ВС", 10);
        ["Бдительность", "Скрытность", "Обман", "Ловкость рук"].forEach(addSkill.bind(null, ctx));
        break;
      case "warlike":
        ["НР", "НС", "СЛ", "ЛВ"].forEach(stat => mod(ctx, stat, die(10, rng)));
        addSkill(ctx, "Бдительность");
        if (chance(25, rng)) addTalent(ctx, "Быстрая атака");
        if (choices.warlikeReward === "natural-weapon") naturalWeapon(ctx);
        else {
          const talents = (choices.warlikeTalents ?? []).filter(Boolean).slice(0, 2);
          talents.forEach(addTalent.bind(null, ctx));
          if (talents.length < 2) addRule(ctx, "Два боевых таланта", "Выберите два боевых таланта либо замените их природным оружием.");
        }
        break;
      case "exotic": {
        const picked = [...new Set(choices.exoticStats ?? [])].filter(stat => STATS.includes(stat)).slice(0, 2);
        picked.forEach(stat => mod(ctx, stat, 10));
        if (picked.length < 2) addRule(ctx, "Экзотические характеристики", "Выберите две характеристики, каждая получает +10.");
        fear(ctx, 1);
        addRule(ctx, "Непохожесть", "−20 к тестам общения с людьми. При определении особенности бросайте дважды и выбирайте больший результат.");
        break;
      }
      case "wild":
        ["НР", "СЛ", "ВН", "ВС"].forEach(stat => mod(ctx, stat, die(10, rng)));
        mod(ctx, "ИН", -die(10, rng)); ctx.wounds += die(10, rng);
        ["Атлетика", "Бдительность", "Выживание"].forEach(addSkill.bind(null, ctx));
        addRule(ctx, "Примитивное снаряжение", "Обычно использует только примитивное снаряжение.");
        break;
      case "greedy":
        mod(ctx, "НС", die(10, rng)); mod(ctx, "ИН", die(10, rng));
        ["Бдительность", "Торговля", "Обман"].forEach(addSkill.bind(null, ctx));
        addRule(ctx, "Накопительство", "Обычно располагает значительным количеством оружия, доспехов и предметов торговли.");
        break;
      case "mechanical":
        mod(ctx, "ИН", 10); mod(ctx, "ОЩ", -10); ctx.implants.push("Один имплант");
        if (choices.machineTrait) ctx.ratings.machine = -1;
        break;
      case "psykers":
        mod(ctx, "НР", -10); mod(ctx, "СЛ", -10); mod(ctx, "СВ", 10);
        addTrait(ctx, "Пси-рейтинг (2)"); addSkill(ctx, "Пси-чутьё");
        ctx.psychicPowers.push("Три малые пси-силы", "Две пси-силы из одной дисциплины");
        break;
      case "fading":
        addTrait(ctx, d100(rng) <= 50 ? "Бестелесный" : "Фазовый");
        addRule(ctx, "Материальная уязвимость", "По решению ведущего прохождение может блокироваться определённым материалом или явлением.");
        break;
      default:
        break;
    }
  }

  function applyFeature(ctx, feature, choices, rng) {
    if (!feature) return;
    ctx.feature = clone(feature);
    switch (feature.id) {
      case "keen-sense": addTalent(ctx, `Обострённые чувства (${choices.keenSense || "Зрение"})`); break;
      case "natural-armour": armour(ctx, ctx.ratings.armour > 0 ? 2 : die(5, rng), ctx.ratings.armour > 0); break;
      case "natural-weapon": naturalWeapon(ctx, ctx.naturalWeapon); break;
      case "strong": mod(ctx, "СЛ", die(10, rng)); break;
      case "tough": mod(ctx, "ВН", die(10, rng)); break;
      case "fast": mod(ctx, "ЛВ", die(10, rng)); break;
      case "durable": ctx.wounds += die(10, rng); break;
      case "night-adaptation": addTrait(ctx, "Ночное зрение"); break;
      case "frightening": fear(ctx, Math.max(1, ctx.ratings.fear + 1)); break;
      case "nimble": addSkill(ctx, "Уклонение"); addTalent(ctx, "Кошачье приземление"); break;
      case "bio-shock": addRule(ctx, "Био-шоковая атака", "Специальная атака наносит 1к10+бСЛ−1 Э урона с чертой Шоковое."); break;
      case "flexible": addSkill(ctx, "Акробатика", 10); break;
      case "venomous": naturalWeapon(ctx); ctx.toxicNaturalWeapon = true; break;
      case "extra-limbs":
        addTrait(ctx, `${choices.extraLimbs === "arms" ? "Многорукое" : "Многоногое"} (${die(5, rng)})`);
        addTalent(ctx, "Амбидекстрия"); addTalent(ctx, "Быстрая атака"); addSkill(ctx, "Акробатика", 20); break;
      case "life-sustain": addRule(ctx, "Поддержание жизни", "Использует мало кислорода, может подолгу обходиться без него и действовать в опасной или безвоздушной среде."); break;
      case "resistant": addTalent(ctx, "Сопротивляемость (Яды)"); break;
      case "fear-bearer": fear(ctx, Math.min(5, ctx.ratings.fear > 0 ? ctx.ratings.fear + 2 : 2)); break;
      case "regeneration": ctx.regeneration = true; break;
      case "breath-weapon": {
        const option = choices.breathWeapon || "spike";
        const labels = {
          spike: "Выстрел шипом: дальность бСЛ×10 м, 1к10+2+1/2бСЛ Р, ББ 4, Перезарядка",
          acid: "Кислотное дыхание: дальность бСЛ×5 м, 1к10+2, ББ 0, Спрей, Перезарядка",
          toxic: "Токсичное дыхание: дальность бСЛ×5 м, 1к10+2, ББ 0, Спрей, Перезарядка",
          fire: "Огненное дыхание: дальность бСЛ×5 м, 1к10+2, ББ 0, Спрей, Перезарядка"
        };
        addRule(ctx, "Дыхательное оружие", labels[option]);
        break;
      }
      case "frenzied":
        addTalent(ctx, "Неистовство"); addTalent(ctx, "Стальная челюсть");
        addRule(ctx, "Ярость раненого", "+10 к СЛ, когда полученные раны равны или превышают половину нормы."); break;
      case "unnatural-agility": setUnnatural(ctx, "ЛВ", 100, 0, rng); break;
      case "unnatural-toughness": setUnnatural(ctx, "ВН", 100, 0, rng); break;
      case "unnatural-strength": setUnnatural(ctx, "СЛ", 100, 0, rng); break;
      case "warp-touched": ctx.mutations += 1; break;
      case "acid-blood": addRule(ctx, "Кислотная кровь", "При получении 5+ урона или критического урона поражает находящееся рядом существо на 1к10+бВН Э, игнорируя ОБ. Можно уклониться, но нельзя парировать."); break;
      case "innate-psyker": addTrait(ctx, "Пси-рейтинг (1)"); ctx.psychicPowers.push("Одна малая пси-сила"); break;
      default: break;
    }
  }

  function finish(ctx) {
    Object.keys(ctx.stats).forEach(stat => { ctx.stats[stat] = clampStat(ctx.stats[stat]); });
    ctx.wounds = Math.max(1, Math.round(ctx.wounds));
    if (ctx.ratings.fear > 0) addTrait(ctx, `Страх (${ctx.ratings.fear})`);
    if (ctx.ratings.armour > 0) addTrait(ctx, `Природная броня (${ctx.ratings.armour})`);
    if (ctx.naturalWeapon) addTrait(ctx, `${ctx.deadlyNaturalWeapon ? "Смертельное природное оружие" : "Природное оружие"}${ctx.toxicNaturalWeapon ? " (Токсичное)" : ""}`);
    if (ctx.regeneration) addTrait(ctx, `Регенерация (${Math.floor(bonus(ctx.stats.ВН) / 2)})`);
    if (ctx.ratings.machine !== 0) addTrait(ctx, `Машина (${ctx.ratings.machine < 0 ? Math.floor(bonus(ctx.stats.ВН) / 2) : ctx.ratings.machine})`);
    for (const stat of ["СЛ", "ВН", "ЛВ"]) {
      if (ctx.unnatural[stat] === null) continue;
      const rating = Math.max(0, Math.floor(bonus(ctx.stats[stat]) / 2) + (ctx.unnatural[stat] || 0));
      addTrait(ctx, `Сверх${stat} (${rating})`);
    }
    if (ctx.mutations > 0) addTrait(ctx, `Мутации (${ctx.mutations})`);
    addTrait(ctx, `Размер (${ctx.size ?? 0})`);
    return {
      type: ctx.type,
      name: ctx.name,
      stats: ctx.stats,
      wounds: ctx.wounds,
      form: ctx.form,
      size: ctx.size,
      archetype: ctx.archetype,
      secondaryArchetype: ctx.secondaryArchetype,
      feature: ctx.feature,
      skills: [...ctx.skills.entries()].map(([name, value]) => value > 0 ? `${name} +${value}` : name),
      talents: [...ctx.talents.values()],
      traits: [...ctx.traits.values()],
      specialRules: ctx.rules,
      equipment: ctx.equipment,
      implants: ctx.implants,
      psychicPowers: ctx.psychicPowers,
      logs: ctx.logs
    };
  }

  function buildProfile(input, data = DATA) {
    if (!data) throw new Error("Данные генератора ксеносов не загружены.");
    const rng = mulberry32(input.seed ?? 1);
    const ctx = makeContext({ type: input.type, name: input.name, stats: input.baseStats, wounds: input.baseWounds });
    const form = data.findByRoll(data.forms, input.formRoll);
    const archetypes = input.type === "race" ? data.raceArchetypes : data.beastArchetypes;
    const archetype = data.findByRoll(archetypes, input.archetypeRoll);
    let featureRoll = Number(input.featureRoll) || 1;
    if (archetype?.id === "exotic" || archetype?.id === "gestalt") {
      const second = d100(rng);
      ctx.logs.push(`Дополнительный бросок особенности: ${second}`);
      featureRoll = Math.max(featureRoll, second);
    }
    const feature = data.findByRoll(data.features, featureRoll);
    ctx.primaryRolls = { form: input.formRoll, archetype: input.archetypeRoll, feature: featureRoll };
    applyForm(ctx, form, rng);
    applySize(ctx, data.sizes.find(item => item.value === Number(input.size)) ?? { value: Number(input.size) || 0 }, rng);
    if (input.type === "race") applyRaceArchetype(ctx, archetype, input.choices ?? {}, rng, data);
    else applyBeastArchetype(ctx, archetype, input.choices ?? {}, rng, false);
    applyFeature(ctx, feature, input.choices ?? {}, rng);
    const result = finish(ctx);
    result.rolls = ctx.primaryRolls;
    return result;
  }

  function toCharacterRace(profile) {
    if (!profile || profile.type !== "race") return null;
    return {
      id: "generated-xeno-race",
      name: profile.name,
      description: `Сгенерированная ксено-раса: ${profile.form?.name ?? "форма не указана"}, ${profile.archetype?.name ?? "архетип не указан"}, ${profile.feature?.name ?? "особенность не указана"}.`,
      baseStats: clone(profile.stats),
      plannedPoints: 0,
      maxPerStat: 0,
      redistributionCount: 0,
      redistributionValue: 5,
      startingXp: 750,
      xpMultiplier: 1,
      woundBonus: 0,
      fixedWounds: profile.wounds,
      fixedGeneration: true,
      generatedXeno: true,
      skills: [...profile.skills],
      talents: [...profile.talents],
      traits: [...profile.traits],
      specialRules: [...profile.specialRules],
      equipment: [...profile.equipment],
      implants: [...profile.implants],
      psychicPowers: [...profile.psychicPowers],
      xenoProfile: clone(profile)
    };
  }

  const api = { mulberry32, die, dice, d100, baseProfile, buildProfile, toCharacterRace };
  if (typeof window !== "undefined") window.KADAT_XENO_ENGINE = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
