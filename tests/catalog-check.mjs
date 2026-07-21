import fs from "node:fs";
import vm from "node:vm";

const context = vm.createContext({ window: {} });
const files = [
  "advancement-config.js",
  "talents-compact-1.js",
  "talents-compact-2.js",
  "talents-source-1.js",
  "talents-source-2.js",
  "talents-source-3.js",
  "talents-source-4a.js",
  "talents-source-4b.js",
  "talents-source-finalize.js"
];

for (const file of files) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: file });
}

const advancement = context.window.KADAT_ADVANCEMENT;
if (!advancement) throw new Error("KADAT_ADVANCEMENT was not created");
if (advancement.skills.length !== 30) {
  throw new Error(`Expected 30 skills, got ${advancement.skills.length}`);
}
if (advancement.talents.length !== 242) {
  throw new Error(`Expected 242 talents, got ${advancement.talents.length}`);
}
if (!advancement.pools.weapon.includes("Лаз")) {
  throw new Error("Weapon pool is missing Лаз");
}
if (!advancement.pools.craft.includes("Оружейник")) {
  throw new Error("Craft pool is missing Оружейник");
}
if (!advancement.talents.some(talent => talent.name === "Владение оружием" && talent.option?.type === "pool")) {
  throw new Error("Weapon proficiency talent does not use a pool");
}
if (!advancement.talents.some(talent => talent.name === "Пси-сила" && talent.option?.type === "text")) {
  throw new Error("Psychic power talent does not request a specialization");
}

console.log(`Catalog OK: ${advancement.skills.length} skills, ${advancement.talents.length} talents.`);
