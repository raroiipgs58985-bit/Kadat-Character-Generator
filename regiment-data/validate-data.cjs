"use strict";

const path = require("node:path");
const base = __dirname;

global.window = global;

require(path.join(base, "regiment-data-core.js"));
for (let index = 1; index <= 7; index += 1) {
  require(path.join(base, "packed", `chunk-${String(index).padStart(2, "0")}.js`));
}
require(path.join(base, "packed", "chunk-01-tail.js"));
require(path.join(base, "regiment-data-loader.js"));

(async () => {
  const data = await global.KADAT_REGIMENT_DATA_READY;
  const expected = {
    homeworlds: 16,
    origins: 7,
    commanders: 17,
    regimentTypes: 19,
    trainingDoctrines: 19,
    equipmentDoctrines: 20,
    drawbacks: 18,
    extraEquipment: 45,
    universalKitItems: 14
  };

  const categories = [
    "homeworlds",
    "origins",
    "commanders",
    "regimentTypes",
    "trainingDoctrines",
    "equipmentDoctrines",
    "drawbacks",
    "extraEquipment"
  ];

  for (const category of categories) {
    if (!Array.isArray(data[category])) {
      throw new Error(`${category} is not an array`);
    }
    if (data[category].length !== expected[category]) {
      throw new Error(`${category}: expected ${expected[category]}, got ${data[category].length}`);
    }
  }

  const ids = new Set();
  for (const category of categories) {
    for (const entry of data[category]) {
      if (!entry.id || !entry.name || !entry.source?.row || !entry.source?.range) {
        throw new Error(`Incomplete entry in ${category}`);
      }
      if (ids.has(entry.id)) {
        throw new Error(`Duplicate id: ${entry.id}`);
      }
      ids.add(entry.id);

      for (const key of ["cost", "woundBonus", "bonusPoints"]) {
        if (key in entry && entry[key] !== null && typeof entry[key] !== "number") {
          throw new Error(`${entry.id}.${key} must be number or null`);
        }
      }
    }
  }

  const mounts = data.equipmentDoctrines.find(entry => entry.name === "Боевые скакуны");
  if (!mounts || mounts.cost !== null) {
    throw new Error("Missing source price for Боевые скакуны must remain null");
  }

  if (!data.standardKit || data.standardKit.universalItems.length !== expected.universalKitItems) {
    throw new Error("Universal kit item count mismatch");
  }

  if (data.policy.inferMissingValues !== false || data.policy.preserveSourceBalance !== true) {
    throw new Error("Source-preservation policy changed");
  }

  console.log(`Regiment data OK: ${ids.size} entries, ${data.standardKit.universalItems.length} universal kit items.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
