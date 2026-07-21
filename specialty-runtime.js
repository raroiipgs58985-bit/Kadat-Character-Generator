function normalizeSkillName(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/\s+\)/g, ")")
    .trim();
}

function parseSkillGrant(rawSkill) {
  const normalized = normalizeSkillName(rawSkill);
  const match = normalized.match(/^(.*?)(?:\s+\+(\d+))$/);

  if (!match) return { name: normalized, bonus: 0 };

  return {
    name: normalizeSkillName(match[1]),
    bonus: Math.min(30, Number(match[2]))
  };
}

mergeSkills = function (sources) {
  const skills = new Map();

  for (const source of sources) {
    for (const rawSkill of source ?? []) {
      const { name, bonus } = parseSkillGrant(rawSkill);
      if (!name) continue;

      const current = skills.get(name);
      if (current === undefined) {
        skills.set(name, bonus);
      } else {
        skills.set(name, Math.min(30, Math.max(current, bonus) + 5));
      }
    }
  }

  return skills;
};

mergeTalents = function (sources) {
  const talents = new Map();
  let bonusXp = 0;

  for (const source of sources) {
    for (const rawTalent of source ?? []) {
      const talent = String(rawTalent).replace(/\s+/g, " ").trim();
      if (!talent) continue;

      const key = talent.toLocaleLowerCase("ru-RU");
      if (talents.has(key)) bonusXp += 25;
      else talents.set(key, talent);
    }
  }

  return { talents: [...talents.values()], bonusXp };
};
const specialtyChoicesContainer = document.querySelector("#specialty-choices");
const genderSelect = document.querySelector("#gender");
state.specialtyChoices = {};

function escapeSpecialtyHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCurrentSpecialty() {
  return getSelected(DATA.specialties, specialtySelect.value);
}

function getAvailableSpecialties() {
  const raceId = raceSelect.value;
  const gender = genderSelect?.value ?? "unspecified";

  return DATA.specialties.filter(specialty => {
    if (specialty.id === "none") return true;
    if (!(specialty.allowedRaces ?? []).includes(raceId)) return false;
    if (specialty.gender && specialty.gender !== gender) return false;
    return true;
  });
}

function renderSpecialtyOptions() {
  const available = getAvailableSpecialties();
  const previous = specialtySelect.value;
  const general = available.filter(item => item.id === "none");
  const groups = new Map();

  for (const specialty of available) {
    if (specialty.id === "none") continue;
    const category = specialty.category || "Прочие специальности";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(specialty);
  }

  specialtySelect.innerHTML = [
    ...general.map(item => `<option value="${item.id}">${escapeSpecialtyHtml(item.name)}</option>`),
    ...[...groups.entries()].map(([category, items]) => `
      <optgroup label="${escapeSpecialtyHtml(category)}">
        ${items.map(item => `
          <option value="${item.id}">
            ${escapeSpecialtyHtml(item.name)}${item.xpCost ? ` — ${item.xpCost} ОО` : ""}
          </option>
        `).join("")}
      </optgroup>
    `)
  ].join("");

  specialtySelect.value = available.some(item => item.id === previous) ? previous : "none";
}

function parseSpecialtyTextChoice(choice, rawValue) {
  const values = String(rawValue ?? "")
    .split(/[;\n]/)
    .map(value => value.trim())
    .filter(Boolean);

  return values.map(value => {
    if (!choice.template) return value;
    if (value.includes("(") && value.includes(")")) return value;
    return choice.template.replace("{value}", value);
  });
}

function getResolvedSpecialtySelections(specialty = getCurrentSpecialty()) {
  return (specialty.choices ?? []).map(choice => {
    const rawValue = state.specialtyChoices[choice.id] ?? "";
    const values = choice.type.endsWith("Text")
      ? parseSpecialtyTextChoice(choice, rawValue)
      : (rawValue ? [rawValue] : []);

    return {
      id: choice.id,
      label: choice.label,
      type: choice.type,
      count: choice.count ?? 1,
      values
    };
  });
}

