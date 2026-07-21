function renderXpHeader(baseError) {
  const spent = advancementSpent();
  const available = baseAvailableXp();
  const left = available - spent;
  return `
    <div class="advancement-header">
      <div>
        <h3>Развитие персонажа</h3>
        <p class="muted">Покупка характеристик, навыков и талантов за очки опыта.</p>
      </div>
      <div class="advancement-xp ${left < 0 ? "negative" : ""}">
        <span>Опыт</span>
        <strong>${formatNumber(left)} / ${formatNumber(available)}</strong>
        <small>Потрачено: ${formatNumber(spent)}</small>
      </div>
    </div>
    ${baseError ? `<div class="message warning">Сначала завершите создание основы персонажа: ${advEscape(baseError)}</div>` : ""}
  `;
}

function renderCharacteristicAdvancement(baseCharacter, ready) {
  return `
    <details class="advancement-group" open>
      <summary>Характеристики</summary>
      <p class="muted">Каждая покупка повышает выбранную характеристику на +5. Стоимость: 250, 500, 750, затем по 1000 ОО.</p>
      <div class="advancement-stat-grid">
        ${DATA.stats.map(stat => {
          const count = state.advancement.characteristics[stat] ?? 0;
          const base = baseCharacter?.stats?.[stat] ?? 0;
          const current = base + count * 5;
          const cost = characteristicCostAt(count);
          const disabled = !ready || remainingXp() < cost;
          return `
            <article class="advancement-stat-card">
              <div><strong>${stat}</strong><span>${current}</span></div>
              <small>Куплено: ${count} × +5</small>
              <div class="advancement-buttons">
                <button type="button" class="secondary compact" data-adv-stat-undo="${stat}" ${count ? "" : "disabled"}>−5</button>
                <button type="button" class="compact" data-adv-stat-buy="${stat}" ${disabled ? "disabled" : ""}>+5 · ${cost}</button>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function renderSkillDraft(ready) {
  const skill = selectedSkillCatalogItem();
  if (!skill) return "";
  const specializations = skill.specializations ?? [];
  if (specializations.length && !state.advancement.ui.skillSpecialization) {
    state.advancement.ui.skillSpecialization = specializations[0];
  }

  const draftName = resolvedDraftSkillName();
  const profile = draftName ? getSkillPurchaseState(draftName) : null;
  const cost = profile?.nextCost;
  const canBuy = ready && draftName && cost !== null && remainingXp() >= cost;
  const selectedSpecialization = state.advancement.ui.skillSpecialization;
  const needsCustom = selectedSpecialization?.includes("#Имя");
  const craftInfo = skill.name === "Ремесло"
    ? (ADVANCEMENT.craftDescriptions ?? {})[selectedSpecialization] ?? ""
    : "";

  return `
    <div class="skill-purchase-box">
      <div class="choice-grid">
        <label class="choice-field">
          Навык
          <select id="adv-skill-name">
            ${ADVANCEMENT.skills.map(item => `<option value="${advEscape(item.name)}" ${item.name === skill.name ? "selected" : ""}>${advEscape(item.name)} (${advEscape(item.characteristic)})</option>`).join("")}
          </select>
        </label>
        ${specializations.length ? `
          <label class="choice-field">
            Специализация
            <select id="adv-skill-specialization">
              ${specializations.map(option => `<option value="${advEscape(option)}" ${option === selectedSpecialization ? "selected" : ""}>${advEscape(option)}</option>`).join("")}
            </select>
          </label>
        ` : ""}
        ${needsCustom ? `
          <label class="choice-field">
            Уточнение названия
            <input id="adv-skill-custom" type="text" value="${advEscape(state.advancement.ui.skillCustomSpecialization)}" placeholder="Введите название">
          </label>
        ` : ""}
      </div>
      <div class="catalog-description">
        <strong>${advEscape(draftName || skill.name)}</strong>
        <span>Связанная характеристика: ${advEscape(skill.characteristic)}</span>
        ${craftInfo || skill.description ? `<p>${advEscape(craftInfo || skill.description)}</p>` : ""}
        ${skill.specialUse ? `<p><strong>Особое применение:</strong> ${advEscape(skill.specialUse)}</p>` : ""}
      </div>
      <button type="button" data-adv-skill-buy="${advEscape(draftName)}" ${canBuy ? "" : "disabled"}>
        ${profile?.stage ? `Улучшить навык · ${cost ?? "макс."}` : `Купить навык +0 · ${cost ?? 200}`}
      </button>
    </div>
  `;
}

function renderCurrentSkills(ready) {
  const profiles = currentSkillProfiles();
  return `
    <div class="owned-advancement-list">
      ${profiles.map(profile => {
        const purchased = state.advancement.skills[profile.name]?.count ?? 0;
        const canBuy = ready && profile.nextCost !== null && remainingXp() >= profile.nextCost;
        return `
          <article class="owned-advancement-card">
            <div>
              <strong>${advEscape(profile.name)}</strong>
              <span>${profile.bonus === 0 ? "+0" : `+${profile.bonus}`}</span>
              <small>Ступень обучения: ${profile.stage}/4${purchased ? ` · куплено: ${purchased}` : ""}</small>
            </div>
            <div class="advancement-buttons">
              <button type="button" class="secondary compact" data-adv-skill-undo="${advEscape(profile.name)}" ${purchased ? "" : "disabled"}>Отменить</button>
              <button type="button" class="compact" data-adv-skill-buy="${advEscape(profile.name)}" ${canBuy ? "" : "disabled"}>${profile.nextCost === null ? "Максимум" : `+10 · ${profile.nextCost}`}</button>
            </div>
          </article>
        `;
      }).join("") || `<p class="muted">Навыков пока нет.</p>`}
    </div>
  `;
}

function renderSkillAdvancement(ready) {
  return `
    <details class="advancement-group" open>
      <summary>Навыки</summary>
      <p class="muted">Покупка: +0 за 200 ОО. Улучшения: +10 за 350, 500 и 750 ОО. Дубли от происхождения дают +5 и не меняют стоимость следующей ступени. Максимум +30.</p>
      ${renderSkillDraft(ready)}
      <h4>Текущие навыки</h4>
      ${renderCurrentSkills(ready)}
    </details>
  `;
}

