const DATA = window.KADAT_DATA;
const state = {
  rolls: Object.fromEntries(DATA.stats.map(stat => [stat, 0])),
  plannedAdditions: Object.fromEntries(DATA.stats.map(stat => [stat, 0])),
  transfers: [],
  pendingTransferFrom: null
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
const redistributionPanel = $("#redistribution-panel");
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
  return { ...state.plannedAdditions };
}

function resetPlannedAdditions() {
  state.plannedAdditions = Object.fromEntries(DATA.stats.map(stat => [stat, 0]));
}

function getTransferDelta(stat) {
  const race = getSelected(DATA.races, raceSelect.value);
  const value = race.redistributionValue ?? 5;
  return state.transfers.reduce((delta, transfer) => {
    if (transfer.from === stat) delta -= value;
    if (transfer.to === stat) delta += value;
    return delta;
  }, 0);
}

function getBaseGenerationValue(stat) {
  return modeSelect.value === "planned"
    ? state.plannedAdditions[stat]
    : state.rolls[stat];
}

function getGenerationValue(stat) {
  return getBaseGenerationValue(stat) + getTransferDelta(stat);
}

function resetTransfers() {
  state.transfers = [];
  state.pendingTransferFrom = null;
}

function allStatsRolled() {
  return Object.values(state.rolls).every(value => value > 0);
}

function plannedDistributionReady() {
  const race = getSelected(DATA.races, raceSelect.value);
  const values = Object.values(state.plannedAdditions);
  return values.every(value => value >= 0 && value <= race.maxPerStat)
    && values.reduce((sum, value) => sum + value, 0) === race.plannedPoints;
}

function generationReady() {
  return modeSelect.value === "planned" ? plannedDistributionReady() : allStatsRolled();
}

function transfersAreValid() {
  const race = getSelected(DATA.races, raceSelect.value);
  const value = race.redistributionValue ?? 5;
  const current = Object.fromEntries(DATA.stats.map(stat => [stat, getBaseGenerationValue(stat)]));

  for (const transfer of state.transfers) {
    if ((current[transfer.from] ?? 0) < value) return false;
    current[transfer.from] -= value;
    current[transfer.to] += value;
  }
  return true;
}

function sanitizeTransfers() {
  if (!transfersAreValid()) resetTransfers();
  const race = getSelected(DATA.races, raceSelect.value);
  const value = race.redistributionValue ?? 5;
  if (state.pendingTransferFrom && getGenerationValue(state.pendingTransferFrom) < value) {
    state.pendingTransferFrom = null;
  }
}

function generationDetails(stat) {
  const delta = getTransferDelta(stat);
  if (modeSelect.value === "random") {
    return `Бросок: ${state.rolls[stat] || "—"}${delta ? `, перенос ${signed(delta)}` : ""}`;
  }
  return `Распределено: ${state.plannedAdditions[stat]}${delta ? `, перенос ${signed(delta)}` : ""}`;
}

function renderStats() {
  const race = getSelected(DATA.races, raceSelect.value);
  const world = getSelected(DATA.homeworlds, worldSelect.value);
  const specialty = getSelected(DATA.specialties, specialtySelect.value);
  const transferValue = race.redistributionValue ?? 5;

  statsGrid.innerHTML = DATA.stats.map(stat => {
    const base = race.baseStats[stat] ?? 0;
    const worldMod = world.statModifiers[stat] ?? 0;
    const specialtyMod = specialty.statModifiers[stat] ?? 0;
    const total = base + worldMod + specialtyMod + getGenerationValue(stat);
    const generationControl = modeSelect.value === "planned"
      ? `<input type="number" min="0" max="${race.maxPerStat}" value="${state.plannedAdditions[stat]}" data-stat-input="${stat}" aria-label="Очки в ${stat}">`
      : "";

    return `
      <article class="stat-card ${state.pendingTransferFrom === stat ? "transfer-source" : ""}" data-stat-card="${stat}">
        <div class="stat-name">${stat}</div>
        <div class="stat-total" data-stat-total="${stat}">${total}</div>
        <div class="stat-details">База ${base}, мир ${signed(worldMod)}, спец. ${signed(specialtyMod)}</div>
        ${generationControl}
        <div class="stat-details" data-generation-details="${stat}">${generationDetails(stat)}</div>
        <div class="transfer-buttons">
          <button type="button" class="transfer-button minus ${state.pendingTransferFrom === stat ? "selected" : ""}" data-transfer-from="${stat}">−${transferValue}</button>
          <button type="button" class="transfer-button plus" data-transfer-to="${stat}">+${transferValue}</button>
        </div>
      </article>`;
  }).join("");

  statsGrid.querySelectorAll("[data-stat-input]").forEach(input => {
    input.addEventListener("input", () => {
      state.plannedAdditions[input.dataset.statInput] = Number(input.value || 0);
      sanitizeTransfers();
      updatePreview();
      refreshTransferControls();
    });
  });
  statsGrid.querySelectorAll("[data-transfer-from]").forEach(button => {
    button.addEventListener("click", () => chooseTransferSource(button.dataset.transferFrom));
  });
  statsGrid.querySelectorAll("[data-transfer-to]").forEach(button => {
    button.addEventListener("click", () => completeTransfer(button.dataset.transferTo));
  });

  updatePreview();
  refreshTransferControls();
}

