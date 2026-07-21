function filteredTalentCatalog() {
  const search = state.advancement.ui.talentSearch.trim().toLocaleLowerCase("ru-RU");
  const level = Number(state.advancement.ui.talentLevel || 0);
  const category = state.advancement.ui.talentCategory;

  return ADVANCEMENT.talents
    .filter(talent => !level || talent.level === level)
    .filter(talent => category === "Все" || talent.category === category)
    .filter(talent => {
      if (!search) return true;
      return [talent.name, talent.requirements, talent.description, talent.category]
        .some(value => String(value ?? "").toLocaleLowerCase("ru-RU").includes(search));
    })
    .sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

function renderTalentOption(talent) {
  const option = talent.option;
  if (!option) return "";
  const current = talentOptionValue(talent);

  if (option.type === "pool" && (option.options ?? []).length) {
    return `
      <label class="talent-option-field">
        Вариант таланта
        <select data-adv-talent-option="${talent.id}">
          <option value="">— Выберите вариант —</option>
          ${option.options.map(value => `<option value="${advEscape(value)}" ${value === current ? "selected" : ""}>${advEscape(value)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  if (option.type === "skill") {
    const skills = currentSkillProfiles().map(profile => profile.name);
    return `
      <label class="talent-option-field">
        Выберите навык
        <select data-adv-talent-option="${talent.id}">
          <option value="">— Выберите навык —</option>
          ${skills.map(value => `<option value="${advEscape(value)}" ${value === current ? "selected" : ""}>${advEscape(value)}</option>`).join("")}
        </select>
      </label>
    `;
  }

  if (option.type === "characteristic") {
    return `
      <label class="talent-option-field">
        Выберите характеристику
        <select data-adv-talent-option="${talent.id}">
          <option value="">— Выберите характеристику —</option>
          ${DATA.stats.map(value => `<option value="${value}" ${value === current ? "selected" : ""}>${value}</option>`).join("")}
        </select>
      </label>
    `;
  }

  return `
    <label class="talent-option-field">
      Уточнение
      <input data-adv-talent-option="${talent.id}" type="text" value="${advEscape(current)}" placeholder="${advEscape(option.placeholder ?? "Введите вариант")}">
    </label>
  `;
}

function renderTalentCatalog(ready) {
  const owned = currentTalentMap();
  const catalog = filteredTalentCatalog();

  return `
    <div class="talent-catalog">
      ${catalog.map(talent => {
        const optionValue = talentOptionValue(talent);
        const fullName = formatTalentName(talent, optionValue);
        const isOwned = fullName ? owned.has(advKey(fullName)) : false;
        const failures = simpleRequirementFailures(talent);
        const cost = talentCost(talent.level);
        const canBuy = ready && fullName && !isOwned && !failures.length && remainingXp() >= cost;

        return `
          <details class="talent-catalog-card">
            <summary>
              <span>
                <strong>${advEscape(talent.name)}</strong>
                <small>${advEscape(talent.category)} · ${talent.level} ур.</small>
              </span>
              <b>${cost} ОО</b>
            </summary>
            <div class="talent-catalog-body">
              <p><strong>Требования:</strong> ${advEscape(talent.requirements || "Нет")}</p>
              ${talent.description ? `<p>${advEscape(talent.description)}</p>` : ""}
              ${renderTalentOption(talent)}
              ${failures.length ? `<p class="requirement-warning">Не выполнено: ${failures.map(advEscape).join(", ")}</p>` : ""}
              <button type="button" data-adv-talent-buy="${talent.id}" ${canBuy ? "" : "disabled"}>
                ${isOwned ? "Уже получен" : `Купить за ${cost} ОО`}
              </button>
            </div>
          </details>
        `;
      }).join("") || `<p class="muted">По заданным фильтрам таланты не найдены.</p>`}
    </div>
  `;
}

function renderPurchasedTalents() {
  return `
    <div class="owned-advancement-list">
      ${state.advancement.talents.map(talent => `
        <article class="owned-advancement-card">
          <div>
            <strong>${advEscape(talent.name)}</strong>
            <span>${talent.level} ур.</span>
            <small>Стоимость: ${talentCost(talent.level)} ОО</small>
          </div>
          <button type="button" class="secondary compact" data-adv-talent-undo="${talent.id}">Отменить</button>
        </article>
      `).join("") || `<p class="muted">Таланты за опыт пока не приобретены.</p>`}
    </div>
  `;
}

function renderTalentAdvancement(ready) {
  return `
    <details class="advancement-group" open>
      <summary>Таланты</summary>
      <p class="muted">Стоимость таланта зависит от уровня: 250 ОО за 1-й, 500 ОО за 2-й и 750 ОО за 3-й уровень. Таланты с выбором оружия, ремесла, чувства или другой специализации используют соответствующий пул.</p>
      <div class="talent-filters">
        <label>
          Поиск
          <input id="adv-talent-search" type="search" value="${advEscape(state.advancement.ui.talentSearch)}" placeholder="Название, требование или описание">
        </label>
        <label>
          Уровень
          <select id="adv-talent-level">
            <option value="0" ${state.advancement.ui.talentLevel === "0" ? "selected" : ""}>Все</option>
            ${[1, 2, 3].map(level => `<option value="${level}" ${String(level) === state.advancement.ui.talentLevel ? "selected" : ""}>${level}</option>`).join("")}
          </select>
        </label>
        <label>
          Раздел
          <select id="adv-talent-category">
            <option value="Все">Все разделы</option>
            ${ADVANCEMENT.talentCategories.map(category => `<option value="${advEscape(category)}" ${category === state.advancement.ui.talentCategory ? "selected" : ""}>${advEscape(category)}</option>`).join("")}
          </select>
        </label>
      </div>
      <h4>Купленные таланты</h4>
      ${renderPurchasedTalents()}
      <h4>Каталог талантов</h4>
      ${renderTalentCatalog(ready)}
    </details>
  `;
}

function bindAdvancementControls() {
  advancementContainer.querySelectorAll("[data-adv-stat-buy]").forEach(button => {
    button.addEventListener("click", () => buyCharacteristic(button.dataset.advStatBuy));
  });
  advancementContainer.querySelectorAll("[data-adv-stat-undo]").forEach(button => {
    button.addEventListener("click", () => undoCharacteristic(button.dataset.advStatUndo));
  });
  advancementContainer.querySelectorAll("[data-adv-skill-buy]").forEach(button => {
    button.addEventListener("click", () => buySkill(button.dataset.advSkillBuy));
  });
  advancementContainer.querySelectorAll("[data-adv-skill-undo]").forEach(button => {
    button.addEventListener("click", () => undoSkill(button.dataset.advSkillUndo));
  });
  advancementContainer.querySelectorAll("[data-adv-talent-buy]").forEach(button => {
    button.addEventListener("click", () => buyTalent(button.dataset.advTalentBuy));
  });
  advancementContainer.querySelectorAll("[data-adv-talent-undo]").forEach(button => {
    button.addEventListener("click", () => undoTalent(button.dataset.advTalentUndo));
  });
  advancementContainer.querySelectorAll("[data-adv-talent-option]").forEach(control => {
    const update = () => {
      state.advancement.ui.talentOptions[control.dataset.advTalentOption] = control.value;
      renderAdvancement();
    };
    control.addEventListener("change", update);
    control.addEventListener("input", () => {
      state.advancement.ui.talentOptions[control.dataset.advTalentOption] = control.value;
    });
  });

  const skillName = advancementContainer.querySelector("#adv-skill-name");
  skillName?.addEventListener("change", () => {
    state.advancement.ui.skillName = skillName.value;
    state.advancement.ui.skillSpecialization = "";
    state.advancement.ui.skillCustomSpecialization = "";
    renderAdvancement();
  });
  const skillSpecialization = advancementContainer.querySelector("#adv-skill-specialization");
  skillSpecialization?.addEventListener("change", () => {
    state.advancement.ui.skillSpecialization = skillSpecialization.value;
    state.advancement.ui.skillCustomSpecialization = "";
    renderAdvancement();
  });
  const skillCustom = advancementContainer.querySelector("#adv-skill-custom");
  skillCustom?.addEventListener("input", () => {
    state.advancement.ui.skillCustomSpecialization = skillCustom.value;
  });

  const talentSearch = advancementContainer.querySelector("#adv-talent-search");
  talentSearch?.addEventListener("input", () => {
    state.advancement.ui.talentSearch = talentSearch.value;
  });
  talentSearch?.addEventListener("change", renderAdvancement);
  advancementContainer.querySelector("#adv-talent-level")?.addEventListener("change", event => {
    state.advancement.ui.talentLevel = event.target.value;
    renderAdvancement();
  });
  advancementContainer.querySelector("#adv-talent-category")?.addEventListener("change", event => {
    state.advancement.ui.talentCategory = event.target.value;
    renderAdvancement();
  });
  advancementContainer.querySelector("#adv-reset")?.addEventListener("click", advancementReset);
}

function renderAdvancement() {
  const baseError = validateCharacterBeforeAdvancement();
  const ready = !baseError;
  const baseCharacter = ready ? currentBaseCharacter() : null;

  advancementContainer.innerHTML = `
    ${renderXpHeader(baseError)}
    ${renderCharacteristicAdvancement(baseCharacter, ready)}
    ${renderSkillAdvancement(ready)}
    ${renderTalentAdvancement(ready)}
    <div class="advancement-footer">
      <button id="adv-reset" type="button" class="secondary">Сбросить все покупки</button>
    </div>
  `;
  bindAdvancementControls();
}
