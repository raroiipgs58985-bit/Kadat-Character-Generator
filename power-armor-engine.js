(() => {
  "use strict";

  function stepMass(speed, system) {
    if (!system || !speed) return 0;
    return Math.ceil(Number(speed) / 5) * Number(system.massPer5 ?? 0);
  }

  function buildDesign(state, data = window.KADAT_POWER_ARMOR_DATA) {
    const armorClass = data.byId(data.classes, state.classId);
    if (!armorClass) throw new Error("Не выбран класс экзо-брони.");

    const left = data.byId(data.manipulators, state.leftManipulatorId || "glove") ?? data.manipulators[0];
    const right = data.byId(data.manipulators, state.rightManipulatorId || "glove") ?? data.manipulators[0];
    const armor = data.byId(data.armor, state.armorId || "standard") ?? data.armor[0];
    const alternateType = state.alternateMovementType || "none";
    const alternateSystem = alternateType === "none" ? null : armorClass[alternateType];

    const groundSpeed = Number(state.groundSpeed || 5);
    const alternateSpeed = alternateSystem ? Number(state.alternateSpeed || 5) : 0;
    const groundMass = stepMass(groundSpeed, armorClass.ground);
    const alternateMass = stepMass(alternateSpeed, alternateSystem);
    const manipulatorMass = Number(left.mass ?? 0) + Number(right.mass ?? 0);
    const knownMass = Number(armorClass.chassisMass) + groundMass + alternateMass + manipulatorMass + Number(armor.mass ?? 0);
    const remainingMass = Number(armorClass.massMax) - knownMass;
    const integrity = Number((Number(armorClass.integrity) * Number(armor.integrityModifier ?? 1)).toFixed(2));
    const leftSlotsFree = Math.max(0, Number(armorClass.armSlots) - Number(left.armSlotCost ?? 0));
    const rightSlotsFree = Math.max(0, Number(armorClass.armSlots) - Number(right.armSlotCost ?? 0));

    return {
      name: String(state.name || "Безымянная серво-броня").trim(),
      armorClass,
      movement: {
        groundSpeed,
        groundMass,
        alternateType,
        alternateSpeed,
        alternateMass,
        alternateSystem
      },
      manipulators: { left, right, mass: manipulatorMass },
      armor,
      knownMass,
      remainingMass,
      integrity,
      armorPoints: armor.armor,
      mountSlots: armor.mountSlots,
      weaponSlots: {
        leftTotal: armorClass.armSlots,
        rightTotal: armorClass.armSlots,
        bodyTotal: armorClass.bodySlots,
        leftFree: leftSlotsFree,
        rightFree: rightSlotsFree,
        bodyFree: armorClass.bodySlots
      },
      reinforcementLimit: armorClass.reinforcementLimit,
      armLayout: data.byId(data.weaponLayouts.arms, state.armLayoutId) ?? null,
      bodyLayout: data.byId(data.weaponLayouts.body, state.bodyLayoutId) ?? null,
      sourceNote: "Рассчитывается только масса компонентов, для которых масса прямо указана в исходной таблице. Масса вооружения и неописанного оборудования не добавляется автоматически."
    };
  }

  function validate(state, data = window.KADAT_POWER_ARMOR_DATA) {
    const errors = [];
    const armorClass = data.byId(data.classes, state.classId);
    if (!armorClass) return ["Выберите класс экзо-брони."];

    const groundSpeed = Number(state.groundSpeed || 0);
    if (groundSpeed < 5 || groundSpeed > armorClass.ground.maxSpeed || groundSpeed % 5 !== 0) {
      errors.push(`Наземная скорость должна быть кратна 5 и находиться в диапазоне 5–${armorClass.ground.maxSpeed} м.`);
    }

    const alternateType = state.alternateMovementType || "none";
    if (alternateType !== "none") {
      const system = armorClass[alternateType];
      if (!system) errors.push("Выбранный неназемный тип передвижения недоступен этому классу.");
      else {
        const speed = Number(state.alternateSpeed || 0);
        if (speed < 5 || speed > system.maxSpeed || speed % 5 !== 0) errors.push(`Скорость дополнительной системы должна быть кратна 5 и находиться в диапазоне 5–${system.maxSpeed} м.`);
      }
    }

    const design = buildDesign(state, data);
    if (design.knownMass > armorClass.massMax) errors.push(`Учтённая масса превышает максимум класса на ${design.knownMass - armorClass.massMax} кг.`);
    if (design.manipulators.left.armSlotCost > armorClass.armSlots) errors.push("Левый модульный адаптер требует больше слотов руки, чем доступно классу.");
    if (design.manipulators.right.armSlotCost > armorClass.armSlots) errors.push("Правый модульный адаптер требует больше слотов руки, чем доступно классу.");
    return errors;
  }

  const api = { stepMass, buildDesign, validate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.KADAT_POWER_ARMOR_ENGINE = api;
})();
