"use strict";
const assert = require("node:assert/strict");
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {} };
require("../src/catalogs/power-armor.js");
const data = global.window.KADAT_POWER_ARMOR_DATA;
const engine = require("../src/domain/power-armor.js");

assert.equal(data.classes.length, 5);
assert.equal(data.manipulators.length, 8);
assert.equal(data.armor.length, 8);

const design = engine.buildDesign(
  {
    name: "Тест",
    classId: "medium",
    groundSpeed: 15,
    alternateMovementType: "jump",
    alternateSpeed: 10,
    leftManipulatorId: "manipulator",
    rightManipulatorId: "servo-claws",
    armorId: "prototype",
    armLayoutId: "one-heavy-one-light",
    bodyLayoutId: "two-heavy-two-light",
  },
  data,
);
assert.equal(design.movement.groundMass, 120);
assert.equal(design.movement.alternateMass, 100);
assert.equal(design.manipulators.mass, 50);
assert.equal(design.knownMass, 545);
assert.equal(design.integrity, 45);
assert.equal(design.armorPoints, 10);
assert.equal(design.reinforcementLimit, 10);
assert.deepEqual(
  engine.validate(
    {
      classId: "medium",
      groundSpeed: 15,
      alternateMovementType: "jump",
      alternateSpeed: 10,
      leftManipulatorId: "manipulator",
      rightManipulatorId: "servo-claws",
      armorId: "prototype",
    },
    data,
  ),
  [],
);
assert(
  engine.validate(
    {
      classId: "heavy",
      groundSpeed: 15,
      alternateMovementType: "flight",
      alternateSpeed: 5,
      leftManipulatorId: "glove",
      rightManipulatorId: "glove",
      armorId: "standard",
    },
    data,
  ).length >= 1,
);
console.log("Power armor engine OK");
