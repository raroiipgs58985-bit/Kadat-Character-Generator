const homeworldChoicesContainer = document.querySelector("#homeworld-choices");
state.homeworldChoices = {};

function getCurrentHomeworld() {
  return getSelected(DATA.homeworlds, worldSelect.value);
}

function getResolvedHomeworldChoices(world = getCurrentHomeworld()) {
  return (world.choices ?? []).map(choice => ({
    id: choice.id,
    label: choice.label,
    type: choice.type,
    value: state.homeworldChoices[choice.id] ?? ""
  }));
}

function renderHomeworldChoices() {
  const world = getCurrentHomeworld();
  const choices = world.choices ?? [];

  if (!choices.length) {
    homeworldChoicesContainer.className = "homeworld-choices hidden";
    homeworldChoicesContainer.innerHTML = "";
    return;
  }

  homeworldChoicesContainer.className = "homeworld-choices";
  homeworldChoicesContainer.innerHTML = `
    <div class="choice-heading">
      <div>
        <h3>Выборы родного мира</h3>
        <p class="muted">Знак «/» в исходной таблице означает: выберите один вариант.</p>
      </div>
    </div>
    <div class="choice-grid">
      ${choices.map(choice => `
        <label class="choice-field">
          ${choice.label}
          <select data-homeworld-choice="${choice.id}">
            <option value="">— Выберите один вариант —</option>
            ${choice.options.map(option => `
              <option value="${escapeHtml(option)}" ${state.homeworldChoices[choice.id] === option ? "selected" : ""}>${escapeHtml(option)}</option>
            `).join("")}
          </select>
        </label>
      `).join("")}
    </div>
  `;

  homeworldChoicesContainer.querySelectorAll("[data-homeworld-choice]").forEach(select => {
    select.addEventListener("change", () => {
      state.homeworldChoices[select.dataset.homeworldChoice] = select.value;
      clearError();
    });
  });
}

function resetHomeworldChoices() {
  state.homeworldChoices = {};
  renderHomeworldChoices();
}

const validateCharacterBeforeHomeworldChoices = validateCharacter;
validateCharacter = function () {
  const baseError = validateCharacterBeforeHomeworldChoices();
  if (baseError) return baseError;

  const world = getCurrentHomeworld();
  const missingChoice = (world.choices ?? []).find(choice => !state.homeworldChoices[choice.id]);
  if (missingChoice) {
    return `Для родного мира «${world.name}» нужно сделать выбор: ${missingChoice.label}.`;
  }

  return "";
};

const buildCharacterBeforeHomeworldChoices = buildCharacter;
buildCharacter = function () {
  const world = getCurrentHomeworld();
  const selections = getResolvedHomeworldChoices(world);
  const originalSkills = world.skills;
  const originalTalents = world.talents;

  world.skills = [
    ...originalSkills,
    ...selections.filter(selection => selection.type === "skill").map(selection => selection.value)
  ];
  world.talents = [
    ...originalTalents,
    ...selections.filter(selection => selection.type === "talent").map(selection => selection.value)
  ];

  try {
    const character = buildCharacterBeforeHomeworldChoices();
    character.worldChoices = selections;
    return character;
  } finally {
    world.skills = originalSkills;
    world.talents = originalTalents;
  }
};

worldSelect.addEventListener("change", resetHomeworldChoices);
document.querySelector("#reset-button").addEventListener("click", resetHomeworldChoices);
renderHomeworldChoices();
