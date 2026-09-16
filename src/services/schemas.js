/* Structural checks only; gameplay validation belongs to domain engines. */
(function (root) {
  "use strict";
  const validStep = (d) =>
    d.step === undefined ||
    (Number.isInteger(d.step) && d.step >= 0 && d.step <= 4);
  function validateXenoRace(r, stats) {
    return Boolean(
      r &&
        r.id === "generated-xeno-race" &&
        typeof r.name === "string" &&
        r.generatedXeno &&
        r.fixedGeneration &&
        r.baseStats &&
        stats.every((s) => Number.isFinite(r.baseStats[s])) &&
        ["skills", "talents", "traits", "equipment"].every((k) =>
          Array.isArray(r[k]),
        ) &&
        r.skills.every((v) => typeof v === "string") &&
        r.talents.every((v) => typeof v === "string") &&
        (!r.choices || (Array.isArray(r.choices) && r.choices.length === 0)) &&
        (!r.specialRules ||
          (Array.isArray(r.specialRules) &&
            r.specialRules.every(
              (v) =>
                v && typeof v.name === "string" && typeof v.text === "string",
            ))) &&
        ["implants", "psychicPowers"].every(
          (k) =>
            !r[k] ||
            (Array.isArray(r[k]) && r[k].every((v) => typeof v === "string")),
        ) &&
        r.traits.every((v) => typeof v === "string") &&
        r.equipment.every((v) => typeof v === "string") &&
        (!r.uniqueFeatures ||
          (Array.isArray(r.uniqueFeatures) &&
            r.uniqueFeatures.every(
              (f) =>
                f &&
                typeof f.name === "string" &&
                Number.isFinite(f.rating) &&
                (!f.spending ||
                  (Array.isArray(f.spending) &&
                    f.spending.every(
                      (v) =>
                        v &&
                        typeof v.name === "string" &&
                        typeof v.text === "string",
                    ))),
            ))) &&
        [
          "plannedPoints",
          "maxPerStat",
          "redistributionCount",
          "redistributionValue",
          "woundBonus",
        ].every((k) => Number.isFinite(r[k])) &&
        Number.isFinite(r.fixedWounds) &&
        Number.isFinite(r.startingXp) &&
        Number.isFinite(r.xpMultiplier),
    );
  }
  function validateXenoDraft(d, stats) {
    const c = d?.choices;
    return Boolean(
      d &&
        ["race", "beast"].includes(d.type) &&
        typeof d.name === "string" &&
        validStep(d) &&
        Number.isFinite(d.seed) &&
        c &&
        [c.exoticStats, c.warlikeTalents, c.apexTalents].every(
          (a) => Array.isArray(a) && a.every((v) => typeof v === "string"),
        ) &&
        ["warlikeReward", "keenSense", "extraLimbs", "breathWeapon"].every(
          (k) => typeof c[k] === "string",
        ) &&
        [d.formRoll, d.archetypeRoll, d.featureRoll].every(
          (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 100),
        ) &&
        Number.isInteger(d.size) &&
        d.size >= -3 &&
        d.size <= 6 &&
        (d.baseStats === null ||
          stats.every((s) => Number.isFinite(d.baseStats?.[s]))) &&
        (d.baseWounds === null || Number.isFinite(d.baseWounds)),
    );
  }
  function validateArmorDraft(d, data) {
    return Boolean(
      d &&
        typeof d.name === "string" &&
        validStep(d) &&
        data.byId(data.classes, d.classId) &&
        data.byId(data.manipulators, d.leftManipulatorId) &&
        data.byId(data.manipulators, d.rightManipulatorId) &&
        data.byId(data.armor, d.armorId) &&
        ["none", "jump", "flight", "underwater"].includes(
          d.alternateMovementType,
        ) &&
        Number.isFinite(d.groundSpeed) &&
        Number.isFinite(d.alternateSpeed) &&
        data.byId(data.weaponLayouts.arms, d.armLayoutId) &&
        data.byId(data.weaponLayouts.body, d.bodyLayoutId),
    );
  }

  const api = {
    validateXenoRace,
    validateXenoDraft,
    validateArmorDraft,
    validStep,
  };
  if (typeof module !== "undefined") module.exports = api;
  if (root) root.KadatSchemas = api;
})(typeof window !== "undefined" ? window : null);
