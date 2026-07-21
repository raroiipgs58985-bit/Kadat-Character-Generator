// v0.9.1: обязательные выборы специальностей используют общие пулы,
// а не свободный ввод там, где перечень уже известен системе.
(function () {
  const config = window.KADAT_ADVANCEMENT;
  if (!config || typeof renderSpecialtyChoices !== "function") return;

  function choiceText(choice) {
    return `${choice.label ?? ""} ${choice.template ?? ""}`.toLocaleLowerCase("ru-RU");
  }

  function getSpecialtyChoicePool(choice) {
    const text = choiceText(choice);
    const pools = config.pools ?? {};

    if (/владение\s+оружием/.test(text) && !/экзотическ/.test(text)) return pools.weapon ?? [];
    if (/уч[её]н(?:ое|ые)\s+знани/.test(text)) return pools.scholasticKnowledge ?? [];
    if (/общ(?:ее|ие)\s+знани/.test(text)) return pools.commonKnowledge ?? [];
    if (/запретн(?:ое|ые)\s+знани/.test(text)) return pools.forbiddenKnowledge ?? [];
    if (/ремесл/.test(text)) return pools.craft ?? [];
    if (/язык/.test(text)) return pools.language ?? [];
    if (/управлен/.test(text)) return pools.management ?? [];
    if (/выживан/.test(text)) return pools.survival ?? [];
    if (/навигац/.test(text)) return pools.navigation ?? [];
    if (/сопротивляемост/.test(text)) return pools.resistance ?? [];
    if (/обостр[её]нн(?:ые|ое)\s+чувств/.test(text)) return pools.senses ?? [];

    return [];
  }

  function rawChoiceValues(choice) {
    const raw = state.specialtyChoices[choice.id];
    if (Array.isArray(raw)) return raw.map(value => String(value).trim()).filter(Boolean);
    return String(raw ?? "")
      .split(/[;\n]/)
      .map(value => value.trim())
      .filter(Boolean);
  }

  function formatChoiceValue(choice, value) {
    if (!choice.template) return value;
    if (value.includes("(") && value.includes(")")) return value;
    return choice.template.replace("{value}", value);
  }

  getResolvedSpecialtySelections = function (specialty = getCurrentSpecialty()) {
    return (specialty.choices ?? []).map(choice => {
      const pool = getSpecialtyChoicePool(choice);
      const values = rawChoiceValues(choice).map(value => formatChoiceValue(choice, value));
      return {
        id: choice.id,
        label: choice.label,
        type: choice.type,
        count: choice.count ?? 1,
        values,
        usesPool: pool.length > 0
      };
    });
  };

  function renderPoolChoice(choice, pool) {
    const count = choice.count ?? 1;
    const selected = rawChoiceValues(choice);
    const selects = Array.from({ length: count }, (_, index) => {
      const current = selected[index] ?? "";
      return `
        <label class="specialty-pool-slot">
          ${count > 1 ? `Вариант ${index + 1}` : "Выбор"}
          <select data-specialty-pool-choice="${choice.id}" data-specialty-pool-index="${index}">
            <option value="">— Выберите вариант —</option>
            ${pool.map(option => {
              const usedElsewhere = selected.some((value, selectedIndex) => selectedIndex !== index && value === option);
              return `<option value="${escapeSpecialtyHtml(option)}" ${current === option ? "selected" : ""} ${usedElsewhere ? "disabled" : ""}>${escapeSpecialtyHtml(option)}</option>`;
            }).join("")}
          </select>
        </label>
      `;
    }).join("");

    return `
      <fieldset class="choice-field specialty-pool-field">
        <legend>${escapeSpecialtyHtml(choice.label)}</legend>
        <div class="specialty-pool-slots">${selects}</div>
        <span class="choice-hint">Нужно выбрать: ${count}. Один вариант нельзя выбрать дважды.</span>
      </fieldset>
    `;
  }

  renderSpecialtyChoices = function () {
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
      const pool = getSpecialtyChoicePool(choice);
      if (pool.length) return renderPoolChoice(choice, pool);

      if (choice.type.endsWith("Text")) {
        const raw = Array.isArray(state.specialtyChoices[choice.id])
          ? state.specialtyChoices[choice.id].join("; ")
          : state.specialtyChoices[choice.id] ?? "";
        return `
          <label class="choice-field">
            ${escapeSpecialtyHtml(choice.label)}
            <textarea rows="2" data-specialty-free-choice="${choice.id}" placeholder="${escapeSpecialtyHtml(choice.placeholder ?? "Введите варианты через ;")}">${escapeSpecialtyHtml(raw)}</textarea>
            <span class="choice-hint">Свободный ввод используется только потому, что для этого выбора нет закрытого пула. Нужно указать: ${choice.count ?? 1}</span>
          </label>
        `;
      }

      const current = Array.isArray(state.specialtyChoices[choice.id])
        ? state.specialtyChoices[choice.id][0] ?? ""
        : state.specialtyChoices[choice.id] ?? "";
      return `
        <label class="choice-field">
          ${escapeSpecialtyHtml(choice.label)}
          <select data-specialty-single-choice="${choice.id}">
            <option value="">— Выберите один вариант —</option>
            ${(choice.options ?? []).map(option => `<option value="${escapeSpecialtyHtml(option)}" ${current === option ? "selected" : ""}>${escapeSpecialtyHtml(option)}</option>`).join("")}
          </select>
        </label>
      `;
    }).join("");

    specialtyChoicesContainer.className = "specialty-choices";
    specialtyChoicesContainer.innerHTML = `
      <div class="choice-heading">
        <div><h3>${escapeSpecialtyHtml(specialty.name)}</h3>${description}</div>
        ${cost}
      </div>
      ${choices.length
        ? `<p class="muted">Выборы оружия, ремёсел, знаний и других специализаций берутся из общих пулов системы.</p><div class="choice-grid">${fields}</div>`
        : `<p class="muted">У этой специальности нет обязательных вариантов выбора.</p>`}
    `;

    specialtyChoicesContainer.querySelectorAll("[data-specialty-pool-choice]").forEach(control => {
      control.addEventListener("change", () => {
        const id = control.dataset.specialtyPoolChoice;
        const index = Number(control.dataset.specialtyPoolIndex);
        const values = rawChoiceValues({ id });
        values[index] = control.value;
        state.specialtyChoices[id] = values;
        clearError();
        renderSpecialtyChoices();
        if (typeof renderAdvancement === "function") renderAdvancement();
      });
    });

    specialtyChoicesContainer.querySelectorAll("[data-specialty-single-choice]").forEach(control => {
      control.addEventListener("change", () => {
        state.specialtyChoices[control.dataset.specialtySingleChoice] = control.value;
        clearError();
        if (typeof renderAdvancement === "function") renderAdvancement();
      });
    });

    specialtyChoicesContainer.querySelectorAll("[data-specialty-free-choice]").forEach(control => {
      control.addEventListener("input", () => {
        state.specialtyChoices[control.dataset.specialtyFreeChoice] = control.value;
        clearError();
      });
      control.addEventListener("change", () => {
        if (typeof renderAdvancement === "function") renderAdvancement();
      });
    });
  };

  renderSpecialtyChoices();
})();
