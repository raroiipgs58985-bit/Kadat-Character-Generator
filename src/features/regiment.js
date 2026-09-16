(() => {
  "use strict";

  if (typeof document === "undefined") return;

  const STEP_COUNT = 5;
  const ROMANS = ["I", "II", "III", "IV", "V"];
  const state = {
    step: 0,
    name: "",
    homeworldId: "",
    originId: "",
    commanderId: "",
    regimentTypeId: "",
    trainingIds: new Set(),
    equipmentDoctrineIds: new Set(),
    drawbackIds: new Set(),
    extraEquipment: new Map(),
    equipmentSearch: "",
    supplyNotice: "",
  };

  const refs = {};
  let catalog = null;

  const U = window.KadatUI;
  const escapeHtml = U.escape;

  const normalize = (value) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
  const asNumber = (value) =>
    typeof value === "number" && Number.isFinite(value) ? value : null;
  const byId = (items, id) =>
    (items ?? []).find((item) => item.id === id) ?? null;

  function buildShell() {
    const footer = document.querySelector(".page-footer");
    if (!footer || document.querySelector("#regiment-builder-view")) return;

    const section = document.createElement("section");
    section.id = "regiment-builder-view";
    section.className = "builder-view regiment-builder-view hidden";
    section.innerHTML = `
      <nav class="wizard-progress regiment-progress" aria-label="Этапы создания полка">
        ${[
          ["Основание", "Мир и происхождение"],
          ["Командование", "Командир и тип"],
          ["Доктрины", "Подготовка и оснащение"],
          ["Снабжение", "Недостаток и имущество"],
          ["Проверка", "Полковой формуляр"],
        ]
          .map(
            ([title, subtitle], index) => `
          <button type="button" class="wizard-step-button${index === 0 ? " is-active" : ""}" data-regiment-go="${index}">
            <span class="wizard-roman">${ROMANS[index]}</span>
            <span class="wizard-step-copy"><strong>${title}</strong><small>${subtitle}</small></span>
          </button>
        `,
          )
          .join("")}
      </nav>

      <form id="regiment-form" class="panel dossier-form regiment-form" novalidate>
        <div class="dossier-rail dossier-rail-left" aria-hidden="true"></div>
        <div class="dossier-rail dossier-rail-right" aria-hidden="true"></div>
        <div id="regiment-mobile-summary" class="mobile-record-strip"></div><div class="feature-layout"><div id="regiment-stage"></div><aside id="regiment-summary" class="live-summary feature-summary" aria-label="Текущая сводка полка"></aside></div>
        <div id="regiment-validation" class="message hidden" role="alert"></div>
        <div class="wizard-controls regiment-controls">
          <button id="regiment-reset" type="button" class="secondary danger-quiet">Сбросить</button>
          <button id="regiment-prev" type="button" class="secondary">Назад</button>
          <div class="wizard-status">
            <span id="regiment-step-status">Этап 1 из 5</span>
            <strong id="regiment-points-status">ПО: 12</strong>
          </div>
          <button id="regiment-next" type="button">Далее</button>
          <button id="regiment-submit" type="submit" class="authorization-button" hidden>Сформировать полк</button>
        </div>
      </form>

      <section id="regiment-result-view" class="result-view hidden" aria-live="polite">
        <div class="result-toolbar">
          <button id="regiment-return" type="button" class="secondary">Вернуться к редактированию</button>
          <button type="button" id="use-regiment-for-character">Создать персонажа из полка</button><div class="result-document-code">
            <span>ПОЛКОВОЙ ФОРМУЛЯР</span>
            <strong id="regiment-code">REG-000000</strong>
          </div>
        </div>
        <section class="panel result-panel regiment-result-panel" tabindex="-1">
          <div class="result-stamp" aria-hidden="true">УЧТЁН</div>
          <div class="result-document-heading">
            <p>DEPARTMENTO MUNITORUM</p>
            <h2>Итоговый формуляр полка</h2>
            <span>REGIMENTAL REGISTRY // KADAT</span>
          </div>
          <div id="regiment-result"></div>
        </section>
      </section>
    `;
    footer.insertAdjacentElement("beforebegin", section);

    refs.section = section;
    refs.form = section.querySelector("#regiment-form");
    refs.stage = section.querySelector("#regiment-stage");
    refs.summary = section.querySelector("#regiment-summary");
    refs.validation = section.querySelector("#regiment-validation");
    refs.prev = section.querySelector("#regiment-prev");
    refs.next = section.querySelector("#regiment-next");
    refs.submit = section.querySelector("#regiment-submit");
    refs.reset = section.querySelector("#regiment-reset");
    refs.status = section.querySelector("#regiment-step-status");
    refs.points = section.querySelector("#regiment-points-status");
    refs.resultView = section.querySelector("#regiment-result-view");
    refs.result = section.querySelector("#regiment-result");
    refs.code = section.querySelector("#regiment-code");
    refs.progress = [...section.querySelectorAll("[data-regiment-go]")];

    section
      .querySelector("#use-regiment-for-character")
      .addEventListener("click", () => {
        const snapshot = saveRegiment();
        if (snapshot)
          window.dispatchEvent(
            new CustomEvent("kadat:use-regiment", { detail: snapshot }),
          );
      });
    for (const type of ["input", "change", "click"])
      refs.form.addEventListener(type, () => queueMicrotask(persistDraft));
    refs.progress.forEach((button) =>
      button.addEventListener("click", () =>
        goToStep(Number(button.dataset.regimentGo)),
      ),
    );
    refs.prev.addEventListener("click", () => goToStep(state.step - 1));
    refs.next.addEventListener("click", () => {
      if (!validateStep(state.step)) return;
      goToStep(state.step + 1);
    });
    refs.reset.addEventListener("click", resetState);
    refs.form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateAll()) return;
      saveRegiment();
      renderResult();
    });
    section.querySelector("#regiment-return").addEventListener("click", () => {
      refs.resultView.classList.add("hidden");
      refs.form.classList.remove("hidden");
      refs.progress[0].parentElement.classList.remove("hidden");
      renderStep();
    });
  }

  function resetState() {
    state.step = 0;
    state.name = "";
    state.homeworldId = "";
    state.originId = "";
    state.commanderId = "";
    state.regimentTypeId = "";
    state.trainingIds.clear();
    state.equipmentDoctrineIds.clear();
    state.drawbackIds.clear();
    state.extraEquipment.clear();
    state.equipmentSearch = "";
    state.supplyNotice = "";
    refs.resultView.classList.add("hidden");
    refs.form.classList.remove("hidden");
    refs.progress[0].parentElement.classList.remove("hidden");
    hideValidation();
    renderStep();
  }

  function selectedEntries() {
    return {
      homeworld: byId(catalog.homeworlds, state.homeworldId),
      origin: byId(catalog.origins, state.originId),
      commander: byId(catalog.commanders, state.commanderId),
      regimentType: byId(catalog.regimentTypes, state.regimentTypeId),
      training: [...state.trainingIds]
        .map((id) => byId(catalog.trainingDoctrines, id))
        .filter(Boolean),
      equipmentDoctrines: [...state.equipmentDoctrineIds]
        .map((id) => byId(catalog.equipmentDoctrines, id))
        .filter(Boolean),
      drawbacks: [...state.drawbackIds]
        .map((id) => byId(catalog.drawbacks, id))
        .filter(Boolean),
      extraEquipment: [...state.extraEquipment.entries()]
        .map(([id, quantity]) => ({
          entry: byId(catalog.extraEquipment, id),
          quantity,
        }))
        .filter((item) => item.entry && item.quantity > 0),
    };
  }

  function calculate() {
    const selected = selectedEntries();
    const regimentEntries = [
      selected.homeworld,
      selected.origin,
      selected.commander,
      selected.regimentType,
      ...selected.training,
      ...selected.equipmentDoctrines,
    ].filter(Boolean);
    const budget = window.KADAT_REGIMENT_BUDGET.calculate({
      regimentEntries,
      drawbacks: selected.drawbacks,
      extraEquipment: selected.extraEquipment,
    });
    return { selected, ...budget };
  }

  function reconcileSupply() {
    const calc = calculate();
    if (calc.equipmentRemaining >= 0 || !state.extraEquipment.size) return calc;

    const plan = window.KADAT_REGIMENT_BUDGET.planReductions(
      calc.selected.extraEquipment,
      Math.abs(calc.equipmentRemaining),
    );
    const removed = [];

    for (const reduction of plan.reductions) {
      const current = state.extraEquipment.get(reduction.id) ?? 0;
      const next = Math.max(0, current - reduction.quantity);
      if (next > 0) state.extraEquipment.set(reduction.id, next);
      else state.extraEquipment.delete(reduction.id);
      removed.push(`${reduction.name} ×${reduction.quantity}`);
    }

    const adjusted = calculate();
    if (removed.length) {
      state.supplyNotice = `Лимит снабжения уменьшился. Автоматически сняты последние закупки: ${removed.join("; ")}.`;
    }
    if (adjusted.equipmentRemaining < 0 || plan.unresolvedOverrun > 0) {
      state.supplyNotice =
        "Закупки превышают доступный лимит снабжения. Уменьшите количество позиций с указанной стоимостью.";
    }
    return adjusted;
  }

  function priceLabel(entry, kind = "cost", unit = "ПО") {
    const value = asNumber(entry?.[kind]);
    if (value === null) return "цена не указана";
    return kind === "bonusPoints" ? `+${value} ПО` : `${value} ${unit}`;
  }

  function optionMarkup(items, selectedId, placeholder) {
    return `<option value="">${placeholder}</option>${(items ?? [])
      .map(
        (entry) => `
      <option value="${escapeHtml(entry.id)}"${entry.id === selectedId ? " selected" : ""}>
        ${escapeHtml(entry.name)} — ${escapeHtml(priceLabel(entry))}
      </option>
    `,
      )
      .join("")}`;
  }

  function textBlocks(entry) {
    if (!entry) return `<p class="muted">Данные не выбраны.</p>`;
    const labels = {
      description: "Описание",
      characteristicsText: "Характеристики",
      skillsText: "Навыки",
      talentsText: "Таланты",
      equipmentText: "Снаряжение",
      effectText: "Эффект",
      rulesText: "Правила",
      specialRulesText: "Особые правила",
      restrictionText: "Ограничения",
      restrictionsText: "Ограничения",
      standardKitText: "Стандартный набор",
      sourceText: "Текст источника",
    };
    const blocks = [];
    for (const [key, label] of Object.entries(labels)) {
      const value = normalize(entry[key]);
      if (value)
        blocks.push(
          `<div><strong>${label}</strong><p>${escapeHtml(value)}</p></div>`,
        );
    }
    if (!blocks.length) {
      for (const [key, value] of Object.entries(entry)) {
        if (!key.endsWith("Text") || !normalize(value)) continue;
        blocks.push(
          `<div><strong>${escapeHtml(key)}</strong><p>${escapeHtml(normalize(value))}</p></div>`,
        );
      }
    }
    return `
      <article class="regiment-entry-preview">
        <header><h3>${escapeHtml(entry.name)}</h3><span>${escapeHtml(priceLabel(entry, "bonusPoints" in entry ? "bonusPoints" : "cost"))}</span></header>
        ${blocks.join("") || `<p class="muted">В исходной таблице дополнительные эффекты не указаны.</p>`}
      </article>
    `;
  }

  function stageHeading(index, kicker, title, description) {
    return `
      <header class="stage-heading">
        <div class="stage-index">${ROMANS[index]}</div>
        <div>
          <p class="stage-kicker">${kicker}</p>
          <h2>${title}</h2>
          <p>${description}</p>
        </div>
      </header>
    `;
  }

  function renderFoundation() {
    const selected = selectedEntries();
    refs.stage.innerHTML = `
      <section class="wizard-stage is-active">
        ${stageHeading(0, "ORIGO REGIMENTI", "Основание полка", "Укажите название полка, его родной мир и происхождение. Все значения переносятся из исходной таблицы без изменений.")}
        <div class="form-grid form-grid-two">
          <label>Название полка<input id="regiment-name" type="text" value="${escapeHtml(state.name)}" placeholder="Например: 9-й Кадатский" autocomplete="off"></label>
          <label>Родной мир<select id="regiment-homeworld">${optionMarkup(catalog.homeworlds, state.homeworldId, "Выберите родной мир")}</select></label>
          <label class="regiment-wide-field">Происхождение<select id="regiment-origin">${optionMarkup(catalog.origins, state.originId, "Выберите происхождение")}</select></label>
        </div>
        <div class="regiment-preview-grid">
          ${textBlocks(selected.homeworld)}
          ${textBlocks(selected.origin)}
        </div>
      </section>
    `;
    refs.stage
      .querySelector("#regiment-name")
      .addEventListener("input", (event) => {
        state.name = event.target.value;
        const name = refs.summary.querySelector("h2");
        if (name) name.textContent = state.name || "Новый полк";
      });
    refs.stage
      .querySelector("#regiment-homeworld")
      .addEventListener("change", (event) => {
        state.homeworldId = event.target.value;
        renderStep();
      });
    refs.stage
      .querySelector("#regiment-origin")
      .addEventListener("change", (event) => {
        state.originId = event.target.value;
        renderStep();
      });
  }

  function renderCommand() {
    const selected = selectedEntries();
    refs.stage.innerHTML = `
      <section class="wizard-stage is-active">
        ${stageHeading(1, "IMPERIUM ET FORMA", "Командование и тип полка", "Выберите характер командира и основную специализацию полка. Тип полка считается одной из трёх допустимых доктрин.")}
        <div class="form-grid form-grid-two">
          <label>Командир<select id="regiment-commander">${optionMarkup(catalog.commanders, state.commanderId, "Выберите тип командира")}</select></label>
          <label>Тип полка<select id="regiment-type">${optionMarkup(catalog.regimentTypes, state.regimentTypeId, "Выберите тип полка")}</select></label>
        </div>
        <div class="regiment-preview-grid">
          ${textBlocks(selected.commander)}
          ${textBlocks(selected.regimentType)}
        </div>
      </section>
    `;
    refs.stage
      .querySelector("#regiment-commander")
      .addEventListener("change", (event) => {
        state.commanderId = event.target.value;
        renderStep();
      });
    refs.stage
      .querySelector("#regiment-type")
      .addEventListener("change", (event) => {
        state.regimentTypeId = event.target.value;
        renderStep();
      });
  }

  function doctrineCard(entry, selected, group) {
    return `
      <label class="regiment-choice-card${selected ? " is-selected" : ""}">
        <input type="checkbox" data-doctrine-group="${group}" value="${escapeHtml(entry.id)}"${selected ? " checked" : ""}>
        <span class="regiment-choice-copy">
          <span class="regiment-choice-title"><strong>${escapeHtml(entry.name)}</strong><em>${escapeHtml(priceLabel(entry))}</em></span>
          <small>${escapeHtml(normalize(entry.description || entry.effectText || entry.rulesText || "Дополнительное описание в источнике отсутствует."))}</small>
        </span>
      </label>
    `;
  }

  function renderDoctrines() {
    const total = state.trainingIds.size + state.equipmentDoctrineIds.size;
    refs.stage.innerHTML = `
      <section class="wizard-stage is-active">
        ${stageHeading(2, "DOCTRINAE BELLUM", "Доктрины полка", "После выбора типа полка можно взять не более двух дополнительных доктрин подготовки или специального снаряжения.")}
        <div class="regiment-doctrine-counter ${total > 2 ? "is-error" : ""}">
          <strong>Выбрано дополнительных доктрин: ${total} из 2</strong>
          <span>Тип полка уже занимает одну из трёх ячеек доктрин.</span>
        </div>
        <details class="regiment-catalog-group" open>
          <summary>Доктрины подготовки <span>${state.trainingIds.size}</span></summary>
          <div class="regiment-choice-list">
            ${catalog.trainingDoctrines.map((entry) => doctrineCard(entry, state.trainingIds.has(entry.id), "training")).join("")}
          </div>
        </details>
        <details class="regiment-catalog-group">
          <summary>Доктрины специального снаряжения <span>${state.equipmentDoctrineIds.size}</span></summary>
          <div class="regiment-choice-list">
            ${catalog.equipmentDoctrines.map((entry) => doctrineCard(entry, state.equipmentDoctrineIds.has(entry.id), "equipment")).join("")}
          </div>
        </details>
      </section>
    `;
    refs.stage.querySelectorAll("[data-doctrine-group]").forEach((input) =>
      input.addEventListener("change", (event) => {
        const group =
          event.target.dataset.doctrineGroup === "training"
            ? state.trainingIds
            : state.equipmentDoctrineIds;
        if (event.target.checked) {
          if (state.trainingIds.size + state.equipmentDoctrineIds.size >= 2) {
            event.target.checked = false;
            showValidation(
              "Полк может иметь не более трёх доктрин вместе с типом полка. Можно выбрать только две дополнительные доктрины.",
            );
            return;
          }
          group.add(event.target.value);
        } else {
          group.delete(event.target.value);
        }
        hideValidation();
        renderStep();
      }),
    );
  }

  function equipmentCard(entry, quantity, calc) {
    const cost = asNumber(entry.cost);
    const canIncrease =
      cost === null || cost <= 0 || calc.equipmentRemaining >= cost;
    return `
      <article class="regiment-equipment-card${quantity > 0 ? " is-selected" : ""}">
        <span class="regiment-quantity-control">
          <button type="button" data-equipment-minus="${escapeHtml(entry.id)}" aria-label="Уменьшить: ${escapeHtml(entry.name)}"${quantity <= 0 ? " disabled" : ""}>−</button>
          <strong>${quantity}</strong>
          <button type="button" data-equipment-plus="${escapeHtml(entry.id)}" aria-label="Увеличить: ${escapeHtml(entry.name)}"${canIncrease ? "" : " disabled"}>+</button>
          <small>${quantity ? "Включено в снабжение" : "Можно брать повторно"}</small>
        </span>
        <div>
          <header><strong>${escapeHtml(entry.name)}</strong><span>${escapeHtml(priceLabel(entry, "cost", "ОС"))}</span></header>
          ${entry.description || entry.effectText || entry.restrictionsText ? `<p>${escapeHtml(normalize(entry.description || entry.effectText || entry.restrictionsText))}</p>` : ""}
          ${entry.restrictionText ? `<p><strong>Ограничения источника:</strong> ${escapeHtml(entry.restrictionText)}</p>` : ""}
          ${!canIncrease ? `<p class="availability warning">Не хватает ${U.number(cost - calc.equipmentRemaining)} ОС.</p>` : ""}
        </div>
      </article>
    `;
  }

  function renderSupply() {
    const calc = calculate();
    const query = normalize(state.equipmentSearch).toLocaleLowerCase("ru-RU");
    const filtered = catalog.extraEquipment.filter(
      (entry) =>
        !query ||
        [
          entry.name,
          entry.description,
          entry.effectText,
          entry.restrictionText,
          entry.restrictionsText,
        ].some((value) =>
          normalize(value).toLocaleLowerCase("ru-RU").includes(query),
        ),
    );
    refs.stage.innerHTML = `
      <section class="wizard-stage is-active">
        ${stageHeading(3, "DEFECTUS ET COPIAE", "Недостатки и снабжение", "Можно выбрать несколько недостатков. Их полковые очки суммируются. Неиспользованные полковые очки превращаются в очки дополнительного снаряжения по правилу источника.")}
        ${state.supplyNotice ? `<div class="message">${escapeHtml(state.supplyNotice)}</div>` : ""}
        <div class="regiment-supply-head">
          <div class="regiment-budget-panel">
            <span>Выбрано недостатков<strong>${calc.selected.drawbacks.length}</strong></span>
            <span>Бонус от недостатков<strong>+${calc.drawbackBonus}</strong></span>
            <span>Полковые очки<strong>${calc.remaining}</strong></span>
            <span>Очки снабжения<strong>${calc.equipmentRemaining} / ${calc.equipmentPool}</strong></span>
          </div>
        </div>
        <details class="regiment-catalog-group" open>
          <summary>Недостатки полка <span>${calc.selected.drawbacks.length}</span></summary>
          <div class="regiment-choice-list">
            ${catalog.drawbacks
              .map(
                (entry) => `
              <label class="regiment-choice-card${state.drawbackIds.has(entry.id) ? " is-selected" : ""}">
                <input type="checkbox" data-regiment-drawback="${escapeHtml(entry.id)}"${state.drawbackIds.has(entry.id) ? " checked" : ""}>
                <span class="regiment-choice-copy">
                  <span class="regiment-choice-title"><strong>${escapeHtml(entry.name)}</strong><em>${escapeHtml(priceLabel(entry, "bonusPoints"))}</em></span>
                  <small>${escapeHtml(normalize(entry.description || entry.effectText || entry.rulesText || "Дополнительное описание в источнике отсутствует."))}</small>
                </span>
              </label>
            `,
              )
              .join("")}
          </div>
        </details>
        ${calc.selected.drawbacks.length ? `<div class="regiment-preview-grid">${calc.selected.drawbacks.map(textBlocks).join("")}</div>` : ""}
        <div class="regiment-equipment-toolbar">
          <label>Поиск по дополнительному снаряжению<input id="regiment-equipment-search" type="search" value="${escapeHtml(state.equipmentSearch)}" placeholder="Название или описание"></label>
          <span>Выбрано: ${calc.selected.extraEquipment.reduce((sum, item) => sum + item.quantity, 0)} покупок в ${calc.selected.extraEquipment.length} позициях</span>
        </div>
        <div class="regiment-equipment-list">
          ${filtered.map((entry) => equipmentCard(entry, state.extraEquipment.get(entry.id) ?? 0, calc)).join("") || `<p class="muted">Совпадений не найдено.</p>`}
        </div>
      </section>
    `;
    refs.stage.querySelectorAll("[data-regiment-drawback]").forEach((input) =>
      input.addEventListener("change", (event) => {
        const id = event.target.dataset.regimentDrawback;
        state.supplyNotice = "";
        if (event.target.checked) state.drawbackIds.add(id);
        else state.drawbackIds.delete(id);
        renderStep();
      }),
    );
    refs.stage
      .querySelector("#regiment-equipment-search")
      .addEventListener("input", (event) => {
        state.equipmentSearch = event.target.value;
        const selectionStart = event.target.selectionStart;
        renderStep();
        const next = refs.stage.querySelector("#regiment-equipment-search");
        next?.focus();
        next?.setSelectionRange(selectionStart, selectionStart);
      });
    refs.stage.querySelectorAll("[data-equipment-plus]").forEach((button) =>
      button.addEventListener("click", () => {
        const entry = byId(
          catalog.extraEquipment,
          button.dataset.equipmentPlus,
        );
        if (!entry) return;
        const current = state.extraEquipment.get(entry.id) ?? 0;
        const cost = asNumber(entry.cost);
        const calc = calculate();
        if (cost !== null && cost > 0 && calc.equipmentRemaining < cost) return;
        state.supplyNotice = "";
        state.extraEquipment.delete(entry.id);
        state.extraEquipment.set(entry.id, current + 1);
        renderStep();
      }),
    );
    refs.stage.querySelectorAll("[data-equipment-minus]").forEach((button) =>
      button.addEventListener("click", () => {
        const id = button.dataset.equipmentMinus;
        const current = state.extraEquipment.get(id) ?? 0;
        state.supplyNotice = "";
        if (current <= 1) state.extraEquipment.delete(id);
        else state.extraEquipment.set(id, current - 1);
        renderStep();
      }),
    );
  }

  function summaryRow(label, value, cost = null) {
    return `<div class="regiment-summary-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "—")}</strong>${cost !== null ? `<em>${escapeHtml(cost)}</em>` : ""}</div>`;
  }

  function renderReview() {
    const calc = calculate();
    const unresolved = [
      ...calc.unresolvedRegiment.map((entry) => entry.name),
      ...calc.unresolvedDrawbacks.map((entry) => entry.name),
      ...calc.unresolvedEquipment.map((item) => item.entry.name),
    ];
    refs.stage.innerHTML = `
      <section class="wizard-stage is-active">
        ${stageHeading(4, "PROBATIO REGIMENTI", "Проверка полкового формуляра", "Сверьте выбранные элементы и итоговый расход очков перед созданием полка.")}
        <div class="regiment-review-card">
          ${summaryRow("Название", state.name)}
          ${summaryRow("Родной мир", calc.selected.homeworld?.name, calc.selected.homeworld ? priceLabel(calc.selected.homeworld) : null)}
          ${summaryRow("Происхождение", calc.selected.origin?.name, calc.selected.origin ? priceLabel(calc.selected.origin) : null)}
          ${summaryRow("Командир", calc.selected.commander?.name, calc.selected.commander ? priceLabel(calc.selected.commander) : null)}
          ${summaryRow("Тип полка", calc.selected.regimentType?.name, calc.selected.regimentType ? priceLabel(calc.selected.regimentType) : null)}
          ${summaryRow("Доктрины подготовки", calc.selected.training.map((entry) => entry.name).join("; ") || "Не выбраны")}
          ${summaryRow("Доктрины снаряжения", calc.selected.equipmentDoctrines.map((entry) => entry.name).join("; ") || "Не выбраны")}
          ${summaryRow("Недостатки", calc.selected.drawbacks.map((entry) => `${entry.name} (${priceLabel(entry, "bonusPoints")})`).join("; ") || "Не выбраны")}
          ${summaryRow("Остаток полковых очков", String(calc.remaining))}
          ${summaryRow("Дополнительное снаряжение", calc.selected.extraEquipment.map((item) => `${item.entry.name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join("; ") || "Не выбрано")}
          ${summaryRow("Остаток очков снабжения", `${calc.equipmentRemaining} из ${calc.equipmentPool}`)}
        </div>
        ${unresolved.length ? `<div class="regiment-source-warning"><strong>В источнике отсутствует цена или бонус:</strong><p>${escapeHtml(unresolved.join("; "))}. Когитатор не назначает этим позициям стоимость самостоятельно.</p></div>` : ""}
        <div class="final-authorization">
          <span class="authorization-stamp" aria-hidden="true">ПРОВЕРКА</span>
          <div><strong>Формуляр готов к обработке</strong><p>После подтверждения откроется итоговое досье полка со всеми исходными эффектами.</p></div>
        </div>
      </section>
    `;
  }

  function renderStep() {
    if (!catalog || !refs.stage) return;
    const restoreFocus = U.focusSnapshot(refs.form);
    reconcileSupply();
    hideValidation();
    if (state.step === 0) renderFoundation();
    if (state.step === 1) renderCommand();
    if (state.step === 2) renderDoctrines();
    if (state.step === 3) renderSupply();
    if (state.step === 4) renderReview();

    const visualBudget = calculate();
    refs.stage
      .querySelector(".stage-heading")
      ?.insertAdjacentHTML(
        "afterend",
        `<div class="visual-budget-grid">${window.KadatUI.meter("Полковые очки", visualBudget.spent, 12 + visualBudget.drawbackBonus, "gold")}${window.KadatUI.meter("Снабжение", visualBudget.equipmentSpent, visualBudget.equipmentPool)}</div>`,
      );
    refs.progress.forEach((button, index) => {
      button.setAttribute(
        "aria-current",
        index === state.step ? "step" : "false",
      );
      button.classList.toggle("is-active", index === state.step);
      button.classList.toggle("is-complete", index < state.step);
    });
    refs.prev.disabled = state.step === 0;
    refs.next.hidden = state.step === STEP_COUNT - 1;
    refs.submit.hidden = state.step !== STEP_COUNT - 1;
    refs.status.textContent = `Этап ${state.step + 1} из ${STEP_COUNT}`;
    const calc = calculate();
    refs.points.textContent =
      state.step >= 3
        ? `ПО: ${calc.remaining} · ОС: ${calc.equipmentRemaining}`
        : `ПО: ${calc.remaining}`;
    const invalidBudget = calc.remaining < 0 || calc.equipmentRemaining < 0;
    refs.points.classList.toggle("is-error", invalidBudget);
    refs.next.disabled = state.step >= 3 && invalidBudget;
    refs.submit.disabled = state.step === STEP_COUNT - 1 && invalidBudget;
    const problems = Array.from({ length: STEP_COUNT }, (_, i) =>
      window.KADAT_REGIMENT_BUDGET.validateStep(snapshot(), calc, i),
    );
    U.progress(refs.progress, state.step, problems);
    refs.summary.innerHTML = `<div class="live-heading"><span class="card-eyebrow">MUNITORUM / СВОДКА</span></div><h2>${escapeHtml(state.name || "Новый полк")}</h2>${U.recordFacts(
      [
        ["Полковые очки", `${calc.remaining} осталось`],
        ["Снабжение", `${calc.equipmentRemaining} ОС`],
      ],
    )}${U.meter("Расход ПО", calc.spent, calc.spent + calc.remaining, "gold")}${doctrineSlots(calc)}${U.status(problems.some(Boolean) ? "Формуляр не завершён" : "Готово к формированию", problems.some(Boolean) ? "warning" : "valid")}${U.recordFacts(
      [
        ["Родной мир", calc.selected.homeworld?.name],
        ["Происхождение", calc.selected.origin?.name],
        ["Командир", calc.selected.commander?.name],
      ],
    )}`;
    refs.section.querySelector("#regiment-mobile-summary").innerHTML =
      `<span>ПО <strong>${calc.remaining}</strong></span><span>ОС <strong>${calc.equipmentRemaining}</strong></span><span>Доктрины <strong>${(calc.selected.regimentType ? 1 : 0) + calc.selected.training.length + calc.selected.equipmentDoctrines.length}/3</strong></span>`;
    restoreFocus();
  }

  function goToStep(nextStep) {
    const target = Math.max(0, Math.min(STEP_COUNT - 1, nextStep));
    if (target > state.step && !validateStep(state.step)) return;
    state.step = target;
    renderStep();
    U.focusStage(refs.stage);
  }

  function validateStep(step) {
    const error = window.KADAT_REGIMENT_BUDGET.validateStep(
      snapshot(),
      calculate(),
      step,
    );
    if (error) {
      showValidation(error);
      return false;
    }
    hideValidation();
    return true;
  }

  function validateAll() {
    for (let index = 0; index < STEP_COUNT; index += 1) {
      if (!validateStep(index)) {
        state.step = index;
        renderStep();
        validateStep(index);
        return false;
      }
    }
    return true;
  }

  function showValidation(message) {
    refs.validation.textContent = message;
    refs.validation.className = "message error";
    U.announce(message, "error", "DATA REJECTED");
    return false;
  }

  function hideValidation() {
    refs.validation?.classList.add("hidden");
    if (refs.validation) refs.validation.textContent = "";
  }

  function doctrineSlots(calc) {
    const slots = [
      calc.selected.regimentType,
      ...calc.selected.training,
      ...calc.selected.equipmentDoctrines,
    ];
    return `<div class="doctrine-slots" aria-label="Три ячейки доктрин">${Array.from({ length: 3 }, (_, i) => `<div class="doctrine-slot ${slots[i] ? "selected" : ""}"><small>${String(i + 1).padStart(2, "0")} ${slots[i] ? "✓" : "—"}</small><span>${escapeHtml(slots[i]?.name ?? (i === 0 ? "Тип полка" : "Свободная ячейка"))}</span></div>`).join("")}</div>`;
  }
  function recordMap(calc) {
    return `<div class="regiment-record-map">${[
      ["01 / РОДНОЙ МИР", calc.selected.homeworld],
      ["02 / ПРОИСХОЖДЕНИЕ", calc.selected.origin],
      ["03 / КОМАНДИР", calc.selected.commander],
      ["04 / СПЕЦИАЛИЗАЦИЯ", calc.selected.regimentType],
    ]
      .map(
        ([label, entry]) =>
          `<div><small>${label}</small><strong>${escapeHtml(entry?.name ?? "Не выбрано")}</strong></div>`,
      )
      .join("")}</div>`;
  }
  function detailSection(title, entries) {
    if (!entries.length) return "";
    return `
      <section class="regiment-result-section ${title === "Недостатки" ? "drawbacks" : ""}">
        <h3>${escapeHtml(title)}</h3>
        <div class="regiment-result-cards">
          ${entries
            .map(
              (entry) => `
            <article>
              <header><strong>${escapeHtml(entry.name)}</strong><span>${escapeHtml(priceLabel(entry))}</span></header>
              ${textBlocks(entry)}
            </article>
          `,
            )
            .join("")}
        </div>
      </section>
    `;
  }

  function renderResult() {
    const calc = calculate();
    const codeSeed = `${state.name}-${Date.now()}`
      .split("")
      .reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
    refs.code.textContent = `REG-${String(codeSeed % 1000000).padStart(6, "0")}`;
    refs.result.innerHTML = `
      ${U.recordHeader("REGIMENTAL DOSSIER", state.name, `${calc.selected.homeworld?.name} · ${calc.selected.regimentType?.name}`, "Проверка пройдена")}
      ${recordMap(calc)}${doctrineSlots(calc)}
      <div class="visual-budget-grid">${U.meter("Расход полковых очков", calc.spent, calc.spent + calc.remaining, "gold")}${U.meter("Расход снабжения", calc.equipmentSpent, calc.equipmentPool)}</div>
      <section class="regiment-result-identity">
        <p>НАИМЕНОВАНИЕ ПОЛКА</p>
        <h3>${escapeHtml(state.name)}</h3>
        <div class="regiment-result-ledger">
          ${summaryRow("Полковые очки", `${calc.remaining} осталось из ${12 + calc.drawbackBonus}`)}
          ${summaryRow("Очки снабжения", `${calc.equipmentRemaining} осталось из ${calc.equipmentPool}`)}
        </div>
      </section>
      ${detailSection("Происхождение", [calc.selected.homeworld, calc.selected.origin].filter(Boolean))}
      ${detailSection("Командование и специализация", [calc.selected.commander, calc.selected.regimentType].filter(Boolean))}
      ${detailSection("Доктрины подготовки", calc.selected.training)}
      ${detailSection("Доктрины специального снаряжения", calc.selected.equipmentDoctrines)}
      ${detailSection("Недостатки", calc.selected.drawbacks)}
      <section class="regiment-result-section">
        <h3>Дополнительное снаряжение</h3>
        ${calc.selected.extraEquipment.length ? `<ul class="equipment-list">${calc.selected.extraEquipment.map((item) => `<li>${escapeHtml(item.entry.name)}${item.quantity > 1 ? ` ×${item.quantity}` : ""} — ${escapeHtml(priceLabel(item.entry, "cost", "ОС"))}</li>`).join("")}</ul>` : `<p class="muted">Дополнительное снаряжение не выбрано.</p>`}
      </section>
    `;
    refs.form.classList.add("hidden");
    refs.progress[0].parentElement.classList.add("hidden");
    refs.resultView.classList.remove("hidden");
    refs.resultView.querySelector(".result-panel")?.focus();
    U.announce("Полковой формуляр сформирован", "valid", "DOSSIER COMPILED");
    refs.resultView.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function snapshot() {
    const value = {
      name: state.name,
      homeworldId: state.homeworldId,
      originId: state.originId,
      commanderId: state.commanderId,
      regimentTypeId: state.regimentTypeId,
      trainingIds: [...state.trainingIds],
      equipmentDoctrineIds: [...state.equipmentDoctrineIds],
      drawbackIds: [...state.drawbackIds],
      drawbackId: [...state.drawbackIds][0] ?? "",
      extraEquipment: [...state.extraEquipment].map(([id, quantity]) => ({
        id,
        quantity,
      })),
    };
    let hash = 2166136261;
    for (const c of JSON.stringify(value)) {
      hash ^= c.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return {
      ...value,
      id: `reg-${(hash >>> 0).toString(36)}`,
      updatedAt: new Date().toISOString(),
    };
  }
  function persistDraft() {
    window.KadatStorage.local.write(window.KadatStorage.KEYS.regimentDraft, {
      ...snapshot(),
      step: state.step,
      equipmentSearch: state.equipmentSearch,
    });
  }
  function restore(value) {
    if (!value) return;
    for (const field of [
      "name",
      "homeworldId",
      "originId",
      "commanderId",
      "regimentTypeId",
    ])
      state[field] = value[field] ?? "";
    state.trainingIds = new Set(value.trainingIds ?? []);
    state.equipmentDoctrineIds = new Set(value.equipmentDoctrineIds ?? []);
    state.drawbackIds = new Set(
      value.drawbackIds ?? (value.drawbackId ? [value.drawbackId] : []),
    );
    state.extraEquipment = new Map(
      (value.extraEquipment ?? []).map((v) => [v.id, v.quantity]),
    );
    state.step = Math.max(0, Math.min(4, value.step ?? 0));
    state.equipmentSearch = value.equipmentSearch ?? "";
    refs.resultView.classList.add("hidden");
    refs.form.classList.remove("hidden");
    refs.progress[0].parentElement.classList.remove("hidden");
    renderStep();
  }
  function saveRegiment() {
    reconcileSupply();
    if (
      !state.homeworldId ||
      !state.originId ||
      !state.commanderId ||
      !state.regimentTypeId
    )
      return null;
    const value = snapshot(),
      storage = window.KadatStorage.local,
      key = window.KadatStorage.KEYS.regiments;
    const saved = storage
      .read(
        key,
        [],
        (v) =>
          Array.isArray(v) && v.every(window.KadatStorage.validateRegiment),
      )
      .filter((r) => r.id !== value.id);
    saved.unshift(value);
    if (!storage.write(key, saved.slice(0, 20))) return null;
    window.dispatchEvent(
      new CustomEvent("kadat:regiments-changed", { detail: saved }),
    );
    return value;
  }
  catalog = window.KADAT_REGIMENT_DATA;
  buildShell();
  window.KadatModes.register("regiment", {
    title: "Создание полка",
    show(active) {
      refs.section.classList.toggle("hidden", !active);
    },
  });
  window.KadatFeatures ??= {};
  window.KadatFeatures.regiment = { snapshot, restore, validate: validateAll };
  const savedDraft = window.KadatStorage.local.read(
    window.KadatStorage.KEYS.regimentDraft,
    null,
    window.KadatStorage.validateRegiment,
  );
  if (savedDraft) restore(savedDraft);
  else renderStep();
})();
