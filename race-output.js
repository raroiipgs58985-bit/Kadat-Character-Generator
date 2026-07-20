function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderUniqueFeatures(features) {
  return (features ?? []).map(feature => {
    const spendingItems = (feature.spending ?? []).map(option => `
      <li>
        <strong>${escapeHtml(option.name)}</strong>
        <span>${escapeHtml(option.text)}</span>
      </li>
    `).join("");

    return `
      <article class="unique-feature-card">
        <div class="unique-feature-heading">
          <h4>${escapeHtml(feature.name)}</h4>
          ${feature.rating !== undefined ? `<span class="feature-rating">Рейтинг ${feature.rating}</span>` : ""}
        </div>
        <p class="feature-resource"><strong>Ресурс:</strong> ${escapeHtml(feature.resourceName)}</p>
        <p><strong>Накопление:</strong> ${escapeHtml(feature.accumulation)}</p>
        ${spendingItems ? `
          <div class="feature-spending">
            <strong>Расход ресурса:</strong>
            <ul>${spendingItems}</ul>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

renderResult = function (character) {
  const statRows = DATA.stats.map(stat => `
    <tr><th>${stat}</th><td>${character.stats[stat]}</td><td>${characteristicBonus(character.stats[stat])}</td></tr>
  `).join("");

  const skillTags = [...character.skills.entries()]
    .map(([name, bonus]) => `<span class="tag">${escapeHtml(name)} ${bonus >= 0 ? "+" : ""}${bonus}</span>`)
    .join("") || `<span class="muted">Нет навыков</span>`;

  const talentTags = character.talents
    .map(name => `<span class="tag">${escapeHtml(name)}</span>`)
    .join("") || `<span class="muted">Нет талантов</span>`;

  const traitTags = (character.race.traits ?? [])
    .map(name => `<span class="tag">${escapeHtml(name)}</span>`)
    .join("") || `<span class="muted">Нет особенностей</span>`;

  const equipmentItems = (character.race.equipment ?? [])
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("") || `<li class="muted">Стартовое снаряжение не указано</li>`;

  const specialRules = (character.race.specialRules ?? [])
    .map(rule => `
      <article class="rule-card">
        <h4>${escapeHtml(rule.name)}</h4>
        <p>${escapeHtml(rule.text)}</p>
      </article>
    `).join("");

  const uniqueFeatures = renderUniqueFeatures(character.race.uniqueFeatures);

  const transferValue = character.race.redistributionValue ?? 5;
  const transferTags = character.transfers.length
    ? character.transfers.map(transfer => `<span class="tag">${transfer.from} −${transferValue} → ${transfer.to} +${transferValue}</span>`).join("")
    : `<span class="muted">Переносы не использованы</span>`;

  result.className = "character-card";
  result.innerHTML = `
    <div>
      <h3>${escapeHtml(character.name)}</h3>
      <p class="muted">${escapeHtml(character.race.name)} • ${escapeHtml(character.world.name)} • ${escapeHtml(character.specialty.name)}</p>
      <p class="race-description">${escapeHtml(character.race.description ?? "")}</p>
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
    <div><h3>Особенности</h3><div class="tags">${traitTags}</div></div>
    ${uniqueFeatures ? `<div><h3>Уникальные особенности</h3><div class="unique-feature-list">${uniqueFeatures}</div></div>` : ""}
    ${character.race.specialtyAccess ? `<div class="notice">${escapeHtml(character.race.specialtyAccess)}</div>` : ""}
    ${specialRules ? `<div><h3>Прочие особые правила</h3><div class="rule-list">${specialRules}</div></div>` : ""}
    <div><h3>Стартовое снаряжение</h3><ul class="equipment-list">${equipmentItems}</ul></div>
  `;
};
