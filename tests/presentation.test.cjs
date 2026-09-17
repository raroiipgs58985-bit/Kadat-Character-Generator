const assert = require("node:assert/strict");
const { loadApp } = require("./helpers.cjs");

(async () => {
  const app = await loadApp();
  const { w, $, click, fill } = app;
  // An untouched xeno record must not present a default table result as a roll.
  await click('[data-registry-mode="xeno"]');
  assert(!$("#xeno-summary").textContent.includes("null"));
  assert(!$("#xeno-summary").textContent.includes("Атавистические"));
  assert(!$("#xeno-summary").textContent.includes("Двуногая"));

  // Re-rendering an option group must keep keyboard focus on that exact option.
  await click('[data-registry-mode="regiment"]');
  await fill("#regiment-name", "Фокус");
  const r = w.KADAT_REGIMENT_DATA;
  await fill("#regiment-homeworld", r.homeworlds.find((e) => e.cost === 1).id);
  await fill("#regiment-origin", r.origins.find((e) => e.cost === 0).id);
  await click("#regiment-next");
  await fill("#regiment-commander", r.commanders.find((e) => e.cost === 0).id);
  await fill("#regiment-type", r.regimentTypes.find((e) => e.cost === 2).id);
  await click("#regiment-next");
  const options = [
    ...w.document.querySelectorAll("input[data-doctrine-group]"),
  ];
  const option = options.find((e, i) => i > 0 && !e.disabled);
  assert(option);
  const id = option.value;
  option.focus();
  await click(`input[data-doctrine-group][value="${id}"]`);
  assert.equal(w.document.activeElement.value, id);
  assert.equal(w.document.activeElement.type, "checkbox");

  await click("#regiment-next");
  const item = r.extraEquipment.find((e) => e.restrictionText);
  await fill("#regiment-equipment-search", item.name);
  const card = $(".regiment-equipment-card");
  assert(card.textContent.includes("ОС"), "Supply prices use the supply unit");
  assert(card.textContent.includes(item.restrictionText));
  assert.equal(card.textContent.split(item.restrictionText).length, 2);
  assert.equal($("#save-status").textContent, "Черновик сохранён");
  await click('[data-registry-mode="xeno"]');
  assert.equal($("#save-status").textContent, "Новый черновик");
  const saved = app.storage();
  assert.deepEqual(app.errors, []);
  app.dom.window.close();
  const restored = await loadApp(saved);
  await restored.click('[data-registry-mode="regiment"]');
  assert.equal(restored.$("#save-status").textContent, "Черновик восстановлен");
  assert.equal(restored.$("#save-status").dataset.state, "valid");
  await restored.click('[data-registry-mode="power-armor"]');
  assert.equal(restored.$("#save-status").textContent, "Новый черновик");
  assert.deepEqual(restored.errors, []);
  restored.dom.window.close();
  console.log(
    "Presentation: unrolled xeno values, keyboard focus, supply restrictions and per-registry save/restore status OK.",
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
