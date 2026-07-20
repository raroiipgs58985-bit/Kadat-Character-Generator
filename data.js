window.KADAT_DATA = {
  stats: ["НС", "НР", "СЛ", "ВН", "ЛВ", "ИН", "СВ", "ВС", "ОЩ"],
  races: [
    {
      id: "human",
      name: "Человек",
      baseStats: { НС: 25, НР: 25, СЛ: 25, ВН: 25, ЛВ: 25, ИН: 25, СВ: 25, ВС: 25, ОЩ: 25 },
      plannedPoints: 100,
      maxPerStat: 20,
      woundBonus: 8,
      startingXp: 750,
      xpMultiplier: 1.25,
      skills: ["Общие знания", "Язык", "Ремесло"],
      talents: [],
      traits: ["Размер (0)", "Быстрое обучение: +25% стартового опыта"]
    }
  ],
  homeworlds: [
    {
      id: "none",
      name: "Без родного мира",
      statModifiers: {},
      woundBonus: 0,
      skills: [],
      talents: []
    },
    {
      id: "test-industrial",
      name: "Тестовый индустриальный мир",
      statModifiers: { ВН: 5, ИН: 5 },
      woundBonus: 3,
      skills: ["Бдительность"],
      talents: ["Выносливый"]
    }
  ],
  specialties: [
    {
      id: "none",
      name: "Без специальности",
      statModifiers: {},
      woundBonus: 0,
      skills: [],
      talents: [],
      xpCost: 0
    },
    {
      id: "test-soldier",
      name: "Тестовый стрелок",
      statModifiers: { НС: 5, ВН: 5 },
      woundBonus: 2,
      skills: ["Бдительность", "Уклонение"],
      talents: ["Выносливый", "Владение оружием (Огнестрельное)"],
      xpCost: 100
    }
  ]
};
