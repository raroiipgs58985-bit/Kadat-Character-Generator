(() => {
  "use strict";

  const asNumber = value => typeof value === "number" && Number.isFinite(value) ? value : null;

  function calculate({
    regimentEntries = [],
    drawbacks = [],
    extraEquipment = [],
    basePoints = 12,
    baseEquipmentPool = 30,
    equipmentPerRemainingPoint = 2
  } = {}) {
    const unresolvedRegiment = regimentEntries.filter(entry => asNumber(entry?.cost) === null);
    const spent = regimentEntries.reduce((sum, entry) => sum + (asNumber(entry?.cost) ?? 0), 0);
    const drawbackBonus = drawbacks.reduce((sum, entry) => sum + (asNumber(entry?.bonusPoints) ?? 0), 0);
    const unresolvedDrawbacks = drawbacks.filter(entry => asNumber(entry?.bonusPoints) === null);
    const remaining = basePoints + drawbackBonus - spent;
    const equipmentPool = baseEquipmentPool + Math.max(0, remaining) * equipmentPerRemainingPoint;
    const unresolvedEquipment = extraEquipment.filter(item => asNumber(item?.entry?.cost) === null);
    const equipmentSpent = extraEquipment.reduce(
      (sum, item) => sum + (asNumber(item?.entry?.cost) ?? 0) * Math.max(0, Number(item?.quantity ?? 0)),
      0
    );

    return {
      spent,
      drawbackBonus,
      remaining,
      equipmentPool,
      equipmentSpent,
      equipmentRemaining: equipmentPool - equipmentSpent,
      unresolvedRegiment,
      unresolvedDrawbacks,
      unresolvedEquipment
    };
  }

  function planReductions(extraEquipment = [], overrun = 0) {
    let remainingOverrun = Math.max(0, Number(overrun) || 0);
    const reductions = [];

    for (const item of [...extraEquipment].reverse()) {
      if (remainingOverrun <= 0) break;
      const cost = asNumber(item?.entry?.cost);
      const quantity = Math.max(0, Number(item?.quantity ?? 0));
      if (!item?.entry?.id || cost === null || cost <= 0 || quantity <= 0) continue;

      const quantityToRemove = Math.min(quantity, Math.ceil(remainingOverrun / cost));
      reductions.push({
        id: item.entry.id,
        name: item.entry.name || item.entry.id,
        quantity: quantityToRemove,
        cost
      });
      remainingOverrun -= quantityToRemove * cost;
    }

    return {
      reductions,
      unresolvedOverrun: Math.max(0, remainingOverrun)
    };
  }

  const api = { asNumber, calculate, planReductions };
  if (typeof window !== "undefined") window.KADAT_REGIMENT_BUDGET = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
