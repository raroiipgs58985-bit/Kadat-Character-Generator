(function (root) {
  "use strict";
  const data = root.KADAT_DATA,
    adv = root.KADAT_ADVANCEMENT,
    V = root.KadatCharacterViews,
    U = root.KadatUI,
    S = root.KadatStorage,
    storage = S.local;
  const engine = root.KadatCharacter.createEngine(
    data,
    adv,
    root.KADAT_REGIMENT_CHARACTER_LINK_INTERNALS,
    root.KADAT_REGIMENT_DATA,
  );
  const saved = storage.read(
    S.KEYS.character,
    null,
    (v) =>
      v?.version === 2 &&
      root.KadatSchemas.validStep(v) &&
      S.validateCharacter(v.draft, data, adv),
  );
  const store = root.KadatStore.create(saved?.draft ?? engine.createDraft());
  const ui = {
    step: Math.max(0, Math.min(4, saved?.step ?? 0)),
    advancementTab: "stats",
    specialtySearch: "",
    talentSearch: "",
    talentLevel: "1",
    talentCategory: "",
    talentOptions: {},
    skillName: adv.skills[0].name,
    skillSpecialization: "",
    skillCustom: "",
    regiments: storage.read(
      S.KEYS.regiments,
      [],
      (v) => Array.isArray(v) && v.every(S.validateRegiment),
    ),
  };
  let lastCharacter = null,
    resultMode = false,
    undoReset = null,
    schedule = false;
  const $ = (s) => document.querySelector(s),
    stage = $("#character-stage"),
    form = $("#character-form"),
    live = $("#live-summary"),
    validation = $("#validation-message");
  function notify(message, error = false) {
    const node = $("#app-notice");
    node.textContent = message;
    node.className = `app-notice ${error ? "warning" : "success"}`;
    U.announce(
      message,
      error ? "error" : "valid",
      error ? "DATA REJECTED" : "RECORD UPDATED",
    );
  }
  root.addEventListener("kadat:storage-error", (event) =>
    notify(event.detail, true),
  );
  if (S.lastError) notify(S.lastError, true);
  function save() {
    if (
      storage.write(S.KEYS.character, {
        version: 2,
        draft: store.get(),
        step: ui.step,
      })
    )
      $("#save-status").textContent = "Черновик сохранён";
    else $("#save-status").textContent = "Сохранение недоступно";
  }
  function render() {
    schedule = false;
    const d = store.get(),
      c = engine.build(d),
      errors = engine.validate(d);
    const content = [V.origin, V.specialty, V.stats, V.advancement, V.review][
      ui.step
    ](d, c, engine, ui, data, adv);
    U.preserveFocus(
      stage,
      `<header class="stage-heading"><div class="stage-index">${String(ui.step + 1).padStart(2, "0")}</div><div><p class="stage-kicker">СОЗДАНИЕ ПЕРСОНАЖА / ${ui.step + 1} ИЗ 5</p><h2 tabindex="-1" id="stage-title">${V.steps[ui.step][0]}</h2><p>${V.steps[ui.step][1]}</p></div></header>${content}`,
    );
    U.preserveFocus(live, V.live(d, c, errors));
    $("#character-mobile-summary").innerHTML =
      `<span>ОО осталось <strong>${U.number(c.availableXp)}</strong></span><span>Раны <strong>${U.number(c.wounds)}</strong></span>${U.status(errors.length ? `Замечаний: ${errors.length}` : "Готово", errors.length ? "warning" : "valid")}`;
    $("#wizard-progress").innerHTML = V.steps
      .map(
        ([title, sub], i) =>
          `<button type="button" class="wizard-step-button ${i === ui.step ? "is-active" : ""} ${i < 4 && !errors.some((e) => e.step === i) ? "is-complete" : ""}" data-wizard-go="${i}" aria-current="${i === ui.step ? "step" : "false"}"><span class="wizard-roman">${i < 4 && !errors.some((e) => e.step === i) ? "✓" : String(i + 1).padStart(2, "0")}</span><span class="wizard-step-copy"><strong>${title}</strong><small>${sub}</small></span></button>`,
      )
      .join("");
    U.progress(
      [...$("#wizard-progress").querySelectorAll("button")],
      ui.step,
      V.steps.map((_, i) => errors.some((e) => e.step === i)),
    );
    $("#wizard-step-status").textContent = `Этап ${ui.step + 1} из 5`;
    $("#wizard-xp-status").textContent = `${U.number(c.availableXp)} ОО`;
    $("#wizard-prev").disabled = ui.step === 0;
    $("#wizard-next").hidden = ui.step === 4;
    $("#wizard-submit").hidden = ui.step !== 4;
    $("#undo-reset").hidden = !undoReset;
    stage.querySelectorAll("[data-error-field]").forEach((node) =>
      node.classList.toggle(
        "has-error",
        errors.some((e) => e.field === node.dataset.errorField),
      ),
    );
  }
  function requestRender() {
    if (schedule) return;
    schedule = true;
    queueMicrotask(render);
  }
  store.subscribe(() => {
    save();
    requestRender();
    lastCharacter = null;
  });
  function change(d) {
    store.replace(d);
    validation.hidden = true;
  }
  function go(step, focus = true) {
    ui.step = Math.max(0, Math.min(4, step));
    render();
    save();
    if (focus) {
      $("#stage-title").focus({ preventScroll: true });
      stage.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }
  function showError(message) {
    validation.textContent = message;
    validation.hidden = false;
    U.announce(message, "error", "DATA REJECTED");
    validation.focus({ preventScroll: true });
  }
  function advance() {
    const errors = engine
      .validate(store.get())
      .filter((e) => e.step <= ui.step);
    if (errors.length) {
      go(errors[0].step);
      showError(errors[0].message);
      return;
    }
    go(ui.step + 1);
  }
  function setField(name, value) {
    const d = structuredClone(store.get());
    if (name === "regimentId") {
      d.regiment = ui.regiments.find((r) => r.id === value) ?? null;
      d.regimentChoices = {};
    } else d[name] = value;
    if (name === "raceId") {
      d.plannedAdditions = engine.createDraft().plannedAdditions;
      d.transfers = [];
      d.pendingTransferFrom = null;
      d.raceChoices = {};
      d.specialtyChoices = {};
      if (engine.origins(d).race.fixedGeneration) {
        d.mode = "planned";
        d.rolls = engine.createDraft().rolls;
      }
    }
    if (name === "gender" || name === "raceId") {
      if (!engine.specialties(d).some((s) => s.id === d.specialtyId))
        d.specialtyId = "none";
      if (name === "gender") d.specialtyChoices = {};
    }
    if (name === "specialtyId") d.specialtyChoices = {};
    if (name === "worldId") d.homeworldChoices = {};
    if (name === "originSource") {
      d.regimentChoices = {};
      d.homeworldChoices = {};
      if (value === "regiment" && !d.regiment)
        d.regiment = ui.regiments[0] ?? null;
    }
    if (name === "mode") {
      d.transfers = [];
      d.pendingTransferFrom = null;
    }
    change(d);
  }
  form.addEventListener("input", handleInput);
  form.addEventListener("change", handleInput);
  function handleInput(event) {
    const target = event.target;
    if (event.type === "input" && ["SELECT", "BUTTON"].includes(target.tagName))
      return;
    if (
      event.type === "change" &&
      ["text", "search", "number", "textarea"].includes(target.type)
    )
      return;
    if (target.dataset.field) {
      setField(target.dataset.field, target.value);
      return;
    }
    if (target.dataset.ui) {
      const k = target.dataset.ui;
      ui[k] = target.value;
      if (k === "skillName") {
        ui.skillSpecialization = "";
        ui.skillCustom = "";
      }
      requestRender();
      return;
    }
    if (target.dataset.talentOption) {
      ui.talentOptions[target.dataset.talentOption] = target.value;
      requestRender();
      return;
    }
    const d = structuredClone(store.get());
    if (target.dataset.stat && target.tagName === "INPUT") {
      d.plannedAdditions[target.dataset.stat] = Number(target.value || 0);
      change(d);
      return;
    }
    if (target.dataset.choice) {
      const kind = target.dataset.choiceKind,
        id = target.dataset.choice,
        i = Number(target.dataset.index ?? 0);
      if (kind === "race") {
        const values = d.raceChoices[id] ?? [];
        values[i] = target.value;
        d.raceChoices[id] = values;
      }
      if (kind === "world") d.homeworldChoices[id] = target.value;
      if (kind === "specialty") {
        const c = engine.origins(d).specialty.choices.find((c) => c.id === id);
        if (c.poolOptions) {
          const values = String(d.specialtyChoices[id] ?? "")
            .split(";")
            .map((s) => s.trim());
          while (values.length < (c.count ?? 1)) values.push("");
          values[i] = target.value;
          d.specialtyChoices[id] = values.join("; ");
        } else d.specialtyChoices[id] = target.value;
      }
      change(d);
      return;
    }
    if (target.dataset.regimentChoice) {
      const id = target.dataset.regimentChoice,
        c = engine
          .origins(d)
          .world.regimentMechanics.choices.find((c) => c.id === id);
      if (c.kind === "stat") {
        const values = [
          ...stage.querySelectorAll("input[data-regiment-choice]:checked"),
        ]
          .filter((x) => x.dataset.regimentChoice === id)
          .map((x) => x.value);
        if (values.length > c.choose) {
          target.checked = false;
          showError(`Можно выбрать ${c.choose} характеристик.`);
          return;
        }
        d.regimentChoices[id] = values;
      } else d.regimentChoices[id] = target.value;
      change(d);
    }
  }
  document.querySelector("#builder-view").addEventListener("click", (event) => {
    const b = event.target.closest("button");
    if (!b) return;
    const a = b.dataset,
      d = structuredClone(store.get());
    if (a.wizardGo !== undefined) {
      go(Number(a.wizardGo));
      return;
    }
    if (a.openMode) {
      root.KadatModes.open(a.openMode);
      return;
    }
    if (a.selectSpecialty) {
      setField("specialtyId", a.selectSpecialty);
      return;
    }
    if (a.advTab) {
      ui.advancementTab = a.advTab;
      render();
      return;
    }
    if (a.action) {
      const t = engine.transact(d, {
        type: a.action,
        stat: a.stat,
        name: a.name,
        catalogId: a.catalogId,
        id: a.purchaseId ?? crypto.randomUUID(),
        option: ui.talentOptions[a.catalogId] ?? "",
      });
      if (t.ok) {
        change(t.draft);
        const labels = {
          buyCharacteristic: "Характеристика повышена",
          undoCharacteristic: "Повышение отменено",
          buySkill: "Навык приобретён",
          undoSkill: "Покупка навыка отменена",
          buyTalent: "Талант приобретён",
          undoTalent: "Покупка таланта отменена",
          resetAdvancement: "Покупки развития отменены",
        };
        U.announce(labels[a.action] ?? "Развитие обновлено");
      } else showError(t.message);
      return;
    }
    if (a.roll !== undefined) {
      for (const stat of data.stats)
        d.rolls[stat] =
          Math.floor(Math.random() * 10) +
          1 +
          Math.floor(Math.random() * 10) +
          1;
      d.transfers = [];
      d.pendingTransferFrom = null;
      change(d);
      U.announce("Броски характеристик выполнены", "valid", "VALUES UPDATED");
      return;
    }
    if (a.transferFrom) {
      d.pendingTransferFrom =
        d.pendingTransferFrom === a.transferFrom ? null : a.transferFrom;
      change(d);
      return;
    }
    if (a.transferTo) {
      if (d.pendingTransferFrom && d.pendingTransferFrom !== a.transferTo) {
        d.transfers.push({ from: d.pendingTransferFrom, to: a.transferTo });
        d.pendingTransferFrom = null;
        change(d);
      }
      return;
    }
    if (a.cancelTransfer !== undefined) {
      d.pendingTransferFrom = null;
      change(d);
      return;
    }
    if (a.undoTransfer !== undefined) {
      d.transfers.pop();
      d.pendingTransferFrom = null;
      change(d);
      return;
    }
    if (a.deleteRegiment !== undefined && d.regiment) {
      const deleted = d.regiment;
      ui.regiments = ui.regiments.filter((r) => r.id !== deleted.id);
      if (!storage.write(S.KEYS.regiments, ui.regiments)) {
        ui.regiments.push(deleted);
        return;
      }
      d.regiment = null;
      d.regimentChoices = {};
      d.originSource = "ready";
      change(d);
      notify(
        "Полк удалён из списка сохранённых. Его черновик доступен в мастере полка.",
      );
    }
  });
  $("#wizard-next").addEventListener("click", advance);
  $("#wizard-prev").addEventListener("click", () => go(ui.step - 1));
  $("#reset-button").addEventListener("click", () => {
    undoReset = structuredClone(store.get());
    resultMode = false;
    ui.step = 0;
    change(engine.createDraft());
    notify("Черновик сброшен. Доступна кнопка «Отменить сброс».");
  });
  $("#undo-reset").addEventListener("click", () => {
    if (undoReset) {
      const restored = undoReset;
      undoReset = null;
      change(restored);
      notify("Черновик восстановлен.");
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const errors = engine.validate(store.get());
    if (errors.length) {
      go(errors[0].step);
      showError(errors[0].message);
      return;
    }
    lastCharacter = engine.build(store.get());
    $("#result").innerHTML = V.dossier(lastCharacter);
    resultMode = true;
    root.KadatModes.open("character");
    $("#result-title").focus({ preventScroll: true });
    $("#result-view").scrollIntoView({ block: "start", behavior: "instant" });
    U.announce("Досье сформировано", "valid", "DOSSIER COMPILED");
  });
  $("#return-to-builder").addEventListener("click", () => {
    resultMode = false;
    root.KadatModes.open("character");
    render();
  });
  $("#export-xlsx").addEventListener("click", () => {
    try {
      if (lastCharacter) {
        root.KadatExports.download("xlsx", lastCharacter);
        U.announce(
          "Excel подготовлен: карточка и три подробных листа",
          "valid",
          "EXPORT COMPILED",
        );
      }
    } catch (e) {
      notify(`Ошибка Excel: ${e.message}`, true);
    }
  });
  $("#print-dossier").addEventListener("click", () => root.print());
  root.KadatModes.register("character", {
    title: "Создание персонажа",
    show(active) {
      $("#builder-view").classList.toggle("hidden", !active || resultMode);
      $("#result-view").classList.toggle("hidden", !active || !resultMode);
    },
  });
  function useRegiment(regiment) {
    ui.regiments = storage.read(
      S.KEYS.regiments,
      [],
      (v) => Array.isArray(v) && v.every(S.validateRegiment),
    );
    const d = structuredClone(store.get());
    d.originSource = "regiment";
    d.regiment = regiment;
    d.regimentChoices = {};
    d.homeworldChoices = {};
    resultMode = false;
    ui.step = 0;
    change(d);
    root.KadatModes.open("character");
  }
  root.addEventListener("kadat:use-regiment", (event) =>
    useRegiment(event.detail),
  );
  root.addEventListener("kadat:regiments-changed", () => {
    ui.regiments = storage.read(
      S.KEYS.regiments,
      [],
      (v) => Array.isArray(v) && v.every(S.validateRegiment),
    );
    requestRender();
  });
  function useXeno(race) {
    root.KADAT_XENO_DATA.installRace(race);
    const d = structuredClone(store.get());
    d.raceId = race.id;
    d.mode = "planned";
    d.rolls = engine.createDraft().rolls;
    d.plannedAdditions = engine.createDraft().plannedAdditions;
    d.transfers = [];
    d.pendingTransferFrom = null;
    d.raceChoices = {};
    d.specialtyChoices = {};
    if (!engine.specialties(d).some((s) => s.id === d.specialtyId))
      d.specialtyId = "none";
    resultMode = false;
    ui.step = 0;
    change(d);
  }
  root.KADAT_SELECT_XENO_RACE = useXeno;
  root.addEventListener("kadat:xeno-race-saved", (event) =>
    useXeno(event.detail),
  );
  const legacySource = storage.read(S.KEYS.source, null);
  if (!saved && legacySource?.mode === "regiment") {
    const regiment = ui.regiments.find((r) => r.id === legacySource.regimentId);
    if (regiment) useRegiment(regiment);
  }
  root.KadatCharacterUI = {
    engine,
    store,
    getCharacter: () => engine.build(store.get()),
    useRegiment,
    useXeno,
    restore(draft) {
      resultMode = false;
      ui.step = 0;
      change(draft);
      root.KadatModes.open("character");
    },
    notify,
  };
  render();
  root.KadatModes.open("character");
})(window);
