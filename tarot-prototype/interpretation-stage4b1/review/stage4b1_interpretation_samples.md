# Imperial Tarot — Stage 4B-1: примеры для ручного review

16 фиксированных чтений. Engine 4b1.1.0.0; замороженный Data V1.0.0.

Основное prophecy отделено от технического trace. Вопрос сохранён как display context и не участвует в чтении.

`source_explicit` — подтверждённая структура Stage 4A. `engine_synthesis_heuristic` — организация повествования и сравнение существующих metadata; это не новые канонические правила.

Тема, общая для карт, означает повтор темы, а не обязательно благоприятное согласие. При отсутствии структурированного основания связь остаётся нейтральной.

До ручного review эти примеры не подключены к UI. Проверить связность, уместность framing, сдержанный тон и сохранение двух альтернатив Ветви.

## F01 — Император: преимущественно благоприятные Major

Расклад: **Император** (`imperator`). Seed: `hope-0`. Режим: `position_based`.

Coverage: `mostly_favourable_major`, `reproducibility_reference`, `display_question_only`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_00` — Пилигрим | `upright` | Прошлое и исток | `major_00.upright.core` |
| 2 | `major_17` — Астрономикон | `upright` | Настоящее и суть вопроса | `major_17.upright.core` |
| 3 | `major_21` — Галлактика | `upright` | Решение или возможный исход | `major_21.upright.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. Исток нынешнего вопроса лежит в прошлом. Перед тобой открывается начало пути, ещё не исчерпавшего своих возможностей. Такова нынешняя суть дела. Свет Астрономикона возвещает надежду, веру и вдохновение.

Карта указывает на возможное решение или исход. Круг дела замыкается, приближаясь к полноте и совершенству. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `imperator.sequence` | `imperator.p01` ↔ `imperator.p02` ↔ `imperator.p03` | CONTINUATION / source_structure | `source_explicit` |
| `heuristic.imperator.1_2` | `imperator.p01` ↔ `imperator.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.imperator.2_3` | `imperator.p02` ↔ `imperator.p03` | TRANSITION_TO_OUTCOME / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `closing_02` (closing).

## F02 — Император: дурные знаки, Демон и Имматериум

Расклад: **Император** (`imperator`). Seed: `adverse-17`. Режим: `position_based`.

Coverage: `adverse_major`, `daemon`, `immaterium`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_15` — Демон | `upright` | Прошлое и исток | `major_15.upright.core` |
| 2 | `major_18` — Имматериум | `upright` | Настоящее и суть вопроса | `major_18.upright.core` |
| 3 | `major_02` — Пророк | `reversed` | Решение или возможный исход | `major_02.reversed.core`, `major_02.reversed.warning` |

### MAIN PROPHECY

Перед взором чтеца лежат истоки дела и его возможные пути. Исток нынешнего вопроса лежит в прошлом. Знак Демона несёт опустошение, насилие и угрозу падения. Такова нынешняя суть дела. Имматериум скрывает опасность за обманом и ошибочным видением.

Карта указывает на возможное решение или исход. Образование соседствует здесь с эгоизмом и поверхностностью; знак особенно мрачен. Учёность сама по себе не освобождает от мелкости суждения. Таковы открывшиеся знаки; будущее ещё пребывает в движении.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `imperator.sequence` | `imperator.p01` ↔ `imperator.p02` ↔ `imperator.p03` | CONTINUATION / source_structure | `source_explicit` |
| `heuristic.imperator.1_2` | `imperator.p01` ↔ `imperator.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.imperator.2_3` | `imperator.p02` ↔ `imperator.p03` | TRANSITION_TO_OUTCOME / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_02` (opening), `closing_01` (closing).

Явное adverse ограничение сохранено: `major_15/upright`, `major_18/upright`, `major_02/reversed`.

## F03 — Император: три перевёрнутые Major

Расклад: **Император** (`imperator`). Seed: `403`. Режим: `position_based`.

Coverage: `reversed_major`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_00` — Пилигрим | `reversed` | Прошлое и исток | `major_00.reversed.core` |
| 2 | `major_11` — Титан | `reversed` | Настоящее и суть вопроса | `major_11.reversed.core` |
| 3 | `major_13` — Жнец | `reversed` | Решение или возможный исход | `major_13.reversed.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. Исток нынешнего вопроса лежит в прошлом. Начало задерживается: нерешительность и апатия удерживают тебя у порога. Знаки повторяют одну тему и усиливают её присутствие в раскладе. Такова нынешняя суть дела. Сила обращена в слабость, мелочность или злоупотребление должностью.

Карта указывает на возможное решение или исход. Перемена задержана: знак допускает застой либо едва достигнутое спасение от смерти. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `imperator.sequence` | `imperator.p01` ↔ `imperator.p02` ↔ `imperator.p03` | CONTINUATION / source_structure | `source_explicit` |
| `heuristic.imperator.1_2` | `imperator.p01` ↔ `imperator.p02` | REINFORCEMENT / shared_existing_theme_tags_only; tags: weakness | `engine_synthesis_heuristic` |
| `heuristic.imperator.2_3` | `imperator.p02` ↔ `imperator.p03` | TRANSITION_TO_OUTCOME / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `reinforcement_01` (imperator.origin_present.link), `closing_02` (closing).

## F04 — Император: истоки, власть и ремесло

Расклад: **Император** (`imperator`). Seed: `mixed-4`. Режим: `position_based`.

