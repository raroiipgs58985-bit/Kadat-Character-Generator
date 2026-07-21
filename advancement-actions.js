function simpleRequirementFailures(talent) {
  const requirements = String(talent.requirements ?? "").trim();
  if (!requirements || requirements === "-") return [];

  const failures = [];
  const character = currentBaseCharacter();
  const stats = { ...(character?.stats ?? {}) };
  DATA.stats.forEach(stat => {
    stats[stat] = (stats[stat] ?? 0) + (state.advancement.characteristics[stat] ?? 0) * 5;
  });

  const raceName = getSelected(DATA.races, raceSelect.value).name.toLocaleLowerCase("ru-RU");
  const lower = requirements.toLocaleLowerCase("ru-RU");
  if (/не\s+огрин/.test(lower) && raceName === "огрин") failures.push("требуется не Огрин");
  else if (/огрин\s*\(раса\)|^огрин(?:\b|,)/i.test(requirements) && raceName !== "огрин") failures.push("требуется раса Огрин");
  if (/ратлинг/i.test(requirements) && raceName !== "ратлинг") failures.push("требуется раса Ратлинг");

  if (!/\bили\b/i.test(requirements)) {
    const statAliases = {
      "НС": "НС", "НР": "НР", "СЛ": "СЛ", "ВН": "ВН", "ЛВ": "ЛВ", "ИН": "ИН", "СВ": "СВ", "ВС": "ВС", "ОЩ": "ОЩ",
      "Навык Стрельбы": "НС", "Навык Рукопашного боя": "НР", "Сила": "СЛ", "Выносливость": "ВН",
      "Ловкость": "ЛВ", "Интеллект": "ИН", "Сила Воли": "СВ", "Восприятие": "ВС", "Общение": "ОЩ"
    };

    const orderedAliases = Object.keys(statAliases).sort((a, b) => b.length - a.length);
    for (const alias of orderedAliases) {
      const regex = new RegExp(`${alias.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*(\\d{2})\\+?`, "gi");
      let match;
      while ((match = regex.exec(requirements))) {
        const stat = statAliases[alias];
        const needed = Number(match[1]);
        if ((stats[stat] ?? 0) < needed) failures.push(`${stat} ${needed}`);
      }
    }
  }

  return [...new Set(failures)];
}

function advancementReset() {
  state.advancement.characteristics = Object.fromEntries(DATA.stats.map(stat => [stat, 0]));
  state.advancement.skills = {};
  state.advancement.talents = [];
  state.advancement.ui.talentOptions = {};
  renderAdvancement();
  applyAdvancementPreview();
}

function buyCharacteristic(stat) {
  const count = state.advancement.characteristics[stat] ?? 0;
  const cost = characteristicCostAt(count);
  if (!isAdvancementReady() || remainingXp() < cost) return;
  state.advancement.characteristics[stat] = count + 1;
  renderAdvancement();
  applyAdvancementPreview();
}

function undoCharacteristic(stat) {
  const count = state.advancement.characteristics[stat] ?? 0;
  if (count <= 0) return;
  state.advancement.characteristics[stat] = count - 1;
  renderAdvancement();
  applyAdvancementPreview();
}

function buySkill(name) {
  const canonical = canonicalSkillName(name);
  const profile = getSkillPurchaseState(canonical);
  if (!canonical || profile.nextCost === null || !isAdvancementReady() || remainingXp() < profile.nextCost) return;

  const purchase = state.advancement.skills[canonical] ?? { name: canonical, count: 0 };
  purchase.count += 1;
  state.advancement.skills[canonical] = purchase;
  renderAdvancement();
}

function undoSkill(name) {
  const canonical = canonicalSkillName(name);
  const purchase = state.advancement.skills[canonical];
  if (!purchase) return;
  purchase.count -= 1;
  if (purchase.count <= 0) delete state.advancement.skills[canonical];
  renderAdvancement();
}

function buyTalent(talentId) {
  const talent = ADVANCEMENT.talents.find(item => item.id === talentId);
  if (!talent) return;
  const optionValue = talentOptionValue(talent);
  const fullName = formatTalentName(talent, optionValue);
  if (!fullName) return;

  const cost = talentCost(talent.level);
  const owned = currentTalentMap();
  if (!talent.option?.repeatable && owned.has(advKey(fullName))) return;
  if (owned.has(advKey(fullName))) return;
  if (!isAdvancementReady() || remainingXp() < cost) return;
  if (simpleRequirementFailures(talent).length) return;

  state.advancement.talents.push({
    id: `${talent.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    catalogId: talent.id,
    name: fullName,
    level: talent.level,
    option: optionValue
  });
  renderAdvancement();
}

function undoTalent(id) {
  state.advancement.talents = state.advancement.talents.filter(talent => talent.id !== id);
  renderAdvancement();
}

function selectedSkillCatalogItem() {
  return ADVANCEMENT.skills.find(skill => skill.name === state.advancement.ui.skillName) ?? ADVANCEMENT.skills[0];
}

function resolvedDraftSkillName() {
  const skill = selectedSkillCatalogItem();
  if (!skill) return "";
  if (!(skill.specializations ?? []).length) return skill.name;

  let specialization = state.advancement.ui.skillSpecialization;
  if (specialization.includes("#Имя")) {
    const custom = state.advancement.ui.skillCustomSpecialization.trim();
    if (!custom) return "";
    specialization = specialization.replace("#Имя", custom);
  }
  return specialization ? `${skill.name} (${specialization})` : "";
}

