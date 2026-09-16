"use strict";
const assert = require("node:assert/strict");

global.window = { KADAT_XENO_DATA: null };
global.localStorage = { getItem: () => null, setItem: () => {} };
require("../src/catalogs/xeno.js");
const data = global.window.KADAT_XENO_DATA;
const engine = require("../src/domain/xeno.js");

assert.equal(data.findByRoll(data.features, 63).id, "bio-shock");
assert.equal(data.findByRoll(data.features, 64).id, "bio-shock");
assert.equal(data.findByRoll(data.features, 65).id, "flexible");

for (const table of [
  data.forms,
  data.raceArchetypes,
  data.beastArchetypes,
  data.features,
]) {
  for (let roll = 1; roll <= 100; roll += 1)
    assert(data.findByRoll(table, roll), `Нет результата для к100=${roll}`);
}
assert.equal(
  data.isHumanSpecialtyAllowed({
    id: "soldier",
    category: "Имперская Гвардия",
    allowedRaces: ["human"],
  }),
  true,
);
assert.equal(
  data.isHumanSpecialtyAllowed({
    id: "sister",
    category: "Адепта Сороритас",
    allowedRaces: ["human"],
  }),
  false,
);
assert.equal(
  data.isHumanSpecialtyAllowed({
    id: "knight",
    category: "Квесторис",
    allowedRaces: ["human"],
  }),
  false,
);
assert.equal(
  data.isHumanSpecialtyAllowed({
    id: "marine",
    category: "Астартес",
    allowedRaces: ["human"],
  }),
  false,
);

const base = {
  НС: 30,
  НР: 30,
  СЛ: 30,
  ВН: 30,
  ЛВ: 30,
  ИН: 30,
  СВ: 30,
  ВС: 30,
  ОЩ: 30,
};
const profile = engine.buildProfile(
  {
    type: "race",
    name: "Тест",
    baseStats: base,
    baseWounds: 10,
    formRoll: 1,
    size: 0,
    archetypeRoll: 21,
    featureRoll: 63,
    seed: 123,
    choices: {},
  },
  data,
);
assert.equal(profile.archetype.id, "stealthy");
assert.equal(profile.feature.id, "bio-shock");
assert.equal(profile.stats.ИН, 40);
assert.equal(profile.stats.ВС, 40);
assert(profile.skills.includes("Бдительность"));
assert(profile.specialRules.some((rule) => rule.name === "Био-шоковая атака"));

const race = engine.toCharacterRace(profile);
assert.equal(race.generatedXeno, true);
assert.equal(race.fixedGeneration, true);
assert.equal(race.plannedPoints, 0);
assert.equal(race.fixedWounds, profile.wounds);

const beast = engine.buildProfile(
  {
    type: "beast",
    name: "Зверь",
    baseStats: base,
    baseWounds: 10,
    formRoll: 76,
    size: 1,
    archetypeRoll: 71,
    featureRoll: 99,
    seed: 321,
    choices: {},
  },
  data,
);
assert.equal(beast.type, "beast");
assert.equal(beast.form.id, "flying");
assert.equal(beast.archetype.id, "arboreal");
assert(beast.traits.some((value) => value.startsWith("Пси-рейтинг")));

console.log("Xeno engine OK");
