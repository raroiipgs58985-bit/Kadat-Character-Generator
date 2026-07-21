const validateCharacterBeforeAdvancement = validateCharacter;
const buildCharacterBeforeAdvancement = buildCharacter;
const renderResultBeforeAdvancement = renderResult;

validateCharacter = function () {
  const baseError = validateCharacterBeforeAdvancement();
  if (baseError) return baseError;
  if (remainingXp() < 0) return `На развитие потрачено больше опыта, чем доступно: перерасход ${Math.abs(remainingXp())} ОО.`;
  return "";
};

function applyAdvancementToCharacter(character) {
  DATA.stats.forEach(stat => {
    character.stats[stat] += (state.advancement.characteristics[stat] ?? 0) * 5;
  });

  character.skills = new Map(
    currentSkillProfiles().map(profile => [profile.name, profile.bonus ?? 0])
  );
  character.talents = [
    ...buildBaseTalentMap().values(),
    ...state.advancement.talents.map(item => item.name)
  ];
  character.advancement = {
    characteristics: { ...state.advancement.characteristics },
    skills: Object.values(state.advancement.skills).map(item => ({ ...item })),
    talents: state.advancement.talents.map(item => ({ ...item })),
    spent: advancementSpent()
  };

  character.wounds = (character.race.woundBonus ?? 0)
    + (character.world.woundBonus ?? 0)
    + (character.specialty.woundBonus ?? 0)
    + (characteristicBonus(character.stats.СВ) + characteristicBonus(character.stats.ВН)) * 2;
  character.availableXp -= character.advancement.spent;
  return character;
}

buildCharacter = function () {
  return applyAdvancementToCharacter(buildCharacterBeforeAdvancement());
};

function renderAdvancementResult(character) {
  const advancement = character.advancement;
  if (!advancement) return "";

  const statItems = DATA.stats
    .filter(stat => advancement.characteristics[stat])
    .map(stat => `<span class="tag">${stat} +${advancement.characteristics[stat] * 5}</span>`)
    .join("") || `<span class="muted">Характеристики не покупались</span>`;
  const skillItems = advancement.skills
    .map(item => `<span class="tag">${escapeHtml(item.name)}: ${item.count} покупок</span>`)
    .join("") || `<span class="muted">Навыки не покупались</span>`;
  const talentItems = advancement.talents
    .map(item => `<span class="tag">${escapeHtml(item.name)} (${item.level} ур.)</span>`)
    .join("") || `<span class="muted">Таланты не покупались</span>`;

  return `
    <section class="advancement-result-section">
      <div class="specialty-title-row">
        <div>
          <h3>Развитие за опыт</h3>
          <p class="muted">Покупки после выбора расы, родного мира и специальности.</p>
        </div>
        <span class="specialty-output-cost">${formatNumber(advancement.spent)} ОО</span>
      </div>
      <div><h4>Характеристики</h4><div class="tags">${statItems}</div></div>
      <div><h4>Навыки</h4><div class="tags">${skillItems}</div></div>
      <div><h4>Таланты</h4><div class="tags">${talentItems}</div></div>
    </section>
  `;
}

renderResult = function (character) {
  renderResultBeforeAdvancement(character);
  const markup = renderAdvancementResult(character);
  if (!markup) return;
  const holder = document.createElement("div");
  holder.innerHTML = markup.trim();
  result.appendChild(holder.firstElementChild);
};

function applyAdvancementPreview() {
  if (!result.classList.contains("character-card")) return;
  const error = validateCharacter();
  if (!error) renderResult(buildCharacter());
}

const advancementDependencies = [
  raceSelect,
  worldSelect,
  specialtySelect,
  modeSelect,
  document.querySelector("#gender"),
  document.querySelector("#manual-skills"),
  document.querySelector("#manual-talents")
].filter(Boolean);

advancementDependencies.forEach(control => {
  control.addEventListener("change", () => setTimeout(renderAdvancement, 0));
  if (control.matches("textarea,input")) control.addEventListener("input", () => setTimeout(renderAdvancement, 0));
});

document.querySelector("#stats-grid")?.addEventListener("input", () => setTimeout(renderAdvancement, 0));
document.querySelector("#roll-button")?.addEventListener("click", () => setTimeout(renderAdvancement, 0));
document.querySelector("#reset-button")?.addEventListener("click", () => {
  advancementReset();
  setTimeout(renderAdvancement, 0);
});

renderAdvancement();
