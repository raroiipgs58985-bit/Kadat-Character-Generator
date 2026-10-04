# Stage 4B-1 — integration notes

Integration-breaking defects в Data V1.0.0 не обнаружены. Набор из 78 card identities / 100 states индексируется engine без исправления источников.

Известные ограничения сохранены явно:

1. Stage 3 Astro-Horoscope отключён и имеет неопределённое production card count. Stage 4A хранит source-confirmed 24 cards, но не индивидуальные роли. Прямой engine возвращает deferred reading, adapter не меняет Stage 3 доступность. Это ожидаемая граница этапа.
2. Branch positions 3–6 имеют групповые роли. Порядок внутри пар используется только как стабильный display order; причинное соответствие между отдельными картами пар не утверждается.
3. В Data V1.0.0 явные tendencies присутствуют лишь у ограниченного числа states. Engine не добавляет polarity. Многие различия сохраняются нейтральными, даже если человек увидит смысловой контраст.
4. Wording variation ограничена существующими synthesis templates. Card fragments не пересочиняются. Literary quality требует ручного review приложенных примеров.
5. Source conflicts и unresolved IDs Stage 4A передаются в sign detail. Stage 4A audit не запускается заново; engine читает принятые данные с их provenance.

Production files, artwork assignments, ritual session/reveal rules, four Kadat generators и GitHub Pages не затронуты. Новые scripts не подключены к HTML. Нет дополнительных dependency или backend.
