(() => {
  "use strict";
  if (typeof document === "undefined") return;
  const DATA = window.KADAT_POWER_ARMOR_DATA;
  const ENGINE = window.KADAT_POWER_ARMOR_ENGINE;
  if (!DATA || !ENGINE) return;

  const ROMANS = ["I", "II", "III", "IV", "V"];
  const state = {
    step: 0,
    name: "",
    classId: "exoskeleton",
    groundSpeed: 5,
    alternateMovementType: "none",
    alternateSpeed: 5,
    leftManipulatorId: "glove",
    rightManipulatorId: "glove",
    armorId: "standard",
    armLayoutId: "one-heavy-one-light",
    bodyLayoutId: "two-heavy-two-light",
    design: null,
  };
  const refs = {};

  const U = window.KadatUI;
  const esc = U.escape;
  const currentClass = () => DATA.byId(DATA.classes, state.classId);
  const option = (items, selected) =>
    items
      .map(
        (item) =>
          `<option value="${esc(item.id)}"${item.id === selected ? " selected" : ""}>${esc(item.name)}</option>`,
      )
      .join("");
  const speedOptions = (max) =>
    Array.from(
      { length: Math.max(1, Math.floor(max / 5)) },
      (_, i) => (i + 1) * 5,
    )
      .map((v) => `<option value="${v}">${v} м</option>`)
      .join("");

  function buildShell() {
    const footer = document.querySelector(".page-footer");
    if (!footer || document.querySelector("#power-armor-builder-view")) return;
    const section = document.createElement("section");
    section.id = "power-armor-builder-view";
    section.className = "builder-view power-armor-builder-view hidden";
    section.innerHTML = `
      <nav class="wizard-progress" aria-label="Этапы создания серво-брони">
        ${[
          ["Шасси", "Класс и масса"],
          ["Движение", "Скорость и системы"],
          ["Манипуляторы", "Руки и крепления"],
          ["Броня", "Защита и прочность"],
          ["Компоновка", "Вооружение и формуляр"],
        ]
          .map(
            ([a, b], i) =>
              `<button type="button" class="wizard-step-button${i === 0 ? " is-active" : ""}" data-pa-go="${i}"><span class="wizard-roman">${ROMANS[i]}</span><span class="wizard-step-copy"><strong>${a}</strong><small>${b}</small></span></button>`,
          )
          .join("")}
      </nav>
      <form id="power-armor-form" class="panel dossier-form" novalidate>
        <div class="dossier-rail dossier-rail-left" aria-hidden="true"></div><div class="dossier-rail dossier-rail-right" aria-hidden="true"></div>
        <div id="armor-mobile-summary" class="mobile-record-strip"></div><div class="feature-layout armor-workspace"><div id="power-armor-stage"></div><aside id="armor-summary" class="feature-summary" aria-label="Текущая конфигурация брони"></aside></div><div id="power-armor-validation" class="message hidden" role="alert"></div>
        <div class="wizard-controls"><button id="pa-reset" type="button" class="secondary danger-quiet">Сбросить</button><button id="pa-prev" type="button" class="secondary">Назад</button><div class="wizard-status"><span id="pa-status">Этап 1 из 5</span><strong id="pa-mass">Масса: —</strong></div><button id="pa-next" type="button">Далее</button><button id="pa-submit" type="submit" class="authorization-button" hidden>Сформировать броню</button></div>
      </form>
      <section id="power-armor-result-view" class="result-view hidden" aria-live="polite"><div class="result-toolbar"><button id="pa-return" type="button" class="secondary">Вернуться к редактированию</button><div class="result-document-code"><span>ТЕХНИЧЕСКИЙ ФОРМУЛЯР</span><strong id="pa-code">ARM-000000</strong></div></div><section class="panel result-panel" tabindex="-1"><div id="pa-result"></div></section></section>`;
    footer.insertAdjacentElement("beforebegin", section);
    refs.section = section;
    refs.form = section.querySelector("#power-armor-form");
    refs.stage = section.querySelector("#power-armor-stage");
    refs.summary = section.querySelector("#armor-summary");
    refs.validation = section.querySelector("#power-armor-validation");
    refs.prev = section.querySelector("#pa-prev");
    refs.next = section.querySelector("#pa-next");
    refs.submit = section.querySelector("#pa-submit");
    refs.status = section.querySelector("#pa-status");
    refs.mass = section.querySelector("#pa-mass");
    refs.resultView = section.querySelector("#power-armor-result-view");
    refs.result = section.querySelector("#pa-result");
    refs.progress = [...section.querySelectorAll("[data-pa-go]")];
    for (const type of ["input", "change", "click"])
      refs.form.addEventListener(type, () => queueMicrotask(persistDraft));
    refs.progress.forEach((b) =>
      b.addEventListener("click", () => go(Number(b.dataset.paGo))),
    );
    refs.prev.addEventListener("click", () => go(state.step - 1));
    refs.next.addEventListener("click", () => {
      if (validateStep(state.step)) go(state.step + 1);
    });
    section.querySelector("#pa-reset").addEventListener("click", reset);
    section.querySelector("#pa-return").addEventListener("click", () => {
      refs.resultView.classList.add("hidden");
      refs.form.classList.remove("hidden");
      refs.progress[0].parentElement.classList.remove("hidden");
      render();
    });
    refs.form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateAll()) return;
      state.design = ENGINE.buildDesign(state, DATA);
      DATA.save(state.design);
      renderResult();
    });
  }

  function heading(i, k, t, d) {
    return `<header class="stage-heading"><div class="stage-index">${ROMANS[i]}</div><div><p class="stage-kicker">${k}</p><h2>${t}</h2><p>${d}</p></div></header>`;
  }
  function metrics(design) {
    return `<div class="power-armor-metrics"><div><span>Учтённая масса</span><strong>${design.knownMass} кг</strong></div><div><span>Предел класса</span><strong>${design.armorClass.massMax} кг</strong></div><div><span>Прочность</span><strong>${design.integrity}</strong></div><div><span>Броня</span><strong>${design.armorPoints}</strong></div></div>`;
  }

  function renderClass() {
    const c = currentClass();
    return `${heading(0, "STRUCTURA PRIMA", "Шасси и весовая категория", "Выберите класс. Класс задаёт диапазон полной массы, массу шасси, структурную целостность и слоты.")}<div class="armor-grid"><label>Название конструкции<input id="pa-name" value="${esc(state.name)}" placeholder="Наименование серво-брони"></label><label>Класс<select id="pa-class">${option(DATA.classes, state.classId)}</select></label></div><div class="power-armor-summary"><h3>${esc(c.name)}</h3><p>Полная масса класса: ${c.massMin}–${c.massMax} кг. Масса шасси: ${c.chassisMass} кг. Базовая структурная целостность: ${c.integrity}.</p><p>Слоты: ${c.armSlots} на каждую руку, ${c.bodySlots} на корпус. Предел структурного усиления: ${c.reinforcementLimit}.</p></div>`;
  }
  function renderMovement() {
    const c = currentClass();
    const alt =
      state.alternateMovementType === "none"
        ? null
        : c[state.alternateMovementType];
    return `${heading(1, "MOTUS SYSTEMATA", "Передвижение", "Наземная система обязательна. Дополнительно можно установить только одну неназемную систему.")}<div class="armor-grid"><label>Наземная скорость<select id="pa-ground">${speedOptions(c.ground.maxSpeed)}</select></label><label>Неназемная система<select id="pa-alt"><option value="none">Нет</option><option value="jump"${state.alternateMovementType === "jump" ? " selected" : ""}>Прыжок</option>${c.flight ? `<option value="flight"${state.alternateMovementType === "flight" ? " selected" : ""}>АВВП / полноценный полёт</option>` : ""}<option value="underwater"${state.alternateMovementType === "underwater" ? " selected" : ""}>Подводное передвижение</option></select></label>${alt ? `<label>Скорость дополнительной системы<select id="pa-alt-speed">${speedOptions(alt.maxSpeed)}</select></label>` : ""}</div><div class="power-armor-note">Масса каждой двигательной системы начисляется за каждые 5 м базовой скорости строго по таблице.</div>`;
  }
  function manipCard(m) {
    return `<article class="power-armor-card"><h3>${esc(m.name)}</h3><p>${esc(m.description)}</p><p>${esc(m.properties)}</p><strong>${m.mass >= 0 ? "+" : ""}${m.mass} кг за руку</strong></article>`;
  }
  function renderManipulators() {
    const l = DATA.byId(DATA.manipulators, state.leftManipulatorId),
      r = DATA.byId(DATA.manipulators, state.rightManipulatorId);
    return `${heading(2, "MANIPULATORA", "Манипуляторы", "Можно установить до двух манипуляторов — по одному на каждую руку. Их масса считается отдельно.")}<div class="armor-grid"><label>Левая рука<select id="pa-left">${option(DATA.manipulators, state.leftManipulatorId)}</select></label><label>Правая рука<select id="pa-right">${option(DATA.manipulators, state.rightManipulatorId)}</select></label>${manipCard(l)}${manipCard(r)}</div>`;
  }
  function renderArmor() {
    const a = DATA.byId(DATA.armor, state.armorId),
      c = currentClass();
    return `${heading(3, "ARMATURA ET FIRMITAS", "Броня и прочность", "Выберите один тип брони/структурного улучшения. Значения берутся напрямую из таблицы.")}<label class="primary-field">Тип брони<select id="pa-armor">${option(DATA.armor, state.armorId)}</select></label><div class="power-armor-summary"><h3>${esc(a.name)}</h3><p>Модификатор прочности: ×${a.integrityModifier}. Очки брони: ${a.armor}. Масса: ${a.mass} кг. Занимаемые слоты крепления: ${a.mountSlots}.</p><p>Предел структурного усиления для класса: ${c.reinforcementLimit}. Отдельный числовой эффект одного уровня усиления в таблице не указан, поэтому когитатор его не придумывает.</p></div>`;
  }
  function renderLayout() {
    const d = ENGINE.buildDesign(state, DATA);
    return `${heading(4, "ARMAMENTUM", "Компоновка вооружения", "Выберите допустимую схему размещения вооружения. Конкретные модели оружия в исходной таблице не перечислены.")}${metrics(d)}<div class="armor-grid"><label>Вооружение рук<select id="pa-arm-layout">${option(DATA.weaponLayouts.arms, state.armLayoutId)}</select></label><label>Вооружение корпуса<select id="pa-body-layout">${option(DATA.weaponLayouts.body, state.bodyLayoutId)}</select></label></div><div class="power-armor-summary"><h3>Свободные слоты после манипуляторов</h3><p>Левая рука: ${d.weaponSlots.leftFree}/${d.weaponSlots.leftTotal}. Правая рука: ${d.weaponSlots.rightFree}/${d.weaponSlots.rightTotal}. Корпус: ${d.weaponSlots.bodyFree}/${d.weaponSlots.bodyTotal}.</p><p class="power-armor-note">${esc(d.sourceNote)}</p></div>`;
  }
  function render() {
    const restoreFocus = U.focusSnapshot(refs.form);
    const renderers = [
      renderClass,
      renderMovement,
      renderManipulators,
      renderArmor,
      renderLayout,
    ];
    refs.stage.innerHTML = renderers[state.step]();
    refs.progress.forEach((b, i) => {
      b.classList.toggle("is-active", i === state.step);
      b.setAttribute("aria-current", i === state.step ? "step" : "false");
    });
    refs.status.textContent = `Этап ${state.step + 1} из 5`;
    refs.prev.disabled = state.step === 0;
    refs.next.hidden = state.step === 4;
    refs.submit.hidden = state.step !== 4;
    hideError();
    bind();
    updateMass();
    U.progress(refs.progress, state.step);
    restoreFocus();
  }
  function bind() {
    refs.stage.querySelector("#pa-name")?.addEventListener("input", (e) => {
      state.name = e.target.value;
    });
    refs.stage.querySelector("#pa-class")?.addEventListener("change", (e) => {
      state.classId = e.target.value;
      state.groundSpeed = 5;
      state.alternateMovementType = "none";
      state.alternateSpeed = 5;
      render();
    });
    const g = refs.stage.querySelector("#pa-ground");
    if (g) {
      g.value = String(state.groundSpeed);
      g.addEventListener("change", (e) => {
        state.groundSpeed = Number(e.target.value);
        updateMass();
      });
    }
    refs.stage.querySelector("#pa-alt")?.addEventListener("change", (e) => {
      state.alternateMovementType = e.target.value;
      state.alternateSpeed = 5;
      render();
    });
    const as = refs.stage.querySelector("#pa-alt-speed");
    if (as) {
      as.value = String(state.alternateSpeed);
      as.addEventListener("change", (e) => {
        state.alternateSpeed = Number(e.target.value);
        updateMass();
      });
    }
    refs.stage.querySelector("#pa-left")?.addEventListener("change", (e) => {
      state.leftManipulatorId = e.target.value;
      render();
    });
    refs.stage.querySelector("#pa-right")?.addEventListener("change", (e) => {
      state.rightManipulatorId = e.target.value;
      render();
    });
    refs.stage.querySelector("#pa-armor")?.addEventListener("change", (e) => {
      state.armorId = e.target.value;
      render();
    });
    refs.stage
      .querySelector("#pa-arm-layout")
      ?.addEventListener("change", (e) => {
        state.armLayoutId = e.target.value;
        updateMass();
      });
    refs.stage
      .querySelector("#pa-body-layout")
      ?.addEventListener("change", (e) => {
        state.bodyLayoutId = e.target.value;
        updateMass();
      });
  }
  function armorVisual(design) {
    const slots = (label, free, total) =>
      `<div class="slot-group"><span>${label}</span><div class="slots" role="img" aria-label="${label}: свободно ${free} из ${total}">${Array.from({ length: total }, (_, i) => `<i class="${i < free ? "free" : "used"}"></i>`).join("")}</div><strong>${free}/${total}</strong></div>`;
    const parts = [
      ["Шасси", design.armorClass.chassisMass],
      ["Наземная система", design.movement.groundMass],
      ["Дополнительная система", design.movement.alternateMass],
      ["Манипуляторы", design.manipulators.mass],
      ["Броня", design.armor.mass],
    ];
    const systems = [
      ["01 / ШАССИ", design.armorClass.name],
      [
        "02 / ПРИВОД",
        `${design.movement.groundSpeed} м · ${design.movement.alternateSystem ? movementName(design.movement.alternateType) : "Наземный"}`,
      ],
      ["03 / ЛЕВАЯ РУКА", design.manipulators.left.name],
      ["04 / ПРАВАЯ РУКА", design.manipulators.right.name],
      ["05 / БРОНЯ", design.armor.name],
      [
        "06 / ВООРУЖЕНИЕ",
        `${design.armLayout?.name ?? "—"} / ${design.bodyLayout?.name ?? "—"}`,
      ],
    ];
    return `<section class="technical-board"><div class="instrument-heading"><span>КОНФИГУРАЦИЯ УЗЛОВ</span><small>ARM / К100</small></div><div class="armor-visual"><div class="armor-diagram"><svg viewBox="0 0 240 280" role="img" aria-label="Схема компонентов брони; индексы соответствуют перечню узлов"><title>Шасси, привод, манипуляторы и броня</title><line x1="120" y1="8" x2="120" y2="266" stroke-dasharray="3 4"/><line x1="15" y1="145" x2="225" y2="145" stroke-dasharray="3 4"/><path d="M103 18h34l7 31-12 10h-24L96 49Z M90 67l-15 48 12 40 11-30 6 34h32l6-34 11 30 12-40-15-48-19 6h-23Z M104 166h14v70H96Z M122 166h14l8 70h-22Z"/><rect x="56" y="93" width="15" height="63" rx="2"/><rect x="169" y="93" width="15" height="63" rx="2"/><line x1="33" y1="103" x2="56" y2="103"/><line x1="184" y1="103" x2="207" y2="103"/><line x1="124" y1="78" x2="194" y2="45"/><line x1="134" y1="143" x2="201" y2="176"/><line x1="107" y1="211" x2="39" y2="234"/><text x="16" y="105">03</text><text x="209" y="105">04</text><text x="198" y="46">01</text><text x="203" y="181">05</text><text x="20" y="240">02</text><text x="120" y="268" text-anchor="middle" class="diagram-index">СХЕМА КОМПОНЕНТОВ</text></svg><span>Броня <strong>${design.armorPoints}</strong> · прочность <strong>${design.integrity}</strong></span></div><div>${U.meter("Учтённая масса, кг", design.knownMass, design.armorClass.massMax, design.remainingMass < 0 ? "red" : "gold")}<dl class="mass-breakdown">${parts.map(([label, v]) => `<div class="mass-row" style="--mass-share:${Math.min(100, (Math.abs(v) / design.armorClass.massMax) * 100)}%"><dt>${label}</dt><dd>${U.number(v)} кг</dd></div>`).join("")}</dl><p class="small-note">Запас массы: <strong>${U.number(design.remainingMass)} кг</strong>. Линии — доля от предела класса.</p>${slots("Левая рука", design.weaponSlots.leftFree, design.weaponSlots.leftTotal)}${slots("Правая рука", design.weaponSlots.rightFree, design.weaponSlots.rightTotal)}${slots("Корпус", design.weaponSlots.bodyFree, design.weaponSlots.bodyTotal)}<p class="slot-legend">Контур — свободно · заливка — занято.<br>Число справа — свободно / всего.</p></div></div><div class="component-register">${systems.map(([code, name]) => `<div><small>${code}</small><strong>${esc(name)}</strong></div>`).join("")}</div><p class="small-note">Слоты учтены после установки манипуляторов. Масса оружия и расход слотов выбранной схемой вооружения не определены в исходной таблице.</p></section>`;
  }
  function movementName(type) {
    return (
      {
        jump: "Прыжок",
        flight: "АВВП / полёт",
        underwater: "Подводное передвижение",
      }[type] ?? type
    );
  }
  function updateMass() {
    try {
      const d = ENGINE.buildDesign(state, DATA);
      refs.mass.textContent = `Масса: ${d.knownMass}/${d.armorClass.massMax} кг`;
      refs.mass.classList.toggle("negative", d.remainingMass < 0);
      const errors = ENGINE.validate(state, DATA);
      refs.summary.innerHTML = `${U.status(errors.length ? "Конфигурация требует проверки" : "Конфигурация допустима", errors.length ? "warning" : "valid")}${armorVisual(d)}${errors.length ? `<ul class="configuration-errors">${errors.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}`;
      refs.section.querySelector("#armor-mobile-summary").innerHTML =
        `<span>Масса <strong>${U.number(d.knownMass)} / ${U.number(d.armorClass.massMax)} кг</strong></span><span>Броня <strong>${d.armorPoints}</strong></span><span>Прочность <strong>${d.integrity}</strong></span>`;
    } catch {
      refs.mass.textContent = "Масса: —";
    }
  }
  function showError(text) {
    refs.validation.textContent = text;
    refs.validation.className = "message error";
    U.announce(text, "error", "DATA REJECTED");
  }
  function hideError() {
    refs.validation.textContent = "";
    refs.validation.classList.add("hidden");
  }
  function validateStep(step) {
    if (step === 0 && !state.classId) {
      showError("Выберите класс экзо-брони.");
      return false;
    }
    if (step === 1) {
      const e = ENGINE.validate(state, DATA);
      if (e.length) {
        showError(e[0]);
        return false;
      }
    }
    return true;
  }
  function validateAll() {
    const e = ENGINE.validate(state, DATA);
    if (e.length) {
      showError(e.join(" "));
      return false;
    }
    return true;
  }
  function go(i) {
    if (i < 0 || i > 4) return;
    state.step = i;
    render();
    U.focusStage(refs.stage);
  }
  function reset() {
    Object.assign(state, {
      step: 0,
      name: "",
      classId: "exoskeleton",
      groundSpeed: 5,
      alternateMovementType: "none",
      alternateSpeed: 5,
      leftManipulatorId: "glove",
      rightManipulatorId: "glove",
      armorId: "standard",
      armLayoutId: "one-heavy-one-light",
      bodyLayoutId: "two-heavy-two-light",
      design: null,
    });
    refs.resultView.classList.add("hidden");
    refs.form.classList.remove("hidden");
    refs.progress[0].parentElement.classList.remove("hidden");
    render();
  }
  function renderResult() {
    const d = state.design;
    refs.form.classList.add("hidden");
    refs.progress[0].parentElement.classList.add("hidden");
    refs.resultView.classList.remove("hidden");
    refs.section.querySelector("#pa-code").textContent =
      `ARM-${String(Date.now()).slice(-6)}`;
    refs.result.innerHTML = `${U.recordHeader("TECHNICAL DOSSIER", d.name, `${d.armorClass.name} · ${d.armor.name}`, "Проверка пройдена")}${armorVisual(d)}<div class="power-armor-result-list"><article><h3>${esc(d.name)}</h3><p>${esc(d.armorClass.name)} · диапазон полной массы ${d.armorClass.massMin}–${d.armorClass.massMax} кг</p></article>${metrics(d)}<article><h3>Передвижение</h3><p>Наземная скорость: ${d.movement.groundSpeed} м; масса системы ${d.movement.groundMass} кг.</p><p>${d.movement.alternateSystem ? `${movementName(d.movement.alternateType)}: ${d.movement.alternateSpeed} м; масса ${d.movement.alternateMass} кг.` : "Дополнительная система не установлена."}</p></article><article><h3>Манипуляторы</h3><p>Левая: ${esc(d.manipulators.left.name)} (${d.manipulators.left.mass >= 0 ? "+" : ""}${d.manipulators.left.mass} кг). Правая: ${esc(d.manipulators.right.name)} (${d.manipulators.right.mass >= 0 ? "+" : ""}${d.manipulators.right.mass} кг).</p></article><article><h3>Броня</h3><p>${esc(d.armor.name)} · броня ${d.armorPoints} · модификатор прочности ×${d.armor.integrityModifier} · масса ${d.armor.mass} кг · слоты крепления ${d.mountSlots}.</p><p>Предел структурного усиления класса: ${d.reinforcementLimit}.</p></article><article><h3>Вооружение</h3><p>Руки: ${esc(d.armLayout?.name || "—")}. ${esc(d.armLayout?.ammo || "")}</p><p>Корпус: ${esc(d.bodyLayout?.name || "—")}. ${esc(d.bodyLayout?.ammo || "")}</p></article><article><h3>Масса и слоты</h3><p>Учтённая масса: ${d.knownMass} кг; запас до верхнего предела класса: ${d.remainingMass} кг.</p><p>Свободные слоты: левая рука ${d.weaponSlots.leftFree}/${d.weaponSlots.leftTotal}, правая ${d.weaponSlots.rightFree}/${d.weaponSlots.rightTotal}, корпус ${d.weaponSlots.bodyFree}/${d.weaponSlots.bodyTotal}.</p><p class="power-armor-note">${esc(d.sourceNote)}</p></article></div>`;
    refs.resultView
      .querySelector(".result-panel")
      ?.focus({ preventScroll: true });
    refs.resultView.scrollIntoView({ block: "start", behavior: "instant" });
    U.announce("Технический формуляр сформирован", "valid", "DOSSIER COMPILED");
  }

  function snapshot() {
    return JSON.parse(JSON.stringify({ ...state, design: null }));
  }
  function persistDraft() {
    window.KadatStorage.local.write(
      window.KadatStorage.KEYS.armorDraft,
      snapshot(),
    );
  }
  function restore(value) {
    Object.assign(state, value, { design: null });
    state.step = Math.max(0, Math.min(4, state.step ?? 0));
    refs.resultView.classList.add("hidden");
    refs.form.classList.remove("hidden");
    refs.progress[0].parentElement.classList.remove("hidden");
    render();
  }
  buildShell();
  window.KadatModes.register("power-armor", {
    title: "Конструктор серво-брони",
    show(active) {
      refs.section.classList.toggle("hidden", !active);
    },
  });
  window.KadatFeatures ??= {};
  window.KadatFeatures.armor = { snapshot, restore, validate: validateAll };
  const savedDraft = window.KadatStorage.local.read(
    window.KadatStorage.KEYS.armorDraft,
    null,
    (v) => window.KadatSchemas.validateArmorDraft(v, DATA),
  );
  if (savedDraft) restore(savedDraft);
  else {
    const legacy = DATA.load();
    const migrated =
      legacy?.armorClass &&
      legacy.movement &&
      legacy.manipulators &&
      legacy.armor
        ? {
            name: legacy.name,
            classId: legacy.armorClass.id,
            groundSpeed: legacy.movement.groundSpeed,
            alternateMovementType: legacy.movement.alternateType,
            alternateSpeed: legacy.movement.alternateSpeed || 5,
            leftManipulatorId: legacy.manipulators.left?.id,
            rightManipulatorId: legacy.manipulators.right?.id,
            armorId: legacy.armor.id,
            armLayoutId: legacy.armLayout?.id ?? state.armLayoutId,
            bodyLayoutId: legacy.bodyLayout?.id ?? state.bodyLayoutId,
          }
        : null;
    if (window.KadatSchemas.validateArmorDraft(migrated, DATA))
      restore(migrated);
    else render();
  }
})();
