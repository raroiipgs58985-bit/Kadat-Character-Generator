(() => {
  const pools = window.KADAT_ADVANCEMENT?.pools;
  if (!pools) return;

  const rules = [
    { pattern: /владение\s+оружием/i, options: pools.weapon, template: "Владение оружием ({value})" },
    { pattern: /уч[её]н(?:ое|ые)\s+знани/i, options: pools.scholasticKnowledge, template: "Учёное знание ({value})" },
    { pattern: /общ(?:ее|ие)\s+знани/i, options: pools.commonKnowledge, template: "Общее знание ({value})" },
    { pattern: /запретн(?:ое|ые)\s+знани/i, options: pools.forbiddenKnowledge, template: "Запретное знание ({value})" },
    { pattern: /ремесл/i, options: pools.craft, template: "Ремесло ({value})" },
    { pattern: /язык/i, options: pools.language, template: "Язык ({value})" },
    { pattern: /управлен/i, options: pools.management, template: "Управление ({value})" },
    { pattern: /выживан/i, options: pools.survival, template: "Выживание ({value})" },
    { pattern: /навигац/i, options: pools.navigation, template: "Навигация ({value})" },
    { pattern: /сопротивляемост/i, options: pools.resistance, template: "Сопротивляемость ({value})" },
    { pattern: /обостр[её]нн(?:ое|ые)\s+чувств/i, options: pools.senses, template: "Обострённые чувства ({value})" }
  ];

  function splitChoiceValues(rawValue) {
    return String(rawValue ?? "")
      .split(/[;\n]/)
      .map(value => value.trim())
      .filter(Boolean);
  }

  function detectPool(choice) {
    if (!String(choice.type ?? "").endsWith("Text")) return null;
    const searchable = `${choice.label ?? ""} ${choice.template ?? ""}`;
    if (/экзотическ/i.test(searchable) && !/кроме\s+экзотическ/i.test(searchable)) return null;
    return rules.find(rule => rule.pattern.test(searchable)) ?? null;
  }

  for (const specialty of DATA.specialties ?? []) {
    for (const choice of specialty.choices ?? []) {
      const rule = detectPool(choice);
      if (!rule) continue;
      choice.poolOptions = [...new Set(rule.options ?? [])];
      choice.template = choice.template || rule.template;
    }
  }

  parseSpecialtyTextChoice = function (choice, rawValue) {
    const values = splitChoiceValues(rawValue);
    if (!choice.template) return values;

    const prefix = choice.template.split("{value}")[0].trim().toLocaleLowerCase("ru-RU");
    return values.map(value => {
      const normalized = value.toLocaleLowerCase("ru-RU");
      if (prefix && normalized.startsWith(prefix)) return value;
      return choice.template.replace("{value}", value);
    });
  };

  function renderPoolChoice(choice) {
    const count = Math.max(1, Number(choice.count ?? 1));
    const values = splitChoiceValues(state.specialtyChoices[choice.id]);

    return `
      <fieldset class="choice-field specialty-pool-field">
        <legend>${escapeSpecialtyHtml(choice.label)}</legend>
        <div class="specialty-pool-grid">
          ${Array.from({ length: count }, (_, index) => {
            const current = values[index] ?? "";
            const selectedElsewhere = new Set(values.filter((value, valueIndex) => value && valueIndex !== index));
            return `
              <label>
                ${count > 1 ? `Вариант ${index + 1}` : "Выбор"}
                <select data-specialty-pool-choice="${choice.id}" data-specialty-pool-index="${index}">
                  <option value="">— Выберите вариант —</option>
                  ${(choice.poolOptions ?? []).map(option => `
                    <option value="${escapeSpecialtyHtml(option)}"
                      ${option === current ? "selected" : ""}
                      ${selectedElsewhere.has(option) ? "disabled" : ""}>
                      ${escapeSpecialtyHtml(option)}
                    </option>
                  `).join("")}
                </select>
              </label>
            `;
          }).join("")}
        </div>
        <span class="choice-hint">Нужно выбрать: ${count}. Повторять один вариант нельзя.</span>
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
      if (choice.poolOptions?.length) return renderPoolChoice(choice);

      if (String(choice.type ?? "").endsWith("Text")) {
        return `
          <label class="choice-field">
            ${escapeSpecialtyHtml(choice.label)}
            <textarea
              rows="2"
              data-specialty-choice="${choice.id}"
              placeholder="${escapeSpecialtyHtml(choice.placeholder ?? "Введите варианты через ;")}">
${escapeSpecialtyHtml(state.specialtyChoices[choice.id] ?? "")}</textarea>
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
        ? `<p class="muted">Выберите нужные варианты из установленных списков. Свободный ввод остаётся только там, где полного перечня нет.</p>
           <div class="choice-grid">${fields}</div>`
        : `<p class="muted">У этой специальности нет обязательных вариантов выбора.</p>`}
    `;

    specialtyChoicesContainer.querySelectorAll("[data-specialty-choice]").forEach(control => {
      const update = () => {
        state.specialtyChoices[control.dataset.specialtyChoice] = control.value;
        clearError();
      };
      control.addEventListener("input", update);
      control.addEventListener("change", update);
    });

    specialtyChoicesContainer.querySelectorAll("[data-specialty-pool-choice]").forEach(control => {
      control.addEventListener("change", () => {
        const choiceId = control.dataset.specialtyPoolChoice;
        const index = Number(control.dataset.specialtyPoolIndex);
        const choice = choices.find(item => item.id === choiceId);
        const count = Math.max(1, Number(choice?.count ?? 1));
        const values = splitChoiceValues(state.specialtyChoices[choiceId]);
        while (values.length < count) values.push("");
        values[index] = control.value;
        state.specialtyChoices[choiceId] = values.slice(0, count).filter(Boolean).join("; ");
        clearError();
        renderSpecialtyChoices();
      });
    });
  };

  renderSpecialtyChoices();
})();