Coverage: `mixed_major_minor`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `adeptio_02` — Писарь | `standard` | Прошлое и исток | `adeptio_02.standard.core` |
| 2 | `major_04` — Бог Император | `upright` | Настоящее и суть вопроса | `major_04.upright.core` |
| 3 | `mandatio_03` — Ремесленник | `standard` | Решение или возможный исход | `mandatio_03.standard.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. Исток нынешнего вопроса лежит в прошлом. Дело держится на усердном исполнении повторяющегося долга. Такова нынешняя суть дела. Свершение обретает опору в уверенном и устойчивом руководстве.

Карта указывает на возможное решение или исход. Освоенное ремесло ведёт к работе и небольшому материальному приобретению. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `imperator.sequence` | `imperator.p01` ↔ `imperator.p02` ↔ `imperator.p03` | CONTINUATION / source_structure | `source_explicit` |
| `heuristic.imperator.1_2` | `imperator.p01` ↔ `imperator.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.imperator.2_3` | `imperator.p02` ↔ `imperator.p03` | TRANSITION_TO_OUTCOME / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `closing_02` (closing).

## F05 — Ветвь: надежда и дурное освобождение как разные пути

Расклад: **Ветвь (Предатель или Верный)** (`branch`). Seed: `fork-5`. Режим: `position_based`.

Coverage: `different_final_paths`, `group_semantics`, `daemon_reversed`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_00` — Пилигрим | `upright` | Прошлое и исток | `major_00.upright.core` |
| 2 | `excuteria_06` — Генерал | `standard` | Настоящее и суть вопроса | `excuteria_06.standard.core` |
| 3 | `adeptio_13` — Регент (Сигилит) | `standard` | Силы и варианты в совокупности (общая роль пары; индивидуальная не установлена) | `adeptio_13.standard.core` |
| 4 | `discordia_03` — Еретик | `standard` | Силы и варианты в совокупности (общая роль пары; индивидуальная не установлена) | `discordia_03.standard.core` |
| 5 | `major_17` — Астрономикон | `upright` | Два возможных направления (общая роль пары; индивидуальная не установлена) | `major_17.upright.core` |
| 6 | `major_15` — Демон | `reversed` | Два возможных направления (общая роль пары; индивидуальная не установлена) | `major_15.reversed.core` |

### MAIN PROPHECY

Перед взором чтеца лежат истоки дела и его возможные пути. Исток нынешнего вопроса лежит в прошлом. Перед тобой открывается начало пути, ещё не исчерпавшего своих возможностей. Такова нынешняя суть дела. Планирование требует сведений и взгляда на дело в целом.

В этой паре раскрываются действующие силы и доступные варианты. Непрестанное служение в тени высшего требует великой жертвы и возвышает способность над происхождением. Угроза зарождается внутри: крамола и измена скрываются среди своих.

Будущее расходится на два возможных направления. Первое направление: Свет Астрономикона возвещает надежду, веру и вдохновение. Второе направление: Откровение или освобождение приходит под знаком Демона и сохраняет дурное предзнаменование. Таковы открывшиеся знаки; будущее ещё пребывает в движении.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `branch.choice` | `branch.forces_options` ↔ `branch.branching_future` | TRANSITION_TO_OUTCOME / source_structure | `source_explicit` |
| `branch.alternatives` | `branch.p05` ↔ `branch.p06` | CONTINUATION / source_structure | `source_explicit` |
| `heuristic.branch.1_2` | `branch.p01` ↔ `branch.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_02` (opening), `closing_01` (closing).

Финальная пара — два направления, оба `selected: false`; соответствие 3→5 / 4→6 не утверждается.

Явное adverse ограничение сохранено: `major_15/reversed`.

## F06 — Ветвь: Discordia без перевёрнутых Minor

Расклад: **Ветвь (Предатель или Верный)** (`branch`). Seed: `discordia-6`. Режим: `position_based`.

