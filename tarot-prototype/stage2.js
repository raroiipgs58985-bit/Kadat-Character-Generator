/* Sacred Divinatio Stage II. This controller is mounted for Concept D only. */
(() => {
  "use strict";
  const data = window.ImperialTarotDemo;
  const engine = window.ImperialTarotSession;
  const fixture = window.ImperialTarotStressFixture;
  const developerMode =
    new URLSearchParams(location.search).get("fixture") === "large-spread";
  const sessionData = Object.freeze({
    ...data,
    spreads: Object.freeze([...data.spreads, ...(fixture ? [fixture] : [])]),
  });
  const STORAGE_KEY = developerMode
    ? "imperial-tarot.prototype.stage2.fixture.large-spread.v1"
    : "imperial-tarot.prototype.stage2.session.v1";
  const views = [
    "home",
    "spreads",
    "question",
    "confirm",
    "ritual",
    "complete",
    "interpretation",
    "demo",
  ];
  const mapDialog = document.getElementById("ritual-map-dialog");
  const resetDialog = document.getElementById("ritual-reset-dialog");
  let root,
    chrome,
    mounted = false,
    view = "home",
    session = null;
  let selectedSpread = "imperator",
    question = "",
    busy = false,
    timer,
    pendingReset = null;
  let storageAvailable = true,
    restoreNotice = "";
  const esc = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (x) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[x],
    );
  const roman = (n) => {
    if (n === 0) return "0";
    let s = "";
    for (const [value, glyph] of [
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ])
      while (n >= value) {
        s += glyph;
        n -= value;
      }
    return s;
  };
  const getSpread = (id) => sessionData.spreads.find((s) => s.spread_id === id);
  const canSelect = (id) => {
    const spread = getSpread(id);
    return (
      spread &&
      spread.startable !== false &&
      (!spread.internal_fixture || developerMode)
    );
  };
  const currentSpread = () => getSpread(session?.spread_id || selectedSpread);
  function save() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ session, view, selectedSpread, question }),
      );
    } catch {
      storageAvailable = false;
    }
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      session = saved.session
        ? engine.restore(saved.session, sessionData, {
            spreadAliases: { astro_horoscope: "LARGE_SPREAD_STRESS_TEST" },
          })
        : null;
      if (saved.session && !session)
        restoreNotice =
          "Сохранённая демосессия несовместима. Новый набор появится только после подтверждения нового ритуала.";
      selectedSpread = canSelect(saved.selectedSpread)
        ? saved.selectedSpread
        : "imperator";
      question = session
        ? session.question
        : typeof saved.question === "string"
          ? saved.question
          : "";
      view = views.includes(saved.view) ? saved.view : "home";
      if (
        (["ritual", "complete", "interpretation"].includes(view) && !session) ||
        (["complete", "interpretation"].includes(view) &&
          !session?.progress.finished)
      )
        view = "home";
      if (session && saved.session.spread_id === "astro_horoscope") {
        restoreNotice =
          "Сохранённые 24 позиции перенесены во внутренний технический тест. Карты, их положения и вопрос сохранены. Это не фиксированный Астро-гороскоп.";
      } else if (!session && saved.selectedSpread === "astro_horoscope") {
        view = "spreads";
        restoreNotice =
          "Астро-гороскоп — свободный расклад, его запуск пока недоступен. Текст вопроса сохранён в черновике.";
      }
    }
  } catch {
    storageAvailable = false;
  }
  if (session) save();
  function cancelAnimation() {
    clearTimeout(timer);
    busy = false;
  }
  function announce(message) {
    document.getElementById("announcement").textContent = message;
  }
  function focusMain() {
    document.getElementById("main")?.focus({ preventScroll: true });
  }
  function go(next, { focus = true, scroll = true } = {}) {
    cancelAnimation();
    view = next;
    save();
    render();
    if (scroll) window.scrollTo({ top: 0, behavior: "instant" });
    if (focus) focusMain();
  }
  const seal = '<span class="sacred-caption-rule" aria-hidden="true">✦</span>';
  const heading = (latin, title, body = "") =>
    `<div class="section-heading stage2-heading"><p class="overline">${latin}</p><h1>${title}</h1>${body ? `<p>${body}</p>` : ""}</div>`;
  function navigation() {
    return `<nav class="view-nav" aria-label="Этапы ритуала">${[
      ["home", "Начало"],
      ["spreads", "Расклады"],
      ["ritual", "Ритуал"],
    ]
      .map(
        ([target, label], i) =>
          `<button data-s2="view" data-target="${target}" ${target === "ritual" && !session ? "disabled" : ""} ${view === target || (target === "spreads" && ["question", "confirm"].includes(view)) || (target === "ritual" && ["complete", "interpretation"].includes(view)) ? 'aria-current="page"' : ""}><span class="nav-ordinal" aria-hidden="true">${roman(i + 1)}</span>${label}</button>`,
      )
      .join("")}</nav>`;
  }
  function render() {
    if (!mounted) return;
    document.body.dataset.s2View = view;
    const content = {
      home,
      spreads: chooseSpread,
      question: askQuestion,
      confirm: confirmStart,
      ritual,
      complete,
      interpretation,
      demo,
    }[view];
    root.innerHTML = `${chrome.bar}<div class="concept-shell stage2-shell"><header class="product-header"><a class="kadat-link" href="../index.html">← REGISTRUM KADAT</a><span class="chapter-label">DIVINATIO IMPERIALIS</span><button class="entry-link" data-action="transition" aria-label="Показать переход из Kadat">Вход из Kadat ↗</button></header>${navigation()}<main id="main" tabindex="-1">${content()}</main><footer class="concept-footer"><span>D / Sacred Divinatio · Stage II</span><span>DEMONSTRATIO · 28 КАРТ / 3 SVG</span></footer></div>`;
    if (developerMode || currentSpread()?.internal_fixture) {
      root
        .querySelector("#main")
        .insertAdjacentHTML(
          "afterbegin",
          `<div class="stage2-fixture-notice"><p>INTERNAL / LARGE_SPREAD_STRESS_TEST · не канонический расклад</p>${developerMode ? '<button class="quiet" data-s2="stress">Подготовить тест 24 позиций →</button>' : ""}${restoreNotice ? `<p role="status">${esc(restoreNotice)}</p>` : ""}</div>`,
        );
    }
    if (view === "question")
      root.querySelector("#ritual-question").value = question;
  }
  function home() {
    return `<section class="forbidden-home sacred-home"><div class="silence-copy"><p class="overline"><span class="sacred-initial" aria-hidden="true">I</span>THE EMPEROR'S TAROT</p><h1>Императорское<br><em>Таро</em></h1><p class="silence-subtitle">DIVINATIO IMPERIALIS</p><div class="home-actions"><button class="primary" data-s2="${session ? "resume" : "choose"}">${session ? "Вернуться к ритуалу" : "Провести гадание"} <span aria-hidden="true">→</span></button><div class="secondary-actions">${session ? '<button class="quiet" data-s2="reset">Новый ритуал</button>' : ""}<button class="quiet" data-s2="archive">Архив арканов ↗</button><button class="quiet" data-s2="about">О Таро</button></div></div></div><div class="void-deck sacred-deck"><div class="deck" aria-label="Закрытая колода Императорского Таро"><span class="deck-layer" aria-hidden="true"></span><span class="deck-layer" aria-hidden="true"></span><img src="assets/card-back-d.svg" alt="Рубашка карты: симметричная имперская геральдика на тёмном поле."></div><div class="sacred-divider" aria-hidden="true"><span>✦</span></div><span class="void-inscription">IN NOMINE IMPERATORIS</span></div><div class="silence-footnote"><p>Откройте карты по одной.<br>Толкование — после завершения ритуала.</p><button class="quiet stage2-demo-link" data-s2="demo">Посмотреть демонстрационные карты ↗</button>${restoreNotice ? `<p role="status">${esc(restoreNotice)}</p>` : ""}${!storageAvailable ? "<p>Хранилище вкладки недоступно. Сессия сохраняется в памяти до перезагрузки страницы.</p>" : ""}</div></section>`;
  }
  function miniMap(spread) {
    return `<svg class="stage2-mini-map" viewBox="0 0 ${spread.map_width} ${spread.map_height}" aria-hidden="true" focusable="false">${spread.positions.map((p, i) => `<g transform="translate(${p.x} ${p.y})"><rect x="${p.horizontal ? -29 : -19}" y="${p.horizontal ? -14 : -25}" width="${p.horizontal ? 58 : 38}" height="${p.horizontal ? 28 : 50}"/><text dy="4">${i + 1}</text></g>`).join("")}</svg>`;
  }
  function chooseSpread() {
    return `<section class="stage2-selection">${heading("FORMA RITUALIS", "Выберите расклад", "У каждого ритуала своя форма.<br>Карты появятся только после подтверждения начала.")}<div class="stage2-spread-options">${data.spreads.map((s) => `<button class="stage2-spread-option" data-s2="select" data-spread="${s.spread_id}" ${s.startable === false ? "disabled" : ""}><span class="stage2-spread-copy"><span class="stage2-spread-count">${s.card_count == null ? "СВОБОДНЫЙ РАСКЛАД" : `${s.card_count} КАРТ`}</span><strong>${s.name_ru}</strong><span class="stage2-spread-en">${s.name_en}</span><span class="stage2-spread-purpose">${s.purpose_ru}</span>${s.source_status === "SOURCE_FLEXIBLE" ? `<span class="stage2-source-warning">SOURCE_FLEXIBLE · запуск пока недоступен</span><span class="stage2-spread-purpose">Источник не задаёт единого количества карт или фиксированной схемы.</span>` : ""}</span>${s.startable === false ? '<span class="stage2-flexible-form" aria-hidden="true">Свободная<br>форма</span>' : miniMap(s)}${s.startable === false ? "" : '<span class="stage2-spread-arrow" aria-hidden="true">↗</span>'}</button>`).join("")}</div><p class="stage2-source-note">Четыре фиксированные схемы: The Emperor's Tarot v1.30, стр. 20–22. Астро-гороскоп сохранён как свободный расклад.</p>${session ? '<p class="stage2-source-note">Текущий расклад сохранён. Выбор другого потребует подтверждения сброса.</p>' : ""}${restoreNotice && !session ? `<p class="stage2-source-note" role="status">${esc(restoreNotice)}</p>` : ""}</section>`;
  }
  function askQuestion() {
    const s = currentSpread();
    return `<section class="stage2-preparation">${heading("QUAESTIO", "Вопрос можно<br><em>не произносить.</em>")}<div class="stage2-chosen"><span>${s.name_ru}</span><span>${s.card_count} карт</span></div><form id="ritual-question-form"><label class="stage2-question-label" for="ritual-question">Сформулировать вопрос <span>необязательно</span></label><textarea id="ritual-question" rows="4" placeholder="Что вы хотите спросить?" aria-describedby="question-privacy"></textarea><p id="question-privacy" class="stage2-source-note">Вопрос сохранится в текущей сессии этой вкладки. Никуда не отправляется.</p><div class="stage2-form-actions"><button type="submit" class="primary" data-s2="question-continue">${question.length ? "Сохранить вопрос и продолжить" : "Продолжить без вопроса"} →</button><button type="button" class="quiet" data-s2="unspoken" ${question.length ? "hidden" : ""}>Оставить невысказанным</button><button type="button" class="quiet" data-s2="choose">← К раскладам</button></div></form></section>`;
  }
  function questionBlock(text = session ? session.question : question) {
    return text
      ? `<div class="stage2-question-record" data-question-status="QUESTION_STATED">${session ? '<p class="stage2-question-saved">Вопрос сохранён в текущей сессии.</p>' : ""}<blockquote class="stage2-question">${esc(text)}</blockquote></div>`
      : '<p class="stage2-unspoken" data-question-status="QUESTION_UNSPOKEN">Вопрос оставлен невысказанным.</p>';
  }
  function questionPanel() {
    return `<div class="stage2-question-desktop"><p class="overline">QUAESTIO</p>${questionBlock()}</div><details class="stage2-question-mobile"><summary><span>QUAESTIO</span> · <span class="stage2-question-show">${session.question.length ? "Показать вопрос" : "Невысказанный вопрос"}</span><span class="stage2-question-hide">Скрыть вопрос</span></summary>${questionBlock()}</details>`;
  }
  function readQuestion() {
    const input = root.querySelector("#ritual-question");
    if (input) question = input.value;
    return question;
  }
  function syncQuestionInput() {
    readQuestion();
    const unspoken = root.querySelector('[data-s2="unspoken"]');
    if (unspoken) unspoken.hidden = question.length > 0;
    const submit = root.querySelector('[data-s2="question-continue"]');
    if (submit)
      submit.textContent = `${question.length ? "Сохранить вопрос и продолжить" : "Продолжить без вопроса"} →`;
    save();
  }
  function confirmStart() {
    const s = currentSpread();
    return `<section class="stage2-preparation">${heading("ANTE RITUM", "Начать ритуал?")}<div class="stage2-chosen"><span>${s.name_ru}</span><span>${s.card_count} карт</span></div>${questionBlock(question)}<div class="stage2-confirm-map">${miniMap(s)}</div>${s.source_status === "SOURCE_INCOMPLETE" ? `<p class="stage2-source-warning">SOURCE_INCOMPLETE</p><p class="stage2-source-note">${s.layout_note_ru}</p>` : ""}<p class="stage2-confirm-rule">Набор карт и положения Major определятся один раз.<br>Открывайте позиции по порядку. Изменить набор можно только новым ритуалом.</p><div class="stage2-form-actions"><button class="primary" data-s2="start">Начать ритуал →</button><button class="quiet" data-s2="edit-question">← К вопросу</button></div></section>`;
  }
  function cardDetails(draw) {
    const card = data.cards.find((c) => c.card_id === draw.card_id);
    return { card, art: engine.resolveCard(card, draw.orientation) };
  }
  function face(draw) {
    const { card, art } = cardDetails(draw);
    return `<span class="card-front"><img class="card-art${draw.orientation === "reversed" ? " is-reversed" : ""}" src="${art.image}" alt="${art.alt}" draggable="false"><span class="front-number">${esc(card.type === "major" ? card.number : card.rank)}</span></span>`;
  }
  function label(draw) {
    const { card } = cardDetails(draw);
    return `<figcaption class="card-label">${seal}<span class="card-name-en">${esc(card.name_en)}</span><span class="card-name-ru">${esc(card.name_ru)}</span>${card.type === "major" ? `<span class="card-state">${draw.orientation === "reversed" ? "Перевёрнутое положение" : "Прямое положение"}</span>` : `<span class="card-rank">${card.suit} · ${esc(card.rank)}</span>`}</figcaption>`;
  }
  function activeCard() {
    const i = session.progress.current_index;
    const opened = i < session.progress.opened_count;
    const s = currentSpread();
    return `<figure id="active-figure" tabindex="-1" class="card-unit stage2-focus-card"><button class="flip-card stage2-flip" data-s2="reveal" data-index="${i}" ${opened || busy ? "disabled" : ""} aria-label="${opened ? `Открытая карта: ${esc(cardDetails(session.draws[i]).card.name_ru)}` : `Открыть позицию ${roman(i + 1)}`}" aria-describedby="ritual-rule"><span class="card-object${opened ? " is-revealed" : ""}"><span class="card-back"><img src="assets/card-back-d.svg" alt="" draggable="false"></span>${opened ? face(session.draws[i]) : ""}</span></button>${opened ? label(session.draws[i]) : `<figcaption class="closed-label">Позиция ${roman(i + 1)} · нажмите, чтобы открыть</figcaption>`}<span class="sr-only">${esc(s.positions[i].name_ru || "Функция позиции не задана источником")}</span></figure>`;
  }
  function map(spread = currentSpread(), interactive = true) {
    const progress = session.progress;
    return `<div class="stage2-map-stage" style="--map-ratio:${spread.map_width}/${spread.map_height}" role="group" aria-label="Схема ${esc(spread.name_ru)}">${spread.positions
      .map((p, i) => {
        const opened = i < progress.opened_count,
          current = i === progress.current_index;
        const name = p.name_ru || `Позиция ${roman(i + 1)}`;
        const draw = opened ? session.draws[i] : null;
        const card = draw ? cardDetails(draw).card : null;
        const state =
          draw?.type === "major"
            ? draw.orientation === "reversed"
              ? ". Перевёрнутое положение"
              : ". Прямое положение"
            : "";
        return `<button class="stage2-map-position${opened ? " is-open" : ""}${current ? " is-current" : ""}${p.horizontal ? " is-horizontal" : ""}" style="left:${(p.x / spread.map_width) * 100}%;top:${(p.y / spread.map_height) * 100}%" data-s2="map-focus" data-index="${i}" ${draw ? `data-card-id="${esc(draw.card_id)}"` : ""} ${!interactive || i > progress.opened_count ? "disabled" : ""} aria-label="${roman(i + 1)}. ${esc(name)}. ${opened ? `Открыта: ${esc(card.name_ru)}${state}` : "Закрыта"}${current ? ". Текущая" : ""}" aria-current="${current ? "step" : "false"}"><span class="stage2-map-image" aria-hidden="true"><img class="stage2-map-art${draw?.orientation === "reversed" ? " is-reversed" : ""}" src="${draw ? esc(draw.image) : "assets/card-back-d.svg"}" alt="" draggable="false"></span><span class="stage2-map-number" aria-hidden="true">${roman(i + 1)}</span></button>`;
      })
      .join("")}</div>`;
  }
  function mapLegend() {
    return '<p class="stage2-map-legend"><span>Рубашка — закрыта</span><span>Изображение — открыта</span><span>Подчёркнута текущая</span></p>';
  }
  function controls() {
    const p = session.progress,
      n = session.draws.length;
    const all = p.opened_count === n;
    return `<div class="stage2-ritual-controls"><p class="opened-count">Открыто ${p.opened_count} из ${n} · осталось ${n - p.opened_count}</p>${all ? `<p class="stage2-finish-mark">РАСКЛАД ЗАВЕРШЁН</p><button class="primary stage2-continue" data-s2="${p.finished ? "completed" : "finish"}">${p.finished ? "К завершённому ритуалу" : "Завершить ритуал"} →</button>` : p.current_index < p.opened_count ? `<button class="primary stage2-continue" data-s2="next">К следующей карте ${roman(p.opened_count + 1)} →</button>` : '<p id="ritual-prompt" class="ritual-prompt">Откройте текущую карту.</p>'}<button class="quiet stage2-map-trigger" data-s2="map">Схема расклада <span aria-hidden="true">↗</span></button><button class="quiet restart-link" data-s2="reset">Начать заново</button></div>`;
  }
  function ritual() {
    if (!session) return chooseSpread();
    const s = currentSpread(),
      p = session.progress;
    return `<section class="stage2-ritual">${heading("RITUS DIVINATIONIS", `${s.name_ru}`, `<span class="stage2-position-label">${roman(p.current_index + 1)} / ${s.card_count}${s.positions[p.current_index].name_ru ? ` · ${s.positions[p.current_index].name_ru}` : ""}</span>`)}<div class="stage2-ritual-layout"><aside class="stage2-map-aside"><h2>Форма ритуала</h2>${map()}${mapLegend()}</aside><div class="stage2-focus">${activeCard()}${controls()}</div><aside class="stage2-ritual-aside">${questionPanel()}<p id="ritual-rule">Открывайте позиции последовательно.<br>Толкование скрыто до завершения всего расклада.</p><p class="stage2-demo-note">Демонстрационные SVG.<br>Финальные арты не подключены.</p></aside></div></section>`;
  }
  function complete() {
    if (!session?.progress.finished) return ritual();
    const s = currentSpread();
    return `<section class="stage2-completion">${heading("RITUS COMPLETUS", "Ритуал завершён", `${s.name_ru} · открыты все ${s.card_count} карт`)}<div class="stage2-completed-spread">${map()}${mapLegend()}</div>${seal}<p class="stage2-complete-vow">ТОЛКОВАНИЕ ДОПУЩЕНО</p>${questionPanel()}<div class="stage2-form-actions"><button class="primary" data-s2="interpret">Перейти к толкованию →</button><button class="quiet" data-s2="resume">Вернуться к картам</button><button class="quiet" data-s2="reset">Новый ритуал</button></div></section>`;
  }
  function interpretation() {
    if (!session?.progress.finished) return ritual();
    return `<section class="stage2-completion">${heading("INTERPRETATIO", "Толкование", "Будет реализовано в Stage 3.")}<p class="stage2-placeholder">Этот этап проверяет только ритуал.<br>Значения карт и предсказания не подключены.</p><div class="stage2-form-actions"><button class="secondary" data-s2="completed">← К завершённому ритуалу</button><button class="quiet" data-s2="resume">Посмотреть карты</button></div></section>`;
  }
  function demo() {
    const major = data.cards.find((c) => c.card_id === "major_02");
    const minor = data.cards.find((c) => c.type === "minor");
    const draws = [
      { card_id: major.card_id, type: "major", orientation: "upright" },
      { card_id: major.card_id, type: "major", orientation: "reversed" },
      { card_id: minor.card_id, type: "minor" },
    ];
    return `<section class="cards-showcase stage2-demo">${heading("IMAGINES ARCANORUM", "Лица арканов", "Major: два разных демоизображения.<br>Minor: одно состояние.")}<div class="showcase-space">${draws.map((d) => `<figure class="card-unit"><div class="static-card">${face(d)}</div>${label(d)}</figure>`).join("")}</div><p class="demo-note">SVG повторяются между картами только для проверки UX. Это не художественные назначения.</p><div class="center-actions"><button class="primary" data-s2="${session ? "resume" : "choose"}">${session ? "Вернуться к ритуалу" : "Выбрать расклад"} →</button></div></section>`;
  }
  function showInfo(which) {
    const info = document.getElementById("info-dialog");
    document.getElementById("dialog-body").innerHTML =
      which === "archive"
        ? '<p class="overline">ARCHIVUM ARCANORUM</p><h2 id="dialog-title">Архив арканов</h2><p>Вход сохранён. Полный архив на этом этапе не реализован.</p>'
        : '<p class="overline">DIVINATIO IMPERIALIS</p><h2 id="dialog-title">О Таро</h2><p>Sacred Divinatio — утверждённое направление V1. Stage II проверяет выбор расклада, вопрос и последовательный ритуал.</p><p>28 демонстрационных карт, три локальные SVG-гравюры. Финальные изображения и значения не подключены. Сессия хранится только в этой вкладке.</p>';
    info.showModal();
  }
  function openMap() {
    if (!session || busy) return;
    const s = currentSpread();
    document.getElementById("ritual-map-body").innerHTML =
      `<p class="overline">FORMA RITUALIS</p><h2 id="ritual-map-title">${s.name_ru}</h2><p class="stage2-source-note">Открыто ${session.progress.opened_count} из ${s.card_count}. Выберите открытую или следующую позицию.</p>${map()}${mapLegend()}<p class="stage2-source-note">${s.layout_note_ru}</p>${s.source_status === "SOURCE_INCOMPLETE" ? '<p class="stage2-source-warning">SOURCE_INCOMPLETE · без значений позиций</p>' : ""}`;
    mapDialog.showModal();
    const current = mapDialog.querySelector(".stage2-map-position.is-current");
    current?.focus({ preventScroll: true });
  }
  function reset(target = null) {
    if (!session) {
      if (target) {
        selectedSpread = target;
        go("question");
      } else {
        question = "";
        restoreNotice = "";
        go("spreads");
      }
      return;
    }
    pendingReset = target;
    document.getElementById("reset-description").textContent =
      `Расклад «${currentSpread().name_ru}» и его вопрос будут удалены. Новый набор появится только после подтверждения начала нового ритуала.`;
    resetDialog.showModal();
  }
  function reveal(index) {
    if (!session || busy) return;
    const updated = engine.update(session, "reveal", index);
    if (updated === session) return;
    session = updated;
    save();
    busy = true;
    const button = root.querySelector(".stage2-flip");
    button.disabled = true;
    button
      .querySelector(".card-object")
      .insertAdjacentHTML("beforeend", face(session.draws[index]));
    const object = button.querySelector(".card-object");
    // Ensure the front exists before the physical flip starts.
    void object.offsetWidth;
    object.classList.add("is-revealed");
    const delay = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 820;
    timer = setTimeout(() => {
      busy = false;
      render();
      const draw = session.draws[index],
        card = cardDetails(draw).card;
      announce(
        `Позиция ${roman(index + 1)}. ${card.name_ru}.${draw.type === "major" ? (draw.orientation === "reversed" ? " Перевёрнутое положение." : " Прямое положение.") : ""} Открыто ${session.progress.opened_count} из ${session.draws.length}.`,
      );
      (
        root.querySelector(".stage2-continue") ||
        root.querySelector("#active-figure")
      )?.focus({ preventScroll: true });
    }, delay);
  }
  function handle(event) {
    const el = event.target.closest("[data-s2]");
    if (!mounted || !el || el.disabled) return;
    const action = el.dataset.s2;
    if (busy && !["view", "reset"].includes(action)) return;
    switch (action) {
      case "view": {
        const next = el.dataset.target;
        if (next === "ritual" && !session) return;
        go(next);
        break;
      }
      case "choose":
        go("spreads");
        break;
      case "select":
        if (!canSelect(el.dataset.spread)) return;
        if (session) reset(el.dataset.spread);
        else {
          selectedSpread = el.dataset.spread;
          go("question");
        }
        break;
      case "unspoken":
        readQuestion();
        go("confirm");
        break;
      case "question-continue":
        // Native form submission reads the current value, including IME/autofill.
        return;
      case "edit-question":
        if (!session) go("question");
        break;
      case "start":
        if (session || view !== "confirm") return;
        try {
          if (!canSelect(selectedSpread)) return;
          session = engine.createSession(sessionData, selectedSpread, question);
          restoreNotice = "";
          go("ritual");
        } catch {
          announce(
            "Не удалось сформировать демосессию. Начало ритуала не выполнено.",
          );
        }
        break;
      case "resume":
        if (session) go("ritual");
        break;
      case "reveal":
        reveal(Number(el.dataset.index));
        break;
      case "next":
        if (session) {
          session = engine.update(session, "next");
          go("ritual", { scroll: false });
          root.querySelector(".stage2-flip")?.focus({ preventScroll: true });
        }
        break;
      case "map":
        openMap();
        break;
      case "map-focus": {
        if (!session) return;
        const i = Number(el.dataset.index);
        const updated = engine.update(session, "focus", i);
        if (updated === session) return;
        session = updated;
        if (mapDialog.open) mapDialog.close();
        go("ritual", { scroll: false });
        (
          root.querySelector(".stage2-flip:not(:disabled)") ||
          root.querySelector("#active-figure")
        )?.focus({ preventScroll: true });
        break;
      }
      case "finish":
        if (!session) return;
        session = engine.update(session, "finish");
        if (session.progress.finished) go("complete");
        break;
      case "completed":
        if (session?.progress.finished) go("complete");
        break;
      case "interpret":
        if (session?.progress.finished) go("interpretation");
        break;
      case "reset":
        reset();
        break;
      case "archive":
        showInfo("archive");
        break;
      case "about":
        showInfo("about");
        break;
      case "demo":
        go("demo");
        break;
      case "stress":
        if (!developerMode || !fixture) return;
        if (session) reset(fixture.spread_id);
        else {
          selectedSpread = fixture.spread_id;
          go("question");
        }
        break;
    }
  }
  mapDialog.addEventListener("click", handle);
  document.getElementById("confirm-reset").addEventListener("click", () => {
    const target = pendingReset;
    resetDialog.close();
    cancelAnimation();
    session = null;
    question = "";
    restoreNotice = "";
    if (target) selectedSpread = target;
    else if (!canSelect(selectedSpread)) selectedSpread = "imperator";
    go(target ? "question" : "spreads");
    announce(
      "Текущая сессия удалена. Подтвердите начало нового ритуала, чтобы получить новый набор.",
    );
  });
  resetDialog.addEventListener("close", () => {
    pendingReset = null;
  });
  window.ImperialTarotStage2 = Object.freeze({
    mount(element, options) {
      root = element;
      chrome = options;
      mounted = true;
      if (!root.dataset.stage2Events) {
        root.addEventListener("click", handle);
        root.addEventListener("input", (event) => {
          if (mounted && event.target.id === "ritual-question") {
            syncQuestionInput();
          }
        });
        root.addEventListener("change", (event) => {
          if (mounted && event.target.id === "ritual-question")
            syncQuestionInput();
        });
        root.addEventListener("submit", (event) => {
          if (!mounted || event.target.id !== "ritual-question-form") return;
          event.preventDefault();
          readQuestion();
          go("confirm");
        });
        root.dataset.stage2Events = "true";
      }
      render();
    },
    unmount() {
      cancelAnimation();
      mounted = false;
      delete document.body.dataset.s2View;
      if (mapDialog.open) mapDialog.close();
      if (resetDialog.open) resetDialog.close();
    },
  });
})();
