// Загружает нормализованный снимок данных полков из семи gzip/base64-фрагментов.
(() => {
  "use strict";

  async function decodeCatalog() {
    const chunks = window.KADAT_REGIMENT_PACKED_CHUNKS ?? [];
    if (chunks.length !== 7 || chunks.some(chunk => typeof chunk !== "string" || !chunk)) {
      throw new Error("Неполный набор данных генератора полков.");
    }

    const encoded = chunks.join("");
    const binary = typeof atob === "function"
      ? atob(encoded)
      : Buffer.from(encoded, "base64").toString("binary");
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));

    if (typeof DecompressionStream === "function") {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return JSON.parse(await new Response(stream).text());
    }

    if (typeof require === "function") {
      const zlib = require("node:zlib");
      return JSON.parse(zlib.gunzipSync(bytes).toString("utf8"));
    }

    throw new Error("Среда не поддерживает распаковку gzip.");
  }

  const root = window.KADAT_REGIMENT_DATA ??= {};
  window.KADAT_REGIMENT_DATA_READY = decodeCatalog().then(catalog => {
    Object.assign(root, catalog);
    return root;
  });
})();
