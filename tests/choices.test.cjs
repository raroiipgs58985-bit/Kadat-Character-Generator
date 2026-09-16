const assert = require("node:assert/strict");
const { loadApp, plain } = require("./helpers.cjs");
(async () => {
  const app = await loadApp();
  const { w, $, click, fill } = app;
  // Slot 2 chosen first must stay in slot 2, even with an empty slot 1.
  await click('[data-wizard-go="1"]');
  await fill("#specialty", "strelok");
  const selector = 'select[data-choice="strelok-choice-1"]';
  const value = $(selector + '[data-index="1"]').options[1].value;
  await fill(selector + '[data-index="1"]', value);
  assert.equal($(selector + '[data-index="0"]').value, "");
  assert.equal($(selector + '[data-index="1"]').value, value);
  // Fill a valid base draft, then exercise actual pool and repeatable talent controls.
  const engine = w.KadatCharacterUI.engine,
    d = engine.createDraft();
  d.mode = "random";
  for (const s of w.KADAT_DATA.stats) d.rolls[s] = 11;
  for (const c of w.KADAT_DATA.races[0].choices ?? [])
    d.raceChoices[c.id] = c.options.slice(0, c.count ?? 1);
  w.KadatCharacterUI.restore(d);
  await app.tick();
  assert.equal(engine.validate(d).length, 0);
  await click('[data-wizard-go="3"]');
  await click('[data-adv-tab="talents"]');
  await fill("#adv-talent-search", "Владение оружием");
  const talent = w.KADAT_ADVANCEMENT.talents.find(
    (t) => t.name === "Владение оружием",
  );
  const select = `select[data-talent-option="${talent.id}"]`;
  assert($(select).options.length > 1, "Embedded talent pools render");
  await fill(select, "Лаз");
  const before = w.KadatCharacterUI.getCharacter().availableXp;
  await click(`[data-action="buyTalent"][data-catalog-id="${talent.id}"]`);
  await click(`[data-action="buyTalent"][data-catalog-id="${talent.id}"]`);
  assert.equal(w.KadatCharacterUI.store.get().advancement.talents.length, 2);
  assert.equal(
    w.KadatCharacterUI.getCharacter().availableXp,
    before - 2 * engine.talentCost(talent.level),
  );
  await click('[data-adv-tab="purchases"]');
  await click('[data-action="undoTalent"]');
  assert.equal(w.KadatCharacterUI.store.get().advancement.talents.length, 1);
  const e = engine.createDraft();
  e.raceId = "eldar";
  const character = engine.build(e);
  const markup = w.KadatCharacterViews.dossier(character);
  assert(markup.includes(character.race.uniqueFeatures[0].accumulation));
  assert(markup.includes(character.race.uniqueFeatures[0].spending[0].text));
  assert.deepEqual(app.errors, []);
  app.dom.window.close();
  console.log(
    "Choices: empty multi-choice slot preserved, embedded talent pools, repeatable purchases/refunds and full racial resources OK.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
