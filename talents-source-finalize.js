(() => {
  const source = window.KADAT_SOURCE_TALENTS ?? [];
  const oldCatalog = window.KADAT_ADVANCEMENT.talents ?? [];
  const key = value => String(value ?? "")
    .toLocaleLowerCase("ru-RU")
    .replace(/[†‡«»]/g, "")
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9]+/gi, " ")
    .trim();

  const oldByName = new Map(oldCatalog.map(talent => [key(talent.name), talent]));
  const pool = window.KADAT_ADVANCEMENT.pools;
  const inferredOptions = {
    "пост человек": { type: "characteristic", repeatable: true, baseName: "Пост-человек" },
    "обостренные чувства": { type: "pool", repeatable: true, baseName: "Обострённые чувства", options: pool.senses },
    "сопротивляемость": { type: "pool", repeatable: true, baseName: "Сопротивляемость", options: pool.resistance },
    "парное оружие": { type: "pool", repeatable: true, baseName: "Парное оружие", options: ["Стрелковое", "Рукопашное"] },
    "мастерство": { type: "skill", repeatable: true, baseName: "Мастерство" },
    "владение оружием": { type: "pool", repeatable: true, baseName: "Владение оружием", options: pool.weapon },
    "владение экзотическим оружием": { type: "text", repeatable: true, baseName: "Владение экзотическим оружием", placeholder: "Название конкретного экзотического оружия" },
    "ненависть": { type: "text", repeatable: true, baseName: "Ненависть", placeholder: "Фракция или тип противника" },
    "связи выберите фракцию": { type: "text", repeatable: true, baseName: "Связи", placeholder: "Название фракции" },
    "хорошая репутация": { type: "text", repeatable: true, baseName: "Хорошая Репутация", placeholder: "Фракция, с которой есть Связи" },
    "механодендрит": { type: "pool", repeatable: true, baseName: "Механодендрит", options: ["Боевой", "Ремесленный"] },
    "зверь компаньон": { type: "text", repeatable: true, baseName: "Зверь-компаньон", placeholder: "Вид или имя зверя" },
    "пси сила": { type: "text", repeatable: true, baseName: "Пси-сила", placeholder: "Название пси-силы" },
    "ношение брони серво броня экзо броня": { type: "pool", repeatable: true, baseName: "Ношение брони", options: ["Серво-броня", "Экзо-броня"] },
    "знаток серво брони экзо брони": { type: "pool", repeatable: true, baseName: "Знаток брони", options: ["Серво-броня", "Экзо-броня"] },
    "мастер экзо брони серво брони": { type: "pool", repeatable: true, baseName: "Мастер брони", options: ["Экзо-броня", "Серво-броня"] },
    "ношение брони силовая броня бсс": { type: "pool", repeatable: true, baseName: "Ношение брони", options: ["Силовая броня", "БСС"] },
    "знаток силовой брони бсс": { type: "pool", repeatable: true, baseName: "Знаток брони", options: ["Силовая броня", "БСС"] },
    "мастер силовой брони бсс": { type: "pool", repeatable: true, baseName: "Мастер брони", options: ["Силовая броня", "БСС"] }
  };
  const repeatableNames = new Set([
    "крепкое телосложение", "пост человек", "обостренные чувства", "сопротивляемость",
    "парное оружие", "мастерство", "владение оружием", "владение экзотическим оружием",
    "ненависть", "связи выберите фракцию", "хорошая репутация", "механодендрит",
    "зверь компаньон", "пси сила"
  ]);

  window.KADAT_ADVANCEMENT.talents = source.map((talent, index) => {
    const talentKey = key(talent.name);
    const old = oldByName.get(talentKey);
    const option = old?.option ?? inferredOptions[talentKey];
    return {
      ...talent,
      id: `talent-source-${index + 1}`,
      option,
      repeatable: repeatableNames.has(talentKey) || Boolean(option?.repeatable)
    };
  });
  window.KADAT_ADVANCEMENT.talentCategories = [...new Set(source.map(talent => talent.category).filter(Boolean))];
  delete window.KADAT_SOURCE_TALENTS;
})();