Coverage: `discordia_heavy`, `minor_standard_only`, `group_semantics`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `discordia_01` — Арлекин | `standard` | Прошлое и исток | `discordia_01.standard.core` |
| 2 | `discordia_02` — Ксенос | `standard` | Настоящее и суть вопроса | `discordia_02.standard.core` |
| 3 | `discordia_03` — Еретик | `standard` | Силы и варианты в совокупности (общая роль пары; индивидуальная не установлена) | `discordia_03.standard.core` |
| 4 | `discordia_04` — Мутант | `standard` | Силы и варианты в совокупности (общая роль пары; индивидуальная не установлена) | `discordia_04.standard.core` |
| 5 | `discordia_05` — Ведьма/Маг(Колдун) | `standard` | Два возможных направления (общая роль пары; индивидуальная не установлена) | `discordia_05.standard.core` |
| 6 | `discordia_06` — Гнусный Змей | `standard` | Два возможных направления (общая роль пары; индивидуальная не установлена) | `discordia_06.standard.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. Исток нынешнего вопроса лежит в прошлом. Скрытый враг и непрямой союз меняют видимый ход событий, оставляя последствия неясными. Знаки повторяют одну тему и усиливают её присутствие в раскладе. Такова нынешняя суть дела. Неизвестная сила угрожает извне, вплоть до вторжения и нападения.

В этой паре раскрываются действующие силы и доступные варианты. Угроза зарождается внутри: крамола и измена скрываются среди своих. Слабость и порча сопровождаются отчуждением и положением изгоя.

Будущее расходится на два возможных направления. Первое направление: Необузданная воля стремится к запретному знанию и опасной свободе. Второе направление: Раскрытие тайны связано с порочностью и запретным знанием. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `branch.choice` | `branch.forces_options` ↔ `branch.branching_future` | TRANSITION_TO_OUTCOME / source_structure | `source_explicit` |
| `branch.alternatives` | `branch.p05` ↔ `branch.p06` | CONTINUATION / source_structure | `source_explicit` |
| `heuristic.branch.1_2` | `branch.p01` ↔ `branch.p02` | REINFORCEMENT / shared_existing_theme_tags_only; tags: unknown | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `reinforcement_01` (branch.origin_present.link), `closing_02` (closing).

Финальная пара — два направления, оба `selected: false`; соответствие 3→5 / 4→6 не утверждается.

## F07 — Трон Терры: совет мученика и условный исход

Расклад: **Трон Терры** (`throne_of_terra`). Seed: `throne-7`. Режим: `position_based`.

Coverage: `mixed_major_minor`, `advice_outcome_condition`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `adeptio_01` — Инквизитор | `standard` | Прошлое и исток | `adeptio_01.standard.core` |
| 2 | `major_00` — Пилигрим | `upright` | Настоящее и суть вопроса | `major_00.upright.core` |
| 3 | `excuteria_01` — Незнакомец | `standard` | Скрытое влияние | `excuteria_01.standard.core` |
| 4 | `adeptio_08` — Ассассин | `standard` | Препятствие | `adeptio_08.standard.core`, `adeptio_08.standard.warning` |
| 5 | `major_11` — Титан | `reversed` | Окружение | `major_11.reversed.core` |
| 6 | `major_12` — Мученик | `upright` | Совет | `major_12.upright.core`, `major_12.upright.advice` |
| 7 | `major_13` — Жнец | `upright` | Исход при исполнении совета | `major_13.upright.core` |

### MAIN PROPHECY

Перед взором чтеца лежат истоки дела и его возможные пути. Исток нынешнего вопроса лежит в прошлом. Абсолютная власть действует из-за завесы тайны, вызывая страх и скрывая истинное лицо. Такова нынешняя суть дела. Перед тобой открывается начало пути, ещё не исчерпавшего своих возможностей.

За видимым ходом дела остаётся скрытое влияние. Неизвестное требует силы, настойчивости и стремления исследовать. Этот знак описывает предстоящее препятствие. Невидимое действие может внезапно завершить дело; знак соединяет скрытую угрозу с простым решением. Простота решения не устраняет возможности внезапной смерти.

Окружение вступает в дело под этим знаком. Сила обращена в слабость, мелочность или злоупотребление должностью. Таков предлагаемый курс действий. Долг требует упорства, принятия и готовности к жертве. Определи, какой жертвы действительно требует твой долг.

Если прежнему совету последовать, возможен такой исход. Неизбежная перемена завершает прежнее и освобождает место новому; смерть также входит в смысл знака. Таковы открывшиеся знаки; будущее ещё пребывает в движении.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `throne_of_terra.advice_outcome` | `throne_of_terra.p06` ↔ `throne_of_terra.p07` | TRANSITION_TO_OUTCOME / source_structure; исход при следовании совету | `source_explicit` |
| `heuristic.throne_of_terra.1_2` | `throne_of_terra.p01` ↔ `throne_of_terra.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.3_4` | `throne_of_terra.p03` ↔ `throne_of_terra.p04` | WARNING / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.5_6` | `throne_of_terra.p05` ↔ `throne_of_terra.p06` | TRANSITION_TO_ADVICE / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_02` (opening), `closing_01` (closing).

Условие: `throne_of_terra.p06 → throne_of_terra.p07`; последняя карта не является безусловным будущим.

## F08 — Трон Терры: неблагоприятная карта в позиции совета

Расклад: **Трон Терры** (`throne_of_terra`). Seed: `throne-8`. Режим: `position_based`.

Coverage: `adverse_advice`, `daemon_reversed`, `advice_outcome_condition`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_03` — Святая Терра | `upright` | Прошлое и исток | `major_03.upright.core` |
| 2 | `mandatio_05` — Нобиль | `standard` | Настоящее и суть вопроса | `mandatio_05.standard.core` |
| 3 | `excuteria_08` — Навигатор | `standard` | Скрытое влияние | `excuteria_08.standard.core` |
| 4 | `discordia_04` — Мутант | `standard` | Препятствие | `discordia_04.standard.core`, `discordia_04.standard.warning` |
| 5 | `adeptio_09` — Проповедник | `standard` | Окружение | `adeptio_09.standard.core` |
| 6 | `major_15` — Демон | `reversed` | Совет | `major_15.reversed.core`, `major_15.reversed.advice` |
| 7 | `major_17` — Астрономикон | `upright` | Исход при исполнении совета | `major_17.upright.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. Исток нынешнего вопроса лежит в прошлом. Святая Терра знаменует дом, изобилие и способность дать начало жизни. Знаки повторяют одну тему и усиливают её присутствие в раскладе. Такова нынешняя суть дела. Благополучие связано с властью главы дома и установленным порядком.

За видимым ходом дела остаётся скрытое влияние. Путь зависит от руководства и решения, подкреплённого властью. Этот знак описывает предстоящее препятствие. Слабость и порча сопровождаются отчуждением и положением изгоя. Отчуждение может стать частью того же мрачного знака.

Окружение вступает в дело под этим знаком. Молитва и община дают защиту верным, а неверным знак несёт уничтожение. Таков предлагаемый курс действий. Откровение или освобождение приходит под знаком Демона и сохраняет дурное предзнаменование. Не принимай это откровение за доказательство благоприятного исхода.

Если прежнему совету последовать, возможен такой исход. Свет Астрономикона возвещает надежду, веру и вдохновение. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `throne_of_terra.advice_outcome` | `throne_of_terra.p06` ↔ `throne_of_terra.p07` | TRANSITION_TO_OUTCOME / source_structure; исход при следовании совету | `source_explicit` |
| `heuristic.throne_of_terra.1_2` | `throne_of_terra.p01` ↔ `throne_of_terra.p02` | REINFORCEMENT / shared_existing_theme_tags_only; tags: wealth | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.3_4` | `throne_of_terra.p03` ↔ `throne_of_terra.p04` | WARNING / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.5_6` | `throne_of_terra.p05` ↔ `throne_of_terra.p06` | TRANSITION_TO_ADVICE / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `reinforcement_01` (throne_of_terra.origin_present.link), `closing_02` (closing).

Условие: `throne_of_terra.p06 → throne_of_terra.p07`; последняя карта не является безусловным будущим.

Явное adverse ограничение сохранено: `major_15/reversed`.

## F09 — Трон Терры: надежда как препятствие

Расклад: **Трон Терры** (`throne_of_terra`). Seed: `throne-9`. Режим: `position_based`.

Coverage: `positive_obstacle`, `immaterium_reversed`, `reversed_major`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_05` — Эклезиарх | `reversed` | Прошлое и исток | `major_05.reversed.core` |
| 2 | `adeptio_03` — Администратор | `standard` | Настоящее и суть вопроса | `adeptio_03.standard.core` |
| 3 | `major_09` — Провидец / Пророк | `reversed` | Скрытое влияние | `major_09.reversed.core` |
| 4 | `major_17` — Астрономикон | `upright` | Препятствие | `major_17.upright.core` |
| 5 | `mandatio_04` — Гильдиец | `standard` | Окружение | `mandatio_04.standard.core` |
| 6 | `major_18` — Имматериум | `reversed` | Совет | `major_18.reversed.core`, `major_18.reversed.advice` |
| 7 | `major_20` — Судья | `upright` | Исход при исполнении совета | `major_20.upright.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. Исток нынешнего вопроса лежит в прошлом. Возникает путь, расходящийся с привычной догмой и допускающий изобретение. Такова нынешняя суть дела. Управление и контроль открывают возможность продвижения.

За видимым ходом дела остаётся скрытое влияние. Поспешность и неосмотрительность ведут к незрелым поступкам. Этот знак описывает предстоящее препятствие. Свет Астрономикона возвещает надежду, веру и вдохновение.

Окружение вступает в дело под этим знаком. Торговля и накопление меняют достаток и положение в обществе. Таков предлагаемый курс действий. Опасность может миновать в последний момент, но знак Имматериума остаётся неблагоприятным. Не принимай малость ошибки за отсутствие опасности.

Если прежнему совету последовать, возможен такой исход. Дело оказывается перед властью закона и требованием подчиниться суду. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `throne_of_terra.advice_outcome` | `throne_of_terra.p06` ↔ `throne_of_terra.p07` | TRANSITION_TO_OUTCOME / source_structure; исход при следовании совету | `source_explicit` |
| `heuristic.throne_of_terra.1_2` | `throne_of_terra.p01` ↔ `throne_of_terra.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.3_4` | `throne_of_terra.p03` ↔ `throne_of_terra.p04` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.5_6` | `throne_of_terra.p05` ↔ `throne_of_terra.p06` | TRANSITION_TO_ADVICE / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `closing_02` (closing).

