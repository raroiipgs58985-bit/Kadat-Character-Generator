/* Stage 5B-2: presentation, clipboard and ordinary navigation only. */
(() => {
  "use strict";
  const ui = window.ImperialTarotConvergenceUI;
  const flow = window.ImperialTarotConvergence;
  const generator = window.ImperialTarotConvergenceReaderPrompt;
  const root = document.getElementById("main");
  if (!ui || !flow || !generator || !root) return;

  let panel = null, dossier = "", readerSession = null, opener = null;
  const completeSession = () => {
    const session = ui.getSession();
    return session?.progress?.finished === true &&
      session.progress.opened_count === 16 && session.draws?.length === 16 &&
      flow.phase(session) === "complete" ? session : null;
  };
  const active = () => panel?.open && readerSession === completeSession();

  function makePanel() {
    if (panel) return;
    panel = document.createElement("dialog");
    panel.id = "cv-external-reader";
    panel.className = "cv-external-reader";
    panel.setAttribute("aria-labelledby", "cv-external-reader-title");
    panel.setAttribute("aria-describedby", "cv-external-reader-description");
    panel.innerHTML = `
      <header class="cv-reader-heading">
        <div><p class="overline">EXTERNUS LECTOR / CONVERGENCE</p>
        <h2 id="cv-external-reader-title">Чтец императорского Таро</h2></div>
        <button class="cv-reader-close" type="button" aria-label="Закрыть Чтеца и вернуться к раскладу">×</button>
      </header>
      <div class="cv-reader-content">
        <p class="cv-reader-ritual">+++ РАСКЛАД ЗАВЕРШЁН +++</p>
        <p id="cv-external-reader-description">Досье Чтеца подготовлено локально. Скопируйте его и передайте внешнему Чтецу для толкования открывшихся знаков.</p>
        <aside class="cv-reader-question"><p class="overline">ВОПРОС ЧТЕЦА</p><blockquote></blockquote></aside>
        <div class="cv-reader-actions">
          <button class="primary" id="cv-copy-dossier" type="button" autofocus>Скопировать промт</button>
          <p class="cv-copy-status" id="cv-copy-status" role="status" aria-live="polite" aria-atomic="true"></p>
          <div class="cv-reader-launches">
            <a class="secondary" href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer">Открыть DeepSeek ↗</a>
            <a class="secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">Открыть ChatGPT ↗</a>
          </div>
        </div>
        <p class="cv-reader-note">Внешний Чтец откроется отдельно. Вставьте промт самостоятельно. Досье можно передать и другому Чтецу.</p>
        <details class="cv-dossier-details"><summary>Просмотреть промт</summary>
          <p class="cv-dossier-note">Полное досье без сокращений. Текст можно выделить и скопировать вручную.</p>
          <pre class="cv-dossier-text" tabindex="0" aria-label="Полный промт Чтеца"></pre>
        </details>
        <button class="secondary cv-reader-return" type="button">Вернуться к раскладу</button>
      </div>`;
    document.body.append(panel);
    panel.querySelectorAll(".cv-reader-close, .cv-reader-return").forEach(button =>
      button.addEventListener("click", () => panel.close()));
    panel.addEventListener("close", () => {
      document.body.classList.remove("cv-reader-is-open");
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
    panel.querySelectorAll(".cv-reader-launches a").forEach(link =>
      link.addEventListener("click", event => { if (!active()) event.preventDefault(); }));
    panel.querySelector("#cv-copy-dossier").addEventListener("click", async () => {
      if (!active()) return;
      const session = readerSession, text = dossier;
      const button = panel.querySelector("#cv-copy-dossier");
      button.disabled = true;
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        if (active() && readerSession === session)
          panel.querySelector("#cv-copy-status").textContent = "+++ ДОСЬЕ ЧТЕЦА СКОПИРОВАНО +++";
      } catch {
        if (active() && readerSession === session) {
          panel.querySelector(".cv-dossier-details").open = true;
          const preview = panel.querySelector(".cv-dossier-text");
          preview.focus();
          const range = document.createRange();
          range.selectNodeContents(preview);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          panel.querySelector("#cv-copy-status").textContent = "Автокопирование недоступно. Скопируйте выделенное досье вручную.";
        }
      } finally { button.disabled = false; }
    });
  }

  function openReader(button) {
    const session = completeSession();
    if (!session) return;
    let text;
    try {
      // The accepted generator is the single authoritative implementation.
      text = generator.fromCompletedSession(session);
    } catch {
      const status = root.querySelector("#cv-reader-status");
      if (status) status.textContent = "Досье не удалось подготовить. Открытый расклад сохранён.";
      return;
    }
    makePanel();
    readerSession = session; dossier = text; opener = button;
    panel.querySelector(".cv-dossier-text").textContent = dossier;
    panel.querySelector(".cv-reader-question blockquote").textContent = session.question;
    panel.querySelector(".cv-dossier-details").open = false;
    panel.querySelector("#cv-copy-status").textContent = "";
    document.body.classList.add("cv-reader-is-open");
    panel.showModal();
    panel.querySelector("#cv-copy-dossier").focus({ preventScroll: true });
    panel.scrollTop = 0;
  }

  function syncAvailability() {
    const session = completeSession();
    if (!session && panel) {
      if (panel.open) panel.close();
      dossier = ""; readerSession = null;
      panel.querySelector(".cv-dossier-text").textContent = "";
      panel.querySelector(".cv-reader-question blockquote").textContent = "";
    }
    const button = root.querySelector(".cv-reader-placeholder button");
    if (button) {
      button.disabled = !session;
      button.type = "button";
      button.dataset.externalReader = "open";
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", "cv-external-reader");
      const status = root.querySelector("#cv-reader-status");
      if (status && session) status.textContent = "+++ ВНЕШНИЙ ЧТЕЦ ДОСТУПЕН +++";
    }
    const entryNote = root.querySelector("#cv-question-note");
    if (entryNote) entryNote.textContent = "Вопрос сохранится в этой вкладке. После открытия XVI можно подготовить досье и передать его внешнему Чтецу.";
  }
  root.addEventListener("click", event => {
    const button = event.target.closest('[data-external-reader="open"]');
    if (button && !button.disabled) openReader(button);
  });
  // Observe presentation replacement only; Stage 5A owns all state/draw/reveal changes.
  new MutationObserver(syncAvailability).observe(root, { childList: true });
  syncAvailability();
})();
