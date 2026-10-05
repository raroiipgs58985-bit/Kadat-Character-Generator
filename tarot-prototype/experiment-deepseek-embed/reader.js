"use strict";

(() => {
  const officialWebChat = "https://chat.deepseek.com/";
  const panel = document.querySelector("#reader-panel");
  const openReader = document.querySelector("#open-reader");
  const fallback = document.querySelector("#fallback-reader");
  const direct = document.querySelector("#direct-reader");
  const slot = document.querySelector("#embed-slot");
  const attempt = document.querySelector("#attempt-embed");
  const prompt = document.querySelector("#mock-prompt");
  const copyStatus = document.querySelector("#copy-status");

  openReader.addEventListener("click", () => {
    panel.showModal();
    document.body.classList.add("reader-is-open");
  });
  document.querySelector("#close-reader").addEventListener("click", () => panel.close());
  panel.addEventListener("close", () => {
    document.body.classList.remove("reader-is-open");
    openReader.focus();
  });

  // A single ordinary iframe navigation; no cross-origin inspection or injection.
  attempt.addEventListener("click", () => {
    if (attempt.disabled) return;
    attempt.disabled = true;
    attempt.textContent = "Проверка уже выполнена";
    const frame = document.createElement("iframe");
    frame.title = "Официальный DeepSeek Web — проверка встраивания";
    frame.src = officialWebChat;
    slot.append(frame);
    fallback.hidden = true;
    direct.hidden = false;
    document.querySelector("#use-fallback").focus();
  });

  document.querySelector("#use-fallback").addEventListener("click", () => {
    // Removing our iframe stops its navigation without touching the remote page.
    slot.replaceChildren();
    direct.hidden = true;
    fallback.hidden = false;
    document.querySelector("#copy-prompt").focus();
  });

  document.querySelector("#copy-prompt").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(prompt.value);
      copyStatus.textContent = "Тестовая строка скопирована.";
    } catch {
      // User-controlled copying remains possible when clipboard permission is absent.
      document.querySelector(".mock-prompt-details").open = true;
      prompt.focus();
      prompt.select();
      copyStatus.textContent = "Скопируйте выделенную тестовую строку вручную.";
    }
  });
})();
