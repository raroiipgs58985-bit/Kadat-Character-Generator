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

// Реальная нормализованная база содержит пустые структурированные поля рядом
// с исходными текстовыми полями. Пустые объекты и массивы не должны блокировать
// разбор characteristicsText, skillsText, talentsText и equipmentText.
const emptyStructuredFields = {
  statModifiers: {},
  skills: [],
  talents: [],
  equipment: []
};

const catalog = {
  homeworlds: [{
    ...emptyStructuredFields,
    id: "world",
    name: "Мир смерти",
    characteristicsText: "ВС/СЛ/ВН +5 к двум из них.",
    skillsText: "Выживание +10",
    woundBonus: 3
  }],
  origins: [{
    ...emptyStructuredFields,
    id: "origin",
    name: "Схола",
    characteristicsText: "НС/НР/СВ +5 к каждой.",
    skillsText: "Общие знания (Война, Империум)"
  }],
  commanders: [{
    ...emptyStructuredFields,
    id: "commander",
    name: "Аскет",
    talentsText: "Аскетизм и тренировки: каждый персонаж получает +5 к одной характеристике по своему выбору."
  }],
  regimentTypes: [{
    ...emptyStructuredFields,
    id: "type",
    name: "Линейная пехота",
    talentsText: "Неистовство или Пресыщенный",
    equipmentText: "Лазган или автоган"
  }],
  trainingDoctrines: [],
  equipmentDoctrines: [],
  drawbacks: [],
  extraEquipment: [{ id: "grenade", name: "Фраг-граната" }],
  standardKit: { universalItems: ["Форма", { name: "Респиратор" }] }
};
const snapshot = {
  id: "reg-test",
  name: "9-й полк",
  homeworldId: "world",
  originId: "origin",
  commanderId: "commander",
  regimentTypeId: "type",
  trainingIds: [],
  equipmentDoctrineIds: [],
  drawbackId: "",
  extraEquipment: [{ id: "grenade", quantity: 2 }]
};

const mechanics = api.buildMechanics(catalog, snapshot);
assert.equal(mechanics.woundBonus, 3);
assert.deepEqual(mechanics.fixedStatModifiers, { НС: 5, НР: 5, СВ: 5 });
assert.equal(mechanics.skills.filter(skill => skill === "Выживание").length, 3);
assert.ok(mechanics.skills.includes("Общие знания (Война)"));
assert.ok(mechanics.skills.includes("Общие знания (Империум)"));
assert.ok(mechanics.equipment.includes("Фраг-граната ×2"));
assert.ok(mechanics.equipment.includes("Форма"));
assert.equal(mechanics.choices.filter(choice => choice.kind === "stat").length, 2);
assert.equal(mechanics.choices.filter(choice => choice.kind === "talent").length, 1);
assert.equal(mechanics.choices.filter(choice => choice.kind === "equipment").length, 1);

const selections = {};
for (const choice of mechanics.choices) {
  if (choice.kind === "stat" && choice.choose === 2) selections[choice.id] = ["ВС", "ВН"];
  if (choice.kind === "stat" && choice.choose === 1) selections[choice.id] = ["ИН"];
  if (choice.kind === "talent") selections[choice.id] = "Пресыщенный";
  if (choice.kind === "equipment") selections[choice.id] = "Лазган";
}
const world = api.buildSyntheticWorld(catalog, snapshot, selections);
assert.equal(world.statModifiers.ВС, 5);
assert.equal(world.statModifiers.ВН, 5);
assert.equal(world.statModifiers.ИН, 5);
assert.equal(world.statModifiers.НС, 5);
assert.ok(world.skills.includes("Выживание"));
assert.ok(world.skills.includes("Общие знания (Война)"));
assert.ok(world.talents.includes("Пресыщенный"));
assert.ok(world.equipment.includes("Лазган"));
assert.equal(world.regimentSource, true);

console.log("Regiment-character link OK");