function renderSpecialtyChoices() {
  const specialty = getCurrentSpecialty();
  const choices = specialty.choices ?? [];

  if (specialty.id === "none") {
    specialtyChoicesContainer.className = "specialty-choices hidden";
    specialtyChoicesContainer.innerHTML = "";
    return;
  }

  const description = specialty.description
    ? `<p class="specialty-choice-description">${escapeSpecialtyHtml(specialty.description)}</p>`
    : "";

  const cost = specialty.xpCost
    ? `<span class="specialty-cost">${specialty.xpCost} ОО</span>`
    : `<span class="specialty-cost free">Без стоимости</span>`;

  const fields = choices.map(choice => {
    if (choice.type.endsWith("Text")) {
      return `
        <label class="choice-field">
          ${escapeSpecialtyHtml(choice.label)}
          <textarea
            rows="2"
            data-specialty-choice="${choice.id}"
            placeholder="${escapeSpecialtyHtml(choice.placeholder ?? "Введите варианты через ;")}"
          >${escapeSpecialtyHtml(state.specialtyChoices[choice.id] ?? "")}</textarea>
          <span class="choice-hint">Нужно указать: ${choice.count ?? 1}</span>
        </label>
      `;
    }

    return `
      <label class="choice-field">
        ${escapeSpecialtyHtml(choice.label)}
        <select data-specialty-choice="${choice.id}">
          <option value="">— Выберите один вариант —</option>
          ${(choice.options ?? []).map(option => `
            <option value="${escapeSpecialtyHtml(option)}"
              ${state.specialtyChoices[choice.id] === option ? "selected" : ""}>
              ${escapeSpecialtyHtml(option)}
            </option>
          `).join("")}
        </select>
      </label>
    `;
  }).join("");

  specialtyChoicesContainer.className = "specialty-choices";
  specialtyChoicesContainer.innerHTML = `
    <div class="choice-heading">
      <div>
        <h3>${escapeSpecialtyHtml(specialty.name)}</h3>
        ${description}
      </div>
      ${cost}
    </div>
    ${choices.length
      ? `<p class="muted">Варианты из таблицы, разделённые знаком «/», выбираются по одному.</p>
         <div class="choice-grid">${fields}</div>`
      : `<p class="muted">У этой специальности нет обязательных вариантов выбора.</p>`
    }
  `;

  specialtyChoicesContainer.querySelectorAll("[data-specialty-choice]").forEach(control => {
    control.addEventListener("input", () => {
      state.specialtyChoices[control.dataset.specialtyChoice] = control.value;
      clearError();
    });
    control.addEventListener("change", () => {
      state.specialtyChoices[control.dataset.specialtyChoice] = control.value;
      clearError();
    });
  });
}

function resetSpecialtyChoices() {
  state.specialtyChoices = {};
  renderSpecialtyChoices();
}

function refreshSpecialties() {
  renderSpecialtyOptions();
  resetSpecialtyChoices();
  renderStats();
}

const validateCharacterBeforeSpecialtyChoices = validateCharacter;
validateCharacter = function () {
  const baseError = validateCharacterBeforeSpecialtyChoices();
  if (baseError) return baseError;

  const specialty = getCurrentSpecialty();
  const selections = getResolvedSpecialtySelections(specialty);

  for (const choice of specialty.choices ?? []) {
    const selection = selections.find(item => item.id === choice.id);
    const actual = selection?.values.length ?? 0;
    const expected = choice.count ?? 1;

    if (choice.required !== false && actual !== expected) {
      return `Для специальности «${specialty.name}» нужно сделать выбор: ${choice.label}. Требуется вариантов: ${expected}.`;
    }
  }

  return "";
};

function applySpecialtyFeatureModifiers(race, specialty) {
  const modifiers = specialty.uniqueFeatureModifiers ?? [];
  if (!modifiers.length || !(race.uniqueFeatures ?? []).length) return race;

  const uniqueFeatures = race.uniqueFeatures.map(feature => {
    const modifier = modifiers.find(item => item.name === feature.name);
    return modifier ? { ...feature, rating: modifier.rating } : feature;
  });

  return { ...race, uniqueFeatures };
}

const buildCharacterBeforeSpecialtyChoices = buildCharacter;
buildCharacter = function () {
  const specialty = getCurrentSpecialty();
  const selections = getResolvedSpecialtySelections(specialty);
  const selectedSkills = selections
    .filter(selection => selection.type === "skill" || selection.type === "skillText")
    .flatMap(selection => selection.values);
  const selectedTalents = selections
    .filter(selection => selection.type === "talent" || selection.type === "talentText")
    .flatMap(selection => selection.values);
  const selectedEquipment = selections
    .filter(selection => selection.type === "equipment")
    .flatMap(selection => selection.values);

  const originalSkills = specialty.skills;
  const originalTalents = specialty.talents;

  specialty.skills = [...originalSkills, ...selectedSkills];
  specialty.talents = [...originalTalents, ...selectedTalents];

  try {
    const character = buildCharacterBeforeSpecialtyChoices();
    character.gender = genderSelect?.value ?? "unspecified";
    character.specialtySelections = selections;
    character.specialtyEquipment = [
      ...(specialty.equipment ?? []),
      ...selectedEquipment
    ];
    character.specialtyTraits = [...(specialty.traits ?? [])];
    character.specialtyRules = [...(specialty.specialRules ?? [])];
    character.race = applySpecialtyFeatureModifiers(character.race, specialty);
    return character;
  } finally {
    specialty.skills = originalSkills;
    specialty.talents = originalTalents;
  }
};

