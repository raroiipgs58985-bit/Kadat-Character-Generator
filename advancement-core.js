const ADVANCEMENT = window.KADAT_ADVANCEMENT;
const advancementContainer = document.querySelector("#advancement");

state.advancement = state.advancement ?? {
  characteristics: Object.fromEntries(DATA.stats.map(stat => [stat, 0])),
  skills: {},
  talents: [],
  ui: {
    skillName: ADVANCEMENT.skills[0]?.name ?? "",
    skillSpecialization: "",
    skillCustomSpecialization: "",
    talentSearch: "",
    talentLevel: "1",
    talentCategory: "Все",
    talentOptions: {}
  }
};

function advEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function advKey(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLocaleLowerCase("ru-RU");
}

function canonicalSkillName(value) {
  let result = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s+\)/g, ")")
    .trim();

  result = result
    .replace(/^Безопастность/i, "Безопасность")
    .replace(/^Общие\s+знания/i, "Общее знание")
    .replace(/^Уч[её]ные\s+знания/i, "Учёное знание")
    .replace(/^Запретные\s+знания/i, "Запретное знание")
    .replace(/^Языки(?=\s*\()/i, "Язык")
    .replace(/^Тех\s*(?:Юз|ЮЗ|пользование|пользования)/i, "Технология")
    .replace(/^Пси[-\s]?чуть[её]/i, "Психическое чутьё")
    .replace(/^Навигация\s*\(Планетарная\)/i, "Навигация (Поверхность)");

  return result;
}

normalizeSkillName = canonicalSkillName;

function expandTalentGrant(rawTalent) {
  const talent = String(rawTalent ?? "").replace(/\s+/g, " ").trim();
  if (!talent) return [];

  const match = talent.match(/^(Владение оружием|Обострённые чувства|Сопротивляемость)\s*\(([^)]+)\)$/i);
  if (!match) return [talent];

  const values = match[2]
    .split(/[,/;]/)
    .map(value => value.trim())
    .filter(Boolean);

  if (values.length < 2 || values.some(value => /люб|кроме|выбер|\d/i.test(value))) return [talent];
  return values.map(value => `${match[1]} (${value})`);
}

mergeTalents = function (sources) {
  const talents = new Map();
  let bonusXp = 0;

  for (const source of sources) {
    for (const rawTalent of source ?? []) {
      for (const talent of expandTalentGrant(rawTalent)) {
        const key = advKey(talent);
        if (!key) continue;
        if (talents.has(key)) bonusXp += 25;
        else talents.set(key, talent);
      }
    }
  }

  return { talents: [...talents.values()], bonusXp };
};

function getCurrentOriginData() {
  const race = getSelected(DATA.races, raceSelect.value);
  const world = getSelected(DATA.homeworlds, worldSelect.value);
  const specialty = getSelected(DATA.specialties, specialtySelect.value);
  const raceSelections = typeof getResolvedRaceChoices === "function"
    ? getResolvedRaceChoices(race)
    : [];
  const worldSelections = typeof getResolvedHomeworldChoices === "function"
    ? getResolvedHomeworldChoices(world)
    : [];
  const specialtySelections = typeof getResolvedSpecialtySelections === "function"
    ? getResolvedSpecialtySelections(specialty)
    : [];

  return { race, world, specialty, raceSelections, worldSelections, specialtySelections };
}

function collectOriginSkillSources() {
  const { race, world, specialty, raceSelections, worldSelections, specialtySelections } = getCurrentOriginData();
  const raceSkills = raceSelections
    .filter(selection => selection.type === "skill" && selection.value)
    .map(selection => selection.value);
  const worldSkills = worldSelections
    .filter(selection => selection.type === "skill" && selection.value)
    .map(selection => selection.value);
  const specialtySkills = specialtySelections
    .filter(selection => selection.type === "skill" || selection.type === "skillText")
    .flatMap(selection => selection.values ?? []);

  return [
    race.skills ?? [],
    raceSkills,
    world.skills ?? [],
    worldSkills,
    specialty.skills ?? [],
    specialtySkills,
    parseList(document.querySelector("#manual-skills")?.value ?? "")
  ];
}

function collectOriginTalentSources() {
  const { race, world, specialty, raceSelections, worldSelections, specialtySelections } = getCurrentOriginData();
  const raceTalents = raceSelections
    .filter(selection => selection.type === "talent" && selection.value)
    .map(selection => selection.value);
  const worldTalents = worldSelections
    .filter(selection => selection.type === "talent" && selection.value)
    .map(selection => selection.value);
  const specialtyTalents = specialtySelections
    .filter(selection => selection.type === "talent" || selection.type === "talentText")
    .flatMap(selection => selection.values ?? []);

  return [
    race.talents ?? [],
    raceTalents,
    world.talents ?? [],
    worldTalents,
    specialty.talents ?? [],
    specialtyTalents,
    parseList(document.querySelector("#manual-talents")?.value ?? "")
  ];
}

