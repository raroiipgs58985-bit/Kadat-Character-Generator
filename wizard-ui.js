(() => {
  const builderView = document.querySelector("#builder-view");
  const resultView = document.querySelector("#result-view");
  const stages = [...document.querySelectorAll("[data-wizard-step]")];
  const stepButtons = [...document.querySelectorAll("[data-wizard-go]")];
  const previousButton = document.querySelector("#wizard-prev");
  const nextButton = document.querySelector("#wizard-next");
  const submitButton = document.querySelector("#wizard-submit");
  const returnButton = document.querySelector("#return-to-builder");
  const statusNode = document.querySelector("#wizard-step-status");
  const xpStatusNode = document.querySelector("#wizard-xp-status");
  const reviewSummary = document.querySelector("#review-summary");
  const dossierCode = document.querySelector("#dossier-code");
  const resultPanel = document.querySelector(".result-panel");

  if (!builderView || !resultView || !stages.length) return;

  let currentStep = 0;

  function escapeUi(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function visibleRequiredControls(stage) {
    return [...stage.querySelectorAll("select, input:not([type='hidden']), textarea")]
      .filter(control => !control.disabled && control.offsetParent !== null);
  }

  function originChoicesReady() {
    const race = getSelected(DATA.races, raceSelect.value);
    const world = getSelected(DATA.homeworlds, worldSelect.value);
    const raceSelections = typeof getResolvedRaceChoices === "function" ? getResolvedRaceChoices(race) : [];
    const worldSelections = typeof getResolvedHomeworldChoices === "function" ? getResolvedHomeworldChoices(world) : [];
    const raceExpected = (race.choices ?? []).reduce((sum, choice) => sum + Number(choice.count ?? 1), 0);
    const worldExpected = (world.choices ?? []).length;
    return raceSelections.filter(selection => selection.value).length === raceExpected
      && worldSelections.filter(selection => selection.value).length === worldExpected;
  }

  function specialtyChoicesReady() {
    const specialty = getSelected(DATA.specialties, specialtySelect.value);
    if (!(specialty.choices ?? []).length) return true;
    if (typeof getResolvedSpecialtySelections !== "function") return false;
    return getResolvedSpecialtySelections(specialty).every(selection =>
      (selection.values ?? []).filter(Boolean).length === Number(selection.count ?? 1)
    );
  }

  function isStageComplete(index) {
    if (index === 0) return originChoicesReady();
    if (index === 1) return specialtyChoicesReady();
    if (index === 2) return typeof generationReady === "function" && generationReady() && !state.pendingTransferFrom;
    if (index === 3) return typeof remainingXp !== "function" || remainingXp() >= 0;
    if (index === 4) return result.classList.contains("character-card");

    return visibleRequiredControls(stages[index]).every(control => control.value !== "");
  }

  function updateStepButtons() {
    stepButtons.forEach((button, index) => {
      const active = index === currentStep;
      button.classList.toggle("is-active", active);
      button.classList.toggle("is-complete", isStageComplete(index));
      button.setAttribute("aria-current", active ? "step" : "false");
    });
  }

  function updateXpStatus() {
    if (!xpStatusNode) return;
    try {
      if (typeof isAdvancementReady === "function" && !isAdvancementReady()) {
        xpStatusNode.textContent = "ОО: ожидает расчёта";
        return;
      }
      if (typeof remainingXp === "function" && typeof baseAvailableXp === "function") {
        const remaining = remainingXp();
        const available = baseAvailableXp();
        xpStatusNode.textContent = `ОО: ${formatNumber(remaining)} / ${formatNumber(available)}`;
        return;
      }
    } catch (error) {
      // До завершения обязательных выборов опыт может быть недоступен.
    }
    xpStatusNode.textContent = "ОО: —";
  }

  function generationReviewText() {
    if (modeSelect.value === "random") {
      return allStatsRolled() ? "Броски 2к10 выполнены" : "Броски ещё не выполнены";
    }
    const race = getSelected(DATA.races, raceSelect.value);
    const spent = Object.values(state.plannedAdditions).reduce((sum, value) => sum + value, 0);
    return `Распределено ${spent} из ${race.plannedPoints} очков`;
  }

  function validationSnapshot() {
    try {
      const error = validateCharacter();
      return error || "Все обязательные данные заполнены";
    } catch (error) {
      return "Часть данных ещё не готова к проверке";
    }
  }

  function updateReviewSummary() {
    if (!reviewSummary) return;

    const race = getSelected(DATA.races, raceSelect.value);
    const world = getSelected(DATA.homeworlds, worldSelect.value);
    const specialty = getSelected(DATA.specialties, specialtySelect.value);
    const characterName = document.querySelector("#character-name")?.value.trim() || "Безымянный персонаж";
    const validation = validationSnapshot();
    const ready = validation === "Все обязательные данные заполнены";

    let xpText = "Недоступно до завершения основы";
    try {
      if (typeof remainingXp === "function" && typeof advancementSpent === "function") {
        xpText = `${formatNumber(remainingXp())} ОО осталось · ${formatNumber(advancementSpent())} ОО потрачено`;
      }
    } catch (error) {
      // Сохраняем пояснение по умолчанию.
    }

    reviewSummary.innerHTML = `
      <article class="review-item">
        <span>Субъект</span>
        <strong>${escapeUi(characterName)}</strong>
        <small>${escapeUi(race.name)} · ${escapeUi(world.name)}</small>
      </article>
      <article class="review-item">
        <span>Служебное назначение</span>
        <strong>${escapeUi(specialty.name)}</strong>
        <small>Стоимость: ${formatNumber(specialty.xpCost ?? 0)} ОО</small>
      </article>
      <article class="review-item ${generationReady() ? "is-ready" : "is-warning"}">
        <span>Характеристики</span>
        <strong>${generationReady() ? "Определены" : "Не завершены"}</strong>
        <small>${escapeUi(generationReviewText())}</small>
      </article>
      <article class="review-item">
        <span>Ресурс развития</span>
        <strong>${escapeUi(xpText)}</strong>
        <small>Покупки можно изменить на этапе IV</small>
      </article>
      <article class="review-item ${ready ? "is-ready" : "is-warning"}" style="grid-column: 1 / -1;">
        <span>Проверка когитатора</span>
        <strong>${ready ? "Формуляр готов" : "Требуется внимание"}</strong>
        <small>${escapeUi(validation)}</small>
      </article>
    `;
  }

  function showStep(index, options = {}) {
    currentStep = Math.max(0, Math.min(stages.length - 1, Number(index)));

    stages.forEach((stage, stageIndex) => {
      const active = stageIndex === currentStep;
      stage.classList.toggle("is-active", active);
      stage.hidden = !active;
    });

    previousButton.disabled = currentStep === 0;
    nextButton.hidden = currentStep === stages.length - 1;
    submitButton.hidden = currentStep !== stages.length - 1;
    statusNode.textContent = `Этап ${currentStep + 1} из ${stages.length}`;

    updateStepButtons();
    updateXpStatus();
    if (currentStep === stages.length - 1) updateReviewSummary();

    const activeButton = stepButtons[currentStep];
    activeButton?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });

    if (options.scroll !== false) {
      builderView.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function inferredErrorStep(message) {
    const text = String(message ?? "").toLocaleLowerCase("ru-RU");
    if (/раса|родн|мир/.test(text)) return 0;
    if (/специальност|оружи|снаряжен|выберите/.test(text)) return 1;
    if (/характерист|брос|распредел|перенос/.test(text)) return 2;
    if (/развит|опыт|оо|талант|навык/.test(text)) return 3;
    return currentStep;
  }

  function makeDossierCode() {
    const source = `${document.querySelector("#character-name")?.value ?? ""}|${raceSelect.value}|${worldSelect.value}|${specialtySelect.value}`;
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `KDT-${String(Math.abs(hash) % 1000000).padStart(6, "0")}`;
  }

  function openResultMode() {
    builderView.classList.add("hidden");
    resultView.classList.remove("hidden");
    dossierCode.textContent = makeDossierCode();
    document.body.classList.add("is-result-mode");
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => resultPanel?.focus({ preventScroll: true }), 250);
  }

  function returnToBuilder() {
    resultView.classList.add("hidden");
    builderView.classList.remove("hidden");
    document.body.classList.remove("is-result-mode");
    showStep(currentStep, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  previousButton?.addEventListener("click", () => showStep(currentStep - 1));
  nextButton?.addEventListener("click", () => showStep(currentStep + 1));
  stepButtons.forEach(button => button.addEventListener("click", () => showStep(button.dataset.wizardGo)));
  returnButton?.addEventListener("click", returnToBuilder);

  form.addEventListener("submit", () => {
    window.setTimeout(() => {
      const succeeded = validationMessage.classList.contains("hidden")
        && result.classList.contains("character-card");

      if (succeeded) {
        updateStepButtons();
        openResultMode();
        return;
      }

      showStep(inferredErrorStep(validationMessage.textContent), { scroll: false });
      validationMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  });

  document.querySelector("#reset-button")?.addEventListener("click", () => {
    resultView.classList.add("hidden");
    builderView.classList.remove("hidden");
    document.body.classList.remove("is-result-mode");
    currentStep = 0;
    window.setTimeout(() => showStep(0, { scroll: false }), 0);
  });

  form.addEventListener("change", () => {
    window.setTimeout(() => {
      updateStepButtons();
      updateXpStatus();
      if (currentStep === stages.length - 1) updateReviewSummary();
    }, 0);
  });

  form.addEventListener("input", () => {
    window.setTimeout(() => {
      updateStepButtons();
      updateXpStatus();
      if (currentStep === stages.length - 1) updateReviewSummary();
    }, 0);
  });

  const advancementObserver = new MutationObserver(() => {
    updateXpStatus();
    if (currentStep === stages.length - 1) updateReviewSummary();
  });
  const advancementNode = document.querySelector("#advancement");
  if (advancementNode) advancementObserver.observe(advancementNode, { childList: true, subtree: true });

  showStep(0, { scroll: false });
})();
