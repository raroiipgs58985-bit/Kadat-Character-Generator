const renderResultWithRaceAndFeatures = renderResult;

function renderHomeworldSection(world, selectedChoices = []) {
  if (!world || world.id === "none") return "";

  const modifiers = DATA.stats
    .filter(stat => world.statModifiers?.[stat])
    .map(stat => {
      const value = world.statModifiers[stat];
      return `<span class="tag">${escapeHtml(stat)} ${value > 0 ? "+" : ""}${value}</span>`;
    })
    .join("") || `<span class="muted">Нет модификаторов характеристик</span>`;

  const chosenSkills = selectedChoices
    .filter(choice => choice.type === "skill" && choice.value)
    .map(choice => choice.value);
  const chosenTalents = selectedChoices
    .filter(choice => choice.type === "talent" && choice.value)
    .map(choice => choice.value);

  const worldSkills = [...(world.skills ?? []), ...chosenSkills]
    .map(skill => `<span class="tag">${escapeHtml(skill)}</span>`)
    .join("") || `<span class="muted">Нет навыков</span>`;

  const worldTalents = [...(world.talents ?? []), ...chosenTalents]
    .map(talent => `<span class="tag">${escapeHtml(talent)}</span>`)
    .join("") || `<span class="muted">Нет талантов</span>`;

  const worldTraits = (world.traits ?? [])
    .map(trait => `<span class="tag">${escapeHtml(trait)}</span>`)
    .join("");

  const choiceTags = selectedChoices
    .filter(choice => choice.value)
    .map(choice => `<span class="tag"><strong>${escapeHtml(choice.label)}:</strong>&nbsp;${escapeHtml(choice.value)}</span>`)
    .join("");

  const worldRules = (world.specialRules ?? [])
    .map(rule => `
      <article class="rule-card">
        <h4>${escapeHtml(rule.name)}</h4>
        <p>${escapeHtml(rule.text)}</p>
      </article>
    `).join("");

  return `
    <div class="homeworld-section">
      <h3>Родной мир: ${escapeHtml(world.name)}</h3>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Модификатор ран</span>
          <span class="summary-value">${world.woundBonus > 0 ? "+" : ""}${world.woundBonus}</span>
        </div>
      </div>
      <div><h4>Модификаторы характеристик</h4><div class="tags">${modifiers}</div></div>
      ${choiceTags ? `<div><h4>Сделанные выборы</h4><div class="tags">${choiceTags}</div></div>` : ""}
      <div><h4>Навыки родного мира</h4><div class="tags">${worldSkills}</div></div>
      <div><h4>Таланты родного мира</h4><div class="tags">${worldTalents}</div></div>
      ${worldTraits ? `<div><h4>Особенности родного мира</h4><div class="tags">${worldTraits}</div></div>` : ""}
      ${worldRules ? `<div><h4>Правила родного мира</h4><div class="rule-list">${worldRules}</div></div>` : ""}
    </div>
  `;
}

renderResult = function (character) {
  renderResultWithRaceAndFeatures(character);

  const homeworldMarkup = renderHomeworldSection(character.world, character.worldChoices ?? []);
  if (!homeworldMarkup) return;

  const container = document.createElement("div");
  container.innerHTML = homeworldMarkup.trim();
  const section = container.firstElementChild;
  const equipmentSection = result.lastElementChild;
  result.insertBefore(section, equipmentSection);
};
