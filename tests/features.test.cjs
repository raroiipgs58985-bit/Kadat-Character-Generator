const assert = require("node:assert/strict");
const { loadApp, plain } = require("./helpers.cjs");
(async () => {
  const app = await loadApp();
  const { w, $, click, fill, tick } = app;
  const cleanBackup = JSON.parse(w.KadatWorkspace.serialize()).data;
  // Real regiment controls; the removal must also reach the saved character source.
  await click('[data-registry-mode="regiment"]');
  await click("#regiment-next");
  assert.match($("#regiment-validation").textContent, /название/);
  await fill("#regiment-name", "125-й проверочный");
  const r = w.KADAT_REGIMENT_DATA;
  await fill("#regiment-homeworld", r.homeworlds.find((e) => e.cost === 1).id);
  await fill("#regiment-origin", r.origins.find((e) => e.cost === 0).id);
  await click("#regiment-next");
  await fill("#regiment-commander", r.commanders.find((e) => e.cost === 0).id);
  await fill("#regiment-type", r.regimentTypes.find((e) => e.cost === 2).id);
  await click("#regiment-next");
  await click("#regiment-next");
  const drawback = r.drawbacks.find((e) => e.bonusPoints === 7);
  await fill(`[data-regiment-drawback="${drawback.id}"]`, true);
  const item = r.extraEquipment.find((e) => e.cost === 15);
  for (let i = 0; i < 4; i++) await click(`[data-equipment-plus="${item.id}"]`);
  assert.equal(
    w.KadatFeatures.regiment.snapshot().extraEquipment[0].quantity,
    4,
  );
  await fill(`[data-regiment-drawback="${drawback.id}"]`, false);
  const reduced = plain(w.KadatFeatures.regiment.snapshot().extraEquipment);
  assert(reduced[0].quantity < 4, "Supply is automatically reduced");
  await click("#regiment-next");
  await click("#regiment-submit");
  await click("#use-regiment-for-character");
  const draft = w.KadatCharacterUI.store.get();
  assert.equal(draft.originSource, "regiment");
  assert.deepEqual(plain(draft.regiment.extraEquipment), reduced);
  assert.deepEqual(
    JSON.parse(w.localStorage.getItem(w.KadatStorage.KEYS.regiments))[0]
      .extraEquipment,
    reduced,
  );
  assert(
    w.KadatCharacterUI.getCharacter().world.equipment.some(
      (e) => e.includes(item.name) && e.includes(String(reduced[0].quantity)),
    ),
  );
  // Xeno race and beast, including fixed values and workspace replacement.
  await click('[data-registry-mode="xeno"]');
  await fill("#xeno-name", "Ирис");
  await click("#xeno-next");
  w.Math.random = () => 0.05;
  await click("#xeno-roll-stats");
  await click("#xeno-next");
  await click("#xeno-roll-form");
  await click("#xeno-next");
  await click("#xeno-roll-archetype");
  await click("#xeno-next");
  await click("#xeno-roll-feature");
  await click("#xeno-submit");
  assert(!$("#xeno-result-view").classList.contains("hidden"));
  await click("#create-xeno-character");
  const race = w.KADAT_DATA.races.find((r) => r.generatedXeno);
  assert(race);
  assert.equal(w.KadatCharacterUI.store.get().raceId, race.id);
  const c = w.KadatCharacterUI.getCharacter();
  assert.equal(c.breakdown.НС.generation, 0);
  assert.equal(
    c.wounds,
    race.fixedWounds + c.world.woundBonus + c.specialty.woundBonus,
  );
  const xenoBackup = JSON.parse(w.KadatWorkspace.serialize()).data;
  w.KadatWorkspace.validate(xenoBackup);
  w.KadatWorkspace.restore(cleanBackup);
  await tick();
  assert(!w.KADAT_DATA.races.some((r) => r.generatedXeno));
  w.KadatWorkspace.restore(xenoBackup);
  await tick();
  assert.equal(w.KADAT_DATA.races.filter((r) => r.generatedXeno).length, 1);
  await click('[data-registry-mode="xeno"]');
  await click('[data-xeno-go="0"]');
  await fill("#xeno-type", "beast");
  await click("#xeno-next");
  await click("#xeno-roll-stats");
  await click('[data-xeno-go="3"]');
  await click("#xeno-roll-archetype");
  await click("#xeno-next");
  await click("#xeno-submit");
  assert(!$("#xeno-result-view").classList.contains("hidden"));
  assert.equal($("#create-xeno-character"), null);
  assert.match($("#xeno-result").textContent, /Ксено-зверь/);
  // Complete armor creation through real controls.
  await click('[data-registry-mode="power-armor"]');
  await fill("#pa-name", "Сигма");
  await fill("#pa-class", "medium");
  await click("#pa-next");
  await fill("#pa-ground", 15);
  await fill("#pa-alt", "jump");
  await fill("#pa-alt-speed", 10);
  await click("#pa-next");
  await fill("#pa-left", "manipulator");
  await fill("#pa-right", "servo-claws");
  await click("#pa-next");
  await fill("#pa-armor", "prototype");
  await click("#pa-next");
  await click("#pa-submit");
  assert(!$("#power-armor-result-view").classList.contains("hidden"));
  assert.match($("#pa-result").textContent, /545/);
  const storedDesign = JSON.parse(
    w.localStorage.getItem(w.KadatStorage.KEYS.armor),
  );
  assert.equal(storedDesign.knownMass, 545);
  const storage = app.storage();
  await tick();
  assert.deepEqual(app.errors, []);
  app.dom.window.close();
  const reloaded = await loadApp(storage);
  assert.equal(reloaded.w.KadatFeatures.armor.snapshot().classId, "medium");
  assert.equal(reloaded.w.KadatFeatures.xeno.snapshot().type, "beast");
  assert.equal(
    reloaded.w.KadatCharacterUI.store.get().raceId,
    "generated-xeno-race",
  );
  assert.deepEqual(reloaded.errors, []);
  reloaded.dom.window.close();
  // Corrupt drafts must not prevent loading other modes or delete the raw record.
  const broken = {
    "kadat.xeno-draft.v2": '{"type":"race","choices":{"exoticStats":[]}}',
    "kadat.armor-draft.v2": '{"classId":"medium","step":4}',
    "kadat.generated-xeno-race.v1": '{"generatedXeno":true}',
    "kadat.character-draft.v2": "{broken",
    "kadat.regiment-draft.v2": "null",
  };
  const invalid = await loadApp(broken);
  assert.deepEqual(invalid.errors, []);
  assert.match(invalid.$("#app-notice").textContent, /сохранени/);
  assert.equal(
    invalid.w.localStorage.getItem("kadat.character-draft.v2"),
    "{broken",
  );
  invalid.dom.window.close();
  // Existing v1 power-armor designs can open as an editable draft.
  const legacy = await loadApp({
    "kadat.generated-power-armor.v1": JSON.stringify(storedDesign),
  });
  assert.equal(
    legacy.w.KadatFeatures.armor.snapshot().leftManipulatorId,
    "manipulator",
  );
  assert.deepEqual(legacy.errors, []);
  legacy.dom.window.close();
  console.log(
    "Features: regiment supply reconciliation → saved source, xeno race/beast → character → backup/reload, armor 545 kg, corrupt saves and legacy v1 armor OK.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
