(function (root) {
  "use strict";
  const registry = new Map();
  let current = "character";
  function register(id, config) {
    registry.set(id, config);
  }
  function open(id) {
    if (!registry.has(id)) return;
    current = id;
    for (const [key, config] of registry) config.show(key === id);
    for (const button of document.querySelectorAll("[data-registry-mode]")) {
      button.classList.toggle("is-active", button.dataset.registryMode === id);
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.registryMode === id),
      );
    }
    document.body.dataset.registryMode = id;
    document.querySelector("#mode-caption").textContent =
      registry.get(id).title;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  document
    .querySelector("#registry-mode-switch")
    .addEventListener("click", (event) => {
      const button = event.target.closest("[data-registry-mode]");
      if (button) open(button.dataset.registryMode);
    });
  root.addEventListener(
    "kadat:storage-saved",
    () =>
      (document.querySelector("#save-status").textContent =
        "Черновик сохранён"),
  );
  root.addEventListener(
    "kadat:storage-error",
    () =>
      (document.querySelector("#save-status").textContent =
        "Сохранение недоступно"),
  );
  root.KadatModes = { register, open, current: () => current };
})(window);
