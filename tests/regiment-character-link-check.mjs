import assert from "node:assert/strict";
import { createRequire } from "node:module";
import zlib from "node:zlib";

const require = createRequire(import.meta.url);
global.window = global;
for (const name of ["chunk-01.js", "chunk-02.js", "chunk-03.js"]) {
  require(`../regiment-character-link-packed/${name}`);
}
const encoded = global.KADAT_REGIMENT_CHARACTER_LINK_PACKED_CHUNKS.join("");
const source = zlib.gunzipSync(Buffer.from(encoded, "base64")).toString("utf8");
Function(source)();
const api = global.KADAT_REGIMENT_CHARACTER_LINK_INTERNALS;
assert.ok(api, "Regiment-character bridge API was not loaded");

// Точная форма записей, которую возвращает нормализованный каталог.
// В каталоге используются singular-поля characteristicText/skillText/talentText,
// а исторический мост ожидает plural-поля. Слой алиасов обязан их связать.
const catalog = {
  homeworlds: [{
    id: "homeworld-feudal",
    name: "Феодальный мир",
    characteristicText: "СЛ/ВН/НР +5 к двум из них.",
    skillText: "«Атлетика», «Общее знание (Война)»",
    woundBonus: 5
  }],
  origins: [{
    id: "origin-schola",
    name: "Схола Прогенум",
    characteristicText: "НС/НР/СВ +5 к каждой.",
    skillText: "«Общие знания (Война, Империум, Имперская Гвардия, Имперская Вера)», «Язык (Высокий готик, Низкий готик)» +10",
    woundBonus: 10
  }],
  commanders: [{
    id: "commander-rebel",
    name: "Бунтарь",
    talentText: "Сопротивляемость (Страх)",
    skillText: "нет"
  }],
  regimentTypes: [{
    id: "type-artillery",
    name: "Артиллерийский полк",
    characteristicText: "НС +5 или ИН +5, ВН -5",
    skillText: "Навигация (Наземная) или Логика",
    talentText: "Бомбардир",
    equipmentText: "лазкарабин (главное оружие) и четыре батареи и магнокль на игрового персонажа; «Василиск» на отделение или миномёт на каждых двух игровых персонажей; вокс-станция на отделение."
  }],
  trainingDoctrines: [],
  equipmentDoctrines: [],
  drawbacks: [{
    id: "drawback-a",
    name: "Недостаток А",
    bonusPoints: 2,
    talentText: "Стальные нервы"
  }, {
    id: "drawback-b",
    name: "Недостаток Б",
    bonusPoints: 3,
    skillText: "Выживание"
  }],
  extraEquipment: [{
    id: "quality-upgrade",
    name: "Улучшить качество одного предмета",
    cost: 5
  }],
  standardKit: { universalItems: [] }
};

global.KADAT_REGIMENT_DATA_READY = Promise.resolve(catalog);
require("../regiment-data-field-aliases.js");
const aliasedCatalog = await global.KADAT_REGIMENT_DATA_READY;

assert.equal(aliasedCatalog.homeworlds[0].characteristicsText, catalog.homeworlds[0].characteristicText);
assert.equal(aliasedCatalog.origins[0].skillsText, catalog.origins[0].skillText);
assert.equal(aliasedCatalog.commanders[0].talentsText, catalog.commanders[0].talentText);

const snapshot = {
  id: "reg-real",
  name: "Кее",
  homeworldId: "homeworld-feudal",
  originId: "origin-schola",
  commanderId: "commander-rebel",
  regimentTypeId: "type-artillery",
  trainingIds: [],
  equipmentDoctrineIds: [],
  drawbackIds: ["drawback-a", "drawback-b"],
  drawbackId: "drawback-a",
  extraEquipment: [{ id: "quality-upgrade", quantity: 3 }]
};

const mechanics = api.buildMechanics(aliasedCatalog, snapshot);
assert.equal(mechanics.woundBonus, 15);
assert.deepEqual(mechanics.fixedStatModifiers, { НС: 5, НР: 5, СВ: 5, ВН: -5 });
assert.equal(mechanics.choices.length, 4);
assert.equal(mechanics.choices.filter(choice => choice.kind === "stat").length, 1);
assert.equal(mechanics.choices.filter(choice => choice.kind === "stat-option").length, 1);
assert.equal(mechanics.choices.filter(choice => choice.kind === "skill").length, 1);
assert.equal(mechanics.choices.filter(choice => choice.kind === "equipment").length, 1);
assert.equal(mechanics.skills.filter(skill => skill === "Язык (Низкий готик)").length, 3);
assert.equal(mechanics.skills.filter(skill => skill === "Язык (Высокий готик)").length, 3);
assert.ok(mechanics.talents.includes("Сопротивляемость (Страх)"));
assert.ok(mechanics.talents.includes("Бомбардир"));
assert.ok(mechanics.talents.includes("Стальные нервы"));
assert.ok(mechanics.skills.includes("Выживание"));
assert.ok(mechanics.equipment.includes("Улучшить качество одного предмета ×3"));
assert.deepEqual(mechanics.selected.drawbacks.map(entry => entry.id), ["drawback-a", "drawback-b"]);

const legacyMechanics = api.buildMechanics(aliasedCatalog, { ...snapshot, drawbackIds: undefined, drawbackId: "drawback-a" });
assert.deepEqual(legacyMechanics.selected.drawbacks.map(entry => entry.id), ["drawback-a"]);

const selections = {};
for (const choice of mechanics.choices) {
  if (choice.kind === "stat") selections[choice.id] = ["СЛ", "ВН"];
  if (choice.kind === "stat-option") selections[choice.id] = "ИН:5";
  if (choice.kind === "skill") selections[choice.id] = "Логика";
  if (choice.kind === "equipment") selections[choice.id] = "Василиск на отделение";
}

const world = api.buildSyntheticWorld(aliasedCatalog, snapshot, selections);
assert.equal(world.statModifiers.СЛ, 5);
assert.equal(world.statModifiers.ВН, 0);
assert.equal(world.statModifiers.ИН, 5);
assert.equal(world.statModifiers.НС, 5);
assert.ok(world.skills.includes("Логика"));
assert.ok(world.talents.includes("Сопротивляемость (Страх)"));
assert.ok(world.talents.includes("Бомбардир"));
assert.ok(world.equipment.includes("Василиск на отделение"));
assert.equal(world.regimentSource, true);

console.log("Regiment-character link OK");