Условие: `throne_of_terra.p06 → throne_of_terra.p07`; последняя карта не является безусловным будущим.

Явное adverse ограничение сохранено: `major_18/reversed`.

## F10 — Ореол: благоприятная карта остаётся испытанием

Расклад: **Ореол Росетты** (`haloed_rosette`). Seed: `rosette-10`. Режим: `position_based`.

Coverage: `positive_challenge`, `inner_present_comparison`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_14` — Империум | `upright` | Текущая ситуация | `major_14.upright.core` |
| 2 | `major_17` — Астрономикон | `upright` | Ближайшее испытание | `major_17.upright.core` |
| 3 | `adeptio_02` — Писарь | `standard` | Далёкое прошлое и основание | `adeptio_02.standard.core` |
| 4 | `major_00` — Пилигрим | `upright` | Недавнее прошлое | `major_00.upright.core` |
| 5 | `major_21` — Галлактика | `upright` | Лучший ожидаемый исход | `major_21.upright.core` |
| 6 | `mandatio_03` — Ремесленник | `standard` | Вероятное ближайшее будущее | `mandatio_03.standard.core` |
| 7 | `major_06` — Единство (Согласие) | `upright` | Факторы и внутренние чувства | `major_06.upright.core` |
| 8 | `discordia_02` — Ксенос | `standard` | Внешние неподконтрольные влияния | `discordia_02.standard.core` |
| 9 | `major_09` — Провидец / Пророк | `reversed` | Надежды или страхи | `major_09.reversed.core` |
| 10 | `major_19` — Золотой Трон | `upright` | Итог | `major_19.upright.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. В глубоком основании вопроса стоит этот знак. Дело держится на усердном исполнении повторяющегося долга. Недавние события отзываются в нынешнем деле. Перед тобой открывается начало пути, ещё не исчерпавшего своих возможностей.

Нынешняя ситуация раскрывается так. Единство сохраняется через сдержанность и терпеливое согласование сил. Здесь карта означает ближайшее испытание. Свет Астрономикона возвещает надежду, веру и вдохновение.

