(() => {
  "use strict";

  const ALIASES = {
    characteristicText: "characteristicsText",
    skillText: "skillsText",
    talentText: "talentsText",
    ruleText: "rulesText",
    specialRuleText: "specialRulesText"
  };

  function applyAliases(data) {
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
      for (const entry of data?.[category] ?? []) {
        for (const [source, target] of Object.entries(ALIASES)) {
          if (!entry[target] && entry[source]) entry[target] = entry[source];
        }
      }
    }
    return data;
  }

  const ready = Promise.resolve(window.KADAT_REGIMENT_DATA_READY).then(applyAliases);
  window.KADAT_REGIMENT_DATA_READY = ready;
  window.KADAT_REGIMENT_DATA_ALIASES_READY = ready;
  window.KADAT_REGIMENT_DATA_APPLY_ALIASES = applyAliases;
})();
