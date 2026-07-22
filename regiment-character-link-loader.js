(() => {
  "use strict";

  async function load() {
    const chunks = window.KADAT_REGIMENT_CHARACTER_LINK_PACKED_CHUNKS ?? [];
    if (chunks.length !== 3 || chunks.some(chunk => typeof chunk !== "string" || !chunk)) {
      throw new Error("Неполный пакет связи полка и персонажа.");
    }
    const binary = atob(chunks.join(""));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    if (typeof DecompressionStream !== "function") {
      throw new Error("Среда не поддерживает распаковку gzip.");
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const source = await new Response(stream).text();
    Function(`${source}\n//# sourceURL=regiment-character-link.js`)();
  }

  window.KADAT_REGIMENT_CHARACTER_LINK_READY = load().catch(error => {
    console.error("Не удалось связать генератор полка с персонажем", error);
    throw error;
  });
})();