function refreshTransferControls() {
  const race = getSelected(DATA.races, raceSelect.value);
  const limit = race.redistributionCount ?? 2;
  const value = race.redistributionValue ?? 5;
  const ready = generationReady();

  DATA.stats.forEach(stat => {
    const sourceButton = document.querySelector(`[data-transfer-from="${stat}"]`);
    const targetButton = document.querySelector(`[data-transfer-to="${stat}"]`);
    const card = document.querySelector(`[data-stat-card="${stat}"]`);
    const sourceAvailable = ready
      && state.transfers.length < limit
      && getGenerationValue(stat) >= value;
    const targetAvailable = ready
      && state.pendingTransferFrom !== null
      && state.pendingTransferFrom !== stat
      && state.transfers.length < limit;

    if (sourceButton) {
      sourceButton.disabled = !sourceAvailable;
      sourceButton.classList.toggle("selected", state.pendingTransferFrom === stat);
    }
    if (targetButton) targetButton.disabled = !targetAvailable;
    if (card) card.classList.toggle("transfer-source", state.pendingTransferFrom === stat);
  });

  renderRedistributionPanel();
}

function renderRedistributionPanel() {
  const race = getSelected(DATA.races, raceSelect.value);
  const limit = race.redistributionCount ?? 2;
  const value = race.redistributionValue ?? 5;
  const ready = generationReady();
  const history = state.transfers.length
    ? state.transfers.map(transfer => `<span class="transfer-chip">${transfer.from} −${value} → ${transfer.to} +${value}</span>`).join("")
    : `<span class="muted">Переносов пока нет.</span>`;

  let instruction;
  if (!ready && modeSelect.value === "planned") {
    instruction = `Сначала распредели ровно ${race.plannedPoints} очков. После этого станут доступны переносы.`;
  } else if (!ready) {
    instruction = "Сначала выполни броски 2к10.";
  } else if (state.pendingTransferFrom) {
    instruction = `Выбрано: ${state.pendingTransferFrom} −${value}. Теперь нажми +${value} у другой характеристики.`;
  } else if (state.transfers.length >= limit) {
    instruction = "Все доступные переносы использованы.";
  } else {
    instruction = `Нажми −${value} у характеристики-источника, затем +${value} у характеристики-получателя.`;
  }

  redistributionPanel.className = "redistribution-panel";
  redistributionPanel.innerHTML = `
    <div class="redistribution-heading">
      <div>
        <h3>Переносы характеристик</h3>
        <p class="muted">Использовано: ${state.transfers.length} / ${limit}</p>
      </div>
      <div class="redistribution-actions">
        <button id="cancel-transfer" type="button" class="secondary compact" ${state.pendingTransferFrom ? "" : "disabled"}>Отменить выбор</button>
        <button id="undo-transfer" type="button" class="secondary compact" ${state.transfers.length ? "" : "disabled"}>Отменить перенос</button>
      </div>
    </div>
    <p class="transfer-instruction">${instruction}</p>
    <div class="transfer-history">${history}</div>`;

  $("#cancel-transfer")?.addEventListener("click", () => {
    state.pendingTransferFrom = null;
    refreshTransferControls();
  });
  $("#undo-transfer")?.addEventListener("click", () => {
    state.transfers.pop();
    state.pendingTransferFrom = null;
    renderStats();
  });
}

function chooseTransferSource(stat) {
  const race = getSelected(DATA.races, raceSelect.value);
  const value = race.redistributionValue ?? 5;
  const limit = race.redistributionCount ?? 2;
  if (!generationReady() || state.transfers.length >= limit || getGenerationValue(stat) < value) return;
  state.pendingTransferFrom = state.pendingTransferFrom === stat ? null : stat;
  refreshTransferControls();
}

