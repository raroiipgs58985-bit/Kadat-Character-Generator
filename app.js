const DATA = window.KADAT_DATA;
const state = {
  rolls: Object.fromEntries(DATA.stats.map(stat => [stat, 0]))
};

const $ = selector => document.querySelector(selector);
const form = $("#character-form");
const raceSelect = $("#race");
const worldSelect = $("#homeworld");
const specialtySelect = $("#specialty");
const modeSelect = $("#generation-mode");
const statsGrid = $("#stats-grid");
const pointsStatus = $("#points-status");
const rollButton = $("#roll-button");
const result = $("#result");
const validationMessage = $("#validation-message");

function fillSelect(select, items) {
  select.innerHTML = items.map(item => `<option value="${item.id}">${item.name}</option>`).join("");
}

function getSelected(items, id) {
  return items.find(item => item.id === id) ?? items[0];
}

function characteristicBonus(value) {
  return Math.floor(value / 10);
}

function parseList(value) {
  return value
    .split(/[;\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function mergeSkills(sources) {
  const skills = new Map();
  for (const source of sources) {
    for (const rawSkill of source) {
      const skill = rawSkill.trim();
      if (!skill) continue;
      const current = skills.get(skill);
      skills.set(skill, current === undefined ? 0 : Math.min(30, current + 5));
    }
  }
  return skills;
}

function mergeTalents(sources) {
  const talents = new Set();
  let bonusXp = 0;
  for (const source of sources) {
    for (const rawTalent of source) {
      const talent = rawTalent.trim();
      if (!talent) continue;
      if (talents.has(talent)) bonusXp += 25;
      else talents.add(talent);
    }
  }
  return { talents: [...talents], bonusXp };
}

function getAdditions() {
  return Object.fromEntries(DATA.stats.map(stat => {
    const input = document.querySelector(`[data-stat-input="${stat}"]`);
    return [stat, Number(input?.value || 0)];
  }));
}

function renderStats() {
  const race = getSelected(DATA.races, raceSelect.value);
  const world = getSelected(DATA.homeworlds, worldSelect.value);
  const specialty = getSelected(DATA.specialties, specialtySelect.value);
  const mode = modeSelect.value;

  statsGrid.innerHTML = DATA.stats.map(stat => {
    const base = race.baseStats[stat] ?? 0;
    const worldMod = world.statModifiers[stat] ?? 0;
    const specialtyMod = specialty.statModifiers[stat] ?? 0;
    const generationValue = mode === "random" ? state.rolls[stat] : 0;
    const total = base + worldMod + specialtyMod + generationValue;
    const input = mode === "planned"
      ? `<input type="number" min="0" max="${race.maxPerStat}" value="0" data-stat-input="${stat}" aria-label="Очки в ${stat}">`
      : `<div class="stat-details">Бросок: ${generationValue || "—"}</div>`;

    return `
      <article class="stat-card">
        <div class="stat-name">${stat}</div>
        <div class="stat-total" data-stat-total="${stat}">${total}</div>
        <div class="stat-details">База ${base}, мир ${signed(worldMod)}, спец. ${signed(specialtyMod)}</div>
        ${input}
      </article>`;
  }).join("");

  statsGrid.querySelectorAll("input").forEach(input => input.addEventListener("input", updatePreview));
  updatePreview();
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function updatePreview() {
  const race = getSelected(DATA.races, raceSelect.value);
  const world = getSelected(DATA.homeworlds, worldSelect.value);
  const specialty = getSelected(DATA.specialties, specialtySelect.value);
  const additions = getAdditions();
  const mode = modeSelect.value;

  for (const stat of DATA.stats) {
    const total = (race.baseStats[stat] ?? 0)
      + (world.statModifiers[stat] ?? 0)
      + (specialty.statModifiers[stat] ?? 0)
      + (mode === "planned" ? additions[stat] : state.rolls[stat]);
    const node = document.querySelector(`[data-stat-total="${stat}"]`);
    if (node) node.textContent = total;
  }

  if (mode === "planned") {
    const used = Object.values(additions).reduce((sum, value) => sum + value, 0);
    const remaining = race.plannedPoints - used;
    pointsStatus.textContent = `Потрачено: ${used} / ${race.plannedPoints}. Осталось: ${remaining}. Максимум ${race.maxPerStat} в одну характеристику.`;
    pointsStatus.style.color = remaining < 0 ? "#ff8585" : "";
  } else {
    const rolled = Object.values(state.rolls).every(value => value > 0);
    pointsStatus.textContent = rolled ? "Броски выполнены." : "Нажми «Бросить 2к10».";
  }
}

function rollStats() {
  for (const stat of DATA.stats) {
    state.rolls[stat] = randomD10() + randomD10();
  }
  renderStats();
}

function randomD10() {
  return Math.floor(Math.random() * 10) + 1;
}

function validateCharacter() {
  const race = getSelected(DATA.races, raceSelect.value);
  if (modeSelect.value === "planned") {
    const additions = getAdditions();
    const values = Object.values(additions);
    if (values.some(value => value < 0 || value > race.maxPerStat)) {
      return `В одну характеристику можно вложить от 0 до ${race.maxPerStat} очков.`;
    }
    const used = values.reduce((sum, value) => sum + value, 0);
    if (used !== race.plannedPoints) {
      return `Нужно распределить ровно ${race.plannedPoints} очков. Сейчас распределено ${used}.`;
    }
  } else if (Object.values(state.rolls).some(value => value === 0)) {
    return "Сначала выполни броски 2к10.";
  }
  return "";
}

function buildCharacter() {
  const race = getSelected(DATA.races, raceSelect.value);
  const world = getSelected(DATA.homeworlds, worldSelect.value);
  const specialty = getSelected(DATA.specialties, specialtySelect.value);
  const additions = getAdditions();
  const mode = modeSelect.value;
  const stats = {};

  for (const stat of DATA.stats) {
    stats[stat] = (race.baseStats[stat] ?? 0)
      + (world.statModifiers[stat] ?? 0)
      + (specialty.statModifiers[stat] ?? 0)
      + (mode === "planned" ? additions[stat] : state.rolls[stat]);
  }

  const skills = mergeSkills([
    race.skills,
    world.skills,
    specialty.skills,
    parseList($("#manual-skills").value)
  ]);
  const talentResult = mergeTalents([
    race.talents,
    world.talents,
    specialty.talents,
    parseList($("#manual-talents").value)
  ]);

  const wounds = race.woundBonus
    + world.woundBonus
    + specialty.woundBonus
    + (characteristicBonus(stats.СВ) + characteristicBonus(stats.ВН)) * 2;

  const startingXp = race.startingXp * race.xpMultiplier;
  const availableXp = startingXp + talentResult.bonusXp - specialty.xpCost;

  return {
    name: $("#character-name").value.trim() || "Безымянный персонаж",
    race,
    world,
    specialty,
    stats,
    skills,
    talents: talentResult.talents,
    bonusXp: talentResult.bonusXp,
    startingXp,
    availableXp,
    wounds
  };
}

function renderResult(character) {
  const statRows = DATA.stats.map(stat => `
    <tr><th>${stat}</th><td>${character.stats[stat]}</td><td>${characteristicBonus(character.stats[stat])}</td></tr>
  `).join("");

  const skillTags = [...character.skills.entries()]
    .map(([name, bonus]) => `<span class="tag">${name} ${bonus >= 0 ? "+" : ""}${bonus}</span>`)
    .join("") || `<span class="muted">Нет навыков</span>`;
  const talentTags = character.talents.map(name => `<span class="tag">${name}</span>`).join("") || `<span class="muted">Нет талантов</span>`;

  result.className = "character-card";
  result.innerHTML = `
    <div>
      <h3>${character.name}</h3>
      <p class="muted">${character.race.name} • ${character.world.name} • ${character.specialty.name}</p>
    </div>

    <div class="summary-grid">
      <div class="summary-item"><span class="summary-label">Раны</span><span class="summary-value">${character.wounds}</span></div>
      <div class="summary-item"><span class="summary-label">Доступно опыта</span><span class="summary-value">${formatNumber(character.availableXp)}</span></div>
      <div class="summary-item"><span class="summary-label">Стартовый опыт</span><span class="summary-value">${formatNumber(character.startingXp)}</span></div>
      <div class="summary-item"><span class="summary-label">Опыт за дубли талантов</span><span class="summary-value">+${character.bonusXp}</span></div>
    </div>

    <div>
      <h3>Характеристики</h3>
      <table class="result-table"><thead><tr><th>Хар.</th><th>Значение</th><th>Бонус</th></tr></thead><tbody>${statRows}</tbody></table>
    </div>

    <div><h3>Навыки</h3><div class="tags">${skillTags}</div></div>
    <div><h3>Таланты</h3><div class="tags">${talentTags}</div></div>
  `;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
}

function showError(message) {
  validationMessage.textContent = message;
  validationMessage.className = "message error";
}

function clearError() {
  validationMessage.textContent = "";
  validationMessage.className = "message hidden";
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const error = validateCharacter();
  if (error) {
    showError(error);
    return;
  }
  clearError();
  renderResult(buildCharacter());
});

$("#reset-button").addEventListener("click", () => {
  form.reset();
  state.rolls = Object.fromEntries(DATA.stats.map(stat => [stat, 0]));
  clearError();
  result.className = "empty-state";
  result.textContent = "Заполни данные и нажми «Рассчитать персонажа».";
  renderStats();
});

rollButton.addEventListener("click", rollStats);
[raceSelect, worldSelect, specialtySelect].forEach(select => select.addEventListener("change", renderStats));
modeSelect.addEventListener("change", () => {
  rollButton.disabled = modeSelect.value !== "random";
  renderStats();
});

fillSelect(raceSelect, DATA.races);
fillSelect(worldSelect, DATA.homeworlds);
fillSelect(specialtySelect, DATA.specialties);
rollButton.disabled = true;
renderStats();
