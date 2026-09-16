/* Small observable store. Snapshots contain JSON data only, never DOM nodes. */
(function (root) {
  "use strict";
  function create(initial) {
    let value = initial;
    const listeners = new Set();
    return {
      get: () => value,
      replace(next) {
        value = next;
        for (const listener of listeners) listener(value);
      },
      update(change) {
        this.replace(
          typeof change === "function"
            ? change(value)
            : { ...value, ...change },
        );
      },
      subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  }
  const api = { create };
  if (typeof module !== "undefined") module.exports = api;
  if (root) root.KadatStore = api;
})(typeof window !== "undefined" ? window : null);
