(() => {
  const renderBeforeRaceChoices = renderResult;

  function renderRaceChoiceSection(character) {
    const selections = character.raceSelections ?? [];
    if (!selections.length) return "";

    const grouped = new Map();
    for (const selection of selections) {
      if (!grouped.has(selection.label)) grouped.set(selection.label, []);
      grouped.get(selection.label).push(selection.value);
    }

    const items = [...grouped.entries()].map(([label, values]) => `
      <li>
        <strong>${escapeHtml(label)}:</strong>
        ${values.map(value => escapeHtml(value)).join(", ")}
      </li>
    `).join("");

    return `
      <section class="specialty-section race-choice-result-section">
        <h3>Выборы расы</h3>
        <ul class="specialty-selection-list">${items}</ul>
      </section>
    `;
  }

  renderResult = function (character) {
    renderBeforeRaceChoices(character);
    const markup = renderRaceChoiceSection(character);
    if (!markup) return;

    const holder = document.createElement("div");
    holder.innerHTML = markup.trim();
    const firstDetailedSection = result.querySelector(".homeworld-section, .specialty-section, .advancement-result-section");
    if (firstDetailedSection) result.insertBefore(holder.firstElementChild, firstDetailedSection);
    else result.appendChild(holder.firstElementChild);
  };
})();
