(function (root) {
  "use strict";
  const KEYS = {
    character: "kadat.character-draft.v2",
    regiments: "kadat.regiments.v1",
    source: "kadat.character-origin-source.v1",
    xeno: "kadat.generated-xeno-race.v1",
    armor: "kadat.generated-power-armor.v1",
    regimentDraft: "kadat.regiment-draft.v2",
    xenoDraft: "kadat.xeno-draft.v2",
    armorDraft: "kadat.armor-draft.v2",
  };
  function create(backend, onError = () => {}, onSaved = () => {}) {
    return {
      read(key, fallback, validate = () => true) {
        try {
          const raw = backend.getItem(key);
          if (raw === null) return fallback;
          const value = JSON.parse(raw);
          if (!validate(value))
            throw new Error("неподдерживаемая структура данных");
          return value;
        } catch (error) {
          onError(
            `Не удалось прочитать сохранение: ${error.message}. Исходная запись сохранена.`,
            key,
          );
          return fallback;
        }
      },
      write(key, value) {
        try {
          backend.setItem(key, JSON.stringify(value));
          onSaved(key);
          return true;
        } catch (error) {
          onError(
            "Автосохранение недоступно. Скачайте резервную копию JSON.",
            key,
          );
          return false;
        }
      },
      remove(key) {
        try {
          backend.removeItem(key);
          return true;
        } catch {
          onError("Не удалось удалить сохранение.", key);
          return false;
        }
      },
    };
  }
  function parseBackup(text) {
    if (text.length > 5_000_000)
      throw new Error("Файл слишком большой: максимум 5 МБ.");
    const value = JSON.parse(text, (key, v) => {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new Error("Недопустимое поле в файле.");
      return v;
    });
    if (
      !value ||
      value.format !== "kadat-workspace" ||
      value.version !== 2 ||
      !value.data ||
      Array.isArray(value.data)
    )
      throw new Error("Ожидается резервная копия Кадата версии 2.");
    return value.data;
  }
  function validateCharacter(d, data, advancement) {
    if (
      !d ||
      typeof d !== "object" ||
      typeof d.name !== "string" ||
      d.name.length > 5000
    )
      return false;
    if (
      !["planned", "random"].includes(d.mode) ||
      !["unspecified", "male", "female"].includes(d.gender) ||
      !["ready", "regiment"].includes(d.originSource)
    )
      return false;
    if (
      ![d.raceId, d.worldId, d.specialtyId].every((v) => typeof v === "string")
    )
      return false;
    for (const prop of ["rolls", "plannedAdditions"])
      if (!d[prop] || data.stats.some((s) => !Number.isFinite(d[prop][s])))
        return false;
    if (
      !Array.isArray(d.transfers) ||
      d.transfers.length > 20 ||
      d.transfers.some(
        (t) => !t || !data.stats.includes(t.from) || !data.stats.includes(t.to),
      )
    )
      return false;
    for (const prop of [
      "raceChoices",
      "homeworldChoices",
      "specialtyChoices",
      "regimentChoices",
    ])
      if (!d[prop] || typeof d[prop] !== "object" || Array.isArray(d[prop]))
        return false;
    for (const value of Object.values(d.raceChoices))
      if (!Array.isArray(value) || value.some((v) => typeof v !== "string"))
        return false;
    for (const prop of ["homeworldChoices", "specialtyChoices"])
      if (Object.values(d[prop]).some((v) => typeof v !== "string"))
        return false;
    if (d.regiment && !validateRegiment(d.regiment)) return false;
    if (
      Object.values(d.regimentChoices).some(
        (v) =>
          typeof v !== "string" &&
          (!Array.isArray(v) || v.some((x) => typeof x !== "string")),
      )
    )
      return false;
    const a = d.advancement;
    if (!a || !a.characteristics || !a.skills || !Array.isArray(a.talents))
      return false;
    if (
      data.stats.some(
        (s) =>
          !Number.isInteger(a.characteristics[s]) ||
          a.characteristics[s] < 0 ||
          a.characteristics[s] > 1000,
      )
    )
      return false;
    if (
      Object.values(a.skills).some(
        (s) =>
          !s ||
          typeof s.name !== "string" ||
          !Number.isInteger(s.count) ||
          s.count < 0 ||
          s.count > 4,
      )
    )
      return false;
    if (
      a.talents.length > 1000 ||
      a.talents.some(
        (t) =>
          !t ||
          !advancement.talents.some(
            (c) => c.id === t.catalogId && c.level === t.level,
          ) ||
          typeof t.id !== "string" ||
          typeof t.name !== "string" ||
          typeof t.option !== "string",
      )
    )
      return false;
    return true;
  }
  function validateRegiment(r) {
    return Boolean(
      r &&
        typeof r.id === "string" &&
        (r.step === undefined ||
          (Number.isInteger(r.step) && r.step >= 0 && r.step <= 4)) &&
        (r.equipmentSearch === undefined ||
          typeof r.equipmentSearch === "string") &&
        typeof r.name === "string" &&
        ["homeworldId", "originId", "commanderId", "regimentTypeId"].every(
          (k) => typeof r[k] === "string",
        ) &&
        ["trainingIds", "equipmentDoctrineIds"].every(
          (k) =>
            Array.isArray(r[k]) && r[k].every((v) => typeof v === "string"),
        ) &&
        (!r.drawbackIds ||
          (Array.isArray(r.drawbackIds) &&
            r.drawbackIds.every((v) => typeof v === "string"))) &&
        Array.isArray(r.extraEquipment) &&
        r.extraEquipment.every(
          (v) =>
            v &&
            typeof v.id === "string" &&
            Number.isInteger(v.quantity) &&
            v.quantity >= 0,
        ),
    );
  }
  const api = {
    KEYS,
    create,
    parseBackup,
    validateCharacter,
    validateRegiment,
  };
  if (typeof module !== "undefined") module.exports = api;
  if (root) {
    root.KadatStorage = api;
    let backend;
    try {
      backend = root.localStorage;
    } catch {
      backend = {
        getItem: () => null,
        setItem() {
          throw new Error("storage unavailable");
        },
      };
    }
    api.local = create(
      backend,
      (message) => {
        root.KadatStorage.lastError = message;
        root.dispatchEvent(
          new CustomEvent("kadat:storage-error", { detail: message }),
        );
      },
      (key) =>
        root.dispatchEvent(
          new CustomEvent("kadat:storage-saved", { detail: key }),
        ),
    );
  }
})(typeof window !== "undefined" ? window : null);
