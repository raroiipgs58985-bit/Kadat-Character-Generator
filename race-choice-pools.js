(() => {
  const container = document.querySelector("#race-choices");
  const pools = window.KADAT_ADVANCEMENT?.pools;
  if (!container || !pools) return;

  state.raceChoices = {};

  function makeChoice(race, kind, count, options, template, bonus = 0, excluded = []) {
    const suffix = bonus > 0 ? ` +${bonus}` : "";
    return {
      id: `race-${race.id}-${kind}`,
      label: kind === "common-knowledge" ? "Общие знания" : "Ремесло",
      type: "skill",
      count,
      options: [...new Set(options)].filter(option => !excluded.includes(option)),
      template: `${template}${suffix}`
    };
  }

  for (const race of DATA.races ?? []) {
    const choices = [...(race.choices ?? [])];
    const fixedSkills = [];

    for (const rawSkill of race.skills ?? []) {
      const skill = String(rawSkill).trim();
      let match = skill.match(/^Общ(?:ее|ие)\s+знани[ея]\s*\((\d+)\s+любых?\)(?:\s*\+(\d+))?$/i);
      if (match) {
        choices.push(makeChoice(
          race,
          "common-knowledge",
          Number(match[1]),
          pools.commonKnowledge ?? [],
          "Общее знание ({value})",
          Number(match[2] ?? 0)
        ));
        continue;
      }

      match = skill.match(/^Ремесло\s*\(Любое\s+(\d+)\)(?:\s*\+(\d+))?$/i);
      if (match) {
        choices.push(makeChoice(
          race,
          "craft",
          Number(match[1]),
          pools.craft ?? [],
          "Ремесло ({value})",
          Number(match[2] ?? 0)
        ));
        continue;
      }

      match = skill.match(/^Ремесло\s*\((\d+)\s+любых?\)(?:\s*\+(\d+))?$/i);
      if (match) {
        choices.push(makeChoice(
          race,
          "craft",
          Number(match[1]),
          pools.craft ?? [],
          "Ремесло ({value})",
          Number(match[2] ?? 0)
        ));
        continue;
      }

      match = skill.match(/^Ремесло\s*\(Повар\s+и\s+любое\s+(\d+)\)(?:\s*\+(\d+))?$/i);
      if (match) {
        const bonus = Number(match[2] ?? 0);
        fixedSkills.push(`Ремесло (Повар)${bonus ? ` +${bonus}` : ""}`);
        choices.push(makeChoice(
          race,
          "craft",
          Number(match[1]),
          pools.craft ?? [],
          "Ремесло ({value})",
          bonus,
          ["Повар"]
        ));
        continue;
      }

      fixedSkills.push(skill);
    }

    race.skills = fixedSkills;
    race.choices = choices;
  }

  function currentRace() {
    return getSelected(DATA.races, raceSelect.value);
  }

  function valuesFor(choice) {
    const value = state.raceChoices[choice.id];
    if (Array.isArray(value)) return value.slice(0, choice.count ?? 1);
    return [];
  }

  function formatValue(choice, value) {
    return choice.template.replace("{value}", value);
  }

  window.getResolvedRaceChoices = function (race = currentRace()) {
    return (race.choices ?? []).flatMap(choice => valuesFor(choice)
      .filter(Boolean)
      .map((value, index) => ({
        id: `${choice.id}-${index}`,
        groupId: choice.id,
        label: choice.label,
        type: choice.type,
        value: formatValue(choice, value)
      }))
    );
  };

  function renderRaceChoices() {
    const race = currentRace();
    const choices = race.choices ?? [];

    if (!choices.length) {
      container.className = "homeworld-choices hidden";
      container.innerHTML = "";
      return;
    }

    const fields = choices.flatMap(choice => {
      const count = Math.max(1, Number(choice.count ?? 1));
      const selected = valuesFor(choice);
      while (selected.length < count) selected.push("");

      return Array.from({ length: count }, (_, index) => {
        const current = selected[index] ?? "";
        const selectedElsewhere = new Set(selected.filter((value, selectedIndex) => value && selectedIndex !== index));
        const label = count > 1 ? `${choice.label} — вариант ${index + 1}` : choice.label;

        return `
          <label class="choice-field">
            ${escapeHtml(label)}
            <select data-race-choice="${choice.id}" data-race-choice-index="${index}">
              <option value="">— Выберите вариант —</option>
              ${(choice.options ?? []).map(option => `
                <option value="${escapeHtml(option)}"
                  ${option === current ? "selected" : ""}
                  ${selectedElsewhere.has(option) ? "disabled" : ""}>
                  ${escapeHtml(option)}
                </option>
              `).join("")}
            </select>
          </label>
        `;
      });
    }).join("");

    container.className = "homeworld-choices";
    container.innerHTML = `
      <div class="choice-heading">
        <div>
          <h3>Выборы расы</h3>
          <p class="muted">Выберите навыки, которые раса получает из общего пула. Один вариант внутри одного выбора нельзя брать повторно.</p>
        </div>
      </div>
      <div class="choice-grid">${fields}</div>
    `;

    container.querySelectorAll("[data-race-choice]").forEach(select => {
      select.addEventListener("change", () => {
        const race = currentRace();
        const choice = (race.choices ?? []).find(item => item.id === select.dataset.raceChoice);
        if (!choice) return;

        const count = Math.max(1, Number(choice.count ?? 1));
        const values = valuesFor(choice);
        while (values.length < count) values.push("");
        values[Number(select.dataset.raceChoiceIndex)] = select.value;
        state.raceChoices[choice.id] = values.slice(0, count);
        clearError();
        renderRaceChoices();
        if (typeof renderAdvancement === "function") renderAdvancement();
      });
    });
  }

  function resetRaceChoices() {
    state.raceChoices = {};
    renderRaceChoices();
  }

  const validateBeforeRaceChoices = validateCharacter;
  validateCharacter = function () {
    const baseError = validateBeforeRaceChoices();
    if (baseError) return baseError;

    const race = currentRace();
    for (const choice of race.choices ?? []) {
      const values = valuesFor(choice).filter(Boolean);
      const expected = Math.max(1, Number(choice.count ?? 1));
      if (values.length !== expected) {
        return `Для расы «${race.name}» нужно сделать выбор: ${choice.label}. Требуется вариантов: ${expected}.`;
      }
      if (new Set(values).size !== values.length) {
        return `В выборе «${choice.label}» нельзя повторять один и тот же вариант.`;
      }
    }

    return "";
  };

  const buildBeforeRaceChoices = buildCharacter;
  buildCharacter = function () {
    const race = currentRace();
    const selections = getResolvedRaceChoices(race);
    const originalSkills = race.skills;

    race.skills = [
      ...originalSkills,
      ...selections.filter(selection => selection.type === "skill").map(selection => selection.value)
    ];

    try {
      const character = buildBeforeRaceChoices();
      character.raceSelections = selections;
      return character;
    } finally {
      race.skills = originalSkills;
    }
  };

  raceSelect.addEventListener("change", resetRaceChoices);
  document.querySelector("#reset-button")?.addEventListener("click", resetRaceChoices);
  renderRaceChoices();
})();
