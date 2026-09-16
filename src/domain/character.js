/* Character rules. Pure functions: all inputs are supplied, no DOM or storage access. */
(function (root) {
  "use strict";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const key = (value) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("ru-RU");
  const list = (value) =>
    String(value ?? "")
      .split(/[;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  const bonus = (value) => Math.floor(value / 10);
  const canonicalSkill = (value) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .replace(/\s+\)/g, ")")
      .trim()
      .replace(/^Безопастность/i, "Безопасность")
      .replace(/^Общие\s+знания/i, "Общее знание")
      .replace(/^Уч[её]ные\s+знания/i, "Учёное знание")
      .replace(/^Запретные\s+знания/i, "Запретное знание")
      .replace(/^Языки(?=\s*\()/i, "Язык")
      .replace(/^Тех\s*(?:Юз|ЮЗ|пользование|пользования)/i, "Технология")
      .replace(/^Пси[-\s]?чуть[её]/i, "Психическое чутьё")
      .replace(/^Навигация\s*\(Планетарная\)/i, "Навигация (Поверхность)");
  function parseSkill(value) {
    const normalized = canonicalSkill(value),
      match = normalized.match(/^(.*?)(?:\s+\+(\d+))$/);
    return match
      ? {
          name: canonicalSkill(match[1]),
          bonus: Math.min(30, Number(match[2])),
        }
      : { name: normalized, bonus: 0 };
  }
  function expandTalent(value) {
    const name = String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const match = name.match(
      /^(Владение оружием|Обострённые чувства|Сопротивляемость)\s*\(([^)]+)\)$/i,
    );
    if (!match) return name ? [name] : [];
    const parts = match[2]
      .split(/[,/;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length < 2 || parts.some((s) => /люб|кроме|выбер|\d/i.test(s))
      ? [name]
      : parts.map((s) => `${match[1]} (${s})`);
  }
  function skillProfiles(sources) {
    const profiles = new Map();
    for (const raw of sources.flat()) {
      const parsed = parseSkill(raw);
      if (!parsed.name) continue;
      const stage = Math.min(4, Math.floor(parsed.bonus / 10) + 1),
        previous = profiles.get(parsed.name);
      if (previous) {
        previous.bonus = Math.min(
          30,
          Math.max(previous.bonus, parsed.bonus) + 5,
        );
        previous.stage = Math.max(previous.stage, stage);
      } else profiles.set(parsed.name, { ...parsed, stage });
    }
    return profiles;
  }
  function talentGrants(sources) {
    const talents = new Map();
    let bonusXp = 0;
    for (const raw of sources.flat())
      for (const name of expandTalent(raw)) {
        if (talents.has(key(name))) bonusXp += 25;
        else talents.set(key(name), name);
      }
    return { talents: [...talents.values()], bonusXp };
  }
  function createEngine(data, advancement, regimentOrigin, regimentCatalog) {
    const zero = () => Object.fromEntries(data.stats.map((stat) => [stat, 0]));
    function createDraft() {
      return {
        name: "",
        gender: "unspecified",
        raceId: data.races[0].id,
        worldId: data.homeworlds[0].id,
        specialtyId: "none",
        mode: "planned",
        rolls: zero(),
        plannedAdditions: zero(),
        transfers: [],
        pendingTransferFrom: null,
        raceChoices: {},
        homeworldChoices: {},
        specialtyChoices: {},
        originSource: "ready",
        regiment: null,
        regimentChoices: {},
        advancement: { characteristics: zero(), skills: {}, talents: [] },
      };
    }
    const select = (items, id) =>
      items.find((item) => item.id === id) ?? items[0];
    function origins(draft) {
      const race = select(data.races, draft.raceId);
      const world =
        draft.originSource === "regiment" && draft.regiment
          ? regimentOrigin.buildSyntheticWorld(
              regimentCatalog,
              draft.regiment,
              draft.regimentChoices,
            )
          : select(data.homeworlds, draft.worldId);
      return {
        race,
        world,
        specialty: select(data.specialties, draft.specialtyId),
      };
    }
    function specialties(draft) {
      const { race } = origins(draft);
      return data.specialties.filter(
        (s) =>
          s.id === "none" ||
          ((s.allowedRaces ?? []).includes(
            race.generatedXeno ? "human" : race.id,
          ) &&
            (!s.gender || s.gender === draft.gender) &&
            (!race.generatedXeno ||
              !["Адепта Сороритас", "Квесторис", "Астартес"].includes(
                s.category,
              ))),
      );
    }
    function choices(draft) {
      const { race, world, specialty } = origins(draft);
      const raceSelections = (race.choices ?? []).flatMap((c) =>
        (draft.raceChoices[c.id] ?? [])
          .slice(0, c.count ?? 1)
          .filter(Boolean)
          .map((value, i) => ({
            id: `${c.id}-${i}`,
            groupId: c.id,
            label: c.label,
            type: c.type,
            value: c.template.replace("{value}", value),
          })),
      );
      const worldChoices = (world.choices ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        type: c.type,
        value: draft.homeworldChoices[c.id] ?? "",
      }));
      const specialtySelections = (specialty.choices ?? []).map((c) => {
        let values = c.type.endsWith("Text")
          ? list(draft.specialtyChoices[c.id])
          : draft.specialtyChoices[c.id]
            ? [draft.specialtyChoices[c.id]]
            : [];
        if (c.type.endsWith("Text") && c.template) {
          const prefix = key(c.template.split("{value}")[0]);
          values = values.map((v) =>
            prefix && key(v).startsWith(prefix)
              ? v
              : c.template.replace("{value}", v),
          );
        }
        return {
          id: c.id,
          label: c.label,
          type: c.type,
          count: c.count ?? 1,
          values,
        };
      });
      return { raceSelections, worldChoices, specialtySelections };
    }
    function sources(draft) {
      const { race, world, specialty } = origins(draft),
        selected = choices(draft);
      const forType = (type) => [
        race[`${type}s`] ?? [],
        selected.raceSelections
          .filter((c) => c.type === type)
          .map((c) => c.value),
        world[`${type}s`] ?? [],
        selected.worldChoices
          .filter((c) => c.type === type)
          .map((c) => c.value),
        specialty[`${type}s`] ?? [],
        selected.specialtySelections
          .filter((c) => c.type === type || c.type === `${type}Text`)
          .flatMap((c) => c.values),
        list(draft[`manual${type === "skill" ? "Skills" : "Talents"}`]),
      ];
      return { skills: forType("skill"), talents: forType("talent") };
    }
    function generation(draft, stat) {
      const { race } = origins(draft);
      if (race.fixedGeneration) return 0;
      return (
        (draft.mode === "random"
          ? draft.rolls[stat]
          : draft.plannedAdditions[stat]) +
        draft.transfers.reduce(
          (sum, t) =>
            sum +
            (t.to === stat ? (race.redistributionValue ?? 5) : 0) -
            (t.from === stat ? (race.redistributionValue ?? 5) : 0),
          0,
        )
      );
    }
    const characteristicCost = (count) =>
      advancement.costs.characteristics[
        Math.min(count, advancement.costs.characteristics.length - 1)
      ];
    const talentCost = (level) =>
      Number(advancement.costs.talents[String(level)] ?? 0);
    function skillState(
      draft,
      name,
      base = skillProfiles(sources(draft).skills),
    ) {
      name = canonicalSkill(name);
      const origin = base.get(name) ?? { name, bonus: 0, stage: 0 },
        count = draft.advancement.skills[name]?.count ?? 0;
      const stage = Math.min(4, origin.stage + count);
      const value = origin.stage
        ? Math.min(30, origin.bonus + count * 10)
        : count
          ? Math.min(30, (count - 1) * 10)
          : null;
      return {
        name,
        baseBonus: origin.stage ? origin.bonus : null,
        baseStage: origin.stage,
        purchased: count,
        stage,
        bonus: value,
        nextCost:
          stage < 4 && (value ?? -1) < 30
            ? (advancement.costs.skills[stage] ?? null)
            : null,
      };
    }
    function costs(draft) {
      const base = skillProfiles(sources(draft).skills);
      let characteristics = 0,
        skills = 0;
      for (const stat of data.stats)
        for (let i = 0; i < (draft.advancement.characteristics[stat] ?? 0); i++)
          characteristics += characteristicCost(i);
      for (const item of Object.values(draft.advancement.skills))
        for (let i = 0; i < item.count; i++)
          skills +=
            advancement.costs.skills[(base.get(item.name)?.stage ?? 0) + i] ??
            0;
      const talents = draft.advancement.talents.reduce(
        (sum, item) => sum + talentCost(item.level),
        0,
      );
      return {
        characteristics,
        skills,
        talents,
        spent: characteristics + skills + talents,
      };
    }
    function build(draft, { baseOnly = false } = {}) {
      const { race: sourceRace, world, specialty } = origins(draft);
      const race = clone(sourceRace);
      for (const modifier of specialty.uniqueFeatureModifiers ?? []) {
        const feature = race.uniqueFeatures?.find(
          (f) => f.name === modifier.name,
        );
        if (feature) feature.rating = modifier.rating;
      }
      const stats = {},
        breakdown = {};
      for (const stat of data.stats) {
        const parts = {
          base: race.baseStats[stat] ?? 0,
          world: world.statModifiers[stat] ?? 0,
          specialty: specialty.statModifiers[stat] ?? 0,
          generation: generation(draft, stat),
          advancement: baseOnly
            ? 0
            : (draft.advancement.characteristics[stat] ?? 0) * 5,
        };
        breakdown[stat] = parts;
        stats[stat] = Object.values(parts).reduce(
          (sum, value) => sum + value,
          0,
        );
      }
      const grants = sources(draft),
        baseProfiles = skillProfiles(grants.skills),
        talentResult = talentGrants(grants.talents);
      const selected = choices(draft),
        expense = costs(draft);
      const names = new Set([
        ...baseProfiles.keys(),
        ...Object.keys(draft.advancement.skills),
      ]);
      const skills = baseOnly
        ? new Map([...baseProfiles].map(([name, p]) => [name, p.bonus]))
        : new Map(
            [...names]
              .map((name) => skillState(draft, name, baseProfiles))
              .filter((p) => p.stage > 0)
              .sort((a, b) => a.name.localeCompare(b.name, "ru"))
              .map((p) => [p.name, p.bonus ?? 0]),
          );
      const startingXp = race.startingXp * race.xpMultiplier;
      const wounds =
        race.generatedXeno && race.fixedGeneration
          ? Math.max(
              1,
              Number(race.fixedWounds ?? 1) +
                Number(world.woundBonus ?? 0) +
                Number(specialty.woundBonus ?? 0),
            )
          : (race.woundBonus ?? 0) +
            (world.woundBonus ?? 0) +
            (specialty.woundBonus ?? 0) +
            (bonus(stats.СВ) + bonus(stats.ВН)) * 2;
      return {
        name: draft.name.trim() || "Безымянный персонаж",
        gender: draft.gender,
        race,
        world,
        specialty,
        stats,
        breakdown,
        skills,
        talents: [
          ...talentResult.talents,
          ...(baseOnly ? [] : draft.advancement.talents.map((t) => t.name)),
        ],
        bonusXp: talentResult.bonusXp,
        startingXp,
        availableXp:
          startingXp +
          talentResult.bonusXp -
          specialty.xpCost -
          (baseOnly ? 0 : expense.spent),
        wounds,
        transfers: clone(draft.transfers),
        ...selected,
        specialtyEquipment: [
          ...(specialty.equipment ?? []),
          ...selected.specialtySelections
            .filter((c) => c.type === "equipment")
            .flatMap((c) => c.values),
        ],
        specialtyTraits: [...(specialty.traits ?? [])],
        specialtyRules: [...(specialty.specialRules ?? [])],
        advancement: {
          characteristics: { ...draft.advancement.characteristics },
          skills: Object.values(draft.advancement.skills).map((v) => ({
            ...v,
          })),
          talents: clone(draft.advancement.talents),
          costs: expense,
          spent: expense.spent,
        },
        ...(draft.originSource === "regiment" && draft.regiment
          ? {
              regiment: {
                ...clone(draft.regiment),
                selectedEntries: world.regimentMechanics?.selected,
                choices: clone(draft.regimentChoices),
              },
            }
          : {}),
        ...(race.generatedXeno
          ? {
              xenoProfile: race.xenoProfile,
              raceImplants: [...(race.implants ?? [])],
              racePsychicPowers: [...(race.psychicPowers ?? [])],
            }
          : {}),
      };
    }
    function requirementFailures(talent, character) {
      const requirements = String(talent.requirements ?? "").trim();
      if (!requirements || requirements === "-") return [];
      const failures = [],
        raceName = key(character.race.name),
        lower = key(requirements);
      if (/не\s+огрин/.test(lower) && raceName === "огрин")
        failures.push("требуется не Огрин");
      else if (
        /огрин\s*\(раса\)|^огрин(?:\b|,)/i.test(requirements) &&
        raceName !== "огрин"
      )
        failures.push("требуется раса Огрин");
      if (/ратлинг/i.test(requirements) && raceName !== "ратлинг")
        failures.push("требуется раса Ратлинг");
      // Preserve the legacy parser. Textual/alternative requirements remain subject to GM review.
      if (!/\bили\b/i.test(requirements)) {
        const aliases = {
          НС: "НС",
          НР: "НР",
          СЛ: "СЛ",
          ВН: "ВН",
          ЛВ: "ЛВ",
          ИН: "ИН",
          СВ: "СВ",
          ВС: "ВС",
          ОЩ: "ОЩ",
          "Навык Стрельбы": "НС",
          "Навык Рукопашного боя": "НР",
          Сила: "СЛ",
          Выносливость: "ВН",
          Ловкость: "ЛВ",
          Интеллект: "ИН",
          "Сила Воли": "СВ",
          Восприятие: "ВС",
          Общение: "ОЩ",
        };
        for (const alias of Object.keys(aliases).sort(
          (a, b) => b.length - a.length,
        )) {
          const regex = new RegExp(`${alias}\\s*(\\d{2})\\+?`, "gi");
          for (const match of requirements.matchAll(regex))
            if ((character.stats[aliases[alias]] ?? 0) < Number(match[1]))
              failures.push(`${aliases[alias]} ${match[1]}`);
        }
      }
      return [...new Set(failures)];
    }
    function validate(draft, { baseOnly = false } = {}) {
      const errors = [],
        add = (step, field, message) => errors.push({ step, field, message });
      const { race, world, specialty } = origins(draft);
      if (
        draft.originSource === "ready" &&
        !data.homeworlds.some((w) => w.id === draft.worldId)
      )
        add(0, "world", "Родной мир отсутствует в каталоге.");
      if (!data.races.some((r) => r.id === draft.raceId))
        add(0, "race", "Выбранная раса отсутствует в каталоге.");
      if (!specialties(draft).some((s) => s.id === draft.specialtyId))
        add(
          1,
          "specialty",
          "Специальность недоступна для выбранной расы и пола.",
        );
      for (const c of race.choices ?? []) {
        const values = (draft.raceChoices[c.id] ?? []).filter(Boolean);
        if (
          values.length !== (c.count ?? 1) ||
          new Set(values).size !== values.length ||
          values.some((v) => !c.options.includes(v))
        )
          add(
            0,
            `race:${c.id}`,
            `Для расы «${race.name}» завершите выбор «${c.label}»: ${c.count ?? 1} разных вариантов.`,
          );
      }
      for (const c of world.choices ?? [])
        if (!c.options.includes(draft.homeworldChoices[c.id]))
          add(
            0,
            `world:${c.id}`,
            `Для мира «${world.name}» завершите выбор «${c.label}».`,
          );
      if (draft.originSource === "regiment") {
        if (!draft.regiment)
          add(0, "regiment", "Сначала выберите сохранённый полк.");
        else {
          const m = world.regimentMechanics;
          for (const name of m.raceRequirements)
            if (!key(race.name).includes(key(name)))
              add(0, "race", `Выбранный полк требует расу «${name}».`);
          for (const c of m.choices) {
            const value = draft.regimentChoices[c.id];
            const valid =
              c.kind === "stat"
                ? Array.isArray(value) &&
                  value.length === c.choose &&
                  new Set(value).size === value.length &&
                  value.every((v) => c.options.includes(v))
                : c.kind.startsWith("free-")
                  ? Boolean(String(value ?? "").trim())
                  : c.options.some(
                      (v) =>
                        (c.kind === "stat-option"
                          ? `${v.stat}:${v.bonus}`
                          : v.value) === value,
                    );
            if (!valid)
              add(
                0,
                `regiment:${c.id}`,
                `Для полка завершите выбор «${c.label}».`,
              );
          }
        }
      }
      for (const c of specialty.choices ?? []) {
        const selected = choices(draft).specialtySelections.find(
          (v) => v.id === c.id,
        );
        const values = c.type.endsWith("Text")
          ? list(draft.specialtyChoices[c.id])
          : selected.values;
        if (c.required !== false && selected.values.length !== (c.count ?? 1))
          add(
            1,
            `specialty:${c.id}`,
            `Завершите выбор «${c.label}»: требуется ${c.count ?? 1}.`,
          );
        if (
          c.poolOptions &&
          (new Set(values).size !== values.length ||
            values.some((v) => !c.poolOptions.includes(v)))
        )
          add(
            1,
            `specialty:${c.id}`,
            `В выборе «${c.label}» нужны разные варианты из списка.`,
          );
        if (c.options && values.some((v) => !c.options.includes(v)))
          add(
            1,
            `specialty:${c.id}`,
            `Выбор «${c.label}» отсутствует в списке.`,
          );
      }
      if (!race.fixedGeneration) {
        const values = data.stats.map((s) =>
          draft.mode === "random" ? draft.rolls[s] : draft.plannedAdditions[s],
        );
        if (draft.mode === "random") {
          if (values.some((v) => !Number.isInteger(v) || v < 2 || v > 20))
            add(2, "rolls", "Выполните броски 2к10 для всех характеристик.");
        } else {
          if (
            values.some(
              (v) => !Number.isFinite(v) || v < 0 || v > race.maxPerStat,
            )
          )
            add(
              2,
              "points",
              `В характеристику можно вложить от 0 до ${race.maxPerStat} очков до переносов.`,
            );
          const used = values.reduce((sum, v) => sum + v, 0);
          if (used !== race.plannedPoints)
            add(
              2,
              "points",
              `Распределите ровно ${race.plannedPoints} очков. Сейчас: ${used}.`,
            );
        }
      }
      if (
        draft.transfers.length > (race.redistributionCount ?? 2) ||
        draft.transfers.some(
          (t) =>
            !data.stats.includes(t.from) ||
            !data.stats.includes(t.to) ||
            t.from === t.to,
        )
      )
        add(2, "transfers", "Проверьте количество и направления переносов.");
      if (draft.pendingTransferFrom)
        add(
          2,
          "transfers",
          `Завершите перенос из ${draft.pendingTransferFrom} или отмените выбор.`,
        );
      if (!baseOnly) {
        const character = build(draft);
        if (character.availableXp < 0)
          add(
            3,
            "xp",
            `Перерасход опыта: ${Math.abs(character.availableXp)} ОО. Отмените лишние покупки.`,
          );
        const base = skillProfiles(sources(draft).skills);
        for (const purchase of Object.values(draft.advancement.skills))
          if (purchase.count + (base.get(purchase.name)?.stage ?? 0) > 4)
            add(
              3,
              "skills",
              `После изменения происхождения у навыка «${purchase.name}» лишние покупки. Отмените их.`,
            );
        for (const purchase of draft.advancement.talents) {
          const talent = advancement.talents.find(
            (t) => t.id === purchase.catalogId,
          );
          if (talent && requirementFailures(talent, character).length)
            add(
              3,
              "talents",
              `После изменения персонажа не выполнены требования «${talent.name}»: ${requirementFailures(talent, character).join(", ")}.`,
            );
        }
      }
      return errors;
    }
    function talentName(talent, option = "") {
      return talent.option
        ? option.trim()
          ? `${talent.option.baseName ?? talent.name} (${option.trim()})`
          : ""
        : talent.name;
    }
    function transact(draft, action) {
      const next = clone(draft),
        a = next.advancement;
      const deny = (message) => ({ ok: false, draft, message });
      const ready = !validate(draft, { baseOnly: true }).length,
        character = build(draft);
      if (action.type.startsWith("buy") && !ready)
        return deny(
          "Сначала завершите происхождение, специальность и характеристики.",
        );
      if (action.type === "buyCharacteristic") {
        if (!data.stats.includes(action.stat))
          return deny("Неизвестная характеристика.");
        const count = a.characteristics[action.stat] ?? 0;
        if (character.availableXp < characteristicCost(count))
          return deny("Недостаточно опыта.");
        a.characteristics[action.stat] = count + 1;
      } else if (action.type === "undoCharacteristic") {
        if (!data.stats.includes(action.stat))
          return deny("Неизвестная характеристика.");
        a.characteristics[action.stat] = Math.max(
          0,
          (a.characteristics[action.stat] ?? 0) - 1,
        );
      } else if (action.type === "buySkill") {
        const name = canonicalSkill(action.name),
          p = skillState(draft, name);
        if (!name || p.nextCost === null || character.availableXp < p.nextCost)
          return deny("Покупка недоступна: проверьте опыт и предел навыка.");
        a.skills[name] = { name, count: (a.skills[name]?.count ?? 0) + 1 };
      } else if (action.type === "undoSkill") {
        const name = canonicalSkill(action.name);
        if (a.skills[name] && --a.skills[name].count <= 0)
          delete a.skills[name];
      } else if (action.type === "buyTalent") {
        const talent = advancement.talents.find(
          (t) => t.id === action.catalogId,
        );
        if (!talent) return deny("Талант отсутствует в каталоге.");
        const name = talentName(talent, action.option ?? "");
        if (!name) return deny("Укажите специализацию таланта.");
        if (
          !talent.repeatable &&
          !talent.option?.repeatable &&
          character.talents.some((t) => key(t) === key(name))
        )
          return deny("Талант уже получен.");
        if (character.availableXp < talentCost(talent.level))
          return deny("Недостаточно опыта.");
        const failures = requirementFailures(talent, character);
        if (failures.length)
          return deny(`Не выполнено: ${failures.join(", ")}.`);
        a.talents.push({
          id: action.id,
          catalogId: talent.id,
          name,
          level: talent.level,
          option: action.option ?? "",
        });
      } else if (action.type === "undoTalent")
        a.talents = a.talents.filter((t) => t.id !== action.id);
      else if (action.type === "resetAdvancement")
        next.advancement = createDraft().advancement;
      else return deny("Неизвестная операция.");
      return { ok: true, draft: next };
    }
    return {
      createDraft,
      origins,
      specialties,
      choices,
      sources,
      generation,
      characteristicCost,
      talentCost,
      skillState,
      costs,
      build,
      validate,
      requirementFailures,
      talentName,
      transact,
    };
  }
  const api = {
    createEngine,
    canonicalSkill,
    parseSkill,
    skillProfiles,
    talentGrants,
    expandTalent,
    bonus,
    key,
    list,
  };
  if (typeof module !== "undefined") module.exports = api;
  if (root) root.KadatCharacter = api;
})(typeof window !== "undefined" ? window : null);
