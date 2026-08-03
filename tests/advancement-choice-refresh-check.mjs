import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

class FakeControl {
  constructor(kind = "div") {
    this.kind = kind;
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  matches(selector) {
    return selector.split(",").includes(this.kind);
  }

  dispatch(type) {
    for (const listener of this.listeners.get(type) ?? []) listener({ target: this });
  }
}

const controls = {
  "#gender": new FakeControl("select"),
  "#manual-skills": new FakeControl("input"),
  "#manual-talents": new FakeControl("input"),
  "#race-choices": new FakeControl(),
  "#homeworld-choices": new FakeControl(),
  "#specialty-choices": new FakeControl(),
  "#stats-grid": new FakeControl(),
  "#roll-button": new FakeControl("button"),
  "#reset-button": new FakeControl("button")
};

const stats = ["НС", "НР", "СЛ", "ВН", "ЛВ", "ИН", "СВ", "ВС", "ОЩ"];
const raceSelect = new FakeControl("select");
const worldSelect = new FakeControl("select");
const specialtySelect = new FakeControl("select");
const modeSelect = new FakeControl("select");
let renderCount = 0;

const context = vm.createContext({
  validateCharacter: () => "",
  buildCharacter: () => ({
    stats: Object.fromEntries(stats.map(stat => [stat, 30])),
    race: {}, world: {}, specialty: {}, skills: new Map(), talents: [], availableXp: 750
  }),
  renderResult: () => {},
  remainingXp: () => 750,
  currentSkillProfiles: () => [],
  buildBaseTalentMap: () => new Map(),
  advancementSpent: () => 0,
  characteristicBonus: () => 3,
  escapeHtml: value => String(value),
  formatNumber: value => String(value),
  advancementReset: () => {},
  renderAdvancement: () => { renderCount += 1; },
  DATA: { stats },
  state: {
    advancement: {
      characteristics: Object.fromEntries(stats.map(stat => [stat, 0])),
      skills: {},
      talents: []
    }
  },
  raceSelect,
  worldSelect,
  specialtySelect,
  modeSelect,
  result: {
    classList: { contains: () => false },
    appendChild: () => {}
  },
  document: {
    querySelector: selector => controls[selector] ?? null,
    createElement: () => ({ innerHTML: "", firstElementChild: null })
  },
  setTimeout: callback => { callback(); return 1; },
  console
});

const source = fs.readFileSync(new URL("../advancement-runtime.js", import.meta.url), "utf8");
vm.runInContext(source, context, { filename: "advancement-runtime.js" });
renderCount = 0;

controls["#specialty-choices"].dispatch("change");
assert.equal(renderCount, 1, "Выбор специальности должен обновлять развитие");

controls["#homeworld-choices"].dispatch("change");
assert.equal(renderCount, 2, "Выбор родного мира должен обновлять развитие");

controls["#race-choices"].dispatch("change");
assert.equal(renderCount, 3, "Выбор расы должен обновлять развитие");

controls["#specialty-choices"].dispatch("input");
assert.equal(renderCount, 4, "Текстовый выбор специальности должен обновлять развитие");

console.log("Advancement choice refresh OK");