function buildBaseSkillProfiles() {
  const profiles = new Map();

  for (const source of collectOriginSkillSources()) {
    for (const rawSkill of source ?? []) {
      const parsed = parseSkillGrant(rawSkill);
      const name = canonicalSkillName(parsed.name);
      if (!name) continue;

      const stage = Math.min(4, Math.floor(parsed.bonus / 10) + 1);
      const current = profiles.get(name);
      if (!current) {
        profiles.set(name, { name, bonus: parsed.bonus, stage });
      } else {
        current.bonus = Math.min(30, Math.max(current.bonus, parsed.bonus) + 5);
        current.stage = Math.max(current.stage, stage);
      }
    }
  }

  return profiles;
}

function buildBaseTalentMap() {
  const result = new Map();
  for (const source of collectOriginTalentSources()) {
    for (const rawTalent of source ?? []) {
      for (const talent of expandTalentGrant(rawTalent)) {
        const key = advKey(talent);
        if (key && !result.has(key)) result.set(key, talent);
      }
    }
  }
  return result;
}

function characteristicCostAt(index) {
  const costs = ADVANCEMENT.costs.characteristics;
  return costs[Math.min(index, costs.length - 1)];
}

function skillCostAt(stage) {
  return ADVANCEMENT.costs.skills[stage] ?? null;
}

function talentCost(level) {
  return Number(ADVANCEMENT.costs.talents[String(level)] ?? 0);
}

function totalCharacteristicCost() {
  return DATA.stats.reduce((sum, stat) => {
    const count = state.advancement.characteristics[stat] ?? 0;
    for (let index = 0; index < count; index += 1) sum += characteristicCostAt(index);
    return sum;
  }, 0);
}

function totalSkillCost() {
  const baseProfiles = buildBaseSkillProfiles();
  let total = 0;

  for (const purchase of Object.values(state.advancement.skills)) {
    const baseStage = baseProfiles.get(purchase.name)?.stage ?? 0;
    for (let index = 0; index < purchase.count; index += 1) {
      total += skillCostAt(baseStage + index) ?? 0;
    }
  }

  return total;
}

function totalTalentCost() {
  return state.advancement.talents.reduce((sum, talent) => sum + talentCost(talent.level), 0);
}

function advancementSpent() {
  return totalCharacteristicCost() + totalSkillCost() + totalTalentCost();
}

function currentBaseCharacter() {
  try {
    return buildCharacterBeforeAdvancement();
  } catch (error) {
    return null;
  }
}

function baseAvailableXp() {
  return Number(currentBaseCharacter()?.availableXp ?? 0);
}

function remainingXp() {
  return baseAvailableXp() - advancementSpent();
}

function isAdvancementReady() {
  return validateCharacterBeforeAdvancement() === "";
}

function getSkillPurchaseState(name) {
  const canonical = canonicalSkillName(name);
  const base = buildBaseSkillProfiles().get(canonical) ?? { name: canonical, bonus: 0, stage: 0 };
  const purchase = state.advancement.skills[canonical] ?? { name: canonical, count: 0 };
  const stage = Math.min(4, base.stage + purchase.count);
  let bonus = null;

  if (base.stage > 0) bonus = Math.min(30, base.bonus + purchase.count * 10);
  else if (purchase.count > 0) bonus = Math.min(30, (purchase.count - 1) * 10);

  return {
    name: canonical,
    baseBonus: base.stage ? base.bonus : null,
    baseStage: base.stage,
    purchased: purchase.count,
    stage,
    bonus,
    nextCost: stage < 4 && (bonus ?? -1) < 30 ? skillCostAt(stage) : null
  };
}

function currentSkillProfiles() {
  const names = new Set(buildBaseSkillProfiles().keys());
  Object.keys(state.advancement.skills).forEach(name => names.add(name));
  return [...names]
    .map(name => getSkillPurchaseState(name))
    .filter(profile => profile.stage > 0)
    .sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

function currentTalentMap() {
  const result = buildBaseTalentMap();
  for (const purchase of state.advancement.talents) result.set(advKey(purchase.name), purchase.name);
  return result;
}

function formatTalentName(talent, optionValue) {
  const option = talent.option;
  if (!option) return talent.name;
  const value = String(optionValue ?? "").trim();
  if (!value) return "";
  return `${option.baseName ?? talent.name} (${value})`;
}

function talentOptionValue(talent) {
  return state.advancement.ui.talentOptions[talent.id] ?? "";
}

