(function (root) {
  "use strict";
  const {
    escape: esc,
    number: n,
    signed,
    tags,
    unique,
    meter,
    radar,
    statBars,
  } = root.KadatUI;
  const U = root.KadatUI;
  const statNames = U.statNames;
  const steps = [
    ["Происхождение", "Личность, раса и мир"],
    ["Специальность", "Роль и обязательные выборы"],
    ["Характеристики", "Распределение и переносы"],
    ["Развитие", "Навыки, таланты и опыт"],
    ["Досье", "Проверка и экспорт"],
  ];
  const options = (items, value) =>
    items
      .map(
        (i) =>
          `<option value="${esc(i.id ?? i)}" ${(i.id ?? i) === value ? "selected" : ""}>${esc(i.name ?? i)}${i.xpCost ? ` · ${n(i.xpCost)} ОО` : ""}</option>`,
      )
      .join("");
  const field = (label, body, extra = "") =>
    `<label ${extra}>${esc(label)}${body}</label>`;
  const sectionTitle = (title, subtitle = "") =>
    `<div class="section-heading"><div><h3>${esc(title)}</h3>${subtitle ? `<p class="muted">${esc(subtitle)}</p>` : ""}</div></div>`;
  function uniqueFeature(f) {
    return `<article class="feature-card"><strong>${esc(f.name)} <span class="badge">${n(f.rating)}</span></strong><p class="muted">${esc(f.resourceName ?? "")}</p><p>${esc(f.accumulation ?? f.text ?? f.description ?? "")}</p>${(f.spending ?? []).map((r) => `<details><summary>${esc(r.name)}</summary><p class="detail-body">${esc(r.text)}</p></details>`).join("")}</article>`;
  }
  function originCard(title, entry, kind) {
    const modifiers = Object.entries(entry.statModifiers ?? {})
      .filter(([, v]) => v)
      .map(([s, v]) => `${s} ${signed(v)}`);
    return `<article class="origin-card"><div class="card-eyebrow">${esc(title)}</div><h3>${esc(entry.name)}</h3><p>${esc(entry.description ?? "")}</p><div class="tags">${tags(kind === "race" ? [`${n(entry.startingXp * entry.xpMultiplier)} стартовых ОО`, `${entry.woundBonus >= 0 ? "+" : ""}${entry.woundBonus} к ранам`] : [...modifiers, `Раны ${signed(entry.woundBonus ?? 0)}`])}</div><details data-detail="origin-${kind}"><summary>Навыки, таланты и особенности</summary><div class="detail-body"><h4>Навыки</h4><div class="tags">${tags(entry.skills ?? [])}</div><h4>Таланты</h4><div class="tags">${tags(entry.talents ?? [])}</div><h4>Особенности</h4><div class="tags">${tags(entry.traits ?? [])}</div>${(entry.uniqueFeatures ?? []).map(uniqueFeature).join("")}${(entry.specialRules ?? []).map((r) => `<h4>${esc(r.name)}</h4><p>${esc(r.text)}</p>`).join("")}</div></details></article>`;
  }
  function choiceFields(choices, values, kind) {
    if (!choices.length) return "";
    return `<section class="choices-section"><div class="section-heading"><h3>Выборы ${kind === "race" ? "расы" : kind === "world" ? "родного мира" : "специальности"}</h3><span class="badge">Обязательно</span></div><div class="choice-grid">${choices
      .map((c) => {
        const count = c.count ?? 1,
          pool = c.poolOptions ?? c.options;
        const selected =
          kind === "race"
            ? (values[c.id] ?? [])
            : c.poolOptions
              ? String(values[c.id] ?? "")
                  .split(";")
                  .map((v) => v.trim())
              : [values[c.id] ?? ""];
        if (pool)
          return `<fieldset class="choice-field" data-error-field="${kind}:${esc(c.id)}"><legend>${esc(c.label)}${count > 1 ? ` · ${count} варианта` : ""}</legend>${Array.from({ length: count }, (_, i) => field(count > 1 ? `Вариант ${i + 1}` : "Выбор", `<select data-choice-kind="${kind}" data-choice="${esc(c.id)}" data-index="${i}" data-focus="${kind}-${esc(c.id)}-${i}"><option value="">— Выберите —</option>${pool.map((o) => `<option value="${esc(o)}" ${selected[i] === o ? "selected" : ""} ${selected.some((v, j) => j !== i && v === o) ? "disabled" : ""}>${esc(o)}</option>`).join("")}</select>`)).join("")}</fieldset>`;
        return field(
          c.label,
          `<textarea rows="2" data-choice-kind="${kind}" data-choice="${esc(c.id)}" data-focus="${kind}-${esc(c.id)}" placeholder="${esc(c.placeholder ?? "Варианты через ;")}">${esc(values[c.id] ?? "")}</textarea><small>Укажите ${count} ${count === 1 ? "вариант" : "варианта"}. Свободный ввод из исходного правила.</small>`,
          `data-error-field="${kind}:${esc(c.id)}"`,
        );
      })
      .join("")}</div></section>`;
  }
  function regimentChoices(d, c) {
    return `<div class="choice-grid">${(
      c.world.regimentMechanics?.choices ?? []
    )
      .map((choice) => {
        const value = d.regimentChoices[choice.id];
        if (choice.kind === "stat")
          return `<fieldset class="choice-field" data-error-field="regiment:${esc(choice.id)}"><legend>${esc(choice.label)} · ${signed(choice.bonus)}</legend><p class="muted">Выберите ${choice.choose}</p><div class="stat-choice-list">${choice.options.map((s) => `<label><input type="checkbox" data-regiment-choice="${esc(choice.id)}" value="${esc(s)}" ${(value ?? []).includes(s) ? "checked" : ""}><span>${esc(s)}</span></label>`).join("")}</div></fieldset>`;
        const control = choice.kind.startsWith("free-")
          ? `<input data-regiment-choice="${esc(choice.id)}" data-focus="reg-${esc(choice.id)}" value="${esc(value ?? "")}" placeholder="${esc(choice.placeholder ?? "")}">`
          : `<select data-regiment-choice="${esc(choice.id)}" data-focus="reg-${esc(choice.id)}"><option value="">— Выберите —</option>${choice.options
              .map((o) => {
                const v =
                  choice.kind === "stat-option"
                    ? `${o.stat}:${o.bonus}`
                    : o.value;
                return `<option value="${esc(v)}" ${value === v ? "selected" : ""}>${choice.kind === "stat-option" ? `${esc(o.stat)} ${signed(o.bonus)}` : esc(o.value)}</option>`;
              })
              .join("")}</select>`;
        return field(
          choice.label,
          control,
          `data-error-field="regiment:${esc(choice.id)}"`,
        );
      })
      .join("")}</div>`;
  }
  function origin(d, c, engine, ui, data) {
    const saved = ui.regiments;
    return `<div class="form-grid form-grid-two">
      ${field("Имя персонажа", `<input id="character-name" data-field="name" maxlength="500" value="${esc(d.name)}" placeholder="Как зовут вашего персонажа?" autocomplete="off">`)}
      ${field(
        "Пол",
        `<select id="gender" data-field="gender">${options(
          [
            { id: "unspecified", name: "Не указан" },
            { id: "male", name: "Мужской" },
            { id: "female", name: "Женский" },
          ],
          d.gender,
        )}</select>`,
      )}
      ${field("Раса", `<select id="race" data-field="raceId">${options(data.races, d.raceId)}</select>`)}
      ${field("Источник происхождения", `<select id="character-origin-source" data-field="originSource"><option value="ready" ${d.originSource === "ready" ? "selected" : ""}>Родной мир из каталога</option><option value="regiment" ${d.originSource === "regiment" ? "selected" : ""}>Мой сформированный полк</option></select>`)}
      ${d.originSource === "regiment" ? field("Сохранённый полк", `<select id="character-regiment-select" data-field="regimentId"><option value="">— Выберите полк —</option>${options(saved, d.regiment?.id)}</select>`) : field("Родной мир", `<select id="homeworld" data-field="worldId">${options(data.homeworlds, d.worldId)}</select>`)}
      ${d.originSource === "regiment" ? `<div class="inline-actions"><button type="button" class="secondary" data-open-mode="regiment">Создать полк</button>${d.regiment ? '<button type="button" class="quiet" data-delete-regiment>Удалить сохранённый полк</button>' : ""}</div>` : ""}
    </div><div class="origin-grid">${originCard("РАСА", c.race, "race")}${originCard(d.originSource === "regiment" ? "ПОЛК" : "РОДНОЙ МИР", c.world, "world")}</div>
    ${choiceFields(c.race.choices ?? [], d.raceChoices, "race")}${d.originSource === "regiment" ? regimentChoices(d, c) : choiceFields(c.world.choices ?? [], d.homeworldChoices, "world")}`;
  }
  function specialty(d, c, engine, ui) {
    const catalog = engine.specialties(d),
      query = ui.specialtySearch.toLocaleLowerCase("ru-RU");
    const filtered = catalog.filter((s) =>
      `${s.name} ${s.category ?? ""}`
        .toLocaleLowerCase("ru-RU")
        .includes(query),
    );
    return `<div class="form-grid form-grid-two">${field("Специальность", `<select id="specialty" data-field="specialtyId">${options(catalog, d.specialtyId)}</select>`)}${field("Найти специальность", `<input type="search" id="specialty-search" data-ui="specialtySearch" value="${esc(ui.specialtySearch)}" placeholder="Название или категория">`)}</div>
      <div class="specialty-picker">${filtered.map((s) => `<button type="button" class="specialty-tile ${s.id === d.specialtyId ? "selected" : ""}" data-select-specialty="${esc(s.id)}" aria-pressed="${s.id === d.specialtyId}"><span class="card-eyebrow">${esc(s.category ?? "Без назначения")}</span><strong>${esc(s.name)}</strong><span>${s.xpCost ? n(s.xpCost) + " ОО" : "Без стоимости"}</span></button>`).join("") || "<p>Ничего не найдено.</p>"}</div>
      ${originCard("ВЫБРАННОЕ НАЗНАЧЕНИЕ", c.specialty, "specialty")}
      <div class="equipment-preview"><h4>Стартовое снаряжение</h4>${U.equipment([["Специальность", c.specialty.equipment]])}</div>
      ${choiceFields(c.specialty.choices ?? [], d.specialtyChoices, "specialty")}`;
  }
  function stats(d, c, engine, ui, data) {
    const fixed = c.race.fixedGeneration,
      spent = Object.values(d.plannedAdditions).reduce((a, b) => a + b, 0),
      limit = c.race.redistributionCount ?? 2,
      transferValue = c.race.redistributionValue ?? 5;
    const generationReady = !engine
      .validate(d, { baseOnly: true })
      .some((e) => e.step === 2 && e.field !== "transfers");
    return `${fixed ? '<div class="message">Характеристики зафиксированы формуляром ксено-расы. Дополнительное распределение и бросок не требуются.</div>' : `<div class="generation-toolbar">${field("Метод определения", `<select id="generation-mode" data-field="mode"><option value="planned" ${d.mode === "planned" ? "selected" : ""}>Распределить ${c.race.plannedPoints} очков</option><option value="random" ${d.mode === "random" ? "selected" : ""}>Бросить 2к10</option></select>`)}${d.mode === "random" ? '<button type="button" id="roll-button" data-roll>Бросить 2к10 ↻</button>' : ""}</div>${d.mode === "planned" ? `<div class="allocation-ledger">${meter("Распределено", spent, c.race.plannedPoints, spent > c.race.plannedPoints ? "red" : "teal")}<p id="points-status">Осталось <strong>${n(c.race.plannedPoints - spent)}</strong> · не более ${c.race.maxPerStat} в характеристику до переносов</p></div>` : '<p class="muted">Каждая характеристика определяется отдельным броском 2к10.</p>'}`}
    <p class="scale-caption">Шкала характеристик: 0–${U.statScale(c.stats)}. Это масштаб отображения, не игровой предел.</p><div class="stats-grid">${data.stats
      .map((stat) => {
        const b = c.breakdown[stat];
        return `<article class="stat-card ${d.pendingTransferFrom === stat ? "transfer-source" : ""}"><div class="stat-title"><abbr title="${esc(statNames[stat])}">${stat}</abbr><small>бонус ${Math.floor(c.stats[stat] / 10)}</small></div><strong class="stat-total">${n(c.stats[stat])}</strong><span class="stat-fullname">${esc(statNames[stat])}</span>${U.segments(c.stats[stat], U.statScale(c.stats), statNames[stat])}${!fixed && d.mode === "planned" ? `<label class="stat-input-label">Вложено<input inputmode="decimal" type="number" min="0" max="${c.race.maxPerStat}" step="any" data-stat="${stat}" data-focus="stat-${stat}" value="${d.plannedAdditions[stat]}" aria-label="Очки в ${stat}"></label>` : !fixed ? `<span class="roll-value">2к10: ${d.rolls[stat] || "—"}</span>` : ""}<details data-detail="stat-${stat}"><summary>Из чего складывается</summary><dl class="breakdown"><div><dt>База расы</dt><dd>${n(b.base)}</dd></div><div><dt>Родной мир / полк</dt><dd>${signed(b.world)}</dd></div><div><dt>Специальность</dt><dd>${signed(b.specialty)}</dd></div><div><dt>Генерация и переносы</dt><dd>${signed(b.generation)}</dd></div><div><dt>Развитие</dt><dd>${signed(b.advancement)}</dd></div><div class="breakdown-total"><dt>Итого</dt><dd>${n(c.stats[stat])}</dd></div></dl></details>${!fixed ? `<div class="transfer-buttons"><button type="button" class="secondary" data-transfer-from="${stat}" aria-label="Перенести ${transferValue} из ${stat}" ${!generationReady || d.transfers.length >= limit ? "disabled" : ""}>−${transferValue}</button><button type="button" class="secondary" data-transfer-to="${stat}" aria-label="Перенести ${transferValue} в ${stat}" ${!generationReady || !d.pendingTransferFrom || d.pendingTransferFrom === stat || d.transfers.length >= limit ? "disabled" : ""}>+${transferValue}</button></div>` : ""}</article>`;
      })
      .join("")}</div>
      ${fixed ? "" : `<section class="transfer-panel"><div class="section-heading"><h3>Переносы <span class="badge">${d.transfers.length} / ${limit}</span></h3><div class="inline-actions"><button class="quiet" type="button" data-cancel-transfer ${!d.pendingTransferFrom ? "disabled" : ""}>Отменить выбор</button><button class="secondary" type="button" data-undo-transfer ${!d.transfers.length ? "disabled" : ""}>Отменить перенос</button></div></div><p>${d.pendingTransferFrom ? `Выбран источник ${d.pendingTransferFrom}. Нажмите +${transferValue} у получателя.` : `Сначала завершите генерацию, затем выберите −${transferValue} у источника и +${transferValue} у получателя.`}</p><div class="transfer-history">${tags(d.transfers.map((t) => `${t.from} −${transferValue} → ${t.to} +${transferValue}`))}</div></section>`}`;
  }
  function talentOption(t, ui, adv) {
    if (!t.option) return "";
    const value = ui.talentOptions[t.id] ?? "",
      o = t.option;
    let values = o.values ?? o.options ?? [];
    if (o.type === "pool" && o.pool) values = adv.pools[o.pool] ?? values;
    if (o.type === "pool" || o.type === "select")
      return field(
        o.label ?? "Специализация",
        `<select data-talent-option="${esc(t.id)}" data-focus="talent-${esc(t.id)}"><option value="">— Выберите —</option>${options(values, value)}</select>`,
      );
    return field(
      o.label ?? "Специализация",
      `<input data-talent-option="${esc(t.id)}" data-focus="talent-${esc(t.id)}" value="${esc(value)}" placeholder="${esc(o.placeholder ?? "Укажите специализацию")}">`,
    );
  }
  function advancement(d, c, engine, ui, data, adv) {
    const ready = !engine.validate(d, { baseOnly: true }).length,
      tab = ui.advancementTab;
    const header = `${U.xpSummary(c)}${!ready ? '<div class="message warning">Для покупок завершите обязательные выборы и характеристики. Каталог можно просматривать сейчас.</div>' : ""}
      <div class="subtabs" role="group" aria-label="Раздел развития">${[
        ["stats", "Характеристики"],
        ["skills", "Навыки"],
        ["talents", "Таланты"],
        ["purchases", "Мои покупки"],
      ]
        .map(
          ([id, label]) =>
            `<button class="${id === tab ? "is-active" : ""}" type="button" data-adv-tab="${id}" aria-pressed="${id === tab}">${label}</button>`,
        )
        .join("")}</div>`;
    if (tab === "stats")
      return (
        header +
        `<div class="adv-stat-grid">${data.stats
          .map((s) => {
            const count = d.advancement.characteristics[s],
              cost = engine.characteristicCost(count);
            return `<article class="advance-card"><span class="card-eyebrow">${esc(statNames[s])}</span><div class="advance-values"><strong>${s} ${n(c.stats[s])}</strong><span>→ ${n(c.stats[s] + 5)}</span></div><p>Куплено: +${count * 5}</p>${U.segments(c.stats[s], U.statScale(c.stats), statNames[s])}<p class="availability ${!ready || c.availableXp < cost ? "warning" : ""}">${!ready ? "Завершите обязательные выборы" : c.availableXp < cost ? `Не хватает ${n(cost - c.availableXp)} ОО` : "Доступно к приобретению"}</p><div class="inline-actions"><button type="button" class="quiet" data-action="undoCharacteristic" data-stat="${s}" ${!count ? "disabled" : ""}>Отменить</button><button type="button" data-action="buyCharacteristic" data-stat="${s}" ${!ready || c.availableXp < cost ? "disabled" : ""}>+5 · ${n(cost)} ОО</button></div></article>`;
          })
          .join("")}</div>`
      );
    if (tab === "skills") {
      const skill =
          adv.skills.find((s) => s.name === ui.skillName) ?? adv.skills[0],
        specializations = skill.specializations ?? [];
      const custom = ui.skillSpecialization.includes("#Имя");
      const option = custom
        ? ui.skillCustom.trim()
          ? ui.skillSpecialization.replace("#Имя", ui.skillCustom.trim())
          : ""
        : ui.skillSpecialization;
      const name = specializations.length
          ? option
            ? `${skill.name} (${option})`
            : ""
          : skill.name,
        p = name ? engine.skillState(d, name) : null;
      return (
        header +
        `<div class="purchase-panel"><div class="form-grid form-grid-two">${field(
          "Навык",
          `<select id="adv-skill-name" data-ui="skillName">${options(
            adv.skills.map((s) => ({ id: s.name, name: s.name })),
            skill.name,
          )}</select>`,
        )}${specializations.length ? field("Специализация", `<select id="adv-skill-specialization" data-ui="skillSpecialization"><option value="">— Выберите —</option>${options(specializations, ui.skillSpecialization)}</select>`) : ""}${custom ? field("Название специализации", `<input id="adv-skill-custom" data-ui="skillCustom" value="${esc(ui.skillCustom)}">`) : ""}</div><p class="muted">Характеристика: ${esc(skill.characteristic ?? "по ситуации")}. Ступени: +0 → +10 → +20 → +30.</p><p class="availability ${!ready || !name || p?.nextCost == null || c.availableXp < p.nextCost ? "warning" : ""}">${!ready ? "Завершите обязательные выборы и характеристики." : !name ? "Выберите или впишите специализацию навыка." : p?.nextCost == null ? "Достигнут предел развития навыка." : c.availableXp < p.nextCost ? `Не хватает ${n(p.nextCost - c.availableXp)} ОО.` : "Навык доступен к приобретению."}</p><button type="button" data-action="buySkill" data-name="${esc(name)}" ${!ready || !name || p?.nextCost == null || c.availableXp < p.nextCost ? "disabled" : ""}>${!name ? "Выберите специализацию" : p?.nextCost == null ? "Предел навыка" : `${p?.stage ? "Улучшить" : "Изучить"} · ${n(p.nextCost)} ОО`}</button></div>
        ${sectionTitle("Навыки персонажа", "Заливка показывает бонус освоения; максимум +30.")}<div class="skill-profile-list">${[...c.skills].map(([name, value]) => `<article><div><strong>${esc(name)}</strong>${meter("Бонус", value, 30)}</div>${d.advancement.skills[name] ? `<button type="button" class="quiet" data-action="undoSkill" data-name="${esc(name)}">Отменить покупку</button>` : '<span class="badge">Происхождение</span>'}</article>`).join("") || '<p class="muted">Пока нет навыков.</p>'}</div>`
      );
    }
    if (tab === "talents") {
      const q = ui.talentSearch.toLocaleLowerCase("ru-RU"),
        catalog = adv.talents.filter(
          (t) =>
            (!ui.talentLevel || String(t.level) === ui.talentLevel) &&
            (!ui.talentCategory || t.category === ui.talentCategory) &&
            `${t.name} ${t.description} ${t.requirements}`
              .toLocaleLowerCase("ru-RU")
              .includes(q),
        );
      return (
        header +
        `<div class="catalog-filters">${field("Найти талант", `<input id="adv-talent-search" type="search" data-ui="talentSearch" value="${esc(ui.talentSearch)}" placeholder="Название, описание, требование">`)}${field("Уровень", `<select id="adv-talent-level" data-ui="talentLevel"><option value="">Все уровни</option>${options(["1", "2", "3"], ui.talentLevel)}</select>`)}${field("Категория", `<select id="adv-talent-category" data-ui="talentCategory"><option value="">Все категории</option>${options(unique(adv.talents.map((t) => t.category)), ui.talentCategory)}</select>`)}</div><p class="muted">Найдено ${catalog.length} из ${adv.talents.length}. Сложные текстовые требования проверяются с ведущим.</p><div class="talent-catalog">${
          catalog
            .map((t) => {
              const name = engine.talentName(t, ui.talentOptions[t.id] ?? ""),
                owned = c.talents.some(
                  (v) =>
                    root.KadatCharacter.key(v) ===
                    root.KadatCharacter.key(name),
                ),
                repeat = Boolean(t.repeatable || t.option?.repeatable),
                failures = engine.requirementFailures(t, c),
                cost = engine.talentCost(t.level),
                can =
                  ready &&
                  name &&
                  (!owned || repeat) &&
                  !failures.length &&
                  c.availableXp >= cost;
              const reason =
                owned && !repeat
                  ? "Уже получен"
                  : !ready
                    ? "Завершите создание"
                    : !name
                      ? "Выберите специализацию"
                      : failures.length
                        ? "Требования не выполнены"
                        : c.availableXp < cost
                          ? `Не хватает ${n(cost - c.availableXp)} ОО`
                          : "Доступен";
              return `<details data-availability="${owned && !repeat ? "owned" : can ? "available" : "locked"}" class="talent-catalog-card" data-detail="${esc(t.id)}"><summary><span><strong>${esc(t.name)}</strong><small>${esc(t.category)} · ${t.level} ур.${repeat ? " · повторяемый" : ""}</small></span><span class="talent-price"><b>${n(cost)} ОО</b>${U.status(reason, owned && !repeat ? "valid" : can ? "active" : "locked")}</span></summary><div class="detail-body"><p>${esc(t.description ?? "")}</p><p><strong>Требования:</strong> ${esc(t.requirements || "Нет")}</p>${talentOption(t, ui, adv)}<p class="availability">${esc(reason)}</p>${failures.length ? `<p class="warning-text">Не выполнено: ${failures.map(esc).join(", ")}</p>` : ""}<button type="button" data-action="buyTalent" data-catalog-id="${esc(t.id)}" ${can ? "" : "disabled"}>${owned && !repeat ? "Уже получен" : owned ? "Купить ещё" : "Купить"} · ${n(cost)} ОО</button></div></details>`;
            })
            .join("") ||
          '<div class="empty-state">Нет совпадений. Измените фильтры.</div>'
        }</div>`
      );
    }
    return (
      header +
      `${sectionTitle("Журнал развития", "Покупки можно отменить по отдельности.")}<div class="purchase-list">${data.stats
        .filter((s) => d.advancement.characteristics[s])
        .map(
          (s) =>
            `<div><span>${s} +${d.advancement.characteristics[s] * 5}</span><button type="button" class="quiet" data-action="undoCharacteristic" data-stat="${s}">Отменить +5</button></div>`,
        )
        .join("")}${Object.values(d.advancement.skills)
        .map(
          (s) =>
            `<div><span>${esc(s.name)} · ${s.count} покупок</span><button type="button" class="quiet" data-action="undoSkill" data-name="${esc(s.name)}">Отменить одну</button></div>`,
        )
        .join(
          "",
        )}${d.advancement.talents.map((t) => `<div><span>${esc(t.name)} <small>${engine.talentCost(t.level)} ОО</small></span><button type="button" class="quiet" data-action="undoTalent" data-purchase-id="${esc(t.id)}">Отменить</button></div>`).join("")}${!c.advancement.spent ? "<p>Покупок ещё нет.</p>" : ""}</div><button type="button" class="secondary" data-action="resetAdvancement" ${!c.advancement.spent ? "disabled" : ""}>Сбросить всё развитие</button>`
    );
  }
  function checklist(errors) {
    return `<div class="validation-checklist">${steps
      .slice(0, 4)
      .map(([label], i) => {
        const problems = errors.filter((e) => e.step === i);
        return `<article class="check-item ${problems.length ? "needs-attention" : "complete"}"><span class="check-icon">${problems.length ? "!" : "✓"}</span><div><strong>${label}</strong><p>${problems.length ? problems.map((e) => esc(e.message)).join("<br>") : "Всё заполнено"}</p></div><button type="button" class="quiet" data-wizard-go="${i}">Изменить</button></article>`;
      })
      .join("")}</div>`;
  }
  function review(d, c, engine) {
    const errors = engine.validate(d);
    return `<div class="review-identity"><span class="card-eyebrow">ЛИЧНОЕ ДЕЛО</span><h3>${esc(c.name)}</h3><p>${esc(c.race.name)} · ${esc(c.world.name)} · ${esc(c.specialty.name)}</p></div>${checklist(errors)}<div class="message ${errors.length ? "warning" : "success"}">${errors.length ? `До формирования досье осталось устранить ${errors.length} замечаний.` : "Персонаж готов. Сформируйте досье, чтобы получить итоговую карточку и выгрузить Excel."}</div>`;
  }
  function live(d, c, errors) {
    return `<div class="live-heading"><span class="card-eyebrow">ЛИЧНОЕ ДЕЛО / PERSONNEL</span></div><h2>${esc(d.name || "Новое личное дело")}</h2><p class="muted">${esc(c.race.name)} · ${esc(c.specialty.name)}</p>${U.recordFacts(
      [
        ["Происхождение", c.world.name],
        ["Раны", n(c.wounds)],
      ],
    )}${U.xpSummary(c, true)}${U.status(errors.length ? `Требует внимания: ${errors.length}` : "Готово к формированию", errors.length ? "warning" : "valid")}<div class="live-stat-profile">${statBars(c.stats)}</div><details class="summary-profile" data-detail="live-profile"><summary>Диаграмма характеристик</summary>${radar(c.stats)}</details><p class="small-note">Сводка учитывает текущие выборы и покупки.</p>`;
  }
  function dossier(c) {
    const equipment = unique([
      ...(c.race.equipment ?? []),
      ...(c.world.equipment ?? []),
      ...(c.specialtyEquipment ?? []),
    ]);
    const traits = unique([
      ...(c.race.traits ?? []),
      ...(c.world.traits ?? []),
      ...(c.specialtyTraits ?? []),
    ]);
    const rules = [
      ...(c.race.specialRules ?? []),
      ...(c.world.specialRules ?? []),
      ...(c.specialtyRules ?? []),
    ].filter(
      (r, i, a) =>
        a.findIndex((x) => x.name === r.name && x.text === r.text) === i,
    );
    const talentCounts = new Map();
    for (const name of c.talents)
      talentCounts.set(name, (talentCounts.get(name) ?? 0) + 1);
    return `${U.recordHeader("PERSONNEL DOSSIER", c.name, `${c.race.name} · ${c.world.name} · ${c.specialty.name}`, "Проверка пройдена")}${U.xpSummary(c)}
      <div class="dossier-grid"><section class="dossier-profile">${radar(c.stats)}${statBars(c.stats)}</section><div><div class="summary-grid"><div><span>Раны</span><strong>${n(c.wounds)}</strong></div><div><span>Опыт доступен</span><strong>${n(c.availableXp)}</strong></div><div><span>На развитие</span><strong>${n(c.advancement.spent)}</strong></div></div>${sectionTitle("Характеристики")}<div class="table-scroll"><table class="result-table"><thead><tr><th>Характеристика</th><th>Значение</th><th>Бонус</th></tr></thead><tbody>${Object.entries(
        c.stats,
      )
        .map(
          ([s, v]) =>
            `<tr><th>${s} <small>${esc(statNames[s])}</small></th><td>${n(v)}</td><td>${Math.floor(v / 10)}</td></tr>`,
        )
        .join("")}</tbody></table></div></div></div>
      ${c.regiment ? `<section class="dossier-section"><span class="card-eyebrow">ПОЛК</span><h3>${esc(c.regiment.name)}</h3><div class="tags">${tags([c.regiment.selectedEntries?.origin?.name, c.regiment.selectedEntries?.commander?.name, c.regiment.selectedEntries?.regimentType?.name].filter(Boolean))}</div></section>` : ""}
      <div class="dossier-columns"><section class="dossier-section"><h3>Навыки <span class="badge">${c.skills.size}</span></h3><div class="skill-result-list">${[...c.skills].map(([name, value]) => `<div><span>${esc(name)}</span><strong>+${value}</strong><i style="--skill:${(value / 30) * 100}%"></i></div>`).join("") || '<p class="muted">Нет навыков</p>'}</div></section><section class="dossier-section"><h3>Таланты <span class="badge">${c.talents.length}</span></h3><div class="tags">${tags([...talentCounts].map(([name, count]) => name + (count > 1 ? ` ×${count}` : "")))}</div><h3>Особенности</h3><div class="tags">${tags(traits)}</div>${(c.race.uniqueFeatures ?? []).map(uniqueFeature).join("")}</section></div>
      <section class="dossier-section"><h3>Снаряжение <span class="badge">${equipment.length}</span></h3>${U.equipment(
        [
          ["Раса", c.race.equipment],
          [c.regiment ? "Полк" : "Родной мир", c.world.equipment],
          ["Специальность", c.specialtyEquipment],
        ],
      )}</section>
      ${(c.raceImplants ?? []).length ? `<section class="dossier-section"><h3>Импланты</h3><div class="tags">${tags(c.raceImplants)}</div></section>` : ""}${(c.racePsychicPowers ?? []).length ? `<section class="dossier-section"><h3>Пси-силы</h3><div class="tags">${tags(c.racePsychicPowers)}</div></section>` : ""}
      <section class="dossier-section"><h3>Особые правила</h3>${rules.map((r, i) => `<details data-detail="rule-${i}"><summary>${esc(r.name)}</summary><p class="detail-body">${esc(r.text)}</p></details>`).join("") || '<p class="muted">Не указаны</p>'}</section>
      <details class="dossier-section" data-detail="xp-details"><summary>Развитие и переносы · ${n(c.advancement.spent)} ОО</summary><div class="detail-body"><div class="tags">${tags(
        Object.entries(c.advancement.characteristics)
          .filter(([, v]) => v)
          .map(([s, v]) => `${s} +${v * 5}`),
      )}${tags(c.advancement.skills.map((s) => `${s.name}: ${s.count} покупок`))}${tags(c.advancement.talents.map((t) => t.name))}${tags(c.transfers.map((t) => `${t.from} → ${t.to}`))}</div></div></details>`;
  }
  root.KadatCharacterViews = {
    steps,
    options,
    statNames,
    origin,
    specialty,
    stats,
    advancement,
    review,
    live,
    dossier,
  };
})(window);
