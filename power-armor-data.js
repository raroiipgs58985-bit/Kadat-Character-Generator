(() => {
  "use strict";

  const STORAGE_KEY = "kadat.generated-power-armor.v1";

  const CLASSES = [
    { id: "exoskeleton", name: "Экзоскелет", massMin: 80, massMax: 400, chassisMass: 80, integrity: 10, armSlots: 2, bodySlots: 2, reinforcementLimit: 2,
      ground: { massPer5: 25, maxSpeed: 15 }, jump: { massPer5: 25, maxSpeed: 15 }, flight: { massPer5: 30, maxSpeed: 35 }, underwater: { massPer5: 45, maxSpeed: 25 } },
    { id: "light", name: "Лёгкая", massMin: 401, massMax: 750, chassisMass: 100, integrity: 20, armSlots: 2, bodySlots: 4, reinforcementLimit: 6,
      ground: { massPer5: 30, maxSpeed: 15 }, jump: { massPer5: 25, maxSpeed: 15 }, flight: { massPer5: 40, maxSpeed: 30 }, underwater: { massPer5: 45, maxSpeed: 25 } },
    { id: "medium", name: "Средняя", massMin: 751, massMax: 1000, chassisMass: 175, integrity: 30, armSlots: 3, bodySlots: 4, reinforcementLimit: 10,
      ground: { massPer5: 40, maxSpeed: 15 }, jump: { massPer5: 50, maxSpeed: 15 }, flight: { massPer5: 60, maxSpeed: 25 }, underwater: { massPer5: 85, maxSpeed: 20 } },
    { id: "heavy", name: "Тяжёлая", massMin: 1001, massMax: 1500, chassisMass: 300, integrity: 40, armSlots: 3, bodySlots: 6, reinforcementLimit: 14,
      ground: { massPer5: 80, maxSpeed: 10 }, jump: { massPer5: 125, maxSpeed: 10 }, flight: null, underwater: { massPer5: 160, maxSpeed: 15 } },
    { id: "superheavy", name: "Сверхтяжёлая", massMin: 1501, massMax: 2000, chassisMass: 550, integrity: 50, armSlots: 4, bodySlots: 6, reinforcementLimit: 18,
      ground: { massPer5: 160, maxSpeed: 10 }, jump: { massPer5: 250, maxSpeed: 10 }, flight: null, underwater: { massPer5: 250, maxSpeed: 10 } }
  ];

  const MANIPULATORS = [
    { id: "none", name: "Нет", mass: -5, armSlotCost: 0, description: "Манипулятор отсутствует; масса шасси уменьшается на 5 кг за эту руку.", properties: "Нет" },
    { id: "modular", name: "Модульный адаптер", mass: 10, armSlotCost: 2, description: "Универсальное крепление для быстрой смены манипуляторов.", properties: "За 2 ОД может сменить модульный манипулятор на другой массой не более 30 кг. Требует 2 слота вооружения руки." },
    { id: "glove", name: "Бронированная перчатка", mass: 0, armSlotCost: 0, description: "Функционал обычной руки; входит в базовую конструкцию.", properties: "Размер кисти 0. Штраф −10 на тонкие манипуляции." },
    { id: "manipulator", name: "Манипулятор", mass: 15, armSlotCost: 0, description: "Пятипалая робо-кисть.", properties: "Серво-усилитель (50/2) для экзоскелета; классы выше получают +10/1 за каждый класс. Ближний бой: 0–2 м, 2к10+5 У, ББ 4." },
    { id: "servo-claws", name: "Серво-когти", mass: 35, armSlotCost: 0, description: "Трёх-четырёхпалая робо-кисть с острыми когтями.", properties: "Серво-усилитель (50/3) для экзоскелета; классы выше получают +10/2 за каждый класс. Ближний бой: 0–2 м, 3к10+5 У, ББ 4, БО, Разрывное, Когти." },
    { id: "heavy-servo-claws", name: "Тяжёлые серво-когти", mass: 50, armSlotCost: 0, description: "Трёхпалая тяжёлая робо-кисть с крупными когтями.", properties: "Серво-усилитель (50/3) для экзоскелета; классы выше получают +10/2 за каждый класс. Ближний бой: 0–2 м, 3к10+5 У, ББ 4, БО, Разрывное, Когти, Громоздкое, Несбалансированное." },
    { id: "drill", name: "Промышленная дрель", mass: 30, armSlotCost: 0, description: "Промышленная дрель под 30 мм для металла и камня.", properties: "1к10+5 У, ББ 4, Разрывное, Калечащее (2), Неточное, Несбалансированное." },
    { id: "rescue-arm", name: "Рука-спасатель", mass: 30, armSlotCost: 0, description: "Спасательный манипулятор с датчиками, лазерными резаками и пилами.", properties: "Извлечение из экзо-брони 2 ОД, из техники 4 ОД, +1 ОД за размер больше 3-го." }
  ];

  const ARMOR = [
    { id: "standard", name: "Стандартная", integrityModifier: 1, armor: 5, mass: 50, mountSlots: 0, description: "Стандартная комбинированная броня, установленная на рёбра жёсткости." },
    { id: "advanced", name: "Продвинутая", integrityModifier: 1.25, armor: 6, mass: 40, mountSlots: 5, description: "." },
    { id: "prototype", name: "Прототип", integrityModifier: 1.5, armor: 10, mass: 100, mountSlots: 4, description: "." },
    { id: "stealth-standard", name: "Стелс (стандарт)", integrityModifier: 0.5, armor: 5, mass: 55, mountSlots: 3, description: "." },
    { id: "stealth-advanced", name: "Стелс (продвинутый)", integrityModifier: 0.75, armor: 6, mass: 60, mountSlots: 5, description: "." },
    { id: "stealth-prototype", name: "Стелс (прототип)", integrityModifier: 1, armor: 8, mass: 100, mountSlots: 4, description: "." },
    { id: "fireproof", name: "Огнеупорная", integrityModifier: 1.25, armor: 7, mass: 60, mountSlots: 5, description: "." },
    { id: "nanomachine", name: "Наномашинная", integrityModifier: 2, armor: 10, mass: 50, mountSlots: 7, description: "." }
  ];

  const WEAPON_LAYOUTS = {
    arms: [
      { id: "one-heavy-one-light", name: "1 ТО и 1 ОС на каждую руку", ammo: "ОС — 5 магазинов; ТО — 1 магазин; СТ — 1 магазин; ракетный БК — 1 магазин." },
      { id: "two-light", name: "2 ОС на каждую руку", ammo: "ОС — 5 магазинов; ТО — 1 магазин; СТ — 1 магазин; ракетный БК — 1 магазин." }
    ],
    body: [
      { id: "two-heavy-two-light", name: "2 ТО и 2 ОС на корпус", ammo: "ОС — 10 магазинов; ТО — 2 магазина; СТ — 2 магазина; ракетный БК — 2 магазина." },
      { id: "one-super-two-light", name: "1 СТ и 2 ОС на корпус", ammo: "ОС — 10 магазинов; ТО — 2 магазина; СТ — 2 магазина; ракетный БК — 2 магазина." }
    ]
  };

  const byId = (items, id) => items.find(item => item.id === id) ?? null;
  const save = design => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(design)); } catch (error) { console.warn(error); }
    return design;
  };
  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (error) { console.warn(error); return null; }
  };

  window.KADAT_POWER_ARMOR_DATA = { STORAGE_KEY, classes: CLASSES, manipulators: MANIPULATORS, armor: ARMOR, weaponLayouts: WEAPON_LAYOUTS, byId, save, load };
})();
