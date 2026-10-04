/* Imperial Tarot, Stage I. Deliberately isolated from Kadat data and storage. */
(() => {
  "use strict";
  const root = document.getElementById("app");
  const info = document.getElementById("info-dialog");
  const transit = document.getElementById("transition-dialog");
  const names = {
    a: "Sacred Manuscript",
    b: "Imperial Reliquary",
    c: "Forbidden Divinatio",
    d: "Sacred Divinatio",
  };
  const titles = {
    a: "Сакральный манускрипт",
    b: "Имперский реликварий",
    c: "Запретное прорицание",
    d: "Сакральное прорицание",
  };
  // B is retained as an unchanged historical prototype, outside the active comparison.
  const activeConcepts = ["a", "c", "d"];
  // Stage I reference concepts keep their original three demonstration identities.
  const cards = [
    {
      number: "0",
      en: "The Pilgrim",
      ru: "Пилигрим",
      src: "assets/demo-pilgrim.svg",
      alt: "Демонстрационная SVG-гравюра: путник перед большой готической аркой.",
      reversed: false,
    },
    {
      number: "II",
      en: "The Prophet",
      ru: "Пророк",
      src: "assets/demo-prophet.svg",
      alt: "Демонстрационная SVG-гравюра: человек в церемониальной одежде с книгой и поднятой рукой.",
      reversed: true,
    },
    {
      number: "XVII",
      en: "The Astronomican",
      ru: "Астрономикон",
      src: "assets/demo-astronomican.svg",
      alt: "Демонстрационная SVG-гравюра: высокая готическая башня с вертикальным лучом света.",
      reversed: false,
    },
  ];
  let concept = null,
    view = "home",
    focusIndex = 0,
    busy = false;
  let revealed = [false, false, false];
  let transitionTimer;
  let flipTimer;
  function cancelFlip() {
    clearTimeout(flipTimer);
    busy = false;
  }
  const nextIndex = () => revealed.findIndex((x) => !x);
  const key = new URLSearchParams(location.search).get("concept");
  if (Object.hasOwn(names, key)) concept = key;
  const mark =
    '<img class="seal" src="assets/imperial-seal.svg" alt="" aria-hidden="true">';
  const deck = (extra = "") =>
    `<div class="deck ${extra}" aria-label="Закрытая колода Императорского Таро"><span class="deck-layer" aria-hidden="true"></span><span class="deck-layer" aria-hidden="true"></span><img src="assets/card-back-${concept}.svg" alt="Рубашка карты: симметричная имперская геральдика на тёмном поле."></div>`;
  const primary =
    '<button class="primary" data-action="begin">Провести гадание <span aria-hidden="true">→</span></button>';
  const secondary =
    '<button class="quiet" data-action="archive">Архив арканов <span aria-hidden="true">↗</span></button><button class="quiet" data-action="about">О Таро</button>';
  function links() {
    return `<nav class="concept-switch" aria-label="Визуальная концепция">${activeConcepts
      .map(
        (k) =>
          `<a href="?concept=${k}" data-concept="${k}" ${concept === k ? 'aria-current="page"' : ""}><span>${k.toUpperCase()}</span><span class="switch-name">${names[k]}</span></a>`,
      )
      .join("")}</nav>`;
  }
  function bar() {
    return `<div class="preview-bar"><a class="compare-link" href="./" data-action="compare">← Все концепции</a>${links()}<span class="stage-badge">${concept === "d" ? "STAGE III <span>FINAL CONTENT · D / V1</span>" : "STAGE I <span>ВИЗУАЛЬНЫЙ ПРОТОТИП</span>"}</span></div>`;
  }
  function navigation() {
    return `<nav class="view-nav" aria-label="Экраны прототипа">${[
      ["home", "Начало"],
      ["cards", "Карты"],
      ["ritual", "Ритуал"],
    ]
      .map(
        ([k, label], i) =>
          `<button data-view="${k}" ${view === k ? 'aria-current="page"' : ""}><span class="nav-ordinal" aria-hidden="true">${["I", "II", "III"][i]}</span>${label}</button>`,
      )
      .join("")}</nav>`;
  }
  function render() {
    document.body.dataset.concept = concept || "comparison";
    document.title = concept
      ? `${names[concept]} — Imperial Tarot`
      : "Imperial Tarot — Visual Concepts";
    if (concept === "d" && window.ImperialTarotStage2) {
      window.ImperialTarotStage2.mount(root, { bar: bar() });
      return;
    }
    window.ImperialTarotStage2?.unmount();
    root.innerHTML = concept
      ? `${bar()}<div class="concept-shell"><header class="product-header"><a class="kadat-link" href="../index.html">← REGISTRUM KADAT</a><span class="chapter-label">DIVINATIO IMPERIALIS</span><button class="entry-link" data-action="transition" aria-label="Показать переход из Kadat">Вход из Kadat ↗</button></header>${navigation()}<main id="main" tabindex="-1">${view === "home" ? home() : view === "cards" ? showcase() : view === "complete" ? complete() : ritual()}</main><footer class="concept-footer"><span>${concept.toUpperCase()} / ${names[concept]}</span><span>THE EMPEROR'S TAROT</span></footer></div>`
      : comparison();
  }
  function comparison() {
    const preview = (k) =>
      `<div class="concept-preview preview-${k}" aria-hidden="true"><span class="preview-tag">DIVINATIO IMPERIALIS</span>${k === "b" ? mark : ""}<div class="preview-title">${k === "a" ? "LIBER<br>DIVINATIONIS" : k === "d" ? "DIVINATIO<br><em>SACRA</em>" : "THE EMPEROR<br>KNOWS."}</div><img class="preview-back" src="assets/card-back-${k}.svg" alt=""><span class="preview-rule"></span></div>`;
    return `<main id="main" class="comparison" tabindex="-1"><header class="comparison-top"><a href="../index.html" class="kadat-link">← REGISTRUM KADAT</a><span class="stage-badge">STAGE III / FINAL CONTENT</span></header><div class="comparison-heading"><p class="overline">THE EMPEROR'S TAROT</p><h1>Sacred<br><em>Divinatio.</em></h1><p>D — утверждённое направление V1 · Stage III.<br class="desktop-break"> A и C сохранены как визуальные references.</p></div><section class="concept-options" aria-label="Утверждённый D и references A, C">${activeConcepts
      .map(
        (k) =>
          `<a class="concept-option" href="?concept=${k}" data-concept="${k}" data-entry="true">${preview(k)}<div class="option-copy"><span class="option-key">${k.toUpperCase()}</span><div><h2>${names[k]}</h2><p>${titles[k]}${k === "d" ? " · V1 / STAGE III" : ""}</p></div><span class="option-arrow" aria-hidden="true">↗</span></div><p class="option-description">${k === "a" ? "Тёмный пергамент. Иллюминированные поля. Карта как фрагмент древнего текста." : k === "d" ? "Выбор расклада. Вопрос. Последовательный ритуал на 3, 6, 7 или 10 карт. Утверждённый визуальный язык D." : "Тишина и темнота. Тонкая красная черта. Одна карта в центре внимания."}</p></a>`,
      )
      .join(
        "",
      )}</section><footer class="comparison-footer"><span>D: 78 карт / 100 назначений / 99 произведений.<br>Толкование будет реализовано отдельно.</span><span>SACRED DIVINATIO · VISUAL DIRECTION V1</span></footer></main>`;
  }
  function home() {
    if (concept === "a")
      return `<section class="manuscript-home"><div class="folio-head"><span>LIBER DIVINATIONIS</span><span>FOLIO I</span></div><div class="manuscript-layout"><div class="manuscript-copy"><p class="overline">THE EMPEROR'S TAROT</p><h1>Императорское<br><em>Таро</em></h1><div class="church-divider" aria-hidden="true"><span>✦</span></div><p class="drop-cap">Откройте колоду. Три карты, одна за другой. Их толкование появится лишь по завершении расклада.</p><div class="home-actions">${primary}<div class="secondary-actions">${secondary}</div></div></div><div class="illuminated-plate"><span class="plate-arch" aria-hidden="true"></span>${deck()}<span class="plate-inscription">IN NOMINE IMPERATORIS</span></div></div><div class="folio-foot"><span>I · COLLECTIO</span><span>✦</span><span>VERBUM IMPERATORIS</span></div></section>`;
    if (concept === "b")
      return `<section class="reliquary-home"><div class="shrine-heading"><p class="overline">THE EMPEROR'S TAROT</p><h1>Императорское Таро</h1></div><div class="reliquary-stage"><div class="shrine-crown">${mark}<span>RELIQUARIUM DIVINATIONIS</span></div><div class="altar-side side-left" aria-hidden="true"><span>IN NOMINE</span><i></i><span>IMPERATORIS</span></div><div class="altar-object">${deck()}<div class="wax-seal" aria-hidden="true"><span>I</span></div></div><div class="altar-side side-right" aria-hidden="true"><span>FIDES</span><i></i><span>IMPERIALIS</span></div><div class="altar-base" aria-hidden="true"></div></div><div class="reliquary-actions"><p>Три карты. Три открытия.<br>Толкование — после завершения ритуала.</p>${primary}<div class="secondary-actions">${secondary}</div></div></section>`;
    if (concept === "d")
      return `<section class="forbidden-home sacred-home"><div class="silence-copy"><p class="overline"><span class="sacred-initial" aria-hidden="true">I</span>THE EMPEROR'S TAROT</p><h1>Императорское<br><em>Таро</em></h1><p class="silence-subtitle">DIVINATIO IMPERIALIS</p><div class="home-actions">${primary}<div class="secondary-actions">${secondary}</div></div></div><div class="void-deck sacred-deck">${deck()}<div class="sacred-divider" aria-hidden="true"><span>✦</span></div><span class="void-inscription">IN NOMINE IMPERATORIS</span></div><p class="silence-footnote">Откройте карты по одной.<br>Толкование — после завершения ритуала.</p></section>`;
    return `<section class="forbidden-home"><div class="silence-copy"><p class="overline"><span class="red-rule" aria-hidden="true"></span>THE EMPEROR'S TAROT</p><h1>Императорское<br><em>Таро</em></h1><p class="silence-subtitle">DIVINATIO IMPERIALIS</p><div class="home-actions">${primary}<div class="secondary-actions">${secondary}</div></div></div><div class="void-deck">${deck()}<span class="void-inscription">THE EMPEROR KNOWS.</span></div><p class="silence-footnote">Откройте карты по одной.<br>Смысл будет раскрыт в конце.</p></section>`;
  }
  const label = (c, visible = true) =>
    `<figcaption class="card-label" ${visible ? "" : "hidden"}>${concept === "d" ? '<span class="sacred-caption-rule" aria-hidden="true">✦</span>' : ""}<span class="card-name-en">${c.en}</span><span class="card-name-ru">${c.ru}</span><span class="card-state">${c.reversed ? "Перевёрнутое положение" : "Прямое положение"}</span></figcaption>`;
  const face = (c, hidden = false) =>
    `<span class="card-front" ${hidden ? 'aria-hidden="true"' : ""}><img class="card-art${c.reversed ? " is-reversed" : ""}" src="${c.src}" alt="${c.alt}" draggable="false"><span class="front-number">${c.number}</span></span>`;
  function openCard(c, cls = "") {
    return `<figure class="card-unit ${cls}"><div class="static-card">${face(c)}</div>${label(c)}</figure>`;
  }
  function showcase() {
    return `<section class="cards-showcase"><div class="section-heading"><p class="overline">IMAGINES ARCANORUM</p><h1>Лица арканов</h1><p>Изображение — главный элемент карты.<br>Название и положение всегда остаются читаемыми.</p></div><div class="showcase-space">${openCard(cards[0])}${openCard(cards[1])}</div><p class="demo-note">Демонстрационные SVG-гравюры · финальные artwork assignments не используются</p><div class="center-actions">${primary}</div></section>`;
  }
  function ritualCard(c, i) {
    const done = revealed[i],
      next = nextIndex(),
      disabled = done || i !== next || busy;
    return `<figure class="card-unit ritual-card${i === focusIndex ? " is-focused" : ""}" data-slot="${i}"><span class="slot-numeral">${["I", "II", "III"][i]}</span><button type="button" class="flip-card" data-flip="${i}" ${disabled ? "disabled" : ""} aria-label="${done ? `${c.ru}: ${c.reversed ? "перевёрнутое" : "прямое"} положение` : `Открыть карту ${i + 1}${i !== next ? ". Сначала откройте предыдущие карты." : ""}`}" aria-describedby="ritual-rule"><span class="card-object${done ? " is-revealed" : ""}"><span class="card-back"><img src="assets/card-back-${concept}.svg" alt="" draggable="false"></span>${face(c, !done)}</span></button>${done ? label(c) : `<figcaption class="closed-label">${i === next ? "Нажмите, чтобы открыть" : "Карта закрыта"}</figcaption>`}</figure>`;
  }
  function ritual() {
    const n = revealed.filter(Boolean).length,
      next = nextIndex();
    return `<section class="ritual-view"><div class="section-heading ritual-heading"><p class="overline">RITUS DIVINATIONIS</p><h1>Ритуальное пространство</h1><p id="ritual-rule">Открывайте карты по порядку: I → II → III.<br>До завершения расклада толкование скрыто.</p></div><div class="ritual-surface"><div class="ritual-watermark" aria-hidden="true">${mark}</div><div class="ritual-canvas">${cards.map(ritualCard).join("")}</div></div><div class="ritual-controls"><div class="ritual-progress" role="group" aria-label="Выбрать карту для просмотра">${cards.map((_, i) => `<button class="progress-step${i === focusIndex ? " is-current" : ""}${revealed[i] ? " is-open" : ""}" data-focus="${i}" aria-label="Карта ${i + 1}: ${revealed[i] ? "открыта" : "закрыта"}" aria-pressed="${i === focusIndex}">${["I", "II", "III"][i]}<span aria-hidden="true">${revealed[i] ? "✓" : "·"}</span></button>`).join("")}</div><p class="opened-count">Открыто ${n} из 3</p>${n === 3 ? '<button class="primary ritual-continue" data-action="finish">Завершить ритуал →</button>' : n > 0 && revealed[focusIndex] ? `<button class="primary ritual-continue" data-focus="${next}">К следующей карте ${["I", "II", "III"][next]} →</button>` : '<p class="ritual-prompt">Прикоснитесь к открывающейся карте</p>'}<button class="quiet restart-link" data-action="reset">Начать заново</button></div></section>`;
  }
  function complete() {
    return `<section class="completion-view"><div class="section-heading"><p class="overline">RITUS COMPLETUS</p><h1>Ритуал завершён</h1></div><div class="completed-cards">${cards.map((c) => openCard(c)).join("")}</div><div class="meaning-placeholder"><h2>Итоговое толкование</h2><p>Оно появляется только после открытия всех карт.<br>В этом визуальном прототипе значения не подключены.</p></div><div class="center-actions"><button class="primary" data-action="begin">Новый ритуал →</button><button class="quiet" data-view="home">Вернуться к колоде</button></div></section>`;
  }
  function announce(text) {
    document.getElementById("announcement").textContent = text;
  }
  function focusMain() {
    document.getElementById("main").focus({ preventScroll: true });
  }
  function route(k, entry = false) {
    cancelFlip();
    concept = k;
    view = "home";
    focusIndex = 0;
    revealed = [false, false, false];
    busy = false;
    const u = new URL(location.href);
    u.search = k ? `?concept=${k}` : "";
    history.pushState({}, "", u);
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    focusMain();
    if (entry) transition();
  }
  function transition() {
    clearTimeout(transitionTimer);
    if (!transit.open) transit.showModal();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      transitionTimer = setTimeout(() => transit.open && transit.close(), 1450);
  }
  transit.addEventListener("close", () => clearTimeout(transitionTimer));
  function showInfo(which) {
    document.getElementById("dialog-body").innerHTML =
      which === "archive"
        ? '<p class="overline">ARCHIVUM ARCANORUM</p><h2 id="dialog-title">Архив арканов</h2><p>Здесь показан только вход в будущий архив. Полная коллекция будет доступна на следующем этапе.</p>'
        : '<p class="overline">DIVINATIO IMPERIALIS</p><h2 id="dialog-title">О Таро</h2><p>Три варианта сакрального интерфейса. В каждом можно увидеть рубашку, открытые карты и короткий последовательный ритуал.</p><p>SVG-гравюры — демонстрационные изображения. Художественные назначения финальной колоды сохранены отдельно.</p>';
    info.showModal();
  }
  function flip(i) {
    if (busy || revealed[i] || i !== nextIndex()) return;
    const button = document.querySelector(`[data-flip="${i}"]`);
    if (!button) return;
    busy = true;
    button.disabled = true;
    button.querySelector(".card-object").classList.add("is-revealed");
    const delay = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 820;
    const current = concept;
    flipTimer = setTimeout(() => {
      if (concept !== current || view !== "ritual") {
        busy = false;
        return;
      }
      revealed[i] = true;
      focusIndex = i;
      busy = false;
      render();
      announce(
        `Карта ${i + 1}: ${cards[i].ru}. ${cards[i].reversed ? "Перевёрнутое" : "Прямое"} положение.`,
      );
      (
        document.querySelector(".ritual-continue") ||
        document.querySelector(`[data-focus="${i}"]`)
      ).focus({ preventScroll: true });
    }, delay);
  }
  root.addEventListener("click", (event) => {
    const e = event.target.closest(
      "[data-concept],[data-view],[data-action],[data-flip],[data-focus]",
    );
    // data-concept on <body> is a theme marker, not a navigation action.
    // Re-routing D here would cancel native question-form submission.
    if (!e || !root.contains(e)) return;
    if (e.hasAttribute("data-concept")) {
      event.preventDefault();
      route(e.dataset.concept, e.dataset.entry === "true");
      return;
    }
    if (e.hasAttribute("data-view")) {
      cancelFlip();
      view = e.dataset.view;
      render();
      window.scrollTo({ top: 0, behavior: "instant" });
      focusMain();
      return;
    }
    if (e.hasAttribute("data-flip")) {
      flip(Number(e.dataset.flip));
      return;
    }
    if (e.hasAttribute("data-focus")) {
      focusIndex = Number(e.dataset.focus);
      render();
      document
        .querySelector(`[data-focus="${focusIndex}"]`)
        .focus({ preventScroll: true });
      return;
    }
    switch (e.dataset.action) {
      case "compare":
        event.preventDefault();
        route(null);
        break;
      case "transition":
        transition();
        break;
      case "about":
        showInfo("about");
        break;
      case "archive":
        showInfo("archive");
        break;
      case "begin":
      case "reset":
        cancelFlip();
        revealed = [false, false, false];
        focusIndex = 0;
        busy = false;
        view = "ritual";
        render();
        focusMain();
        break;
      case "finish":
        if (revealed.every(Boolean)) {
          view = "complete";
          render();
          focusMain();
        }
        break;
    }
  });
  window.addEventListener("popstate", () => {
    cancelFlip();
    const k = new URLSearchParams(location.search).get("concept");
    concept = Object.hasOwn(names, k) ? k : null;
    view = "home";
    revealed = [false, false, false];
    focusIndex = 0;
    busy = false;
    render();
  });
  render();
})();
