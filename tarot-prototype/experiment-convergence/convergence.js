/* Presentation only. No semantic lookup, interpretation dependency, or network reader. */
(() => {
  "use strict";
  const data = window.ImperialTarotProduction;
  const flow = window.ImperialTarotConvergence;
  const root = document.getElementById("main");
  const resetDialog = document.getElementById("cv-reset-dialog");
  const STORAGE_KEY = "imperial-tarot.experiment.convergence.stage5a.v1";
  const numerals = ["I", "II", "III", "IV", "V"];
  let session = null, question = "", storageAvailable = true, restoreNotice = "";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (x) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[x]);
  const number = (index) => String(index + 1).padStart(2, "0");
  function save() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ session, question })); }
    catch { storageAvailable = false; }
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      session = saved.session ? flow.restore(saved.session) : null;
      question = session?.question || (typeof saved.question === "string" ? saved.question : "");
      if (saved.session && !session)
        restoreNotice = "Прежний экспериментальный расклад не удалось восстановить. Вопрос сохранён; начните новый ритуал.";
    }
  } catch { storageAvailable = false; }
  function cardInfo(index) {
    const draw = session.draws[index];
    const card = data.getCard(draw.card_id);
    const artwork = card.type === "major" ? card[draw.orientation] : card.artwork;
    return {
      card, artwork,
      state: card.type === "major"
        ? (draw.orientation === "reversed" ? "Перевёрнутое положение" : "Прямое положение")
        : `${card.suit} · ${card.rank}`,
      rank: card.type === "major" ? card.number : card.rank,
    };
  }
  const opened = (index) => Boolean(session && index < session.progress.opened_count);
  function slot(index, extraClass = "") {
    const isOpen = opened(index);
    const info = isOpen ? cardInfo(index) : null;
    const current = session?.progress.current_index === index;
    const accessible = `${index === 15 ? "XVI — Схождение" : `Знак ${number(index)}`}. ${isOpen ? `${info.card.name_ru}. ${info.state}` : "Закрыт"}`;
    return `<button class="cv-slot ${extraClass}${isOpen ? " is-open" : ""}${current ? " is-current" : ""}" data-cv="inspect" data-index="${index}" ${isOpen ? "" : "disabled"} ${current && isOpen ? 'aria-current="true"' : ""} aria-label="${esc(accessible)}"><img src="${isOpen ? `../${esc(info.artwork.image)}` : "../assets/card-back-d.svg"}" alt="" loading="lazy" decoding="async"><span>${index === 15 ? "XVI" : number(index)}</span></button>`;
  }
  function board() {
    return `<div class="cv-board" role="group" aria-label="Пять отдельных путей сходятся к шестнадцатой карте">${numerals.map((n, p) => `<section class="cv-path${session && session.progress.opened_count >= (p + 1) * 3 ? " is-path-open" : ""}" style="--path-row:${p + 1}" aria-label="Путь ${n}"><h3><span>Путь</span>${n}</h3>${[0, 1, 2].map((i) => slot(p * 3 + i)).join("")}</section>`).join("")}<svg class="cv-threads" viewBox="0 0 100 500" preserveAspectRatio="none" aria-hidden="true" focusable="false">${[50, 150, 250, 350, 450].map((y, i) => `<path class="${session?.progress.opened_count >= (i + 1) * 3 ? "is-path-open" : ""}" d="M 0 ${y} C 38 ${y}, 64 250, 100 250"/>`).join("")}</svg><div class="cv-convergence-knot">${slot(15, "cv-knot-card")}<span>Схождение</span></div></div>`;
  }
  function entry() {
    return `<section class="cv-entry"><div class="cv-entry-copy"><p class="overline">ASTRO-HOROSCOPE / EXPERIMENTUM</p><h1>Схождение</h1><p class="cv-latin">CONVERGENCE</p><p class="cv-intro">Пять путей. Пятнадцать знаков.<br>Одна общая карта Схождения.</p><p class="cv-source-note">Экспериментальная, неканоническая схема. У путей нет заданных тем; у трёх знаков внутри каждого пути — заданных значений позиций.</p><form id="cv-question-form"><label for="cv-question">ВОПРОС ЧТЕЦА / ЦЕЛЬ</label><textarea id="cv-question" name="question" required rows="3" maxlength="2000" placeholder="Как достигнуть цели X?" aria-describedby="cv-question-note">${esc(question)}</textarea><p id="cv-question-note">Вопрос сохранится в этой вкладке. Чтец ещё не подключён; толкование в этом эксперименте недоступно.</p><button class="primary" id="cv-start" type="submit" ${question.trim() ? "" : "disabled"}>Начать Схождение →</button></form>${restoreNotice ? `<p class="cv-notice" role="status">${esc(restoreNotice)}</p>` : ""}${!storageAvailable ? '<p class="cv-notice">Хранилище вкладки недоступно. Вопрос и карты сохраняются в памяти до перезагрузки.</p>' : ""}</div><div class="cv-entry-form"><p class="overline">V VIAE / UNUM SIGNUM</p>${board()}<p class="cv-board-caption">Пути I–V · по три карты<br>XVI · общий знак Схождения</p></div></section>`;
  }
  function questionBlock() {
    return `<aside class="cv-question-block" aria-label="Вопрос чтеца"><p class="overline">ВОПРОС ЧТЕЦА</p><blockquote>«${esc(session.question)}»</blockquote></aside>`;
  }
  function currentPath() {
    const index = session.progress.current_index;
    if (index === 15) return "";
    const path = Math.floor(index / 3);
    return `<nav class="cv-current-path" aria-label="Карты пути ${numerals[path]}">${[0, 1, 2].map((i) => slot(path * 3 + i)).join("")}<p>Путь ${numerals[path]} → Схождение</p></nav>`;
  }
  function focusCard(index, waiting = false) {
    const isOpen = opened(index);
    const info = isOpen ? cardInfo(index) : null;
    const special = index === 15;
    const frame = `<span class="cv-art-frame"><img class="cv-art" src="${isOpen ? `../${esc(info.artwork.image)}` : "../assets/card-back-d.svg"}" alt="${isOpen ? esc(info.card.name_ru) : "Закрытая карта: имперская геральдика"}" decoding="async">${isOpen ? `<span class="cv-rank">${esc(info.rank)}</span>` : ""}</span>`;
    return `<figure class="cv-focus-card${special ? " cv-final-card" : ""}">${!isOpen && !special
      ? `<button class="cv-reveal" data-cv="reveal-path" aria-label="Открыть знак ${number(index)}">${frame}</button>`
      : `<div class="cv-art-holder">${frame}</div>`}<figcaption>${special ? '<p class="cv-position">XVI — СХОЖДЕНИЕ</p>' : `<p class="cv-position">ЗНАК ${index + 1} / 16</p>`}${isOpen ? `<p class="cv-name-en">${esc(info.card.name_en)}</p><h2 class="cv-name-ru">${esc(info.card.name_ru)}</h2><p class="cv-state">${esc(info.state)}</p>` : `<p class="cv-card-prompt">${waiting ? "Общий знак остаётся закрытым." : "Откройте текущую карту."}</p>`}</figcaption></figure>`;
  }
  function controls(phase) {
    const p = session.progress;
    if (phase === "awaiting_convergence")
      return '<div class="cv-controls"><button class="primary cv-convergence-action" data-cv="reveal-convergence">Открыть Схождение</button></div>';
    if (phase === "complete")
      return '<div class="cv-reader-placeholder"><p id="cv-reader-status" class="cv-ritual-status">+++ ЧТЕЦ ЕЩЁ НЕ ПРИЗВАН +++</p><button class="primary" disabled aria-describedby="cv-reader-status">Запросить толкование</button></div>';
    const pathDone = p.opened_count > 0 && p.opened_count % 3 === 0 && p.current_index === p.opened_count - 1;
    return `<div class="cv-controls">${pathDone ? `<p class="cv-ritual-status cv-path-completion">+++ ПУТЬ ${numerals[p.opened_count / 3 - 1]} ОТКРЫТ +++</p>` : ""}${p.current_index < p.opened_count ? `<button class="primary cv-next" data-cv="next">${pathDone ? `К пути ${numerals[p.opened_count / 3]}` : `К знаку ${number(p.opened_count)}`} →</button>` : ""}</div>`;
  }
  function mobileGallery() {
    return `<details class="cv-mobile-gallery" open><summary>ОТКРЫТЫЙ РАСКЛАД · 16 КАРТ</summary>${numerals.map((n, p) => `<section><h2>Путь ${n}</h2><div class="cv-gallery-path">${[0, 1, 2].map((i) => slot(p * 3 + i)).join("")}</div></section>`).join("")}<section class="cv-gallery-convergence"><h2>XVI — Схождение</h2>${slot(15)}</section></details>`;
  }
  function ritual() {
    const phase = flow.phase(session), p = session.progress;
    const waiting = phase === "awaiting_convergence";
    const complete = phase === "complete";
    const index = waiting ? 15 : p.current_index;
    const path = Math.min(4, Math.floor(index / 3));
    return `<section class="cv-ritual${waiting ? " is-awaiting" : ""}${complete ? " is-complete" : ""}"><header class="cv-ritual-heading"><p class="overline">ASTRO-HOROSCOPE / EXPERIMENTUM</p><h1>Схождение</h1>${waiting ? '<div class="cv-gate-status" role="status"><p>+++ ПЯТЬ ПУТЕЙ ОТКРЫТЫ +++</p><p>+++ ЗНАК СХОЖДЕНИЯ ОЖИДАЕТ +++</p></div>' : complete ? '<div class="cv-gate-status" role="status"><p>+++ СХОЖДЕНИЕ ЗАВЕРШЕНО +++</p><p>+++ ПЯТЬ ПУТЕЙ СОШЛИСЬ В ЕДИНОМ ЗНАКЕ +++</p></div>' : `<p class="cv-path-heading">ПУТЬ ${numerals[path]} ИЗ V <span>ЗНАК ${index + 1} / 16</span></p>`}</header><div class="cv-ritual-layout"><aside class="cv-structure"><div class="cv-desktop-board"><h2>Пять путей · один знак</h2>${board()}<p class="cv-board-caption">Нажмите на открытый знак, чтобы рассмотреть его.<br>Закрытые карты остаются закрытыми.</p></div><details class="cv-mobile-overview" ${waiting ? "open" : ""}><summary>ПЯТЬ ПУТЕЙ · ОТКРЫТО ${p.opened_count} / 16</summary>${board()}</details></aside><div class="cv-focus">${!waiting && !complete ? currentPath() : ""}${focusCard(index, waiting)}<p class="cv-progress">Открыто ${p.opened_count} из 16</p>${controls(phase)}${waiting && p.current_index < 15 && opened(p.current_index) ? `<details class="cv-last-path-inspection"><summary>Рассмотреть знак ${number(p.current_index)}</summary>${focusCard(p.current_index)}</details>` : ""}<button class="quiet cv-reset" data-cv="reset">Новый расклад</button></div></div>${questionBlock()}${complete ? mobileGallery() : ""}${!storageAvailable ? '<p class="cv-notice">Сессия сохраняется в памяти до перезагрузки страницы.</p>' : ""}</section>`;
  }
  function render(focusAction = "") {
    document.body.dataset.cvPhase = flow.phase(session);
    root.innerHTML = session ? ritual() : entry();
    save();
    if (focusAction) root.querySelector(`[data-cv="${focusAction}"]`)?.focus({ preventScroll: true });
  }
  function announce(text) {
    document.getElementById("announcement").textContent = text;
  }
  root.addEventListener("input", (event) => {
    if (event.target.id !== "cv-question") return;
    question = event.target.value;
    document.getElementById("cv-start").disabled = !question.trim();
    save();
  });
  root.addEventListener("submit", (event) => {
    if (event.target.id !== "cv-question-form") return;
    event.preventDefault();
    if (session || !question.trim()) return;
    session = flow.create(question);
    render("reveal-path");
    root.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    announce("Схождение начато. Путь I. Знак 1 из 16.");
  });
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cv]");
    if (!button || button.disabled || !session) return;
    const action = button.dataset.cv;
    if (action === "reset") { resetDialog.showModal(); return; }
    const index = action === "reveal-path" ? session.progress.current_index : Number(button.dataset.index);
    const next = flow.update(session, action, index);
    if (next === session) return;
    session = next;
    const phase = flow.phase(session);
    render(action === "reveal-path" ? (phase === "awaiting_convergence" ? "reveal-convergence" : "next") : action === "next" ? "reveal-path" : "");
    if (["next", "inspect", "reveal-convergence"].includes(action)) {
      root.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    if (action === "reveal-path") {
      const info = cardInfo(index);
      const count = session.progress.opened_count;
      announce(`Знак ${index + 1}. ${info.card.name_ru}. ${info.state}. Открыто ${count} из 16.${count === 15 ? " Пять путей открыты. Знак Схождения ожидает отдельного открытия." : count % 3 === 0 ? ` Путь ${numerals[count / 3 - 1]} открыт.` : ""}`);
    } else if (action === "reveal-convergence") {
      const info = cardInfo(15);
      announce(`XVI — Схождение. ${info.card.name_ru}. ${info.state}. Все шестнадцать карт открыты. Чтец ещё не призван.`);
    }
  });
  document.getElementById("cv-confirm-reset").addEventListener("click", () => {
    resetDialog.close();
    session = null; question = ""; restoreNotice = "";
    render();
    document.getElementById("cv-question").focus();
    window.scrollTo({ top: 0, behavior: "instant" });
    announce("Весь расклад сброшен. Для нового Схождения задайте вопрос.");
  });
  // Read-only integration boundary. No reader is invoked; incomplete sessions return null.
  window.ImperialTarotConvergenceUI = Object.freeze({
    getSession: () => session,
    getReaderInput: () => flow.toReaderInput(session),
  });
  render();
})();
