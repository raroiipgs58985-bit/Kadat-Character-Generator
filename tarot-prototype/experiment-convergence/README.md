# Схождение / Convergence — Stage 5A

Изолированный экспериментальный Astro-Horoscope, не каноническая схема из *The Emperor's Tarot*. Вход находится в `tarot-prototype/experiment-convergence/index.html`; production entry V1 не изменён.

Схема: пять путей по три карты (`01–03`, `04–06`, `07–09`, `10–12`, `13–15`) и отдельная общая карта `16`. Пути обозначены только I–V. Темы путей и значения трёх позиций не назначены.

Карты выбираются сразу, без повторов, существующим `ImperialTarotSession.createSession`. Production dataset, artwork mappings и правила ориентации используются без изменений. Состояние хранится в отдельном sessionStorage key `imperial-tarot.experiment.convergence.stage5a.v1`; ключ V1 не затрагивается.

Открытие идёт строго `01 → 15`. После знака 15 наступает `awaiting_convergence`; только отдельное действие `reveal-convergence` открывает XVI. Карта XVI не трактуется как гарантированный исход. Затем сохраняются весь расклад и вопрос; доступны просмотр открытых знаков и полный сброс. Кнопка толкования отключена: «Чтец ещё не призван».

Для локального просмотра из корня репозитория: `node scripts/serve.cjs 4173`, затем `http://127.0.0.1:4173/tarot-prototype/experiment-convergence/`.

## Граница будущего чтеца

`ImperialTarotConvergenceUI.getReaderInput()` возвращает `null` до завершения. После открытия XVI возвращается immutable contract:

- `spread: "convergence"`, `experimental: true`, `contract_version`;
- `session_id`, версия существующих production data и исходный `question`;
- `paths.path_1` … `paths.path_5`: по три упорядоченные ссылки;
- `convergence`: отдельная ссылка на позицию 16;
- ссылка: `position`, неизменный `card_id`, `type`; только Major содержит production `orientation` (`upright` / `reversed`).

В контракте нет копий семантических фрагментов, заданных ролей или толкования. Question хранится как текст и не влияет на выбор карт. Пример контракта и review находятся в `review-stage5a/`.

Stage 5A не загружает Interpretation Engine / Stage 4A runtime, не вызывает reader, AI, API, NLP или backend. Stage 5B не реализован.

## Сохранённая проверка

`review-stage5a/stage5a_validation.json`: PASS 26/26, ноль interpretation / AI calls. Один complete UI session проверен при 320, 414 и 1366 px; полный reset проверен началом второго закрытого session. Screenshots сняты один раз. Validator отказывается повторять сохранённый pass.

До UI-проверок прежний scratch Chromium оказался усечённым. Имеющийся vendor payload распакован заново; десять уже пройденных structural checks сохранены, продолжены только оставшиеся UI checks. Начальная диагностика сохранена отдельно; приложение при восстановлении среды не изменялось.
