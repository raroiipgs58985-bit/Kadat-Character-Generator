(function (root) {
  "use strict";
  const registry = new Map();
  const labels = {
    character: [
      "ADEPTUS ADMINISTRATUM / PERSONNEL REGISTRY",
      "Личное дело · происхождение, назначение и развитие",
    ],
    regiment: [
      "DEPARTMENTO MUNITORUM / REGIMENTAL REGISTRY",
      "Полковой формуляр · командование, доктрины и снабжение",
    ],
    xeno: [
      "RESTRICTED ARCHIVE / XENOS RECORD",
      "Ксенологический архив · раса или отдельное существо",
    ],
    "power-armor": [
      "ADEPTUS MECHANICUS / MACHINE REGISTRUM",
      "Технический формуляр · компоненты и компоновка",
    ],
  };
  let current = "character";
  const saveStates = new Map();
  const keys = root.KadatStorage.KEYS;
  const savedModes = new Map([
    [keys.character, "character"],
    [keys.regimentDraft, "regiment"],
    [keys.regiments, "regiment"],
    [keys.xenoDraft, "xeno"],
    [keys.xeno, "xeno"],
    [keys.armorDraft, "power-armor"],
    [keys.armor, "power-armor"],
  ]);
  let storageError = Boolean(root.KadatStorage.lastError);
  function showSaveState() {
    const node = document.querySelector("#save-status");
    const text = storageError
      ? "Сохранение недоступно"
      : (saveStates.get(current) ?? "Новый черновик");
    node.textContent = text;
    node.dataset.state = storageError
      ? "error"
      : saveStates.has(current)
        ? "valid"
        : "normal";
  }
  function restored(id) {
    saveStates.set(id, "Черновик восстановлен");
    if (id === current) showSaveState();
  }
  function register(id, config) {
    registry.set(id, config);
  }
  function open(id) {
    if (!registry.has(id)) return;
    current = id;
    showSaveState();
    for (const [key, config] of registry) config.show(key === id);
    for (const button of document.querySelectorAll(
      "button[data-registry-mode]",
    )) {
      button.classList.toggle("is-active", button.dataset.registryMode === id);
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.registryMode === id),
      );
    }
    document.body.dataset.registryMode = id;
    document.querySelector("#mode-caption").textContent =
      registry.get(id).title;
    const [authority, description] = labels[id] ?? labels.character;
    document.querySelector("#registry-authority").textContent = authority;
    document.querySelector("#registry-description").textContent = description;
    root.KadatUI.announce(registry.get(id).title, "active", "ARCHIVE ACCESSED");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  document
    .querySelector("#registry-mode-switch")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-registry-mode]");
      if (button) open(button.dataset.registryMode);
    });
  root.addEventListener("kadat:storage-saved", (event) => {
    const id = savedModes.get(event.detail);
    if (id) saveStates.set(id, "Черновик сохранён");
    storageError = false;
    showSaveState();
  });
  root.addEventListener("kadat:storage-error", () => {
    storageError = true;
    showSaveState();
  });
  root.KadatModes = { register, open, restored, current: () => current };
  const feedback = {
    "regiment-reset": "Черновик полка сброшен",
    "xeno-reset": "Черновик ксеноса сброшен",
    "pa-reset": "Конфигурация брони сброшена",
    "xeno-roll-stats": "Характеристики и раны определены",
    "xeno-roll-form": "Форма тела определена",
    "xeno-roll-archetype": "Архетип определён",
    "xeno-roll-feature": "Особенность определена",
  };
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (feedback[button.id]) root.KadatUI.announce(feedback[button.id]);
    else if (
      button.hasAttribute("data-equipment-plus") ||
      button.hasAttribute("data-equipment-minus")
    )
      root.KadatUI.announce("Снабжение полка обновлено");
    else if (
      button.hasAttribute("data-transfer-to") ||
      button.hasAttribute("data-undo-transfer")
    )
      root.KadatUI.announce("Перенос характеристик обновлён");
  });
})(window);
