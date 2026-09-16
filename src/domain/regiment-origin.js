(() => {
  "use strict";

  const STORAGE_KEY = "kadat.regiments.v1";
  const STAT_CODES = ["НС", "НР", "СЛ", "ВН", "ЛВ", "ИН", "СВ", "ВС", "ОЩ"];
  const STAT_PATTERN = "(?:НС|НР|СЛ|ВН|ЛВ|ИН|СВ|ВС|ОЩ)";
  const MECHANIC_FIELDS = [
    "characteristicsText",
    "talentsText",
    "effectText",
    "rulesText",
    "specialRulesText",
  ];

  const normalize = (value) =>
    String(value ?? "")
      .replace(/\r/g, "\n")
      .replace(/[‐‑‒–—]/g, "-")
      .replace(/[“”„]/g, '"')
      .replace(/\s+/g, " ")
      .trim();

  const unique = (values) => {
    const seen = new Set();
    return (values ?? []).filter((value) => {
      const key = normalize(
        typeof value === "string" ? value : JSON.stringify(value),
      ).toLocaleLowerCase("ru-RU");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const hash = (value) => {
    let result = 2166136261;
    for (const character of String(value)) {
      result ^= character.charCodeAt(0);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  };

  function splitTopLevel(value, options = {}) {
    const text = String(value ?? "")
      .replace(/[«»"]/g, "")
      .replace(/\r?\n/g, ";");
    const parts = [];
    let current = "";
    let depth = 0;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (character === "(") depth += 1;
      if (character === ")") depth = Math.max(0, depth - 1);

      const wordAnd =
        options.and !== false &&
        depth === 0 &&
        text.slice(index, index + 3).toLocaleLowerCase("ru-RU") === " и ";
      const separator =
        depth === 0 &&
        (character === ";" || (options.comma !== false && character === ","));

      if (wordAnd || separator) {
        const item = normalize(current).replace(/^[,.]\s*|[,.]\s*$/g, "");
        if (item) parts.push(item);
        current = "";
        if (wordAnd) index += 2;
        continue;
      }
      current += character;
    }

    const tail = normalize(current).replace(/^[,.]\s*|[,.]\s*$/g, "");
    if (tail) parts.push(tail);
    return parts;
  }

  function splitAlternative(value) {
    const text = String(value ?? "");
    let depth = 0;
    for (let index = 0; index <= text.length - 5; index += 1) {
      if (text[index] === "(") depth += 1;
      if (text[index] === ")") depth = Math.max(0, depth - 1);
      if (
        depth === 0 &&
        text.slice(index, index + 5).toLocaleLowerCase("ru-RU") === " или "
      ) {
        return [
          normalize(text.slice(0, index)),
          normalize(text.slice(index + 5)),
        ].filter(Boolean);
      }
    }
    return [normalize(text)].filter(Boolean);
  }

  function canonicalSkill(value) {
    return normalize(value)
      .replace(/^Общее\s+знание/i, "Общие знания")
      .replace(/^Общие\s+знание/i, "Общие знания")
      .replace(/^Уч[её]ное\s+знание/i, "Учёные знания")
      .replace(/^Ученые\s+знания/i, "Учёные знания")
      .replace(/^Знание\s+языка/i, "Язык")
      .replace(/^ТехЮз$/i, "Техника")
      .replace(/^Пользование\s+техник(?:и|ой)$/i, "Техника")
      .replace(/\s+\.$/, "")
      .trim();
  }

  function expandSpecializations(value) {
    const skill = canonicalSkill(value);
    const match = skill.match(/^(.+?)\s*\((.+)\)$/);
    if (!match) return [skill];
    const base = normalize(match[1]);
    const expandable =
      /^(?:Общие знания|Учёные знания|Запретные знания|Язык|Навигация|Управление|Ремесло)$/i.test(
        base,
      );
    if (!expandable) return [skill];
    const options = splitTopLevel(match[2], { and: true, comma: true });
    return options.length > 1
      ? options.map((option) => `${base} (${option})`)
      : [skill];
  }

  function bonusCopies(bonus) {
    if (!Number.isFinite(bonus) || bonus <= 0) return 1;
    return 1 + Math.floor(bonus / 5);
  }

  function addModifier(target, stat, amount) {
    if (!STAT_CODES.includes(stat) || !Number.isFinite(amount)) return;
    target[stat] = (target[stat] ?? 0) + amount;
  }

  function choiceId(source, kind, seed) {
    return `${kind}-${hash(`${source?.id ?? source?.name ?? "source"}:${seed}`)}`;
  }

  function parseStatText(rawText, source) {
    let text = normalize(rawText);
    const fixed = {};
    const choices = [];
    if (!text) return { fixed, choices };

    const stat = STAT_PATTERN;
    const consume = (match, replacement = " ") => {
      text = `${text.slice(0, match.index)}${replacement}${text.slice(match.index + match[0].length)}`;
    };

    let match;
    const eitherRegex = new RegExp(
      `(${stat})\\s*([+-]\\d+)\\s*или\\s*(${stat})\\s*([+-]\\d+)`,
      "i",
    );
    while ((match = eitherRegex.exec(text))) {
      choices.push({
        id: choiceId(source, "stat-option", match[0]),
        kind: "stat-option",
        label: `${source.name}: выберите изменение характеристики`,
        choose: 1,
        options: [
          { stat: match[1].toUpperCase(), bonus: Number(match[2]) },
          { stat: match[3].toUpperCase(), bonus: Number(match[4]) },
        ],
        sourceName: source.name,
      });
      consume(match);
    }

    const sameBonusRegex = new RegExp(
      `(${stat})\\s*([+-]\\d+)\\s*,?\\s*а\\s+так(?:же| же)\\s+к\\s+любой\\s+одной\\s+характеристике`,
      "i",
    );
    while ((match = sameBonusRegex.exec(text))) {
      addModifier(fixed, match[1].toUpperCase(), Number(match[2]));
      choices.push({
        id: choiceId(source, "stat", match[0]),
        kind: "stat",
        label: `${source.name}: выберите одну характеристику`,
        choose: 1,
        bonus: Number(match[2]),
        options: [...STAT_CODES],
        sourceName: source.name,
      });
      consume(match);
    }

    const groupChoiceRegex = new RegExp(
      `((?:${stat})(?:\\s*[/,]\\s*(?:${stat}))+?)\\s*([+-]\\d+)\\s*к\\s*(одной|двум|тр[её]м)\\s*(?:из\\s+них)?`,
      "ig",
    );
    const groupMatches = [...text.matchAll(groupChoiceRegex)];
    for (const groupMatch of groupMatches.reverse()) {
      const countWord = groupMatch[3].toLocaleLowerCase("ru-RU");
      const choose = countWord.startsWith("од")
        ? 1
        : countWord.startsWith("дв")
          ? 2
          : 3;
      choices.push({
        id: choiceId(source, "stat", groupMatch[0]),
        kind: "stat",
        label: `${source.name}: выберите ${choose} характеристик`,
        choose,
        bonus: Number(groupMatch[2]),
        options: groupMatch[1].match(new RegExp(stat, "g")) ?? [],
        sourceName: source.name,
      });
      text = `${text.slice(0, groupMatch.index)} ${text.slice(groupMatch.index + groupMatch[0].length)}`;
    }

    const anyChoiceRegex =
      /([+-]\d+)\s*к\s*(одной|двум|тр[её]м)\s+характеристик(?:е|ам)(?:\s+по\s+(?:своему\s+)?выбору)?/gi;
    const anyMatches = [...text.matchAll(anyChoiceRegex)];
    for (const anyMatch of anyMatches.reverse()) {
      const countWord = anyMatch[2].toLocaleLowerCase("ru-RU");
      const choose = countWord.startsWith("од")
        ? 1
        : countWord.startsWith("дв")
          ? 2
          : 3;
      choices.push({
        id: choiceId(source, "stat", anyMatch[0]),
        kind: "stat",
        label: `${source.name}: выберите ${choose} характеристик`,
        choose,
        bonus: Number(anyMatch[1]),
        options: [...STAT_CODES],
        sourceName: source.name,
      });
      text = `${text.slice(0, anyMatch.index)} ${text.slice(anyMatch.index + anyMatch[0].length)}`;
    }

    const valueBeforeRegex = new RegExp(
      `([+-]\\d+)\\s*к\\s*((?:${stat})(?:\\s*[/,]\\s*(?:${stat}))*)`,
      "ig",
    );
    const beforeMatches = [...text.matchAll(valueBeforeRegex)];
    for (const beforeMatch of beforeMatches.reverse()) {
      for (const code of beforeMatch[2].match(new RegExp(stat, "g")) ?? [])
        addModifier(fixed, code, Number(beforeMatch[1]));
      text = `${text.slice(0, beforeMatch.index)} ${text.slice(beforeMatch.index + beforeMatch[0].length)}`;
    }

    const groupFixedRegex = new RegExp(
      `((?:${stat})(?:\\s*[/,]\\s*(?:${stat}))*)\\s*([+-]\\d+)`,
      "ig",
    );
    for (const fixedMatch of text.matchAll(groupFixedRegex)) {
      for (const code of fixedMatch[1].match(new RegExp(stat, "g")) ?? [])
        addModifier(fixed, code, Number(fixedMatch[2]));
    }

    return { fixed, choices };
  }

  function parseSkillText(rawText, source) {
    const skills = [];
    const choices = [];
    const text = normalize(rawText);
    if (!text || /^(?:нет|нет данных|-)$/i.test(text))
      return { skills, choices };

    for (const rawItem of splitTopLevel(text, { and: true, comma: true })) {
      if (!rawItem || /^(?:нет|нет данных|-)$/i.test(rawItem)) continue;
      const alternatives = splitAlternative(rawItem);
      const parsedAlternatives = alternatives
        .map((option) => {
          const bonusMatch = option.match(/\s*([+-]\d+)\s*$/);
          const bonus = bonusMatch ? Number(bonusMatch[1]) : 0;
          const name = canonicalSkill(
            bonusMatch ? option.slice(0, bonusMatch.index) : option,
          );
          return { name, bonus, expanded: expandSpecializations(name) };
        })
        .filter((option) => option.name);

      if (!parsedAlternatives.length) continue;
      const freeChoice = parsedAlternatives.some((option) =>
        /(?:одно|один|1)\s+(?:любое|любой|из\s+рабочих)/i.test(option.name),
      );
      if (freeChoice) {
        choices.push({
          id: choiceId(source, "free-skill", rawItem),
          kind: "free-skill",
          label: `${source.name}: укажите выбранный навык или специализацию`,
          placeholder: parsedAlternatives[0].name,
          sourceName: source.name,
        });
        continue;
      }

      if (parsedAlternatives.length > 1) {
        choices.push({
          id: choiceId(source, "skill", rawItem),
          kind: "skill",
          label: `${source.name}: выберите навык`,
          options: parsedAlternatives.flatMap((option) =>
            option.expanded.map((value) => ({
              value,
              copies: bonusCopies(option.bonus),
            })),
          ),
          sourceName: source.name,
        });
        continue;
      }

      const only = parsedAlternatives[0];
      for (const value of only.expanded) {
        for (let index = 0; index < bonusCopies(only.bonus); index += 1)
          skills.push(value);
      }
    }
    return { skills, choices };
  }

  function parseTalentText(rawText, source) {
    const talents = [];
    const choices = [];
    const text = normalize(rawText);
    if (!text || /^(?:нет|нет данных|-)$/i.test(text))
      return { talents, choices };
    if (
      text.length > 140 ||
      (text.includes(":") &&
        /(?:персонаж|тест|снабж|стандартн|увелич|получа|теря)/i.test(text))
    ) {
      return { talents, choices };
    }

    for (const rawItem of splitTopLevel(text, { and: true, comma: true })) {
      if (!rawItem || /^(?:нет|нет данных|-)$/i.test(rawItem)) continue;
      const alternatives = splitAlternative(rawItem)
        .map(normalize)
        .filter(Boolean);
      if (!alternatives.length) continue;
      if (
        alternatives.some((option) =>
          /(?:одно|один|1)\s+люб(?:ое|ой)/i.test(option),
        )
      ) {
        choices.push({
          id: choiceId(source, "free-talent", rawItem),
          kind: "free-talent",
          label: `${source.name}: укажите выбранный талант`,
          placeholder: alternatives[0],
          sourceName: source.name,
        });
      } else if (alternatives.length > 1) {
        choices.push({
          id: choiceId(source, "talent", rawItem),
          kind: "talent",
          label: `${source.name}: выберите талант`,
          options: alternatives.map((value) => ({ value })),
          sourceName: source.name,
        });
      } else {
        talents.push(alternatives[0].replace(/[.;]+$/g, ""));
      }
    }
    return { talents, choices };
  }

  function parseEquipmentText(rawText, source) {
    const equipment = [];
    const choices = [];
    const text = normalize(rawText);
    if (!text || /^(?:нет|нет данных|-)$/i.test(text))
      return { equipment, choices };

    for (const rawItem of splitTopLevel(text, { and: false, comma: false })) {
      const item = normalize(rawItem).replace(/[.;]+$/g, "");
      if (!item || /^(?:нет|нет данных|-)$/i.test(item)) continue;
      const alternatives = splitAlternative(item);
      if (
        alternatives.length > 1 &&
        alternatives.every((option) => option.length < 120)
      ) {
        choices.push({
          id: choiceId(source, "equipment", item),
          kind: "equipment",
          label: `${source.name}: выберите снаряжение`,
          options: alternatives.map((value) => ({ value })),
          sourceName: source.name,
        });
      } else {
        equipment.push(item);
      }
    }
    return { equipment, choices };
  }

  function extractExactEffects(entry) {
    const result = { talents: [], traits: [], woundBonus: 0 };
    const texts = MECHANIC_FIELDS.map((field) =>
      normalize(entry?.[field]),
    ).filter(Boolean);
    for (const text of texts) {
      if (typeof entry.woundBonus !== "number") {
        const woundMatches = [
          ...text.matchAll(
            /(?:количество\s+)?ран(?:ы)?\s*(?:на|увеличивают[^+]{0,40}на)?\s*\+(\d+)/gi,
          ),
          ...text.matchAll(/увеличивают[^.]{0,60}ран[^+]{0,20}\+(\d+)/gi),
        ];
        for (const match of woundMatches) result.woundBonus += Number(match[1]);
      }
      for (const match of text.matchAll(
        /(?:получают|получает)\s+(?:талант|особенность)\s+[«"]([^»"]+)[»"]/gi,
      )) {
        if (/талант/i.test(match[0])) result.talents.push(normalize(match[1]));
        else result.traits.push(normalize(match[1]));
      }
      for (const match of text.matchAll(/особенность\s+[«"]([^»"]+)[»"]/gi))
        result.traits.push(normalize(match[1]));
    }
    return result;
  }

  function requiredRace(entry) {
    const text = normalize(entry?.characteristicsText);
    const match = text.match(/Раса\s+([^,(]+)\s*\(исключительно\)/i);
    return match ? normalize(match[1]) : "";
  }

  function resolveSnapshotEntries(catalog, snapshot) {
    const byId = (items, id) =>
      (items ?? []).find((entry) => entry.id === id) ?? null;
    return {
      homeworld: byId(catalog.homeworlds, snapshot.homeworldId),
      origin: byId(catalog.origins, snapshot.originId),
      commander: byId(catalog.commanders, snapshot.commanderId),
      regimentType: byId(catalog.regimentTypes, snapshot.regimentTypeId),
      training: (snapshot.trainingIds ?? [])
        .map((id) => byId(catalog.trainingDoctrines, id))
        .filter(Boolean),
      equipmentDoctrines: (snapshot.equipmentDoctrineIds ?? [])
        .map((id) => byId(catalog.equipmentDoctrines, id))
        .filter(Boolean),
      drawbacks: (
        snapshot.drawbackIds ??
        (snapshot.drawbackId ? [snapshot.drawbackId] : [])
      )
        .map((id) => byId(catalog.drawbacks, id))
        .filter(Boolean),
      extraEquipment: (snapshot.extraEquipment ?? [])
        .map((item) => ({
          entry: byId(catalog.extraEquipment, item.id),
          quantity: Number(item.quantity ?? 0),
        }))
        .filter((item) => item.entry && item.quantity > 0),
    };
  }

  function buildMechanics(catalog, snapshot) {
    const selected = resolveSnapshotEntries(catalog, snapshot);
    const entries = [
      selected.homeworld,
      selected.origin,
      selected.commander,
      selected.regimentType,
      ...selected.training,
      ...selected.equipmentDoctrines,
      ...selected.drawbacks,
    ].filter(Boolean);

    const fixedStatModifiers = {};
    const skills = [];
    const talents = [];
    const traits = [];
    const equipment = [];
    const choices = [];
    const specialRules = [];
    let woundBonus = 0;
    const raceRequirements = [];

    for (const entry of entries) {
      const structuredStatEntries =
        entry.statModifiers && typeof entry.statModifiers === "object"
          ? Object.entries(entry.statModifiers).filter(
              ([, amount]) =>
                Number.isFinite(Number(amount)) && Number(amount) !== 0,
            )
          : [];
      if (structuredStatEntries.length) {
        for (const [stat, amount] of structuredStatEntries)
          addModifier(fixedStatModifiers, stat, Number(amount));
      } else {
        for (const field of MECHANIC_FIELDS) {
          const parsed = parseStatText(entry[field], entry);
          for (const [stat, amount] of Object.entries(parsed.fixed))
            addModifier(fixedStatModifiers, stat, amount);
          choices.push(...parsed.choices);
        }
      }

      const structuredSkills = Array.isArray(entry.skills)
        ? entry.skills.filter((value) => normalize(value))
        : [];
      if (structuredSkills.length) skills.push(...structuredSkills);
      else {
        const parsed = parseSkillText(entry.skillsText, entry);
        skills.push(...parsed.skills);
        choices.push(...parsed.choices);
      }

      const structuredTalents = Array.isArray(entry.talents)
        ? entry.talents.filter((value) => normalize(value))
        : [];
      if (structuredTalents.length) talents.push(...structuredTalents);
      else {
        const parsed = parseTalentText(entry.talentsText, entry);
        talents.push(...parsed.talents);
        choices.push(...parsed.choices);
      }

      const structuredEquipment = Array.isArray(entry.equipment)
        ? entry.equipment.filter((value) => normalize(value))
        : [];
      if (structuredEquipment.length) equipment.push(...structuredEquipment);
      else {
        for (const field of ["equipmentText", "standardKitText"]) {
          const parsed = parseEquipmentText(entry[field], entry);
          equipment.push(...parsed.equipment);
          choices.push(...parsed.choices);
        }
      }

      woundBonus += typeof entry.woundBonus === "number" ? entry.woundBonus : 0;
      const exact = extractExactEffects(entry);
      woundBonus += exact.woundBonus;
      talents.push(...exact.talents);
      traits.push(...exact.traits);

      const race = requiredRace(entry);
      if (race) raceRequirements.push(race);

      for (const field of [
        "effectText",
        "rulesText",
        "specialRulesText",
        "restrictionsText",
      ]) {
        const text = normalize(entry[field]);
        if (text) specialRules.push({ name: entry.name, text });
      }
      const talentRuleText = normalize(entry.talentsText);
      if (
        talentRuleText &&
        (talentRuleText.length > 140 || talentRuleText.includes(":"))
      ) {
        specialRules.push({ name: entry.name, text: talentRuleText });
      }
    }

    const universalItems = catalog.standardKit?.universalItems ?? [];
    for (const item of universalItems) {
      const value = normalize(
        typeof item === "string" ? item : item?.name || item?.text,
      );
      if (value) equipment.push(value);
    }
    for (const item of selected.extraEquipment) {
      equipment.push(
        `${item.entry.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`,
      );
      const text = normalize(
        item.entry.effectText ||
          item.entry.description ||
          item.entry.restrictionsText,
      );
      if (text) specialRules.push({ name: item.entry.name, text });
    }

    return {
      selected,
      fixedStatModifiers,
      skills,
      talents,
      traits: unique(traits),
      equipment: unique(equipment),
      choices: unique(choices),
      specialRules: unique(specialRules),
      woundBonus,
      raceRequirements: unique(raceRequirements),
    };
  }

  function applySelections(mechanics, selections = {}) {
    const statModifiers = { ...mechanics.fixedStatModifiers };
    const skills = [...mechanics.skills];
    const talents = [...mechanics.talents];
    const equipment = [...mechanics.equipment];

    for (const choice of mechanics.choices) {
      const selected = selections[choice.id];
      if (choice.kind === "stat") {
        const values = Array.isArray(selected)
          ? selected
          : selected
            ? [selected]
            : [];
        for (const stat of values)
          addModifier(statModifiers, stat, choice.bonus);
      } else if (choice.kind === "stat-option") {
        const option = choice.options.find(
          (item) => `${item.stat}:${item.bonus}` === selected,
        );
        if (option) addModifier(statModifiers, option.stat, option.bonus);
      } else if (choice.kind === "skill") {
        const option = choice.options.find((item) => item.value === selected);
        if (option)
          for (let index = 0; index < (option.copies ?? 1); index += 1)
            skills.push(option.value);
      } else if (choice.kind === "talent") {
        if (selected) talents.push(selected);
      } else if (choice.kind === "equipment") {
        if (selected) equipment.push(selected);
      } else if (choice.kind === "free-skill") {
        if (normalize(selected)) skills.push(normalize(selected));
      } else if (choice.kind === "free-talent") {
        if (normalize(selected)) talents.push(normalize(selected));
      }
    }

    return {
      statModifiers,
      skills,
      talents,
      equipment: unique(equipment),
    };
  }

  function buildSyntheticWorld(catalog, snapshot, selections = {}) {
    const mechanics = buildMechanics(catalog, snapshot);
    const applied = applySelections(mechanics, selections);
    return {
      id: `regiment:${snapshot.id}`,
      name: `${mechanics.selected.homeworld?.name ?? "Родной мир не указан"} · ${snapshot.name}`,
      description: `Родной мир и полковой пакет сформированы в когитаторе полков.`,
      statModifiers: applied.statModifiers,
      woundBonus: mechanics.woundBonus,
      skills: applied.skills,
      talents: applied.talents,
      traits: mechanics.traits,
      equipment: applied.equipment,
      choices: [],
      specialRules: mechanics.specialRules,
      regimentSource: true,
      regimentSnapshotId: snapshot.id,
      regimentSnapshot: snapshot,
      regimentMechanics: mechanics,
    };
  }

  const API = {
    STORAGE_KEY,
    STAT_CODES,
    normalize,
    splitTopLevel,
    parseStatText,
    parseSkillText,
    parseTalentText,
    parseEquipmentText,
    buildMechanics,
    applySelections,
    buildSyntheticWorld,
    resolveSnapshotEntries,
  };

  if (typeof window !== "undefined")
    window.KADAT_REGIMENT_CHARACTER_LINK_INTERNALS = API;
})();