raceSelect.addEventListener("change", refreshSpecialties);
genderSelect?.addEventListener("change", refreshSpecialties);
specialtySelect.addEventListener("change", () => {
  resetSpecialtyChoices();
  renderStats();
});
document.querySelector("#reset-button").addEventListener("click", refreshSpecialties);

renderSpecialtyOptions();
renderSpecialtyChoices();
renderStats();
const renderResultWithSpecialtyBase = renderResult;

function renderSpecialtySection(character) {
  const specialty = character.specialty;
  if (!specialty || specialty.id === "none") return "";

  const modifiers = DATA.stats
    .filter(stat => specialty.statModifiers?.[stat])
    .map(stat => {
      const value = specialty.statModifiers[stat];
      return `<span class="tag">${escapeHtml(stat)} ${value > 0 ? "+" : ""}${value}</span>`;
    })
    .join("") || `<span class="muted">Нет модификаторов характеристик</span>`;

  const selectedSkills = (character.specialtySelections ?? [])
    .filter(selection => selection.type === "skill" || selection.type === "skillText")
    .flatMap(selection => selection.values);
  const selectedTalents = (character.specialtySelections ?? [])
    .filter(selection => selection.type === "talent" || selection.type === "talentText")
    .flatMap(selection => selection.values);

  const specialtySkills = [...(specialty.skills ?? []), ...selectedSkills]
    .map(skill => `<span class="tag">${escapeHtml(skill)}</span>`)
    .join("") || `<span class="muted">Нет навыков</span>`;

  const specialtyTalents = [...(specialty.talents ?? []), ...selectedTalents]
    .map(talent => `<span class="tag">${escapeHtml(talent)}</span>`)
    .join("") || `<span class="muted">Нет талантов</span>`;

  const traits = (character.specialtyTraits ?? [])
    .map(trait => `<span class="tag">${escapeHtml(trait)}</span>`)
    .join("");

  const rules = (character.specialtyRules ?? [])
    .map(rule => `
      <article class="rule-card">
        <h4>${escapeHtml(rule.name)}</h4>
        <p>${escapeHtml(rule.text)}</p>
      </article>
    `).join("");

  const resourceModifiers = (specialty.uniqueFeatureModifiers ?? [])
    .map(modifier => `
      <article class="specialty-resource-card">
        <span>${escapeHtml(modifier.name)}</span>
        <strong>Рейтинг ${modifier.rating}</strong>
      </article>
    `).join("");

  const equipment = (character.specialtyEquipment ?? [])
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("") || `<li class="muted">Специальность не выдаёт отдельного снаряжения</li>`;

  const selectedOptions = (character.specialtySelections ?? [])
    .filter(selection => selection.values.length)
    .map(selection => `
      <li>
        <strong>${escapeHtml(selection.label)}:</strong>
        ${selection.values.map(value => escapeHtml(value)).join("; ")}
      </li>
    `).join("");

  return `
    <div class="specialty-section">
      <div class="specialty-title-row">
        <div>
          <h3>Специальность: ${escapeHtml(specialty.name)}</h3>
          <p class="muted">${escapeHtml(specialty.category ?? "")}</p>
        </div>
        <span class="specialty-output-cost">${specialty.xpCost ?? 0} ОО</span>
      </div>

      ${specialty.description ? `<p>${escapeHtml(specialty.description)}</p>` : ""}

      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Стоимость</span>
          <span class="summary-value">${specialty.xpCost ?? 0} ОО</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Бонус ран</span>
          <span class="summary-value">${specialty.woundBonus > 0 ? "+" : ""}${specialty.woundBonus ?? 0}</span>
        </div>
      </div>

      <div><h4>Бонусные характеристики</h4><div class="tags">${modifiers}</div></div>
      <div><h4>Навыки специальности</h4><div class="tags">${specialtySkills}</div></div>
      <div><h4>Таланты специальности</h4><div class="tags">${specialtyTalents}</div></div>
      ${traits ? `<div><h4>Особенности специальности</h4><div class="tags">${traits}</div></div>` : ""}
      ${resourceModifiers ? `<div><h4>Изменение уникальной особенности</h4><div class="specialty-resource-list">${resourceModifiers}</div></div>` : ""}
      ${selectedOptions ? `<div><h4>Сделанные выборы</h4><ul class="specialty-selection-list">${selectedOptions}</ul></div>` : ""}
      ${rules ? `<div><h4>Особые правила</h4><div class="rule-list">${rules}</div></div>` : ""}
      <div><h4>Снаряжение специальности</h4><ul class="equipment-list">${equipment}</ul></div>
    </div>
  `;
}

renderResult = function (character) {
  renderResultWithSpecialtyBase(character);

  const specialtyMarkup = renderSpecialtySection(character);
  if (!specialtyMarkup) return;

  const container = document.createElement("div");
  container.innerHTML = specialtyMarkup.trim();
  const section = container.firstElementChild;
  const equipmentSection = result.lastElementChild;
  result.insertBefore(section, equipmentSection);
};
