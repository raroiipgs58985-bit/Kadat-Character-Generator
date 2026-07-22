# Данные генератора полков

Каталог содержит нормализованную техническую выгрузку из Google Sheets:

`https://docs.google.com/spreadsheets/d/17D50fPX6ACgDQdZjzv1oOixsxMHaqj744cZ8TQvu3to/edit`

## Правила переноса

- Баланс исходной таблицы не меняется.
- Отсутствующие цена, бонус, навык, талант или эффект сохраняются как `null`.
- Механика не дополняется по смыслу описания.
- Исходные формулировки хранятся в отдельных текстовых свойствах записи.
- `source.row` и `source.range` позволяют проверить любую запись по исходной таблице.
- Пустые группы доктрин сохраняются в `KADAT_REGIMENT_DATA.emptyGroups`.
- Цена доктрины «Боевые скакуны» намеренно равна `null`, поскольку в источнике она отсутствует.

## Состав каталога

- `regiment-data-core.js` — источник, политика переноса, общие правила создания и правила смешанных полков.
- `packed/chunk-01.js` и `packed/chunk-01-tail.js` — две части первого фрагмента снимка.
- `packed/chunk-02.js` — `packed/chunk-07.js` — остальные части сжатого снимка нормализованного каталога.
- `regiment-data-loader.js` — собирает фрагменты, распаковывает JSON и добавляет категории в `window.KADAT_REGIMENT_DATA`.
- `index.js` — единая точка доступа к готовому каталогу и поиск записи по `id`.
- `validate-data.cjs` — проверяет структуру, количество записей, уникальность идентификаторов, ссылки на исходные строки и сохранение отсутствующих значений.

## Состав данных

- 16 родных миров;
- 7 происхождений;
- 17 типов командиров;
- 19 типов полков;
- 19 доктрин подготовки;
- 20 доктрин специального снаряжения;
- 18 недостатков;
- 45 вариантов дополнительного снаряжения;
- 14 предметов универсального стандартного набора.

Всего каталог содержит 161 самостоятельную запись.

## Подключение в браузере

Файлы должны загружаться в следующем порядке:

```html
<script src="regiment-data/regiment-data-core.js"></script>
<script src="regiment-data/packed/chunk-01.js"></script>
<script src="regiment-data/packed/chunk-01-tail.js"></script>
<script src="regiment-data/packed/chunk-02.js"></script>
<script src="regiment-data/packed/chunk-03.js"></script>
<script src="regiment-data/packed/chunk-04.js"></script>
<script src="regiment-data/packed/chunk-05.js"></script>
<script src="regiment-data/packed/chunk-06.js"></script>
<script src="regiment-data/packed/chunk-07.js"></script>
<script src="regiment-data/regiment-data-loader.js"></script>
<script src="regiment-data/index.js"></script>
```

После загрузки используется обещание:

```js
const catalog = await window.KADAT_REGIMENT_CATALOG_READY;
const regimentData = catalog.data;
const deathWorld = catalog.findById("homeworld-death-world");
```

Каталог пока не подключён к основному интерфейсу генератора персонажей. Это сделано намеренно: текущая страница не должна загружать данные полков до появления отдельного мастера создания полка.

## Проверка

```bash
node regiment-data/validate-data.cjs
```

Ожидаемый результат:

```text
Regiment data OK: 161 entries, 14 universal kit items.
```