Знаки повторяют одну тему и усиливают её присутствие в раскладе. Внутренние чувства и скрытые направления требуют сопоставления с настоящим. Разрозненные силы соединяются через доверие и согласие. Вне твоего контроля действует это влияние. Неизвестная сила угрожает извне, вплоть до вторжения и нападения. Надежды или страхи окрашивают видение ситуации. Поспешность и неосмотрительность ведут к незрелым поступкам.

Так обозначен лучший исход, на который можно надеяться. Круг дела замыкается, приближаясь к полноте и совершенству. Ближайшее будущее может принять такую форму. Освоенное ремесло ведёт к работе и небольшому материальному приобретению.

Итог дела показан этим знаком. Золотой Трон являет величие и блеск верховной власти. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `haloed_rosette.inner_present` | `haloed_rosette.p07` ↔ `haloed_rosette.p01` | REINFORCEMENT / shared_existing_theme_tags_only; tags: unity | `source_explicit` |
| `heuristic.haloed_rosette.3_4` | `haloed_rosette.p03` ↔ `haloed_rosette.p04` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.4_1` | `haloed_rosette.p04` ↔ `haloed_rosette.p01` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_6` | `haloed_rosette.p01` ↔ `haloed_rosette.p06` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.6_10` | `haloed_rosette.p06` ↔ `haloed_rosette.p10` | CONCLUSION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_2` | `haloed_rosette.p01` ↔ `haloed_rosette.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.7_8` | `haloed_rosette.p07` ↔ `haloed_rosette.p08` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.5_10` | `haloed_rosette.p05` ↔ `haloed_rosette.p10` | CONCLUSION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `reinforcement_01` (haloed_rosette.inner_outer_expectations.inner_present), `closing_02` (closing).

Позиция 2 сохраняет challenge; 7↔1 сравниваются по source-explicit relation. Остальные структурные связи имеют отдельную heuristic provenance.

## F11 — Ореол: явное противоречие внутреннего и настоящего

Расклад: **Ореол Росетты** (`haloed_rosette`). Seed: `rosette-11`. Режим: `position_based`.

Coverage: `explicit_tension`, `inner_present_comparison`, `daemon`, `immaterium`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_15` — Демон | `upright` | Текущая ситуация | `major_15.upright.core` |
| 2 | `discordia_08` — Лорд Крови | `standard` | Ближайшее испытание | `discordia_08.standard.core`, `discordia_08.standard.warning` |
| 3 | `excuteria_02` — Солдат | `standard` | Далёкое прошлое и основание | `excuteria_02.standard.core` |
| 4 | `major_03` — Святая Терра | `reversed` | Недавнее прошлое | `major_03.reversed.core` |
| 5 | `major_19` — Золотой Трон | `upright` | Лучший ожидаемый исход | `major_19.upright.core` |
| 6 | `mandatio_10` — Консул | `standard` | Вероятное ближайшее будущее | `mandatio_10.standard.core` |
| 7 | `major_17` — Астрономикон | `upright` | Факторы и внутренние чувства | `major_17.upright.core` |
| 8 | `major_18` — Имматериум | `upright` | Внешние неподконтрольные влияния | `major_18.upright.core` |
| 9 | `major_09` — Провидец / Пророк | `reversed` | Надежды или страхи | `major_09.reversed.core` |
| 10 | `major_20` — Судья | `upright` | Итог | `major_20.upright.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. В глубоком основании вопроса стоит этот знак. Служение ставит долг и жертву на путь общего блага. Недавние события отзываются в нынешнем деле. Дом оказывается под знаком колебаний и неверности.

Нынешняя ситуация раскрывается так. Знак Демона несёт опустошение, насилие и угрозу падения. Здесь карта означает ближайшее испытание. Дело омрачено кровью, смертью и страданием. Знак допускает тяжёлую боль и кровопролитие.

Между знаками остаётся противоречие; оба свидетельства следует сохранить. Внутренние чувства и скрытые направления требуют сопоставления с настоящим. Свет Астрономикона возвещает надежду, веру и вдохновение. Вне твоего контроля действует это влияние. Имматериум скрывает опасность за обманом и ошибочным видением. Надежды или страхи окрашивают видение ситуации. Поспешность и неосмотрительность ведут к незрелым поступкам.

Так обозначен лучший исход, на который можно надеяться. Золотой Трон являет величие и блеск верховной власти. Ближайшее будущее может принять такую форму. Высокое мастерство сталкивается с трудным выбором и множеством незавершённых дел.

Итог дела показан этим знаком. Дело оказывается перед властью закона и требованием подчиниться суду. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `haloed_rosette.inner_present` | `haloed_rosette.p07` ↔ `haloed_rosette.p01` | TENSION / opposed_explicit_source_tendencies | `source_explicit` |
| `heuristic.haloed_rosette.3_4` | `haloed_rosette.p03` ↔ `haloed_rosette.p04` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.4_1` | `haloed_rosette.p04` ↔ `haloed_rosette.p01` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_6` | `haloed_rosette.p01` ↔ `haloed_rosette.p06` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.6_10` | `haloed_rosette.p06` ↔ `haloed_rosette.p10` | CONCLUSION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_2` | `haloed_rosette.p01` ↔ `haloed_rosette.p02` | WARNING / shared_existing_theme_tags_only; tags: conflict, loss | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.7_8` | `haloed_rosette.p07` ↔ `haloed_rosette.p08` | TENSION / opposed_explicit_source_tendencies | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.5_10` | `haloed_rosette.p05` ↔ `haloed_rosette.p10` | CONCLUSION / shared_existing_theme_tags_only; tags: authority | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `tension_01` (haloed_rosette.inner_outer_expectations.inner_present), `closing_02` (closing).

Позиция 2 сохраняет challenge; 7↔1 сравниваются по source-explicit relation. Остальные структурные связи имеют отдельную heuristic provenance.

Явное adverse ограничение сохранено: `major_15/upright`, `major_18/upright`.

## F12 — Ореол: повторяющиеся темы служения и долга

Расклад: **Ореол Росетты** (`haloed_rosette`). Seed: `rosette-12`. Режим: `position_based`.

Coverage: `repeated_themes`, `minor_standard_only`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `adeptio_02` — Писарь | `standard` | Текущая ситуация | `adeptio_02.standard.core` |
| 2 | `adeptio_03` — Администратор | `standard` | Ближайшее испытание | `adeptio_03.standard.core` |
| 3 | `excuteria_02` — Солдат | `standard` | Далёкое прошлое и основание | `excuteria_02.standard.core` |
| 4 | `excuteria_03` — Сержант | `standard` | Недавнее прошлое | `excuteria_03.standard.core` |
| 5 | `major_05` — Эклезиарх | `upright` | Лучший ожидаемый исход | `major_05.upright.core` |
| 6 | `mandatio_08` — Сборщик (налогов) | `standard` | Вероятное ближайшее будущее | `mandatio_08.standard.core` |
| 7 | `adeptio_07` — Сестра Битвы (Храмовник) | `standard` | Факторы и внутренние чувства | `adeptio_07.standard.core` |
| 8 | `adeptio_11` — Кустодий | `standard` | Внешние неподконтрольные влияния | `adeptio_11.standard.core` |
| 9 | `mandatio_09` — Епископ | `standard` | Надежды или страхи | `mandatio_09.standard.core` |
| 10 | `excuteria_13` — Мастер Ордена | `standard` | Итог | `excuteria_13.standard.core` |

### MAIN PROPHECY

Перед взором чтеца лежат истоки дела и его возможные пути. В глубоком основании вопроса стоит этот знак. Служение ставит долг и жертву на путь общего блага. Знаки повторяют одну тему и усиливают её присутствие в раскладе. Недавние события отзываются в нынешнем деле. Долгая служба выражается в решительном исполнении приказа.

Нынешняя ситуация раскрывается так. Дело держится на усердном исполнении повторяющегося долга. Здесь карта означает ближайшее испытание. Управление и контроль открывают возможность продвижения.

Внутренние чувства и скрытые направления требуют сопоставления с настоящим. Преданность и вера собирают волю в единую цель, допускающую праведный гнев. Вне твоего контроля действует это влияние. Защита становится долгом перед целью, превосходящей отдельного служителя. Надежды или страхи окрашивают видение ситуации. Мудрость старших утверждает Имперскую истину и святость человека.

Так обозначен лучший исход, на который можно надеяться. Путь определяется традицией и догмой Имперского Кредо. Ближайшее будущее может принять такую форму. Труд ведёт к росту, но развитие допускает остановку и новую оценку.

Итог дела показан этим знаком. Уверенное решение допускает суровую необходимость, но соседствует с упрямством и ограниченностью. Таковы открывшиеся знаки; будущее ещё пребывает в движении.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `haloed_rosette.inner_present` | `haloed_rosette.p07` ↔ `haloed_rosette.p01` | CONTINUATION / insufficient_structured_basis_neutral | `source_explicit` |
| `heuristic.haloed_rosette.3_4` | `haloed_rosette.p03` ↔ `haloed_rosette.p04` | REINFORCEMENT / shared_existing_theme_tags_only; tags: service | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.4_1` | `haloed_rosette.p04` ↔ `haloed_rosette.p01` | REINFORCEMENT / shared_existing_theme_tags_only; tags: discipline, service | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_6` | `haloed_rosette.p01` ↔ `haloed_rosette.p06` | REINFORCEMENT / shared_existing_theme_tags_only; tags: service | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.6_10` | `haloed_rosette.p06` ↔ `haloed_rosette.p10` | CONCLUSION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_2` | `haloed_rosette.p01` ↔ `haloed_rosette.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.7_8` | `haloed_rosette.p07` ↔ `haloed_rosette.p08` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.5_10` | `haloed_rosette.p05` ↔ `haloed_rosette.p10` | CONCLUSION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_02` (opening), `reinforcement_01` (haloed_rosette.foundations.link), `closing_01` (closing).

Позиция 2 сохраняет challenge; 7↔1 сравниваются по source-explicit relation. Остальные структурные связи имеют отдельную heuristic provenance.

## F13 — Ореол: сила и слабость без выдуманной polarity

Расклад: **Ореол Росетты** (`haloed_rosette`). Seed: `rosette-13`. Режим: `position_based`.

Coverage: `apparent_tension_neutral_fallback`, `inner_present_comparison`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_11` — Титан | `upright` | Текущая ситуация | `major_11.upright.core` |
| 2 | `discordia_03` — Еретик | `standard` | Ближайшее испытание | `discordia_03.standard.core`, `discordia_03.standard.warning` |
| 3 | `major_03` — Святая Терра | `upright` | Далёкое прошлое и основание | `major_03.upright.core` |
| 4 | `mandatio_02` — Гражданин | `standard` | Недавнее прошлое | `mandatio_02.standard.core` |
| 5 | `major_19` — Золотой Трон | `upright` | Лучший ожидаемый исход | `major_19.upright.core` |
| 6 | `excuteria_04` — Офицер | `standard` | Вероятное ближайшее будущее | `excuteria_04.standard.core` |
| 7 | `major_01` — Астропат (колдун) | `reversed` | Факторы и внутренние чувства | `major_01.reversed.core` |
| 8 | `mandatio_05` — Нобиль | `standard` | Внешние неподконтрольные влияния | `mandatio_05.standard.core` |
| 9 | `major_09` — Провидец / Пророк | `reversed` | Надежды или страхи | `major_09.reversed.core` |
| 10 | `major_21` — Галлактика | `upright` | Итог | `major_21.upright.core` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. В глубоком основании вопроса стоит этот знак. Святая Терра знаменует дом, изобилие и способность дать начало жизни. Знаки повторяют одну тему и усиливают её присутствие в раскладе. Недавние события отзываются в нынешнем деле. Устойчивое основание удерживает равновесие в чём-то большем, чем отдельный человек.

