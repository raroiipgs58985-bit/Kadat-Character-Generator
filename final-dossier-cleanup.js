(() => {
  const renderResultWithSourceBreakdown = renderResult;

  function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function uniqueValues(values) {
    const seen = new Set();
    const result = [];

    for (const rawValue of values ?? []) {
      const value = normalizeText(rawValue);
      const key = value.toLocaleLowerCase("ru-RU");
      if (!value || seen.has(key)) continue;
      seen.add(key);
      result.push(value);
    }

    return result;
  }

  function splitGroupedOptions(value) {
    return normalizeText(value)
      .split(/\s*[,;]\s*/)
      .map(option => option.trim())
      .filter(Boolean);
  }

  function groupParentheticalEntries(entries, showBonus) {
    const records = [];
    const grouped = new Map();
    const plain = new Set();

    for (const entry of entries) {
      const name = normalizeText(entry.name);
      const bonus = Number(entry.bonus ?? 0);
      if (!name) continue;

      const match = name.match(/^(.+?)\s*\((.+)\)$/);
      if (!match) {
        const key = `${name.toLocaleLowerCase("ru-RU")}::${showBonus ? bonus : ""}`;
        if (plain.has(key)) continue;
        plain.add(key);
        records.push({ type: "plain", name, bonus });
        continue;
      }

      const base = normalizeText(match[1]);
      const key = `${base.toLocaleLowerCase("ru-RU")}::${showBonus ? bonus : ""}`;
      let record = grouped.get(key);

      if (!record) {
        record = { type: "group", base, bonus, options: [], optionKeys: new Set() };
        grouped.set(key, record);
        records.push(record);
      }

      for (const option of splitGroupedOptions(match[2])) {
        const optionKey = option.toLocaleLowerCase("ru-RU");
        if (record.optionKeys.has(optionKey)) continue;
        record.optionKeys.add(optionKey);
        record.options.push(option);
      }
    }

    return records.map(record => {
      const label = record.type === "group"
        ? `${record.base} (${record.options.join(", ")})`
        : record.name;
      const suffix = showBonus ? ` ${record.bonus >= 0 ? "+" : ""}${record.bonus}` : "";
      return `${label}${suffix}`;
    });
  }

  function renderTags(values) {
    return values.length
      ? values.map(value => `<span class="tag">${escapeHtml(value)}</span>`).join("")
      : `<span class="muted">Нет данных</span>`;
  }

  function findSection(title) {
    const heading = [...result.querySelectorAll("h3")]
      .find(node => normalizeText(node.textContent) === title);
    return heading?.parentElement ?? null;
  }

  function replaceTags(title, values) {
    const section = findSection(title);
    const tags = section?.querySelector(".tags");
    if (tags) tags.innerHTML = renderTags(values);
  }

  function aggregateTraits(character) {
    const uniqueFeatureNames = new Set(
      (character.race.uniqueFeatures ?? []).map(feature => normalizeText(feature.name).toLocaleLowerCase("ru-RU"))
    );

    const traits = uniqueValues([
      ...(character.race.traits ?? []),
      ...(character.world?.traits ?? []),
      ...(character.specialtyTraits ?? []),
      ...(character.specialty?.traits ?? [])
    ]).filter(trait => {
      const match = trait.match(/^(.+?)\s*\(/);
      const base = normalizeText(match?.[1] ?? trait).toLocaleLowerCase("ru-RU");
      return !uniqueFeatureNames.has(base);
    });

    return groupParentheticalEntries(
      traits.map(name => ({ name })),
      false
    );
  }

  function aggregateEquipment(character) {
    return uniqueValues([
      ...(character.race.equipment ?? []),
      ...(character.world?.equipment ?? []),
      ...(character.specialtyEquipment ?? []),
      ...(character.specialty?.equipment ?? [])
    ]);
  }

  function aggregateRules(character) {
    const seen = new Set();
    const rules = [];

    for (const rule of [
      ...(character.race.specialRules ?? []),
      ...(character.world?.specialRules ?? []),
      ...(character.specialtyRules ?? []),
      ...(character.specialty?.specialRules ?? [])
    ]) {
      const name = normalizeText(rule?.name);
      const text = normalizeText(rule?.text);
      const key = `${name.toLocaleLowerCase("ru-RU")}::${text.toLocaleLowerCase("ru-RU")}`;
      if ((!name && !text) || seen.has(key)) continue;
      seen.add(key);
      rules.push({ name, text });
    }

    return rules;
  }

  function replaceEquipment(character) {
    const section = findSection("Стартовое снаряжение");
    if (!section) return;

    const heading = section.querySelector("h3");
    if (heading) heading.textContent = "Снаряжение";

    const list = section.querySelector(".equipment-list");
    const equipment = aggregateEquipment(character);
    if (list) {
      list.innerHTML = equipment.length
        ? equipment.map(item => `<li>${escapeHtml(item)}</li>`).join("")
        : `<li class="muted">Снаряжение не указано</li>`;
    }
  }

  function replaceRules(character) {
    const rules = aggregateRules(character);
    let section = findSection("Прочие особые правила");

    if (!rules.length) {
      section?.remove();
      return;
    }

    const markup = rules.map(rule => `
      <article class="rule-card">
        <h4>${escapeHtml(rule.name)}</h4>
        <p>${escapeHtml(rule.text)}</p>
      </article>
    `).join("");

    if (!section) {
      section = document.createElement("div");
      section.innerHTML = `<h3>Особые правила</h3><div class="rule-list">${markup}</div>`;
      const equipmentSection = findSection("Снаряжение") ?? findSection("Стартовое снаряжение");
      if (equipmentSection) result.insertBefore(section, equipmentSection);
      else result.appendChild(section);
      return;
    }

    const heading = section.querySelector("h3");
    if (heading) heading.textContent = "Особые правила";
    const list = section.querySelector(".rule-list");
    if (list) list.innerHTML = markup;
  }

  function removeSourceBreakdown() {
    result.querySelectorAll(
      ".homeworld-section, .specialty-section, .advancement-result-section, .race-choice-result-section"
    ).forEach(section => section.remove());
  }

  renderResult = function (character) {
    renderResultWithSourceBreakdown(character);
    removeSourceBreakdown();

    result.querySelector(".race-description")?.remove();

    const groupedSkills = groupParentheticalEntries(
      [...character.skills.entries()].map(([name, bonus]) => ({ name, bonus })),
      true
    );
    const groupedTalents = groupParentheticalEntries(
      (character.talents ?? []).map(name => ({ name })),
      false
    );

    replaceTags("Навыки", groupedSkills);
    replaceTags("Таланты", groupedTalents);
    replaceTags("Особенности", aggregateTraits(character));
    replaceEquipment(character);
    replaceRules(character);
  };
})();
