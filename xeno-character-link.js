(() => {
  "use strict";

  if (typeof document === "undefined" || !window.KADAT_XENO_DATA) return;

  const isGeneratedXeno = race => Boolean(race?.generatedXeno && race?.fixedGeneration);

  if (typeof getAvailableSpecialties === "function") {
    const previousGetAvailableSpecialties = getAvailableSpecialties;
    getAvailableSpecialties = function () {
      const race = getSelected(DATA.races, raceSelect.value);
      if (!isGeneratedXeno(race)) return previousGetAvailableSpecialties();
      const gender = genderSelect?.value ?? "unspecified";
      return DATA.specialties.filter(specialty => window.KADAT_XENO_DATA.isHumanSpecialtyAllowed(specialty, gender));
    };
  }

  if (typeof renderStats === "function") {
    const previousRenderStats = renderStats;
    renderStats = function () {
      previousRenderStats();
      const race = getSelected(DATA.races, raceSelect.value);
      const fixed = isGeneratedXeno(race);
      modeSelect.disabled = fixed;
      if (fixed) {
        modeSelect.value = "planned";
        rollButton.disabled = true;
        document.querySelectorAll("[data-stat-input]").forEach(input => input.remove());
        pointsStatus.textContent = "Характеристики зафиксированы формуляром ксено-расы. Второй бросок или распределение очков не выполняются.";
        redistributionPanel.className = "redistribution-panel hidden";
      } else {
        modeSelect.disabled = false;
        rollButton.disabled = modeSelect.value !== "random";
      }
    };
  }

  if (typeof buildCharacter === "function") {
    const previousBuildCharacter = buildCharacter;
    buildCharacter = function () {
      const character = previousBuildCharacter();
      if (isGeneratedXeno(character.race)) {
        character.wounds = Math.max(1,
          Number(character.race.fixedWounds ?? 1)
          + Number(character.world?.woundBonus ?? 0)
          + Number(character.specialty?.woundBonus ?? 0)
        );
        character.xenoProfile = character.race.xenoProfile;
        character.raceImplants = [...(character.race.implants ?? [])];
        character.racePsychicPowers = [...(character.race.psychicPowers ?? [])];
      }
      return character;
    };
  }

  function installAndSelect(race) {
    if (!race) return;
    window.KADAT_XENO_DATA.installRace(race);
    fillSelect(raceSelect, DATA.races);
    raceSelect.value = race.id;
    resetPlannedAdditions();
    resetTransfers();
    raceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    if (typeof refreshSpecialties === "function") refreshSpecialties();
    renderStats();
  }

  window.KADAT_SELECT_XENO_RACE = installAndSelect;
  window.addEventListener("kadat:xeno-race-saved", event => installAndSelect(event.detail));

  const loaded = DATA.races.find(isGeneratedXeno);
  if (loaded && raceSelect.value === loaded.id) installAndSelect(loaded);
})();