Нынешняя ситуация раскрывается так. Титан возвещает внутреннюю и внешнюю силу, а также мужество стоять твёрдо. Здесь карта означает ближайшее испытание. Угроза зарождается внутри: крамола и измена скрываются среди своих. Предательство способно открыть путь нападению изнутри.

Внутренние чувства и скрытые направления требуют сопоставления с настоящим. Воля ослаблена, а неуверенность откладывает действие. Вне твоего контроля действует это влияние. Благополучие связано с властью главы дома и установленным порядком. Надежды или страхи окрашивают видение ситуации. Поспешность и неосмотрительность ведут к незрелым поступкам.

Так обозначен лучший исход, на который можно надеяться. Золотой Трон являет величие и блеск верховной власти. Ближайшее будущее может принять такую форму. Решение проходит через того, кто отдаёт приказ и связывает уровни командования.

Итог дела показан этим знаком. Круг дела замыкается, приближаясь к полноте и совершенству. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `haloed_rosette.inner_present` | `haloed_rosette.p07` ↔ `haloed_rosette.p01` | CONTINUATION / insufficient_structured_basis_neutral | `source_explicit` |
| `heuristic.haloed_rosette.3_4` | `haloed_rosette.p03` ↔ `haloed_rosette.p04` | REINFORCEMENT / shared_existing_theme_tags_only; tags: unity | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.4_1` | `haloed_rosette.p04` ↔ `haloed_rosette.p01` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_6` | `haloed_rosette.p01` ↔ `haloed_rosette.p06` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.6_10` | `haloed_rosette.p06` ↔ `haloed_rosette.p10` | CONCLUSION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.1_2` | `haloed_rosette.p01` ↔ `haloed_rosette.p02` | WARNING / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.7_8` | `haloed_rosette.p07` ↔ `haloed_rosette.p08` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.haloed_rosette.5_10` | `haloed_rosette.p05` ↔ `haloed_rosette.p10` | CONCLUSION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `reinforcement_01` (haloed_rosette.foundations.link), `closing_02` (closing).

