# Imperial Tarot — Stage 2.1

**D — Sacred Divinatio / Visual Direction V1.** Patch существующего Stage II: рабочий вопрос, визуальный overview и исправление источника Astro-Horoscope. A/C остаются references; B — архивный вариант. Stage III не начат.

## Открыть

- [Concept D / Stage 2.1](https://raroiipgs58985-bit.github.io/Kadat-Character-Generator/tarot-prototype/?concept=d&v=stage2-1-20261004)
- [Comparison / references](https://raroiipgs58985-bit.github.io/Kadat-Character-Generator/tarot-prototype/)
- Локально: `npm start`, затем `/tarot-prototype/?concept=d`.

Home → расклад → необязательный вопрос → подтверждение → последовательное открытие → завершение → placeholder толкования. Статические HTML/CSS/JS, локальные SVG/шрифт; GitHub Pages, без сборки, backend и API.

## Расклады и источник

| Расклад                              | Карт | Статус / схема                                                 |
| ------------------------------------ | ---: | -------------------------------------------------------------- |
| The Imperator / Император            |    3 | SOURCE_SUPPORTED · ряд слева направо                           |
| The Branch (Traitor or True) / Ветвь |    6 | SOURCE_SUPPORTED · две начальные карты и две расходящиеся пары |
| The Throne of Terra / Трон Терры     |    7 | SOURCE_SUPPORTED · перевёрнутая V                              |
| The Haloed Rosette / Ореол Росетты   |   10 | SOURCE_SUPPORTED · крест и верхний ряд VII–X                   |
| The Astro-Horoscope / Астро-гороскоп |    — | SOURCE_FLEXIBLE · запуск недоступен                            |

Сохранены четыре прежние фиксированные схемы из The Emperor's Tarot v1.30, стр. 20–22. Функции пар в Ветви не разделяются искусственно. В Росетте I–II находятся в центральной области; touch targets слегка разнесены для доступности.

**Исправление Stage 2.1:** источник описывает Astro-Horoscope как свободный сложный расклад — ряды/столбцы, круг, концентрические круги, звезда и другие формы. Он не задаёт единого количества карт или фиксированной схемы. Прежнее утверждение «Astro-Horoscope = fixed 24» отозвано. У этой записи `card_count: null`, `positions: []`, `startable: false`; UI не показывает 24 карты или выдуманную официальную сетку. Исправление основано на принятом уточнении пользователя; нового исследования не проводилось.

## Вопрос

- Настоящая форма с submit читает **текущее значение textarea**, включая ввод/IME/autofill. Введённая строка сохраняется без `trim`, обрезки или замены. Текст экранируется для безопасного отображения, оставаясь тем же вопросом.
- Непустая строка → `QUESTION_STATED`; пустая → `QUESTION_UNSPOKEN`. Кнопка «Оставить невысказанным» скрыта при введённом тексте и не стирает его.
- При подготовке сохраняется черновик. После начала `session.question` и `question_status` входят в замороженную ritual session вместе с draws и прогрессом. Сохранённый вопрос имеет приоритет над старым черновиком при restore.
- На desktop QUAESTIO находится справа. На mobile это закрытый по умолчанию `<details>` с действием «Показать вопрос»; active card сохраняет свой размер.
- Home, возврат, A/C, overview и refresh не изменяют вопрос. Подтверждённый reset удаляет его с текущим раскладом. Отмена reset сохраняет всё.

Сессия и черновик хранятся только в `sessionStorage` этой вкладки: `imperial-tarot.prototype.stage2.session.v1`. Текст не отправляется на сервер. Если хранилище недоступно, работает память страницы с явным сообщением; refresh в этом режиме не может восстановить сессию.

## Карты и overview

28 demo card identities: 6 Major, 22 Minor. Иллюстрации — только три прежних локальных SVG. Их повторение между разными demo cards допустимо; это не финальная художественная курация.

- Все карты выбираются один раз без возвращения при подтверждении начала. `crypto.getRandomValues` и rejection sampling исключают смещение выбора.
- Major получает независимый равномерный бит 50/50 один раз. Draws/ориентации заморожены; restore и navigation не вызывают RNG.
- Upright/Reversed имеют разные demo-artwork states. Reversed использует свой asset **и** поворот artwork на 180°. Названия, номера и controls остаются читаемыми.
- Minor имеет одно изображение, без orientation, reversed state, artwork или meaning.
- Открытие строго последовательное; следующая карта требует отдельного действия. Будущие позиции закрыты. Нет индивидуального reroll. Flip 820 мс; reduced motion — без анимации.
- До окончания расклада нет meanings, keywords или интерпретации. После завершения пользователь отдельно открывает placeholder Stage III.

Overview показывает рубашку для закрытой позиции и **точный `session.draws[i].image`** для открытой. Thumbnail сохраняет reversed state и 180° поворот Major; номер позиции не поворачивается. Текущая позиция выделена тонкой рамкой и crimson-подчёркиванием. Идентичность карты также присутствует в accessible label и `data-card-id` открытой позиции. Будущие faces/IDs не попадают в DOM.

На mobile active card остаётся крупной; компактная схема открывается в модальном окне. На desktop реальные thumbnails постепенно заполняют схему слева. Экран завершения сохраняет всю визуальную схему с выпавшими картами в их позициях. Touch targets ≥44 px; внешнего horizontal overflow нет.

## Internal 24-position fixture

`tests/fixtures/large-spread.js` содержит **LARGE_SPREAD_STRESS_TEST**: 24 позиции, 4 × 6, `INTERNAL_TEST_FIXTURE`, все функции позиций `null`. Это техническая конфигурация, а не правило или схема Astro-Horoscope. В обычном списке раскладов её нет.

Для разработки: `/tarot-prototype/?concept=d&fixture=large-spread`, затем «Подготовить тест 24 позиций». Явная плашка отделяет его от канонических раскладов. Используется отдельный ключ `imperial-tarot.prototype.stage2.fixture.large-spread.v1`; обычная сессия не перезаписывается.

Старая сохранённая Stage II сессия `astro_horoscope` с 24 draws переносится в эту внутреннюю конфигурацию с явным уведомлением. **Набор, ориентации, вопрос и прогресс сохраняются без нового RNG.** Это совместимость старого сохранения, не доступный новый канонический расклад. После reset обычный интерфейс предлагает только четыре фиксированных схемы. У старых сохранений без `question_status` статус выводится из фактически сохранённой строки. Текст, который предыдущая версия уже потеряла/обрезала, восстановить невозможно.

## Проверка и изоляция

```sh
node tarot-prototype/tests/stage2.test.cjs
node tarot-prototype/tests/prototype.test.cjs
npm test
```

[STAGE2_1_VALIDATION.md](STAGE2_1_VALIDATION.md) — текущие результаты. [STAGE2_VALIDATION.md](STAGE2_VALIDATION.md) — история Stage II с пометкой об исправленном source claim. Матрица Chromium: 360×800, 390×844, 412×915, 430×932, 1366×768, 1920×1080.

Старые `prototype.css`, `concept-d.css`, рубашки, SVG и шрифт сохранены побайтно. Изменения находятся только в `tarot-prototype/`. Production Tarot dataset и финальные Blanche artworks не подключены; четыре генератора Kadat не изменены. API, runtime AI, новые зависимости, interpretation engine и Stage III отсутствуют.
