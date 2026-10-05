# Stage 5B-1 — Convergence Reader prompt review

Branch: `experiment/imperial-tarot-reader-prompt`

Functional baseline: `865423f7f4c3bbc6710c28408d91f71582a01539` (includes accepted Stage 5A). Approved main `31d7755b68768a7bc1461afa63592fb945e6c743` is also preserved as a commit parent.

Stage 4A source: `1.0.0 / FROZEN`, existing `interpretation-stage4b1/data-v1.0.0.js` and its original JSON authority. No new semantic dataset.

Six representative completed sessions. These are fixed valid fixtures restored by the unchanged Stage 5A adapter; no production draw or meaning was changed. Fixture labels describe review coverage, not stored path themes.

[Two full prompts, ready to copy](two-complete-prompts.md). All six standalone TXT files below are complete prompts; no application is needed to paste one manually into an external chat.

One bounded prompt validation pass: checks 1–39 PASS. Check 40 is the clean/synced checkpoint verification performed at delivery with `--finish-checkpoint`; it does not rerun fixtures or prompts. The final 40/40 result is reported with the delivered checkpoint.

No AI/API calls, keys or backend. No external interpretation has been generated or evaluated. Model compliance with these instructions will require the user's later manual review.

## 01-major-heavy — Преимущественно Major

Question, verbatim:

```text
Как Келусу получить археотех Штрассе?
```

Prompt: [01-major-heavy.txt](prompts/01-major-heavy.txt) · [Stage 5A input](inputs/01-major-heavy.json)

UTF-8 bytes: 24429 · SHA-256: `5579defa6514e08c3539aeb5d563b6f1a58935ab93187e514d69c1d8149a4206`

| Group | Ordered cards / actual state |
| --- | --- |
| Путь I | 01 Пилигрим (`major_00`, upright) → 02 Астропат (колдун) (`major_01`, upright) → 03 Пророк (`major_02`, upright) |
| Путь II | 04 Святая Терра (`major_03`, upright) → 05 Бог Император (`major_04`, upright) → 06 Эклезиарх (`major_05`, upright) |
| Путь III | 07 Единство (Согласие) (`major_06`, upright) → 08 Крестоносец (`major_07`, upright) → 09 Святой (`major_08`, upright) |
| Путь IV | 10 Провидец / Пророк (`major_09`, upright) → 11 Человек (`major_10`, upright) → 12 Титан (`major_11`, upright) |
| Путь V | 13 Мученик (`major_12`, upright) → 14 Империум (`major_14`, upright) → 15 Вольный Торговец (`excuteria_12`, standard) |
| XVI — Схождение | 16 Галлактика (`major_21`, upright) |

## 02-minor-heavy — Все карты Minor; четыре масти

Question, verbatim:

```text
Как снабдить отряд перед дальнейшим продвижением?
```

Prompt: [02-minor-heavy.txt](prompts/02-minor-heavy.txt) · [Stage 5A input](inputs/02-minor-heavy.json)

UTF-8 bytes: 21991 · SHA-256: `b438ff899d2b144d8d28e8563aba79ef9b66d9bfd59453716689f83441736ca3`

| Group | Ordered cards / actual state |
| --- | --- |
| Путь I | 01 Писарь (`adeptio_02`, standard) → 02 Администратор (`adeptio_03`, standard) → 03 Техно-Жрец (`adeptio_06`, standard) |
| Путь II | 04 Арлекин (`discordia_01`, standard) → 05 Ксенос (`discordia_02`, standard) → 06 Мутант (`discordia_04`, standard) |
| Путь III | 07 Солдат (`excuteria_02`, standard) → 08 Сержант (`excuteria_03`, standard) → 09 Офицер (`excuteria_04`, standard) |
| Путь IV | 10 Гражданин (`mandatio_02`, standard) → 11 Ремесленник (`mandatio_03`, standard) → 12 Гильдиец (`mandatio_04`, standard) |
| Путь V | 13 Эксплоратор (`excuteria_07`, standard) → 14 Навигатор (`excuteria_08`, standard) → 15 Вольный Торговец (`excuteria_12`, standard) |
| XVI — Схождение | 16 Фабрикатор (`mandatio_06`, standard) |

## 03-reversed-major — Major Reversed и сохранённые ограничения источника

Question, verbatim:

```text
Когда Штрассе отдаст археотех Келусу?
```

Prompt: [03-reversed-major.txt](prompts/03-reversed-major.txt) · [Stage 5A input](inputs/03-reversed-major.json)

UTF-8 bytes: 26204 · SHA-256: `3d7c857d168b649766362cba415fbf181b3aefc1b28b0f3728c2c38e612ed8f0`

| Group | Ordered cards / actual state |
| --- | --- |
| Путь I | 01 Пилигрим (`major_00`, reversed) → 02 Астропат (колдун) (`major_01`, reversed) → 03 Бог Император (`major_04`, reversed) |
| Путь II | 04 Единство (Согласие) (`major_06`, reversed) → 05 Человек (`major_10`, reversed) → 06 Демон (`major_15`, reversed) |
| Путь III | 07 Золотой Трон (`major_19`, reversed) → 08 Галлактика (`major_21`, reversed) → 09 Вольный Торговец (`excuteria_12`, standard) |
| Путь IV | 10 Регент (Сигилит) (`adeptio_13`, standard) → 11 Арлекин (`discordia_01`, standard) → 12 Консул (`mandatio_10`, standard) |
| Путь V | 13 Мученик (`major_12`, upright) → 14 Имматериум (`major_18`, reversed) → 15 Арбитр (`adeptio_04`, standard) |
| XVI — Схождение | 16 Астрономикон (`major_17`, reversed) |

