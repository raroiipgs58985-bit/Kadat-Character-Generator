(function (root) {
  "use strict";
  const formats = new Map();
  root.KadatExports = {
    register(id, adapter) {
      formats.set(id, adapter);
    },
    list: () => [...formats.keys()],
    download(id, value) {
      const adapter = formats.get(id);
      if (!adapter) throw new Error("Формат экспорта недоступен.");
      adapter.download(value);
    },
  };
})(window);
