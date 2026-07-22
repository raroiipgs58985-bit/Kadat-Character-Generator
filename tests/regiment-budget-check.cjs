"use strict";

const assert = require("node:assert/strict");
const budget = require("../regiment-budget.js");

const result = budget.calculate({
  regimentEntries: [{ cost: 4 }, { cost: 5 }],
  drawbacks: [{ bonusPoints: 2 }, { bonusPoints: 3 }],
  extraEquipment: [
    { entry: { cost: 5 }, quantity: 3 },
    { entry: { cost: 2 }, quantity: 2 }
  ]
});

assert.equal(result.spent, 9);
assert.equal(result.drawbackBonus, 5);
assert.equal(result.remaining, 8);
assert.equal(result.equipmentPool, 46);
assert.equal(result.equipmentSpent, 19);
assert.equal(result.equipmentRemaining, 27);
assert.equal(result.unresolvedDrawbacks.length, 0);

const unresolved = budget.calculate({ drawbacks: [{ bonusPoints: null }] });
assert.equal(unresolved.drawbackBonus, 0);
assert.equal(unresolved.unresolvedDrawbacks.length, 1);

const plan = budget.planReductions([
  { entry: { id: "first", name: "Первая", cost: 5 }, quantity: 2 },
  { entry: { id: "last", name: "Последняя", cost: 15 }, quantity: 1 }
], 10);
assert.deepEqual(plan.reductions, [{ id: "last", name: "Последняя", quantity: 1, cost: 15 }]);
assert.equal(plan.unresolvedOverrun, 0);

console.log("Regiment budget OK");
