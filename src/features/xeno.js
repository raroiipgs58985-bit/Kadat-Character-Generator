(() => {
  "use strict";

  if (typeof document === "undefined") return;

  const DATA = window.KADAT_XENO_DATA;
  const ENGINE = window.KADAT_XENO_ENGINE;
  if (!DATA || !ENGINE) return;

  const ROMANS = ["I", "II", "III", "IV", "V"];
  const state = {
    step: 0,
    type: "race",
    name: "",
    baseStats: null,
    baseWounds: null,
    formRoll: null,
    size: 0,
    archetypeRoll: null,
    featureRoll: null,
    seed: Math.floor(Math.random() * 0xffffffff),
    choices: {
      exoticStats: [],
      warlikeReward: "combat-talents",
      warlikeTalents: ["", ""],
      machineTrait: false,
      apexTalents: ["", ""],
      keenSense: "Зрение",
      extraLimbs: "legs",
      breathWeapon: "spike",
    },
    profile: null,
  };

  const refs = {};

  const U = window.KadatUI;
  const escapeHtml = U.escape;

  const roll100 = () => ENGINE.d100(Math.random);
  const currentForm = () =>
    state.formRoll == null ? null : DATA.findByRoll(DATA.forms, state.formRoll);
  const currentArchetype = () =>
    state.archetypeRoll == null
      ? null
      : DATA.findByRoll(
          state.type === "race" ? DATA.raceArchetypes : DATA.beastArchetypes,
          state.archetypeRoll,
        );
  const currentFeature = () =>
    state.featureRoll == null
      ? null
      : DATA.findByRoll(DATA.features, state.featureRoll);

  function buildShell() {
    const footer = document.querySelector(".page-footer");
    if (!footer || document.querySelector("#xeno-builder-view")) return;
    const section = document.createElement("section");
    section.id = "xeno-builder-view";
    section.className = "builder-view xeno-builder-view hidden";
    section.innerHTML = `
      <nav class="wizard-progress xeno-progress" aria-label="Этапы генерации ксеноса">
        ${[
          ["Тип", "Раса или зверь"],
          ["Параметры", "Характеристики"],
          ["Тело", "Форма и размер"],
          ["Природа", "Архетип"],
          ["Особенность", "к100 и формуляр"],
        ]
          .map(
            ([title, subtitle], index) => `
          <button type="button" class="wizard-step-button${index === 0 ? " is-active" : ""}" data-xeno-go="${index}">
            <span class="wizard-roman">${ROMANS[index]}</span>
            <span class="wizard-step-copy"><strong>${title}</strong><small>${subtitle}</small></span>
          </button>
        `,
          )
          .join("")}
      </nav>
      <form id="xeno-form" class="panel dossier-form xeno-form" novalidate>
        <div class="dossier-rail dossier-rail-left" aria-hidden="true"></div>
        <div class="dossier-rail dossier-rail-right" aria-hidden="true"></div>
        <div class="restricted-label">КСЕНОЛОГИЧЕСКИЙ АРХИВ // RESTRICTED ARCHIVE</div><div id="xeno-mobile-summary" class="mobile-record-strip"></div><div class="feature-layout"><div id="xeno-stage"></div><aside id="xeno-summary" class="live-summary feature-summary" aria-label="Текущий профиль ксеноса"></aside></div>
        <div id="xeno-validation" class="message hidden" role="alert"></div>
        <div class="wizard-controls xeno-controls">
          <button id="xeno-reset" type="button" class="secondary danger-quiet">Сбросить</button>
          <button id="xeno-prev" type="button" class="secondary">Назад</button>
          <div class="wizard-status"><span id="xeno-step-status">Этап 1 из 5</span><strong id="xeno-roll-status">к100: —</strong></div>
          <button id="xeno-next" type="button">Далее</button>
          <button id="xeno-submit" type="submit" class="authorization-button" hidden>Сформировать ксеноса</button>
        </div>
      </form>
      <section id="xeno-result-view" class="result-view hidden" aria-live="polite">
        <div class="result-toolbar">
          <button id="xeno-return" type="button" class="secondary">Вернуться к редактированию</button>
          <div class="result-document-code"><span>КСЕНО-ФОРМУЛЯР</span><strong id="xeno-code">XEN-000000</strong></div>
        </div>
        <section class="panel result-panel xeno-result-panel" tabindex="-1">
          <div id="xeno-result"></div>
        </section>
      </section>`;
    footer.insertAdjacentElement("beforebegin", section);

    refs.section = section;
    refs.form = section.querySelector("#xeno-form");
    refs.stage = section.querySelector("#xeno-stage");
    refs.summary = section.querySelector("#xeno-summary");
    refs.validation = section.querySelector("#xeno-validation");
    refs.prev = section.querySelector("#xeno-prev");
    refs.next = section.querySelector("#xeno-next");
    refs.submit = section.querySelector("#xeno-submit");
    refs.status = section.querySelector("#xeno-step-status");
    refs.rollStatus = section.querySelector("#xeno-roll-status");
    refs.resultView = section.querySelector("#xeno-result-view");
    refs.result = section.querySelector("#xeno-result");
    refs.progress = [...section.querySelectorAll("[data-xeno-go]")];

    for (const type of ["input", "change", "click"])
      refs.form.addEventListener(type, () => queueMicrotask(persistDraft));
    refs.progress.forEach((button) =>
      button.addEventListener("click", () =>
        goToStep(Number(button.dataset.xenoGo)),
      ),
    );
    refs.prev.addEventListener("click", () => goToStep(state.step - 1));
    refs.next.addEventListener("click", () => {
      if (validateStep(state.step)) goToStep(state.step + 1);
    });
    section.querySelector("#xeno-reset").addEventListener("click", resetState);
    section.querySelector("#xeno-return").addEventListener("click", () => {
      refs.resultView.classList.add("hidden");
      refs.form.classList.remove("hidden");
      refs.progress[0].parentElement.classList.remove("hidden");
      renderStep();
    });
    refs.form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validateAll()) return;
      state.profile = buildProfile();
      renderResult();
    });
  }

  function heading(index, kicker, title, description) {
    return `<header class="stage-heading"><div class="stage-index">${ROMANS[index]}</div><div><p class="stage-kicker">${kicker}</p><h2>${title}</h2><p>${description}</p></div></header>`;
  }

  function showValidation(message) {
    refs.validation.textContent = message;
    refs.validation.className = "message error";
    U.announce(message, "error", "DATA REJECTED");
    return false;
  }
  function hideValidation() {
    refs.validation.textContent = "";
    refs.validation.className = "message hidden";
  }

  function resetState() {
    state.step = 0;
    state.type = "race";
    state.name = "";
    state.baseStats = null;
    state.baseWounds = null;
    state.formRoll = null;
    state.size = 0;
    state.archetypeRoll = null;
    state.featureRoll = null;
    state.seed = Math.floor(Math.random() * 0xffffffff);
    state.profile = null;
    state.choices = {
      exoticStats: [],
      warlikeReward: "combat-talents",
      warlikeTalents: ["", ""],
      machineTrait: false,
      apexTalents: ["", ""],
      keenSense: "Зрение",
      extraLimbs: "legs",
      breathWeapon: "spike",
    };
    refs.resultView.classList.add("hidden");
    refs.form.classList.remove("hidden");
    refs.progress[0].parentElement.classList.remove("hidden");
    renderStep();
  }

  function renderType() {
    refs.stage.innerHTML = `<section class="wizard-stage is-active">
      ${heading(0, "CLASSIFICATIO XENOS", "Тип ксеноса", "Ксено-раса может быть сохранена как игровая раса персонажа. Ксено-зверь создаётся как отдельное существо.")}
      <div class="form-grid form-grid-two">
        <label>Название<input id="xeno-name" type="text" value="${escapeHtml(state.name)}" placeholder="Название расы или существа"></label>
        <label>Тип<select id="xeno-type"><option value="race"${state.type === "race" ? " selected" : ""}>Ксено-раса</option><option value="beast"${state.type === "beast" ? " selected" : ""}>Ксено-зверь</option></select></label>
      </div>
      <div class="xeno-info-card"><strong>${state.type === "race" ? "Ксено-раса" : "Ксено-зверь"}</strong><p>${state.type === "race" ? "Разумная самобытная раса со своей культурой, религией и наукой." : "Местный представитель фауны или флоры, не используемый как обычный персонаж."}</p></div>
    </section>`;
    refs.stage
      .querySelector("#xeno-name")
      .addEventListener("input", (event) => {
        state.name = event.target.value;
        updatePreview();
      });
    refs.stage
      .querySelector("#xeno-type")
      .addEventListener("change", (event) => {
        state.type = event.target.value;
        state.baseStats = null;
        state.baseWounds = null;
        state.archetypeRoll = null;
        state.profile = null;
        renderStep();
      });
  }

  function renderStats() {
    const stats = state.baseStats;
    refs.stage.innerHTML = `<section class="wizard-stage is-active">
      ${heading(1, "PARAMETRA XENOBIOLOGICA", "Характеристики", "Все базовые характеристики и раны определяются бросками, указанными в исходной таблице.")}
      <div class="generation-action xeno-roll-action"><button id="xeno-roll-stats" type="button">${stats ? "Перебросить характеристики" : "Бросить характеристики"}</button></div>
      ${stats ? `<div class="stats-grid">${DATA.stats.map((stat) => `<article class="stat-card"><div class="stat-name">${stat}</div><div class="stat-total">${stats[stat]}</div><span class="stat-fullname">${escapeHtml(U.statNames[stat])}</span>${U.segments(stats[stat], U.statScale(stats), U.statNames[stat])}<div class="stat-details">${state.type === "beast" && stat === "НС" ? "Отсутствует" : "Результат броска"}</div></article>`).join("")}</div><div class="xeno-wounds-card"><span>Раны</span><strong>${state.baseWounds}</strong></div>` : `<p class="empty-state">Выполните броски характеристик.</p>`}
    </section>`;
    refs.stage
      .querySelector("#xeno-roll-stats")
      .addEventListener("click", () => {
        const base = ENGINE.baseProfile(state.type, Math.random);
        state.baseStats = base.stats;
        state.baseWounds = base.wounds;
        state.seed = Math.floor(Math.random() * 0xffffffff);
        renderStep();
      });
  }

  function renderBody() {
    const form = currentForm();
    refs.stage.innerHTML = `<section class="wizard-stage is-active">
      ${heading(2, "FORMA ET MAGNITUDO", "Форма и размер", "Форма определяется броском к100. Размер выбирается отдельно по шкале от −3 до +6.")}
      <div class="xeno-roll-panel"><button id="xeno-roll-form" type="button">${form ? "Перебросить форму" : "Бросить к100 на форму"}</button>${form ? `<strong>${state.formRoll}: ${escapeHtml(form.name)}</strong><p>${escapeHtml(form.description)}</p>` : ""}</div>
      <label class="primary-field">Размер<select id="xeno-size">${DATA.sizes.map((size) => `<option value="${size.value}"${size.value === state.size ? " selected" : ""}>${escapeHtml(size.name)} — ${escapeHtml(size.example)}</option>`).join("")}</select></label>
      <div class="xeno-info-card"><strong>${escapeHtml(DATA.sizes.find((item) => item.value === state.size)?.description ?? "")}</strong></div>
    </section>`;
    refs.stage
      .querySelector("#xeno-roll-form")
      .addEventListener("click", () => {
        state.formRoll = roll100();
        state.seed = Math.floor(Math.random() * 0xffffffff);
        renderStep();
      });
    refs.stage
      .querySelector("#xeno-size")
      .addEventListener("change", (event) => {
        state.size = Number(event.target.value);
        state.seed = Math.floor(Math.random() * 0xffffffff);
        renderStep();
      });
  }

  function archetypeChoices(archetype) {
    if (!archetype) return "";
    if (archetype.id === "exotic")
      return `<div class="choice-grid"><label>Первая характеристика<select data-xeno-choice="exotic-0">${statOptions(state.choices.exoticStats[0])}</select></label><label>Вторая характеристика<select data-xeno-choice="exotic-1">${statOptions(state.choices.exoticStats[1])}</select></label></div>`;
    if (archetype.id === "warlike")
      return `<div class="choice-grid"><label>Воинственное преимущество<select data-xeno-choice="warlike-reward"><option value="combat-talents"${state.choices.warlikeReward === "combat-talents" ? " selected" : ""}>Два боевых таланта</option><option value="natural-weapon"${state.choices.warlikeReward === "natural-weapon" ? " selected" : ""}>Природное оружие</option></select></label>${state.choices.warlikeReward === "combat-talents" ? `<label>Боевой талант 1<input data-xeno-choice="warlike-talent-0" value="${escapeHtml(state.choices.warlikeTalents[0])}"></label><label>Боевой талант 2<input data-xeno-choice="warlike-talent-1" value="${escapeHtml(state.choices.warlikeTalents[1])}"></label>` : ""}</div>`;
    if (archetype.id === "mechanical")
      return `<label class="xeno-check"><input type="checkbox" data-xeno-choice="machine"${state.choices.machineTrait ? " checked" : ""}> Получить свойство Машина (1/2 бВН)</label>`;
    if (archetype.id === "apex")
      return `<div class="choice-grid"><label>Любой талант 1<input data-xeno-choice="apex-talent-0" value="${escapeHtml(state.choices.apexTalents[0])}"></label><label>Любой талант 2<input data-xeno-choice="apex-talent-1" value="${escapeHtml(state.choices.apexTalents[1])}"></label></div>`;
    return "";
  }

  function statOptions(selected) {
    return `<option value="">— Выберите —</option>${DATA.stats.map((stat) => `<option value="${stat}"${selected === stat ? " selected" : ""}>${stat}</option>`).join("")}`;
  }

  function bindArchetypeChoices() {
    refs.stage.querySelectorAll("[data-xeno-choice]").forEach((control) => {
      const save = () => {
        const id = control.dataset.xenoChoice;
        if (id === "exotic-0" || id === "exotic-1")
          state.choices.exoticStats[Number(id.at(-1))] = control.value;
        if (id === "warlike-reward")
          state.choices.warlikeReward = control.value;
        if (id.startsWith("warlike-talent-"))
          state.choices.warlikeTalents[Number(id.at(-1))] = control.value;
        if (id === "machine") state.choices.machineTrait = control.checked;
        if (id.startsWith("apex-talent-"))
          state.choices.apexTalents[Number(id.at(-1))] = control.value;
        if (id === "warlike-reward") renderStep();
        else updatePreview();
      };
      control.addEventListener("input", save);
      control.addEventListener("change", save);
    });
  }

  function renderArchetype() {
    const archetype = currentArchetype();
    refs.stage.innerHTML = `<section class="wizard-stage is-active">
      ${heading(3, "NATURA ET ORIGO", "Черты и модификаторы", "Бросок к100 определяет общий архетип. Полные эффекты применяются автоматически.")}
      <div class="xeno-roll-panel"><button id="xeno-roll-archetype" type="button">${archetype ? "Перебросить архетип" : "Бросить к100 на архетип"}</button>${archetype ? `<strong>${state.archetypeRoll}: ${escapeHtml(archetype.name)}</strong><p>${escapeHtml(archetype.description)}</p>` : ""}</div>
      ${archetypeChoices(archetype)}
    </section>`;
    refs.stage
      .querySelector("#xeno-roll-archetype")
      .addEventListener("click", () => {
        state.archetypeRoll = roll100();
        state.seed = Math.floor(Math.random() * 0xffffffff);
        renderStep();
      });
    bindArchetypeChoices();
  }

  function featureChoices(feature) {
    if (!feature) return "";
    if (feature.id === "keen-sense")
      return `<label class="primary-field">Обострённое чувство<select data-feature-choice="keen"><option>Зрение</option><option>Слух</option><option>Обоняние</option><option>Вкус</option><option>Осязание</option></select></label>`;
    if (feature.id === "extra-limbs")
      return `<label class="primary-field">Тип конечностей<select data-feature-choice="limbs"><option value="legs"${state.choices.extraLimbs === "legs" ? " selected" : ""}>Многоногое</option><option value="arms"${state.choices.extraLimbs === "arms" ? " selected" : ""}>Многорукое</option></select></label>`;
    if (feature.id === "breath-weapon")
      return `<label class="primary-field">Дыхательное оружие<select data-feature-choice="breath"><option value="spike">Выстрел шипом</option><option value="acid">Кислотное дыхание</option><option value="toxic">Токсичное дыхание</option><option value="fire">Огненное дыхание</option></select></label>`;
    return "";
  }

  function buildProfile() {
    return ENGINE.buildProfile({
      type: state.type,
      name:
        state.name.trim() ||
        (state.type === "race"
          ? "Безымянная ксено-раса"
          : "Безымянный ксено-зверь"),
      baseStats: state.baseStats,
      baseWounds: state.baseWounds,
      formRoll: state.formRoll,
      size: state.size,
      archetypeRoll: state.archetypeRoll,
      featureRoll: state.featureRoll,
      seed: state.seed,
      choices: state.choices,
    });
  }

  function renderFeature() {
    const feature = currentFeature();
    const canPreview =
      state.baseStats &&
      state.formRoll &&
      state.archetypeRoll &&
      state.featureRoll;
    const profile = canPreview ? buildProfile() : null;
    refs.stage.innerHTML = `<section class="wizard-stage is-active">
      ${heading(4, "SIGNUM DISTINCTIVUM", "Определение особенности", "Бросьте к100. Результат 63–64 соответствует особенности «Био-шоковое».")}
      <div class="xeno-roll-panel"><button id="xeno-roll-feature" type="button">${feature ? "Перебросить особенность" : "Бросить к100 на особенность"}</button>${feature ? `<strong>${state.featureRoll}: ${escapeHtml(feature.name)}</strong><p>${escapeHtml(feature.description)}</p>` : ""}</div>
      ${featureChoices(feature)}
      ${profile ? profilePreview(profile) : ""}
    </section>`;
    refs.stage
      .querySelector("#xeno-roll-feature")
      .addEventListener("click", () => {
        state.featureRoll = roll100();
        state.seed = Math.floor(Math.random() * 0xffffffff);
        renderStep();
      });
    const keen = refs.stage.querySelector('[data-feature-choice="keen"]');
    if (keen) {
      keen.value = state.choices.keenSense;
      keen.addEventListener("change", () => {
        state.choices.keenSense = keen.value;
        renderStep();
      });
    }
    const limbs = refs.stage.querySelector('[data-feature-choice="limbs"]');
    if (limbs)
      limbs.addEventListener("change", () => {
        state.choices.extraLimbs = limbs.value;
        renderStep();
      });
    const breath = refs.stage.querySelector('[data-feature-choice="breath"]');
    if (breath) {
      breath.value = state.choices.breathWeapon;
      breath.addEventListener("change", () => {
        state.choices.breathWeapon = breath.value;
        renderStep();
      });
    }
  }

  function profilePreview(profile) {
    return `<div class="xeno-review-card"><h3>Предварительный формуляр</h3><div class="xeno-review-grid">
      <span>Тип<strong>${profile.type === "race" ? "Ксено-раса" : "Ксено-зверь"}</strong></span><span>Форма<strong>${escapeHtml(profile.form?.name ?? "—")}</strong></span>
      <span>Размер<strong>${profile.size >= 0 ? "+" : ""}${profile.size}</strong></span><span>Архетип<strong>${escapeHtml(profile.archetype?.name ?? "—")}</strong></span>
      <span>Особенность<strong>${escapeHtml(profile.feature?.name ?? "—")}</strong></span><span>Раны<strong>${profile.wounds}</strong></span></div>
      <div class="tags">${profile.traits.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div></div>`;
  }

  function validateStep(step) {
    hideValidation();
    const error = ENGINE.validateStep(state, DATA, step);
    return error ? showValidation(error) : true;
  }

  function validateAll() {
    for (let step = 0; step < 5; step += 1)
      if (!validateStep(step)) {
        state.step = step;
        renderStep();
        validateStep(step);
        return false;
      }
    return true;
  }

  function goToStep(step) {
    const target = Math.max(0, Math.min(4, step));
    if (target > state.step && !validateStep(state.step)) return;
    state.step = target;
    renderStep();
    U.focusStage(refs.stage);
  }

  function rollRegister() {
    return `<div class="roll-register" aria-label="Результаты бросков к100">${[
      ["Форма", state.formRoll, currentForm()],
      ["Архетип", state.archetypeRoll, currentArchetype()],
      ["Особенность", state.featureRoll, currentFeature()],
    ]
      .map(
        ([label, roll, entry]) =>
          `<div><small>${label} / к100</small><strong>${roll ?? "—"}</strong><span>${escapeHtml(entry?.name ?? "Бросок не выполнен")}</span></div>`,
      )
      .join("")}</div>`;
  }
  function updatePreview() {
    const complete =
      state.baseStats &&
      state.formRoll &&
      state.archetypeRoll &&
      state.featureRoll;
    const profile = complete ? buildProfile() : null;
    const preview = profile ? profile.stats : state.baseStats;
    const errors = Array.from({ length: 5 }, (_, i) =>
      ENGINE.validateStep(state, DATA, i),
    ).filter(Boolean);
    refs.summary.innerHTML = `<div class="live-heading"><span class="card-eyebrow">XENOS / ЗАПИСЬ</span></div><h2>${escapeHtml(state.name || "Новый ксено-формуляр")}</h2>${U.recordFacts(
      [
        ["Тип", state.type === "race" ? "Ксено-раса" : "Ксено-зверь"],
        ["Размер", U.signed(state.size)],
        ["Раны", profile?.wounds ?? state.baseWounds ?? "Не определены"],
      ],
    )}${U.status(errors.length ? "Есть незавершённые этапы" : "Готово к формированию", errors.length ? "warning" : "valid")}${rollRegister()}${preview ? `<p class="small-note">${profile ? "Итоговый профиль с модификаторами" : "Базовые броски; модификаторы ещё не включены"}</p>${U.statBars(preview)}` : '<p class="empty-state">Выполните броски характеристик.</p>'}`;
    refs.section.querySelector("#xeno-mobile-summary").innerHTML =
      `<span>${state.type === "race" ? "Ксено-раса" : "Ксено-зверь"}</span><span>Размер <strong>${U.signed(state.size)}</strong></span><span>Раны <strong>${profile?.wounds ?? state.baseWounds ?? "—"}</strong></span>`;
    const review = refs.stage.querySelector(".xeno-review-card");
    if (review && profile) review.outerHTML = profilePreview(profile);
  }

  function renderStep() {
    if (!refs.stage) return;
    const restoreFocus = U.focusSnapshot(refs.form);
    hideValidation();
    if (state.step === 0) renderType();
    if (state.step === 1) renderStats();
    if (state.step === 2) renderBody();
    if (state.step === 3) renderArchetype();
    if (state.step === 4) renderFeature();
    updatePreview();
    refs.progress.forEach((button, index) => {
      button.setAttribute(
        "aria-current",
        index === state.step ? "step" : "false",
      );
      button.classList.toggle("is-active", index === state.step);
      button.classList.toggle("is-complete", index < state.step);
    });
    refs.prev.disabled = state.step === 0;
    refs.next.hidden = state.step === 4;
    refs.submit.hidden = state.step !== 4;
    refs.status.textContent = `Этап ${state.step + 1} из 5`;
    refs.rollStatus.textContent =
      state.step === 2
        ? `к100: ${state.formRoll ?? "—"}`
        : state.step === 3
          ? `к100: ${state.archetypeRoll ?? "—"}`
          : state.step === 4
            ? `к100: ${state.featureRoll ?? "—"}`
            : "к100: —";
    U.progress(
      refs.progress,
      state.step,
      Array.from({ length: 5 }, (_, i) => ENGINE.validateStep(state, DATA, i)),
    );
    restoreFocus();
  }

  function renderResult() {
    const profile = state.profile;
    refs.form.classList.add("hidden");
    refs.progress[0].parentElement.classList.add("hidden");
    refs.resultView.classList.remove("hidden");
    refs.resultView.querySelector("#xeno-code").textContent =
      `XEN-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
    refs.result.innerHTML = `<div class="character-card">${U.recordHeader("XENOS DOSSIER", profile.name, `${profile.type === "race" ? "Ксено-раса" : "Ксено-зверь"} · ${profile.form?.name ?? "—"} · ${profile.archetype?.name ?? "—"}`, "Проверка пройдена")}${rollRegister()}
      <div class="summary-grid"><div class="summary-item"><span class="summary-label">Раны</span><span class="summary-value">${profile.wounds}</span></div><div class="summary-item"><span class="summary-label">Размер</span><span class="summary-value">${profile.size >= 0 ? "+" : ""}${profile.size}</span></div><div class="summary-item"><span class="summary-label">Особенность</span><span class="summary-value">${escapeHtml(profile.feature?.name ?? "—")}</span></div></div>
      ${U.radar(profile.stats)}${U.statBars(profile.stats)}<div><h3>Характеристики</h3><table class="result-table"><thead><tr><th>Хар.</th><th>База</th><th>Изменение</th><th>Итог</th><th>Бонус</th></tr></thead><tbody>${DATA.stats.map((stat) => `<tr><th>${stat}</th><td>${state.baseStats[stat]}</td><td>${U.signed(profile.stats[stat] - state.baseStats[stat])}</td><td>${profile.stats[stat]}</td><td>${Math.floor(profile.stats[stat] / 10)}</td></tr>`).join("")}</tbody></table></div>
      <div><h3>Навыки</h3><div class="tags">${profile.skills.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("") || `<span class="muted">Нет</span>`}</div></div>
      <div><h3>Таланты</h3><div class="tags">${profile.talents.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("") || `<span class="muted">Нет</span>`}</div></div>
      <div><h3>Особенности</h3><div class="tags">${profile.traits.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("") || `<span class="muted">Нет</span>`}</div></div>
      ${profile.specialRules.length ? `<div><h3>Особые правила</h3>${profile.specialRules.map((rule) => `<article class="rule-card"><h4>${escapeHtml(rule.name)}</h4><p>${escapeHtml(rule.text)}</p></article>`).join("")}</div>` : ""}
      ${profile.psychicPowers.length ? `<div><h3>Пси-силы</h3><ul>${profile.psychicPowers.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
      ${profile.implants.length ? `<div><h3>Импланты</h3><ul>${profile.implants.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
      ${profile.type === "race" ? `<div class="xeno-character-actions"><button id="save-xeno-race" type="button">Сохранить как игровую расу</button><button id="create-xeno-character" type="button" class="secondary">Создать персонажа этой расы</button><p>Доступны человеческие специальности, кроме Адепта Сороритас, Квесторис и Астартес.</p></div>` : `<div class="message">Ксено-зверь сохраняется только как отдельное существо и не используется в мастере персонажа.</div>`}
    </div>`;

    if (profile.type === "race") {
      const save = () => {
        const race = ENGINE.toCharacterRace(profile);
        if (!DATA.saveRace(race)) return null;
        window.dispatchEvent(
          new CustomEvent("kadat:xeno-race-saved", { detail: race }),
        );
        return race;
      };
      refs.result
        .querySelector("#save-xeno-race")
        .addEventListener("click", (event) => {
          if (save()) {
            event.currentTarget.textContent = "Раса сохранена";
            U.announce(
              "Раса добавлена в каталог персонажа",
              "valid",
              "RECORD STORED",
            );
          }
        });
      refs.result
        .querySelector("#create-xeno-character")
        .addEventListener("click", () => {
          if (!save()) return;
          document.querySelector('[data-registry-mode="character"]')?.click();
        });
    }
    refs.resultView
      .querySelector(".result-panel")
      ?.focus({ preventScroll: true });
    refs.resultView.scrollIntoView({ behavior: "instant", block: "start" });
    U.announce("Ксено-формуляр сформирован", "valid", "DOSSIER COMPILED");
  }

  function snapshot() {
    return JSON.parse(JSON.stringify({ ...state, profile: null }));
  }
  function persistDraft() {
    window.KadatStorage.local.write(
      window.KadatStorage.KEYS.xenoDraft,
      snapshot(),
    );
  }
  function restore(value) {
    Object.assign(state, value, { profile: null });
    state.step = Math.max(0, Math.min(4, state.step ?? 0));
    refs.resultView.classList.add("hidden");
    refs.form.classList.remove("hidden");
    refs.progress[0].parentElement.classList.remove("hidden");
    renderStep();
    window.KadatModes.restored("xeno");
  }
  buildShell();
  window.KadatModes.register("xeno", {
    title: "Создание ксеноса",
    show(active) {
      refs.section.classList.toggle("hidden", !active);
    },
  });
  window.KadatFeatures ??= {};
  window.KadatFeatures.xeno = { snapshot, restore, validate: validateAll };
  const savedDraft = window.KadatStorage.local.read(
    window.KadatStorage.KEYS.xenoDraft,
    null,
    (v) => window.KadatSchemas.validateXenoDraft(v, DATA.stats),
  );
  if (savedDraft) restore(savedDraft);
  else renderStep();
})();
