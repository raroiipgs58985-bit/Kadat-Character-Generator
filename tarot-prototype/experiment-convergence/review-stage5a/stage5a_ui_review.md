# Stage 5A — Convergence review

STATUS: PASS — 26/26. Interpretation calls: 0. AI/API calls: 0.

Branch: `experiment/imperial-tarot-convergence`.
Baseline: `0dc66e6db4522276de7536ac8292af587b26e4a8`.
Checkpoint: единственный Stage 5A commit этой ветки; review входит в его tree.

Добавлены только файлы в `tarot-prototype/experiment-convergence/`: entry HTML, `convergence.css`, presentation `convergence.js`, structure/gate adapter `session.js`, README, bounded validator и этот изолированный review set. Все ранее существовавшие production files остаются byte-for-byte неизменными.

## Результат

Точно 16 уникальных production cards: пять путей по три карты и отдельная карта XVI. Строгая последовательность `01 → 15`, затем отдельный gate «Открыть Схождение». После XVI показываются все пути, общий знак и сохранённый вопрос. Открытые карты можно рассмотреть крупно; закрытые не раскрываются при просмотре схемы. Reset сбрасывает весь session.

Значения позиций, темы путей и толкование не назначены. Major/Reversed использует прежнее artwork assignment, изображение визуально upright; Minor не получает reverse state. Future reader contract содержит упорядоченные references и question, доступен только после завершения; вызов reader отсутствует.

Desktop: пять различимых путей сходятся к одной карте. Mobile: текущий путь, artwork 288 px при viewport 320 / 300 px при viewport 414, раскрываемый общий обзор и отдельные группы открытых карт в completed state. Horizontal overflow и clipped text отсутствуют во всех проверенных entry / active / gate / completed / inspection состояниях.

Stage 4A, Interpretation Engine, synthesis, production mappings/assets, четыре канонических расклада, Archive, четыре Kadat генератора и deployment configuration не изменены. Main и production не публиковались этим этапом.

## Screenshots

| Состояние | Review screenshot |
|---|---|
| Entry / start, 1366 px | [01_entry_start.png](screenshots/01_entry_start.png) |
| Active Path I | [02_active_path_I.png](screenshots/02_active_path_I.png) |
| Path I complete → Path II | [03_path_transition.png](screenshots/03_path_transition.png) |
| Пять путей открыты, XVI закрыта | [04_five_paths_XVI_closed.png](screenshots/04_five_paths_XVI_closed.png) |
| Explicit Convergence reveal | [05_convergence_reveal.png](screenshots/05_convergence_reveal.png) |
| Completed 16-card spread | [06_completed_spread.png](screenshots/06_completed_spread.png) |
| Mobile 320 px | [07_mobile_320.png](screenshots/07_mobile_320.png) |
| Mobile 414 px | [08_mobile_414.png](screenshots/08_mobile_414.png) |
| Desktop composition 1366 px | [09_desktop_1366.png](screenshots/09_desktop_1366.png) |

Screenshots просмотрены визуально; повторно не генерировались. Test-only uint32 stream обеспечивает один reversed Major и один Minor в representative session; обычный интерфейс использует прежний production crypto draw.

## Evidence / limitations

- [26-check result and viewport measurements](stage5a_validation.json).
- [Completed session contract example](session_contract_example.json).
- [Initial browser launch diagnostic](initial_browser_launch_failure.json): усечённый scratch binary, до UI flow и screenshots. Vendor binary восстановлен; продолжены только незавершённые проверки, structural PASS не повторялся.
- Reduced-motion, disabled reader control, закрытые позиции и full reset проверены в bounded pass. Старые Stage 4 suites не запускались.
- Неподключённый reader — намеренная граница Stage 5A. Question не анализируется, Stage 5B не начат.

Unresolved issues: none.