Позиция 2 сохраняет challenge; 7↔1 сравниваются по source-explicit relation. Остальные структурные связи имеют отдельную heuristic provenance.

## F14 — Астро-гороскоп: 24 карты без выдуманных ролей

Расклад: **Астро-гороскоп** (`astro_horoscope`). Seed: `astro-14`. Режим: `deferred_complex_reading`.

Coverage: `astro_deferred`, `no_individual_astro_roles`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_00` — Пилигрим | `upright` | Не установлена источником |  |
| 2 | `major_01` — Астропат (колдун) | `reversed` | Не установлена источником |  |
| 3 | `major_02` — Пророк | `upright` | Не установлена источником |  |
| 4 | `major_03` — Святая Терра | `reversed` | Не установлена источником |  |
| 5 | `major_04` — Бог Император | `upright` | Не установлена источником |  |
| 6 | `major_05` — Эклезиарх | `reversed` | Не установлена источником |  |
| 7 | `major_06` — Единство (Согласие) | `upright` | Не установлена источником |  |
| 8 | `major_07` — Крестоносец | `reversed` | Не установлена источником |  |
| 9 | `major_08` — Святой | `upright` | Не установлена источником |  |
| 10 | `major_09` — Провидец / Пророк | `reversed` | Не установлена источником |  |
| 11 | `major_10` — Человек | `upright` | Не установлена источником |  |
| 12 | `major_11` — Титан | `reversed` | Не установлена источником |  |
| 13 | `major_12` — Мученик | `upright` | Не установлена источником |  |
| 14 | `major_13` — Жнец | `reversed` | Не установлена источником |  |
| 15 | `major_14` — Империум | `upright` | Не установлена источником |  |
| 16 | `major_15` — Демон | `reversed` | Не установлена источником |  |
| 17 | `major_16` — Остов (Халк) | `upright` | Не установлена источником |  |
| 18 | `major_17` — Астрономикон | `reversed` | Не установлена источником |  |
| 19 | `major_18` — Имматериум | `upright` | Не установлена источником |  |
| 20 | `major_19` — Золотой Трон | `reversed` | Не установлена источником |  |
| 21 | `major_20` — Судья | `upright` | Не установлена источником |  |
| 22 | `major_21` — Галлактика | `reversed` | Не установлена источником |  |
| 23 | `adeptio_01` — Инквизитор | `standard` | Не установлена источником |  |
| 24 | `discordia_01` — Арлекин | `standard` | Не установлена источником |  |

### MAIN PROPHECY

Полное толкование намеренно отложено: источник не устанавливает индивидуальных ролей и порядка чтения 24 позиций. Prophecy, sections и relations пусты; в output сохранены source anchors 24 карт.

### Technical trace

Relations не назначены.

Synthesis templates: .

Явное adverse ограничение сохранено: `major_15/reversed`, `major_18/upright`.

## F15 — Император: те же карты, другой seed

Расклад: **Император** (`imperator`). Seed: `hope-1`. Режим: `position_based`.

Coverage: `different_seed_same_semantics`, `paired_with_F01`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `major_00` — Пилигрим | `upright` | Прошлое и исток | `major_00.upright.core` |
| 2 | `major_17` — Астрономикон | `upright` | Настоящее и суть вопроса | `major_17.upright.core` |
| 3 | `major_21` — Галлактика | `upright` | Решение или возможный исход | `major_21.upright.core` |

### MAIN PROPHECY

Перед взором чтеца лежат истоки дела и его возможные пути. Исток нынешнего вопроса лежит в прошлом. Перед тобой открывается начало пути, ещё не исчерпавшего своих возможностей. Такова нынешняя суть дела. Свет Астрономикона возвещает надежду, веру и вдохновение.

Карта указывает на возможное решение или исход. Круг дела замыкается, приближаясь к полноте и совершенству. Таковы открывшиеся знаки; будущее ещё пребывает в движении.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `imperator.sequence` | `imperator.p01` ↔ `imperator.p02` ↔ `imperator.p03` | CONTINUATION / source_structure | `source_explicit` |
| `heuristic.imperator.1_2` | `imperator.p01` ↔ `imperator.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.imperator.2_3` | `imperator.p02` ↔ `imperator.p03` | TRANSITION_TO_OUTCOME / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_02` (opening), `closing_01` (closing).