function completeTransfer(stat) {
  const race = getSelected(DATA.races, raceSelect.value);
  const value = race.redistributionValue ?? 5;
  const limit = race.redistributionCount ?? 2;
  const from = state.pendingTransferFrom;
  if (!generationReady() || !from || from === stat || state.transfers.length >= limit) return;
  if (getGenerationValue(from) < value) {
    state.pendingTransferFrom = null;
    refreshTransferControls();
    return;
  }
  state.transfers.push({ from, to: stat });
  state.pendingTransferFrom = null;
  renderStats();
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

function updatePreview() {
  const race = getSelected(DATA.races, raceSelect.value);
  const world = getSelected(DATA.homeworlds, worldSelect.value);
  const specialty = getSelected(DATA.specialties, specialtySelect.value);

  for (const stat of DATA.stats) {
    const total = (race.baseStats[stat] ?? 0)
      + (world.statModifiers[stat] ?? 0)
      + (specialty.statModifiers[stat] ?? 0)
      + getGenerationValue(stat);
    const totalNode = document.querySelector(`[data-stat-total="${stat}"]`);
    const detailsNode = document.querySelector(`[data-generation-details="${stat}"]`);
    if (totalNode) totalNode.textContent = total;
    if (detailsNode) detailsNode.textContent = generationDetails(stat);
  }

  if (modeSelect.value === "planned") {
    const used = Object.values(state.plannedAdditions).reduce((sum, value) => sum + value, 0);
    const remaining = race.plannedPoints - used;
    pointsStatus.textContent = `Потрачено: ${used} / ${race.plannedPoints}. Осталось: ${remaining}. Максимум ${race.maxPerStat} до переносов.`;
    pointsStatus.style.color = remaining < 0 ? "#ff8585" : "";
  } else {
    pointsStatus.textContent = allStatsRolled() ? "Броски выполнены." : "Нажми «Бросить 2к10».";
    pointsStatus.style.color = "";
  }
}

function rollStats() {
  for (const stat of DATA.stats) {
    state.rolls[stat] = randomD10() + randomD10();
  }
  resetTransfers();
  renderStats();
}

function randomD10() {
  return Math.floor(Math.random() * 10) + 1;
}

function validateCharacter() {
  const race = getSelected(DATA.races, raceSelect.value);
  if (modeSelect.value === "planned") {
    const values = Object.values(state.plannedAdditions);
    if (values.some(value => value < 0 || value > race.maxPerStat)) {
      return `В одну характеристику можно вложить от 0 до ${race.maxPerStat} очков до переносов.`;
    }
    const used = values.reduce((sum, value) => sum + value, 0);
    if (used !== race.plannedPoints) {
      return `Нужно распределить ровно ${race.plannedPoints} очков. Сейчас распределено ${used}.`;
    }
  } else if (!allStatsRolled()) {
    return "Сначала выполни броски 2к10.";
  }

  if (!transfersAreValid()) {
    return "Один из переносов больше нельзя выполнить с текущими значениями характеристик.";
  }
  if (state.pendingTransferFrom) {
    return `Перенос из ${state.pendingTransferFrom} не завершён. Выбери характеристику для +${race.redistributionValue ?? 5} или отмени выбор.`;
  }
  return "";
}

function buildCharacter() {
  const race = getSelected(DATA.races, raceSelect.value);
  const world = getSelected(DATA.homeworlds, worldSelect.value);
  const specialty = getSelected(DATA.specialties, specialtySelect.value);
  const stats = {};

  for (const stat of DATA.stats) {
    stats[stat] = (race.baseStats[stat] ?? 0)
      + (world.statModifiers[stat] ?? 0)
      + (specialty.statModifiers[stat] ?? 0)
      + getGenerationValue(stat);
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
    wounds,
    transfers: [...state.transfers]
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
  const transferValue = character.race.redistributionValue ?? 5;
  const transferTags = character.transfers.length
    ? character.transfers.map(transfer => `<span class="tag">${transfer.from} −${transferValue} → ${transfer.to} +${transferValue}</span>`).join("")
    : `<span class="muted">Переносы не использованы</span>`;

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

    <div><h3>Переносы</h3><div class="tags">${transferTags}</div></div>
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
  resetPlannedAdditions();
  resetTransfers();
  clearError();
  result.className = "empty-state";
  result.textContent = "Заполни данные и нажми «Рассчитать персонажа».";
  rollButton.disabled = true;
  renderStats();
});

rollButton.addEventListener("click", rollStats);
raceSelect.addEventListener("change", () => {
  resetPlannedAdditions();
  resetTransfers();
  renderStats();
});
[worldSelect, specialtySelect].forEach(select => select.addEventListener("change", renderStats));
modeSelect.addEventListener("change", () => {
  resetTransfers();
  rollButton.disabled = modeSelect.value !== "random";
  renderStats();
});

fillSelect(raceSelect, DATA.races);
fillSelect(worldSelect, DATA.homeworlds);
fillSelect(specialtySelect, DATA.specialties);
rollButton.disabled = true;
renderStats();