## 04-tensions — Контрастирующие знаки; без заранее выбранного пути

Question, verbatim:

```text
Как сохранить единство отряда, не приняв опасного соглашения?
```

Prompt: [04-tensions.txt](prompts/04-tensions.txt) · [Stage 5A input](inputs/04-tensions.json)

UTF-8 bytes: 24177 · SHA-256: `e62edaa68f57e061d0de47f20abef710f2f19625c866c465df658045802512f5`

| Group | Ordered cards / actual state |
| --- | --- |
| Путь I | 01 Единство (Согласие) (`major_06`, upright) → 02 Кустодий (`adeptio_11`, standard) → 03 Святой (`major_08`, upright) |
| Путь II | 04 Еретик (`discordia_03`, standard) → 05 Великий Лжец (`discordia_09`, standard) → 06 Предатель (`discordia_14`, standard) |
| Путь III | 07 Офицер (`excuteria_04`, standard) → 08 Мастер Ордена (`excuteria_13`, standard) → 09 Крестоносец (`major_07`, upright) |
| Путь IV | 10 Демон (`major_15`, reversed) → 11 Имматериум (`major_18`, upright) → 12 Арлекин (`discordia_01`, standard) |
| Путь V | 13 Оратор (`mandatio_07`, standard) → 14 Проповедник (`adeptio_09`, standard) → 15 Вольный Торговец (`excuteria_12`, standard) |
| XVI — Схождение | 16 Судья (`major_20`, upright) |

## 05-shared-motifs — Общие мотивы власти и служения через разные карты

Question, verbatim:

```text
Как добиться разрешения на экспедицию?
```

Prompt: [05-shared-motifs.txt](prompts/05-shared-motifs.txt) · [Stage 5A input](inputs/05-shared-motifs.json)

UTF-8 bytes: 21454 · SHA-256: `bda183e3bc0d79ab02ef9b0e9bc346fca3536220dada58c20f7a840bb8f736fc`

| Group | Ordered cards / actual state |
| --- | --- |
| Путь I | 01 Бог Император (`major_04`, upright) → 02 Администратор (`adeptio_03`, standard) → 03 Консул (`mandatio_10`, standard) |
| Путь II | 04 Регент (Сигилит) (`adeptio_13`, standard) → 05 Офицер (`excuteria_04`, standard) → 06 Губернатор (`mandatio_13`, standard) |
| Путь III | 07 Капитан (`excuteria_05`, standard) → 08 Генерал (`excuteria_06`, standard) → 09 Мастер Войны (`adeptio_14`, standard) |
| Путь IV | 10 Писарь (`adeptio_02`, standard) → 11 Арбитр (`adeptio_04`, standard) → 12 Сборщик (налогов) (`mandatio_08`, standard) |
| Путь V | 13 Эклезиарх (`major_05`, upright) → 14 Проповедник (`adeptio_09`, standard) → 15 Епископ (`mandatio_09`, standard) |
| XVI — Схождение | 16 Верховный Лорд (`mandatio_14`, standard) |

## 06-ambiguous — Неопределённый вопрос; пробелы и перевод строки сохраняются

Question, verbatim:

```text
  Что мне делать дальше?
Срок мне пока неизвестен.  
```

Prompt: [06-ambiguous.txt](prompts/06-ambiguous.txt) · [Stage 5A input](inputs/06-ambiguous.json)

UTF-8 bytes: 25079 · SHA-256: `d036c9d2e3038f31fd2f3715a9e938264a6d49b4d8221ff7f9fa2d5995513c09`

| Group | Ordered cards / actual state |
| --- | --- |
| Путь I | 01 Пилигрим (`major_00`, reversed) → 02 Провидец / Пророк (`major_09`, reversed) → 03 Имматериум (`major_18`, upright) |
| Путь II | 04 Арлекин (`discordia_01`, standard) → 05 Незнакомец (`excuteria_01`, standard) → 06 Вольный Торговец (`excuteria_12`, standard) |
| Путь III | 07 Человек (`major_10`, reversed) → 08 Остов (Халк) (`major_16`, upright) → 09 Золотой Трон (`major_19`, reversed) |
| Путь IV | 10 Санкционированный Псайкер (`adeptio_05`, standard) → 11 Техно-Жрец (`adeptio_06`, standard) → 12 Ремесленник (`mandatio_03`, standard) |
| Путь V | 13 Единство (Согласие) (`major_06`, reversed) → 14 Мутант (`discordia_04`, standard) → 15 Оратор (`mandatio_07`, standard) |
| XVI — Схождение | 16 Галлактика (`major_21`, reversed) |

## Boundaries retained

Major Reversed uses its own frozen state and core framing; upright-only core meanings are not reused. Contextual notes and existing source limitations are retained without correction, including the Demon and unenumerated Rogue Trader variations. Only used suits appear as supplementary context; Discordia tendencies do not create Minor reverse states.

The question is included byte-for-byte and is not classified or interpreted locally. Five paths and their card order are preserved. No themes or roles are assigned. The Reader protocol reads all paths, compares them, then interprets XVI, then synthesizes. Titles requested from the Reader are explicitly non-canonical output.

Generated outputs contain no artwork paths/IDs, CSS, UI metadata, session IDs, dates, random prose, fragment IDs or full undrawn-card data. The model is asked for final prophecy and concise explanations, never private chain-of-thought.

Main/live-test, Stage 5A, Stage 5B fallback, frozen Stage 4A, engine, canonical Tarot, Archive, artwork mappings and the four generators are untouched. Publication: NONE. Stage 5B-2: NOT STARTED.