## F16 — Трон Терры: Discordia и неблагоприятный условный исход

Расклад: **Трон Терры** (`throne_of_terra`). Seed: `throne-16`. Режим: `position_based`.

Coverage: `discordia_heavy`, `adverse_advice`, `adverse_conditional_outcome`, `daemon_reversed`, `immaterium_reversed`.

| Позиция | Production ID / карта | State | Роль | Выбранные fragments |
| --- | --- | --- | --- | --- |
| 1 | `discordia_07` — Великий Нечистый | `standard` | Прошлое и исток | `discordia_07.standard.core` |
| 2 | `discordia_09` — Великий Лжец | `standard` | Настоящее и суть вопроса | `discordia_09.standard.core` |
| 3 | `discordia_10` — Око Ужаса | `standard` | Скрытое влияние | `discordia_10.standard.core` |
| 4 | `discordia_11` — Бездушный | `standard` | Препятствие | `discordia_11.standard.core`, `discordia_11.standard.warning` |
| 5 | `discordia_14` — Предатель | `standard` | Окружение | `discordia_14.standard.core` |
| 6 | `major_18` — Имматериум | `reversed` | Совет | `major_18.reversed.core`, `major_18.reversed.advice` |
| 7 | `major_15` — Демон | `reversed` | Исход при исполнении совета | `major_15.reversed.core`, `major_15.reversed.warning` |

### MAIN PROPHECY

Карты открывают знаки вокруг заданного вопроса. Исток нынешнего вопроса лежит в прошлом. Продолжение существования соседствует с болезнью и разложением. Такова нынешняя суть дела. За путаницей могут стоять вложенные друг в друга заговоры, ведущие к разорению.

За видимым ходом дела остаётся скрытое влияние. Зло приобретает организованную форму: преступные силы и тёмные заговоры действуют совместно. Этот знак описывает предстоящее препятствие. Неестественное и лишённое веры предвещает дурные вести. Дурные вести могут раскрыть непрочность видимого порядка.

Окружение вступает в дело под этим знаком. Непреклонная строгость переходит в нетерпимость, предубеждение и ссору. Таков предлагаемый курс действий. Опасность может миновать в последний момент, но знак Имматериума остаётся неблагоприятным. Не принимай малость ошибки за отсутствие опасности.

Если прежнему совету последовать, возможен такой исход. Откровение или освобождение приходит под знаком Демона и сохраняет дурное предзнаменование. Даже освобождение здесь не снимает мрачного смысла карты. Чтение завершено. Возможный путь обозначен, но его исход ещё не закреплён.

### Technical trace

| Relation | Узлы | Тип / основание | Происхождение |
| --- | --- | --- | --- |
| `throne_of_terra.advice_outcome` | `throne_of_terra.p06` ↔ `throne_of_terra.p07` | TRANSITION_TO_OUTCOME / source_structure; исход при следовании совету | `source_explicit` |
| `heuristic.throne_of_terra.1_2` | `throne_of_terra.p01` ↔ `throne_of_terra.p02` | CONTINUATION / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.3_4` | `throne_of_terra.p03` ↔ `throne_of_terra.p04` | WARNING / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |
| `heuristic.throne_of_terra.5_6` | `throne_of_terra.p05` ↔ `throne_of_terra.p06` | TRANSITION_TO_ADVICE / insufficient_structured_basis_neutral | `engine_synthesis_heuristic` |

Synthesis templates: `opening_01` (opening), `closing_02` (closing).

Условие: `throne_of_terra.p06 → throne_of_terra.p07`; последняя карта не является безусловным будущим.

Явное adverse ограничение сохранено: `major_18/reversed`, `major_15/reversed`.
