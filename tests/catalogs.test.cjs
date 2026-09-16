"use strict";
const assert = require("node:assert/strict"),
  crypto = require("node:crypto"),
  { loadDomain } = require("./helpers.cjs");
const { data: character, adv: advancement, regiments: data } = loadDomain();
assert.equal(character.races.length, 8);
assert.equal(character.homeworlds.length, 13);
assert.equal(character.specialties.length, 38);
assert.equal(advancement.skills.length, 30);
assert.equal(advancement.talents.length, 242);
const expected = {
  homeworlds: 16,
  origins: 7,
  commanders: 17,
  regimentTypes: 19,
  trainingDoctrines: 19,
  equipmentDoctrines: 20,
  drawbacks: 18,
  extraEquipment: 45,
  universalKitItems: 14,
};

const categories = [
  "homeworlds",
  "origins",
  "commanders",
  "regimentTypes",
  "trainingDoctrines",
  "equipmentDoctrines",
  "drawbacks",
  "extraEquipment",
];

for (const category of categories) {
  if (!Array.isArray(data[category])) {
    throw new Error(`${category} is not an array`);
  }
  if (data[category].length !== expected[category]) {
    throw new Error(
      `${category}: expected ${expected[category]}, got ${data[category].length}`,
    );
  }
}

const ids = new Set();
for (const category of categories) {
  for (const entry of data[category]) {
    if (
      !entry.id ||
      !entry.name ||
      !entry.source?.row ||
      !entry.source?.range
    ) {
      throw new Error(`Incomplete entry in ${category}`);
    }
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate id: ${entry.id}`);
    }
    ids.add(entry.id);

    for (const key of ["cost", "woundBonus", "bonusPoints"]) {
      if (
        key in entry &&
        entry[key] !== null &&
        typeof entry[key] !== "number"
      ) {
        throw new Error(`${entry.id}.${key} must be number or null`);
      }
    }
  }
}

const mounts = data.equipmentDoctrines.find(
  (entry) => entry.name === "Боевые скакуны",
);
if (!mounts || mounts.cost !== null) {
  throw new Error("Missing source price for Боевые скакуны must remain null");
}

if (
  !data.standardKit ||
  data.standardKit.universalItems.length !== expected.universalKitItems
) {
  throw new Error("Universal kit item count mismatch");
}

if (
  data.policy.inferMissingValues !== false ||
  data.policy.preserveSourceBalance !== true
) {
  throw new Error("Source-preservation policy changed");
}

console.log(
  `Regiment data OK: ${ids.size} entries, ${data.standardKit.universalItems.length} universal kit items.`,
);

const hashes = {
  character: "ddccec36481ebf81b4fc90b64d3a2be70d54e7d13c26e8a1e7e6835bee396dde",
  advancement:
    "c7c07f49b224dff6dcfb8dab4fde6add9e5b25040451ed83fdfa3656fcb92088",
  data: "9f21e50c30bc6a2a6a38a1fe3bd9ee35a197d8f82c4804dff0aab3ba75a039d9",
};
for (const [name, value] of Object.entries({ character, advancement, data }))
  assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"),
    hashes[name],
    `${name}: catalog changed from c04816b`,
  );
console.log("Normalized catalogs exactly match original c04816b snapshots.");
