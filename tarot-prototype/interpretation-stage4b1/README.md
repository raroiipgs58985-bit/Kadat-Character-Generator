# Imperial Tarot — Stage 4B-1

Изолированный deterministic JavaScript engine, semantic Engine **4b1.1.0.0**, synthesis **4b1.1.1**, Data **1.0.0**. Четыре расклада поддерживают чтение по позициям; Astro-Horoscope возвращает `deferred_complex_reading`. Production HTML, ритуал и четыре генератора не подключают эти файлы.

## API

Node 20+, без установки dependency:

```js
const data = require("./data-v1.0.0.js");
const { createEngine } = require("./engine.js");
const engine = createEngine(data);
const reading = engine.interpret({
  spreadId: "imperator",
  seed: "expedition-1",
  question: "Что ожидает экспедицию?",
  cards: [
    { cardId: "major_00", state: "upright" },
    { cardId: "major_17", state: "upright" },
    { cardId: "mandatio_03", state: "standard" },
  ],
});
```

Порядок входного массива соответствует production position IDs. Необязательный `positionId` проверяется против этого порядка. Major требуют явного `upright` или `reversed`; Minor требуют `standard`. Неизвестные IDs, неверные states, повтор одной card identity и неверное число карт дают Error со стабильным `code`. Одинаковые входные identities, states и seed дают одинаковый JSON output. Seed — строка либо safe integer; он нормализуется в строку, default `"0"`.

В браузере файлы являются обычными UMD scripts: `ImperialTarotInterpretationDataV1`, `ImperialTarotInterpretationV1.createEngine`, `ImperialTarotInterpretationSessionV1.fromCompletedSession`. Bundle содержит сериализованные данные; загрузчик engine не делает сетевых запросов. Подключение к production scripts намеренно не выполнено.

`session-adapter.js` читает готовую Stage 3 session v2 с `finished: true`, всеми раскрытыми картами и актуальным `data_version`. Проверяет прежние artwork identities, но не изменяет назначения и сессию. Adapter не вызывает drawing/reveal/update. Minor orientation property должна отсутствовать; она конвертируется в interpretation state `standard`. Seed по умолчанию — сохранённый `session_id`, можно передать `{ seed }`. Отключённый в Stage 3 Astro-Horoscope adapter не включает; прямой engine API распознаёт 24 карты в deferred режиме.

## Чтение и границы канона

Каждый знак использует неизменённый Stage 4A `core`. В advice добавляется `advice`; в obstacle/challenge — `warning`, если он есть; в solution/outcome — `warning` при явном source adverse. Не более двух fragments на знак. В past дополнительные советы не выбираются. `constructive` и `outcome` не вставляются автоматически: положение и core уже сохраняют смысл, а дополнительные парафразы давали повторы. Suit metadata остаются контекстом детали и не заменяют значение карты.

| Расклад | Main prophecy | Подтверждённые особенности |
| --- | --- | --- |
| Imperator | 2 абзаца | past → present/problem → solution/possible outcome |
| Branch | 3 абзаца | past, present, forces/options pair, two alternative futures; роли 3–6 только групповые |
| Throne of Terra | 4 абзаца | hidden, obstacle, environment, advice; исход 7 при следовании совету 6 |
| Haloed Rosette | 5 абзацев | challenge 2 независимо от благоприятности; source-explicit comparison 7↔1 |
| Astro-Horoscope | Нет prophecy | 24 source anchors; roles/framing/relations не назначаются |

Существующие relationships Stage 4A сохраняются как `source_explicit`. Разбивка на абзацы, дополнительные edges и локальные связки размечены `engine_synthesis_heuristic`. Для Rosette это temporal 3→4→1→6→10, situation 1↔2, internal/external 7↔8, best/final 5↔10. Для остальных раскладов дополнительные edges лишь связывают подтверждённые соседние роли. Эти edges не добавляют каноническую связь 3→5 / 4→6 в Branch.

REINFORCEMENT допускается только при совпадении существующих tags и сообщает о повторе темы, а не о благоприятном согласии. Поэтому используется осторожный `reinforcement_01`. TENSION требует двух явных противоположных source tendencies `favourable`/`adverse`. Совпадение свободных текстов не вычисляется; отдельная таблица антонимов, polarity scoring и rank weighting не создаются. При отсутствии основания — CONTINUATION с `insufficient_structured_basis_neutral`. Различия strength/weakness без source tendency остаются нейтральными. Major и Minor участвуют по структуре расклада; дополнительные веса или произвольное ранжирование не нужны.

Демон и Имматериум сохраняют adverse в обеих ориентациях. Благоприятная карта в challenge остаётся challenge. Branch не выбирает ветвь и не называет пути «верностью»/«предательством». Seed выбирает варианты rendering frames, не source anchors, states, роли или conditions. FNV-1a-32 использует JS UTF-16 code units, fixed canonical input array и именованный scope; question в hash не входит.

## Output для будущего UI

