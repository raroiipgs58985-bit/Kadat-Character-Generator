# Imperial Tarot — Stage 3: Production Data & Artwork Integration

**D — Sacred Divinatio / Visual Direction V1.** Финальный контент подключён к изолированному ритуальному прототипу. Художественная курация пользователя заморожена: **78 карт / 100 назначений / 99 произведений и физических файлов**. Толкование остаётся placeholder; основное приложение Kadat не интегрировано с Tarot.

## Открыть

- [Concept D / Stage 3](https://raroiipgs58985-bit.github.io/Kadat-Character-Generator/tarot-prototype/?concept=d&v=stage3-20261004)
- [Comparison / references A и C](https://raroiipgs58985-bit.github.io/Kadat-Character-Generator/tarot-prototype/)
- Локально: `npm start`, затем `/tarot-prototype/?concept=d`.

Home → расклад → необязательный вопрос → подтверждение → последовательное открытие → завершение → placeholder толкования. Статические HTML/CSS/JS с относительными локальными путями; GitHub Pages, без сборки, backend, API или runtime AI.

## Финальная авторская курация

Источник назначений — предоставленный `blanche_tarot_final_data(2).zip`, финальная версия пакета `blanche_tarot_final_data.zip`. Его JSON/CSV сверены между собой. Изображения скопированы побайтно из `final_selected_artworks/`; ни одно произведение не заменено, не обрезано, не перекрашено и не увеличено. Ни новых работ, ни внешних версий не скачивалось.

| Карта                     | Состояние    | Artwork ID | Общий локальный файл                   |
| ------------------------- | ------------ | ---------- | -------------------------------------- |
| major_16 / The Hulk       | Upright      | JB-LX-073  | `assets/artworks/major_16_upright.jpg` |
| mandatio_07 / The Speaker | единственное | JB-LX-073  | `assets/artworks/major_16_upright.jpg` |

Это **INTENTIONAL_REUSE**, явно разрешённое пользователем. Две разные Tarot card identities используют одно произведение. Draw без возвращения проверяет **card identity**, а не artwork identity. Создавать сотый физический файл или устранять это повторное использование запрещено.

## Данные и источники

| Файл                            | Содержимое                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `data/cards.json`               | 22 Major и 56 Minor; EN/RU названия, source image descriptions, исходные значения, variations, artwork mappings и ссылки на PDF/XLSX |
| `data/spreads.json`             | четыре фиксированных расклада, функции позиций EN/RU и отключённый свободный Astro-Horoscope                                         |
| `data/content.js`               | статическая browser/CommonJS-версия тех же cards/spreads; сеть и JSON fetch не требуются                                             |
| `production-data.js`            | неизменяемый runtime adapter и lookup функций `getCard`, `getMeaning`, `getReadingContext`                                           |
| `data/assignment-manifest.json` | все 100 назначений со стабильными card/artwork/identity ID                                                                           |
| `data/artwork-manifest.json`    | 99 файлов, размеры/формат/SHA-256, происхождение, assignments и intentional reuse                                                    |
| `data/intentional-reuse.json`   | решение пользователя о JB-LX-073                                                                                                     |
| `data/source-provenance.json`   | хеши трёх предоставленных источников, версия данных и правила их использования                                                       |
| `data/CURATION_FREEZE.md`       | исходный record финальной ручной курации                                                                                             |
| `assets/artworks/`              | ровно 99 оригинальных JPG/PNG из финального пакета                                                                                   |

English meanings сохранены из финального пакета и сверены с предоставленным The Emperor’s Tarot v1.30. Русские значения всех 100 состояний сохранены из предоставленного XLSX без нового перевода; указаны sheet/cell references. Variations хранятся отдельно от основного meaning. Для 64 карт в XLSX нет отдельного русского описания исходного изображения: соответствующее поле `null`, без придуманного текста. Эти описания относятся к иллюстрациям исходного PDF, а не к выбранным Blanche artworks.

[STAGE3_SOURCE_CONFLICTS.md](STAGE3_SOURCE_CONFLICTS.md) фиксирует расхождения источников и исторические технические записи. Нет неразрешённых конфликтов художественных назначений. Для десяти изображений размеры manifest в ZIP отличались от фактического файла: runtime использует измеренные размеры, прежние значения сохранены в metadata; байты файла прежние.

## Расклады

| Расклад                              | Карт | Статус                             |
| ------------------------------------ | ---: | ---------------------------------- |
| The Imperator / Император            |    3 | SOURCE_SUPPORTED                   |
| The Branch (Traitor or True) / Ветвь |    6 | SOURCE_SUPPORTED                   |
| The Throne of Terra / Трон Терры     |    7 | SOURCE_SUPPORTED                   |
| The Haloed Rosette / Ореол Росетты   |   10 | SOURCE_SUPPORTED                   |
| The Astro-Horoscope / Астро-гороскоп |    — | SOURCE_FLEXIBLE; запуск недоступен |

Схемы, краткие подписи и порядок позиций сохранены из утверждённого Stage 2.1. Функции позиций взяты из PDF, стр. 20–22, и русских XLSX-листов. Для пар III–IV и V–VI Ветви источник даёт общие функции: они сохранены как shared groups, без искусственного распределения смысла между двумя позициями.

Astro-Horoscope остаётся свободным сложным раскладом: `card_count: null`, `positions: []`, `startable: false`. Упоминание 24 карт в вводном разделе PDF не возвращает отменённое пользователем правило fixed-24. В обычном selector нет 24-card сетки. Технический `LARGE_SPREAD_STRESS_TEST` остаётся в `tests/fixtures/large-spread.js`: 24 позиции, 4 × 6, `INTERNAL_TEST_FIXTURE`, функции `null`. Доступ для разработки: `?concept=d&fixture=large-spread`; отдельная sessionStorage-запись, отсутствует в пользовательском списке раскладов.

## Сессия и ритуал

- 78 card identities; выбор без возвращения через `crypto.getRandomValues` с rejection sampling. Все draws формируются один раз при подтверждении начала.
- Каждая Major получает независимый равномерный бит **50/50 Upright/Reversed**. В состоянии Reversed используется назначенный Reversed файл **и** CSS-поворот artwork на 180°. Название, номер, position label и кнопки остаются читаемыми.
- Minor имеет единственное изображение и `symbolizes_en/ru`; поля orientation/reversed artwork/reversed meaning отсутствуют.
- Draws, artwork IDs и Major orientations заморожены; restore/navigation не используют RNG. Карты открываются строго последовательно. Индивидуального reroll нет.
- UI показывает artwork, имя, номер/rank и состояние Major. Meanings, keywords и функции позиции доступны в данных, но не выводятся при открытии, в overview или на завершённом раскладе. Кнопка толкования открывает только placeholder.
- Вопрос необязателен. Точное значение textarea, включая пробелы/переносы/IME/autofill, хранится без trim и ограничения длины. Пустая строка → `QUESTION_UNSPOKEN`; непустая → `QUESTION_STATED`. Текст экранируется при отображении, не отправляется на сервер. На mobile QUAESTIO — сворачиваемый блок.
- Home, A/C, refresh и overview сохраняют вопрос, карты, ориентации и прогресс. Reset требует подтверждения, удаляет старую сессию и вопрос; следующий набор появляется только после нового подтверждения начала.
- Flip 820 мс; `prefers-reduced-motion` отключает анимацию. Картинка предварительно загружается перед flip; смена view во время загрузки не возобновляет старую анимацию и не изменяет draw.

### Совместимость сохранений

`session.version: 2`, `data_version: blanche-final-v1-5d3bd931d33c`. Ключ обычной вкладки сохранён: `imperial-tarot.prototype.stage2.session.v1`; fixture имеет свой ключ. Это позволяет распознать старое сохранение.

**Демосессии Stage 2/2.1 не переносятся на production IDs.** При несовместимой версии cards/orientations отбрасываются с явным уведомлением, точный сохранённый вопрос остаётся черновиком. Новый draw требует подтверждения. Совместимые Stage 3 сессии восстанавливаются без RNG с проверкой card ID, image, artwork ID и identity ID. Если sessionStorage недоступен, работает память страницы и показывается предупреждение; refresh в этом режиме восстановление не гарантирует.

## Artwork и mobile overview

CSS `object-fit: contain` сохраняет полный кадр в active card и thumbnail. Исходные файлы остаются неизменными. Прототип не применяет generative fill, upscale или фильтры для «улучшения» художественного содержания.

Desktop overview показывает рубашки закрытых позиций и реальные изображения открытых. Reversed thumbnail использует тот же файл и поворот, что active card. Завершённый расклад сохраняет визуальную схему всех карт. На mobile крупная active card остаётся главным объектом; карта расклада открывается в dialog, вопрос свёрнут по умолчанию. Touch targets ≥44 px.

99 изображений не загружаются при входе. На Home используются прежние локальные декоративные SVG; при ритуале предварительно загружаются только focused и next artworks, открытые thumbnails — lazy. Декоративный слой D, рубашки, шрифт и три stylesheet остаются прежними. A/C и архивный B используют свои неизменённые Stage I demo assets, не production artwork assignments.

## Проверки

```sh
node tarot-prototype/tests/stage3.test.cjs
node tarot-prototype/tests/stage2.test.cjs
node tarot-prototype/tests/prototype.test.cjs
npm test
npm run check
```

Текущий отчёт: [STAGE3_PRODUCTION_VALIDATION.md](STAGE3_PRODUCTION_VALIDATION.md). [Stage 2.1](STAGE2_1_VALIDATION.md) и [Stage II](STAGE2_VALIDATION.md) — исторические проверки прежнего demo build.

Изменения ограничены `tarot-prototype/`. Persona, Regimentum, Xenos, Armatura, их UI/данные/сохранения/логика и корневой build/deploy не менялись. Новых зависимостей, API, runtime AI, полного Archive и interpretation engine нет. Stage 3 завершает только интеграцию данных и artwork; дальнейшие этапы требуют отдельного задания.
