const assert = require("node:assert/strict");
const { loadApp, plain } = require("./helpers.cjs");
(async () => {
  const app = await loadApp();
  const { w, $, click, fill, errors, downloads } = app;
  assert.deepEqual(errors, []);
  for (const mode of [
    "regiment",
    "xeno",
    "power-armor",
    "character",
    "power-armor",
    "regiment",
    "xeno",
    "character",
  ]) {
    await click(`[data-registry-mode="${mode}"]`);
    const visible = [
      "builder-view",
      "result-view",
      "regiment-builder-view",
      "xeno-builder-view",
      "power-armor-builder-view",
    ].filter((id) => !$("#" + id).classList.contains("hidden"));
    assert.equal(visible.length, 1, `Only one mode visible: ${mode}`);
  }
  await fill("#character-name", "Тестовый <img src=x onerror=alert(1)>");
  await click("#wizard-next");
  assert(!$("#validation-message").hidden, "Missing origin choice shown");
  const raceChoices = [
    ...w.document.querySelectorAll('select[data-choice-kind="race"]'),
  ].map((e) => ({ id: e.dataset.choice, index: e.dataset.index }));
  for (const { id, index } of raceChoices) {
    const selector = `select[data-choice="${id}"][data-index="${index}"]`;
    const option = [...$(selector).options].find((o) => o.value && !o.disabled);
    await fill(selector, option.value);
  }
  await click("#wizard-next");
  assert.match($("#stage-title").textContent, /Специальность/);
  await click("#wizard-next");
  assert.match($("#stage-title").textContent, /Характеристики/);
  const stats = w.KADAT_DATA.stats;
  for (const [i, stat] of stats.entries())
    await fill(`input[data-stat="${stat}"]`, i === 0 ? 20 : 10);
  await click('[data-transfer-from="НС"]');
  await click('[data-transfer-to="НР"]');
  assert.equal(w.KadatCharacterUI.store.get().transfers.length, 1);
  await click("[data-undo-transfer]");
  await click("#wizard-next");
  const before = w.KadatCharacterUI.getCharacter();
  await click('[data-action="buyCharacteristic"][data-stat="ВН"]');
  assert.equal(
    w.KadatCharacterUI.getCharacter().availableXp,
    before.availableXp - 250,
  );
  await click('[data-action="undoCharacteristic"][data-stat="ВН"]');
  assert.equal(
    w.KadatCharacterUI.getCharacter().availableXp,
    before.availableXp,
  );
  await click('[data-adv-tab="skills"]');
  await click('[data-action="buySkill"]');
  assert(w.KadatCharacterUI.getCharacter().skills.has("Акробатика"));
  await click('[data-adv-tab="talents"]');
  await fill("#adv-talent-search", "Ночное");
  assert.equal(
    $("#adv-talent-search").value,
    "Ночное",
    "Search survives re-render",
  );
  await click("#wizard-next");
  assert.match($("#stage-title").textContent, /Досье/);
  await click("#wizard-submit");
  assert(!$("#result-view").classList.contains("hidden"));
  assert.equal($("#result img"), null, "Name remains text");
  assert($("#result").textContent.includes("<img"));
  await click("#export-xlsx");
  assert(downloads[0].name.endsWith(".xlsx"));
  assert(downloads[0].blob.size > 1000);
  const exportStats = plain(w.KadatCharacterUI.getCharacter().stats);
  await click("#backup-export");
  assert(downloads[1].name.endsWith(".json"));
  const backup = w.KadatWorkspace.serialize();
  w.KadatWorkspace.validate(JSON.parse(backup).data);
  await click("#return-to-builder");
  await click("#reset-button");
  assert.equal(w.KadatCharacterUI.store.get().name, "");
  await click("#undo-reset");
  assert.equal(
    w.KadatCharacterUI.store.get().name,
    "Тестовый <img src=x onerror=alert(1)>",
  );
  const storage = app.storage();
  app.dom.window.close();
  const restored = await loadApp(storage);
  assert.equal(
    restored.w.KadatCharacterUI.store.get().name,
    "Тестовый <img src=x onerror=alert(1)>",
  );
  assert.deepEqual(
    plain(restored.w.KadatCharacterUI.getCharacter().stats),
    exportStats,
  );
  const comparable = (text) =>
    JSON.parse(text, (key, value) =>
      ["updatedAt", "exportedAt"].includes(key) ? undefined : value,
    );
  const original = comparable(restored.w.KadatWorkspace.serialize());
  assert.throws(() =>
    restored.w.KadatWorkspace.restore({
      character: { name: "Invalid" },
      regiments: [],
    }),
  );
  assert.deepEqual(comparable(restored.w.KadatWorkspace.serialize()), original);
  restored.w.KadatWorkspace.restore(JSON.parse(backup).data);
  await restored.tick();
  assert.deepEqual(restored.errors, []);
  restored.dom.window.close();
  console.log(
    "Application: all mode transitions, required choices, planned generation, transfer/undo, XP purchases/refunds, search focus, dossier, XLSX/JSON, reset/undo, reload and atomic invalid import OK.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
