(() => {
  const resultPanel = document.querySelector(".result-panel");
  if (!resultPanel) return;

  form.addEventListener("submit", () => {
    window.setTimeout(() => {
      const calculationSucceeded = validationMessage.classList.contains("hidden")
        && result.classList.contains("character-card");
      if (!calculationSucceeded) return;

      resultPanel.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "start"
      });
    }, 0);
  });
})();