`prophecy.paragraphs` — основное связное чтение. `sections` содержат ссылки на знаки, альтернативы Branch и условие Throne. `signs` отдельно содержат identity/state/position, source semantic anchor и provenance, authored fragment IDs/text/provenance, прежний role frame, source-conflict/unresolved IDs, suit context, omen restriction и относящиеся relations. `relations` различают источник и heuristic, сохраняют tags/tendencies как evidence. `metadata` фиксирует версии, determinism и ограничения. Output пригоден для будущего «Изучить знамения»; UI в этой ветке не реализован.

Вопрос возвращается неизменённым только в `question`. Никакие слова, keywords, sentiment или тема вопроса не анализируются. Это display context. Engine не использует DOM, storage, часы, randomness, AI, NLP, backend или API. Данные приватно копируются и замораживаются; output — новый объект для каждого вызова.

## Frozen data и review

`frozen-data/data/*.json` и `frozen-data/manifest.json` — byte-identical файлы принятого Stage 4A archive. `frozen-data/LOCK.json` фиксирует archive/file SHA-256; `data-v1.0.0.js` — только UMD serialization тех же документов. Stage 4A не переписывался и не подвергался повторному semantic audit.

- `review/stage4b1_interpretation_samples.md` — 16 fixed fixtures с prophecy и trace.
- `review/fixture_outputs.json` — соответствующий полный output для будущего UI.
- `review/generation_record.json` — один generation pass и hashes.
- `review/validation_report.md` / `.json` — один bounded final validation pass.
- `review/integration_notes.md` — ограничения интеграции.

Generation: `node tarot-prototype/interpretation-stage4b1/tests/generate-samples.cjs`. Final validation: `node tarot-prototype/interpretation-stage4b1/tests/final-validation.cjs`. Оба скрипта защищены от повторного полного запуска после завершения; сохранённые результаты служат checkpoint. После первого просмотра точечно обновлены семь примеров для удаления outcome-повторов и дублирующих Rosette связок; этот repair записан отдельно в generation record. Validator использует cached suite и только необходимые дополнительные вызовы для reproducibility, question independence и adapter/browser parity; второй полный fixture pass не выполняется. Нет случайного fuzzing. Повторный запуск после PASS в этой задаче запрещён.

Checkpoint предназначен для ручного review. Stage 4B-2, публикация и подключение к production не начаты.

## Stage 4B-1.1 — synthesis revision

Пересмотрен только rendering MAIN PROPHECY. Semantic engine version сохранён; `metadata.synthesisVersion` у position-based readings — `4b1.1.1`. Весь selection/meaning/relation код остался прежним. Astro возвращается до нового rendering кода; его output не меняется, fixture для него не запускался.

Короткие engine-authored context variants включают значение карты внутрь предложения. В Rosette настоящее 1 и внутренние силы 7 читаются рядом в одном абзаце; 2 остаётся challenge, а 8–9 составляют следующий абзац. Это только перестановка presentation plan, размеченного как heuristic. Source roles и relationships не изменены.

REINFORCEMENT соединяет две разные clause в общем тематическом frame только при существующем shared tag и использует точное имя из frozen tag vocabulary. Повтор темы не утверждает одинаковый исход. TENSION связывает настоящее и внутренние силы через «однако»/«но», сохраняя обе source clauses. Нейтральная связь не получает выдуманного конфликта. Warning включается в предложение, conditional outcome имеет явное условие следования совету. Окончание ссылается на уже раскрытый путь. Принятые paired forces и two futures paragraphs Branch сохранены.

При явной source favourable tendency в challenge/obstacle используются существующие `semantic_themes_ru` в осторожном nominal frame: смысл остаётся благоприятным, контекст остаётся испытанием. Причина препятствия не добавляется. Core сохраняется verbatim в `signs`, но его темы могут быть сжаты в main prose; это не новая card meaning. Все main rendering operations имеют `engine_synthesis_heuristic` trace с исходными fragment/position/relation IDs. Source template IDs отделены от новых `engine.context.*` IDs. `connectorCount` теперь равен числу отдельных corpus connector sentences: такие предложения не вставляются.

Russian prose не анализируется. Строковые операции над fragment — первая буква и конечная точка при соединении clauses, с сохранением capitals точного card name, и literal удаление повторённого имени уже подтверждённой темы из начала clause. Последнее лишь объединяет существующий subject с context frame, сохраняя predicate; из текста тема не выводится. Темы и отношения выбираются только по structured fields; нет parser, inflection, NLP, polarity scoring или AI.

- `review/stage4b1_1_synthesis_comparison.md` — ровно 8 BEFORE/AFTER readings от `2c8b63f`.
- `review/synthesis_v1_1_outputs.json` — 8 новых outputs.
- `review/synthesis_v1_1_regression_report.md` / `.json` — один bounded regression pass.
- `tests/synthesis-v1_1.cjs --review` и `--validate` — отдельные guarded phases; старые 16-fixture generator и 60-check validator не вызываются.

Старые `fixture_outputs.json`, sample/report и generation record сохранены как historical Stage 4B-1 checkpoint, а не как результаты обновлённого rendering. После regression PASS новые readings также ожидают ручного review.
