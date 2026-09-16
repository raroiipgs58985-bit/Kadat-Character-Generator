(function (root) {
  "use strict";
  const S = root.KadatStorage,
    storage = S.local,
    U = root.KadatUI;
  function snapshot() {
    return {
      character: root.KadatCharacterUI.store.get(),
      regiments: storage.read(
        S.KEYS.regiments,
        [],
        (v) => Array.isArray(v) && v.every(S.validateRegiment),
      ),
      xenoRace: root.KADAT_DATA.races.find((r) => r.generatedXeno) ?? null,
      regimentDraft: root.KadatFeatures.regiment.snapshot(),
      xenoDraft: root.KadatFeatures.xeno.snapshot(),
      armorDraft: root.KadatFeatures.armor.snapshot(),
    };
  }
  const validateXenoRace = (r) =>
    root.KadatSchemas.validateXenoRace(r, root.KADAT_DATA.stats);
  const validateXenoDraft = (d) =>
    root.KadatSchemas.validateXenoDraft(d, root.KADAT_DATA.stats);
  const validateArmorDraft = (d) =>
    root.KadatSchemas.validateArmorDraft(d, root.KADAT_POWER_ARMOR_DATA);
  function validate(value) {
    if (
      !S.validateCharacter(
        value.character,
        root.KADAT_DATA,
        root.KADAT_ADVANCEMENT,
      )
    )
      throw new Error("Некорректный черновик персонажа.");
    if (
      !Array.isArray(value.regiments) ||
      value.regiments.length > 20 ||
      !value.regiments.every(S.validateRegiment)
    )
      throw new Error("Некорректные сохранения полков.");
    if (
      value.character.regiment &&
      !S.validateRegiment(value.character.regiment)
    )
      throw new Error("Некорректный полк персонажа.");
    if (
      !root.KADAT_DATA.races.some(
        (r) => !r.generatedXeno && r.id === value.character.raceId,
      ) &&
      value.xenoRace?.id !== value.character.raceId
    )
      throw new Error("Раса персонажа отсутствует в файле и каталоге.");
    if (value.xenoRace && !validateXenoRace(value.xenoRace))
      throw new Error("Некорректная ксено-раса.");
    if (!S.validateRegiment(value.regimentDraft))
      throw new Error("Некорректный черновик полка.");
    if (!validateXenoDraft(value.xenoDraft))
      throw new Error("Некорректный черновик ксеноса.");
    if (!validateArmorDraft(value.armorDraft))
      throw new Error("Некорректный черновик брони.");
    for (const d of [value.regimentDraft, value.xenoDraft, value.armorDraft])
      if (
        d?.step !== undefined &&
        (!Number.isInteger(d.step) || d.step < 0 || d.step > 4)
      )
        throw new Error("Некорректный номер этапа.");
    return value;
  }
  function restore(value) {
    validate(value);
    if (value.xenoRace) {
      root.KADAT_XENO_DATA.installRace(value.xenoRace);
      storage.write(S.KEYS.xeno, value.xenoRace);
    } else {
      root.KADAT_DATA.races = root.KADAT_DATA.races.filter(
        (r) => !r.generatedXeno,
      );
      storage.remove(S.KEYS.xeno);
    }
    storage.write(S.KEYS.regiments, value.regiments);
    root.dispatchEvent(new CustomEvent("kadat:regiments-changed"));
    if (value.regimentDraft) {
      root.KadatFeatures.regiment.restore(value.regimentDraft);
      storage.write(S.KEYS.regimentDraft, value.regimentDraft);
    }
    if (value.xenoDraft) {
      root.KadatFeatures.xeno.restore(value.xenoDraft);
      storage.write(S.KEYS.xenoDraft, value.xenoDraft);
    }
    if (value.armorDraft) {
      root.KadatFeatures.armor.restore(value.armorDraft);
      storage.write(S.KEYS.armorDraft, value.armorDraft);
    }
    root.KadatCharacterUI.restore(value.character);
  }
  function serialize() {
    return JSON.stringify(
      {
        format: "kadat-workspace",
        version: 2,
        exportedAt: new Date().toISOString(),
        data: snapshot(),
      },
      null,
      2,
    );
  }
  document.querySelector("#backup-export").addEventListener("click", () => {
    U.download(
      serialize(),
      `${U.fileName(root.KadatCharacterUI.store.get().name || "Kadat")}.json`,
      "application/json",
    );
    U.announce(
      "JSON подготовлен: все четыре черновика и сохранённые полки",
      "valid",
      "ARCHIVE COMPILED",
    );
  });
  // Existing workspace export and browser print, available from every dossier.
  document
    .querySelectorAll(".builder-view .result-toolbar")
    .forEach((toolbar) => {
      const save = document.createElement("button");
      save.type = "button";
      save.className = "secondary";
      save.textContent = "Сохранить JSON";
      save.addEventListener("click", () =>
        document.querySelector("#backup-export").click(),
      );
      const print = document.createElement("button");
      print.type = "button";
      print.className = "quiet";
      print.textContent = "Печать";
      print.addEventListener("click", () => root.print());
      toolbar.append(save, print);
    });
  const input = document.querySelector("#backup-file");
  document
    .querySelector("#backup-import")
    .addEventListener("click", () => input.click());
  let beforeImport = null;
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 5_000_000)
        throw new Error("Максимальный размер файла — 5 МБ.");
      const value = validate(S.parseBackup(await file.text()));
      beforeImport = JSON.parse(serialize()).data;
      restore(value);
      root.KadatCharacterUI.notify(
        `Сохранение открыто. Все четыре черновика восстановлены: персонаж «${value.character.name || "Без имени"}», полк «${value.regimentDraft.name || "Без имени"}», ксенос «${value.xenoDraft.name || "Без имени"}», броня «${value.armorDraft.name || "Без имени"}». Формат совместим; готовность каждого формуляра показана в его мастере.`,
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiet";
      button.textContent = "Отменить открытие";
      button.addEventListener("click", () => {
        if (beforeImport) {
          restore(beforeImport);
          beforeImport = null;
          root.KadatCharacterUI.notify("Предыдущие черновики восстановлены.");
        }
      });
      document.querySelector("#app-notice").append(button);
    } catch (error) {
      root.KadatCharacterUI.notify(
        `Не удалось открыть файл: ${error.message}`,
        true,
      );
    } finally {
      input.value = "";
    }
  });
  root.KadatWorkspace = {
    snapshot,
    serialize,
    restore,
    validate,
    validateXenoDraft,
    validateArmorDraft,
    validateXenoRace,
  };
})(window);
