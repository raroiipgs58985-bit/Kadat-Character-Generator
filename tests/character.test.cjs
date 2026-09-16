const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { loadDomain, plain } = require("./helpers.cjs");
const { data, adv, engine, api } = loadDomain();
const source = JSON.stringify(data),
  fixtures = fs
    .readFileSync("tests/fixtures/characters-v1.jsonl", "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
for (const { input, expected } of fixtures) {
  const c = engine.build({ ...engine.createDraft(), ...input });
  for (const [name, value] of Object.entries(expected))
    assert.deepEqual(
      plain(
        name === "skills"
          ? [...c.skills]
          : name === "equipment"
            ? c.specialtyEquipment
            : c[name],
      ),
      value,
      `${input.raceId}/${input.worldId}/${input.specialtyId}/${name}`,
    );
}
assert.equal(
  JSON.stringify(data),
  source,
  "Calculation must not mutate catalogs",
);
let d = engine.createDraft();
d.mode = "random";
d.rolls = Object.fromEntries(data.stats.map((s) => [s, 11]));
for (const choice of engine.origins(d).race.choices ?? [])
  d.raceChoices[choice.id] = choice.options.slice(0, choice.count ?? 1);
assert.equal(engine.validate(d).length, 0);
const before = engine.build(d);
let tx = engine.transact(d, { type: "buyCharacteristic", stat: "ВН" });
assert(tx.ok);
d = tx.draft;
assert.equal(engine.build(d).availableXp, before.availableXp - 250);
assert.equal(engine.build(d).wounds, before.wounds + 2);
tx = engine.transact(d, { type: "undoCharacteristic", stat: "ВН" });
assert(tx.ok);
d = tx.draft;
assert.equal(engine.build(d).availableXp, before.availableXp);
tx = engine.transact(d, { type: "buySkill", name: "Акробатика" });
assert(tx.ok);
d = tx.draft;
assert.equal(engine.build(d).skills.get("Акробатика"), 0);
assert.equal(engine.build(d).availableXp, before.availableXp - 200);
tx = engine.transact(d, { type: "buySkill", name: "Акробатика" });
assert(tx.ok);
d = tx.draft;
assert.equal(engine.build(d).skills.get("Акробатика"), 10);
assert.equal(engine.build(d).availableXp, before.availableXp - 550);
assert.equal(
  engine.transact(d, { type: "buySkill", name: "Акробатика" }).ok,
  false,
  "Over-budget purchase blocked",
);
d.transfers = [
  { from: "НС", to: "НР" },
  { from: "НС", to: "НР" },
];
d.rolls.НС = 2;
assert(
  !engine.validate(d, { baseOnly: true }).some((e) => e.field === "transfers"),
  "Legacy negative transfer contribution preserved",
);
assert.equal(engine.generation(d, "НС"), -8);
assert.equal(
  engine.characteristicCost(8),
  1000,
  "Legacy post-fourth cost preserved",
);
assert.equal(
  api.talentGrants([["Ночное зрение", "ночное зрение"]]).bonusXp,
  25,
);
const sourceSkills = api.skillProfiles([Array(9).fill("Акробатика")]);
assert.equal(sourceSkills.get("Акробатика").bonus, 30);
d = engine.createDraft();
d.mode = "planned";
d.plannedAdditions = Object.fromEntries(
  data.stats.map((s, i) => [s, i === 0 ? 19.5 : i === 1 ? 10.5 : 10]),
);
assert(
  !engine.validate(d, { baseOnly: true }).some((e) => e.step === 2),
  "Legacy fractional allocations explicitly preserved",
);
d.plannedAdditions.НС = NaN;
assert(engine.validate(d).some((e) => e.step === 2));
console.log(
  `Character: ${fixtures.length} baseline scenarios, immutable catalogs, purchases/refunds, caps, generation and preserved ambiguities OK.`,
);
