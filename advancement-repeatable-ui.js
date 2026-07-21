renderTalentCatalog = function (ready) {
  const owned = currentTalentMap();
  const catalog = filteredTalentCatalog();

  return `
    <div class="talent-catalog">
      ${catalog.map(talent => {
        const optionValue = talentOptionValue(talent);
        const fullName = formatTalentName(talent, optionValue);
        const isOwned = fullName ? owned.has(advKey(fullName)) : false;
        const repeatable = Boolean(talent.repeatable || talent.option?.repeatable);
        const blockedByOwnership = isOwned && !repeatable;
        const failures = simpleRequirementFailures(talent);
        const cost = talentCost(talent.level);
        const canBuy = ready && fullName && !blockedByOwnership && !failures.length && remainingXp() >= cost;
        const buttonLabel = blockedByOwnership
          ? "Уже получен"
          : (isOwned && repeatable ? `Купить ещё за ${cost} ОО` : `Купить за ${cost} ОО`);

        return `
          <details class="talent-catalog-card">
            <summary>
              <span>
                <strong>${advEscape(talent.name)}</strong>
                <small>${advEscape(talent.category)} · ${talent.level} ур.${repeatable ? " · повторяемый" : ""}</small>
              </span>
              <b>${cost} ОО</b>
            </summary>
            <div class="talent-catalog-body">
              <p><strong>Требования:</strong> ${advEscape(talent.requirements || "Нет")}</p>
              ${talent.description ? `<p>${advEscape(talent.description)}</p>` : ""}
              ${renderTalentOption(talent)}
              ${failures.length ? `<p class="requirement-warning">Не выполнено: ${failures.map(advEscape).join(", ")}</p>` : ""}
              <button type="button" data-adv-talent-buy="${talent.id}" ${canBuy ? "" : "disabled"}>${buttonLabel}</button>
            </div>
          </details>
        `;
      }).join("") || `<p class="muted">По заданным фильтрам таланты не найдены.</p>`}
    </div>
  `;
};
