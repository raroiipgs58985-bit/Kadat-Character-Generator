(() => {
  "use strict";

  const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const STATS = ["НС", "НР", "СЛ", "ВН", "ЛВ", "ИН", "СВ", "ВС", "ОЩ"];
  const enc = new TextEncoder();

  const clean = value => String(value ?? "").replace(/\s+/g, " ").trim();
  const bonus = value => Math.floor(Number(value ?? 0) / 10);
  const numberText = value => {
    const number = Number(value ?? 0);
    return Number.isInteger(number)
      ? String(number)
      : number.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
  };

  function unique(values) {
    const seen = new Set();
    return (values ?? []).map(clean).filter(value => {
      const key = value.toLocaleLowerCase("ru-RU");
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function groupEntries(entries, showBonus) {
    const records = [];
    const grouped = new Map();
    const plain = new Set();

    for (const entry of entries ?? []) {
      const name = clean(entry?.name);
      const value = Number(entry?.bonus ?? 0);
      if (!name) continue;
      const match = name.match(/^(.+?)\s*\((.+)\)$/);
      if (!match) {
        const key = `${name.toLocaleLowerCase("ru-RU")}::${showBonus ? value : ""}`;
        if (plain.has(key)) continue;
        plain.add(key);
        records.push({ name, bonus: value });
        continue;
      }

      const base = clean(match[1]);
      const key = `${base.toLocaleLowerCase("ru-RU")}::${showBonus ? value : ""}`;
      let record = grouped.get(key);
      if (!record) {
        record = { base, bonus: value, options: [], keys: new Set() };
        grouped.set(key, record);
        records.push(record);
      }
      for (const option of clean(match[2]).split(/\s*[,;]\s*/).filter(Boolean)) {
        const optionKey = option.toLocaleLowerCase("ru-RU");
        if (record.keys.has(optionKey)) continue;
        record.keys.add(optionKey);
        record.options.push(option);
      }
    }

    return records.map(record => {
      const label = record.base ? `${record.base} (${record.options.join(", ")})` : record.name;
      return showBonus ? `${label}${record.bonus >= 0 ? "+" : ""}${record.bonus}` : label;
    });
  }

  function sizeOf(character) {
    for (const value of [
      ...(character?.race?.traits ?? []),
      ...(character?.world?.traits ?? []),
      ...(character?.specialtyTraits ?? []),
      ...(character?.specialty?.traits ?? [])
    ]) {
      const match = clean(value).match(/размер\s*\(\s*([+-]?\d+)\s*\)/i);
      if (match) return Number(match[1]);
    }
    return 0;
  }

  function equipmentOf(character) {
    return unique([
      ...(character?.race?.equipment ?? []),
      ...(character?.world?.equipment ?? []),
      ...(character?.specialtyEquipment ?? []),
      ...(character?.specialty?.equipment ?? [])
    ]);
  }

  function featuresOf(character) {
    const uniqueFeatures = (character?.race?.uniqueFeatures ?? []).map(feature => {
      const name = clean(feature?.name);
      const rating = Number(feature?.rating);
      return name && Number.isFinite(rating) ? `${name} (${rating})` : name;
    });
    const rules = [
      ...(character?.race?.specialRules ?? []),
      ...(character?.world?.specialRules ?? []),
      ...(character?.specialtyRules ?? []),
      ...(character?.specialty?.specialRules ?? [])
    ].map(rule => clean(rule?.name) || clean(rule?.text));
    return unique([
      ...uniqueFeatures,
      ...(character?.race?.traits ?? []),
      ...(character?.world?.traits ?? []),
      ...(character?.specialtyTraits ?? []),
      ...(character?.specialty?.traits ?? []),
      ...rules
    ]);
  }

  function genderText(value) {
    if (value === "male") return "мужчина";
    if (value === "female") return "женщина";
    return "";
  }

  function exportData(character) {
    if (!character) throw new Error("Персонаж ещё не сформирован.");
    const skills = groupEntries(
      [...(character.skills instanceof Map ? character.skills.entries() : Object.entries(character.skills ?? {}))]
        .map(([name, value]) => ({ name, bonus: value })),
      true
    );
    const talents = groupEntries((character.talents ?? []).map(name => ({ name })), false);
    const movement = Math.max(0, bonus(character?.stats?.ЛВ) + sizeOf(character));
    return {
      name: clean(character.name) || "БЕЗЫМЯННЫЙ ПЕРСОНАЖ",
      description: unique([
        character?.race?.name,
        character?.world?.name,
        character?.specialty?.name,
        genderText(character?.gender)
      ]).join(" • ") || "Данные происхождения не указаны",
      stats: Object.fromEntries(STATS.map(stat => {
        const value = Number(character?.stats?.[stat] ?? 0);
        return [stat, `${numberText(value)} (${bonus(value)})`];
      })),
      xp: numberText(character.availableXp),
      movement: `${movement}/${movement * 2}/${movement * 3}/${movement * 6}`,
      armor: "—",
      toughness: String(bonus(character?.stats?.ВН)),
      wounds: numberText(character.wounds),
      insanity: "0",
      corruption: "0",
      skills: skills.join("; ") || "Нет навыков",
      talents: talents.join("; ") || "Нет талантов",
      psychic: "Нет",
      features: featuresOf(character).join("; ") || "Нет особенностей",
      implants: "—",
      equipment: equipmentOf(character).join("; ") || "Снаряжение не указано"
    };
  }

  function xml(value) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function textCell(ref, value, style = 1) {
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  }

  function blankCell(ref, style = 1) {
    return `<c r="${ref}" s="${style}"/>`;
  }

  function row(number, cells) {
    return `<row r="${number}" ht="15.75" customHeight="1">${cells.join("")}</row>`;
  }

  function sheetXml(data) {
    const rows = [];
    rows.push(row(1, [textCell("A1", data.name.toLocaleUpperCase("ru-RU"), 2), blankCell("B1", 2), blankCell("C1", 2), blankCell("D1", 2)]));
    rows.push(row(2, [textCell("A2", data.description, 3), blankCell("B2", 3), blankCell("C2", 3), blankCell("D2", 3)]));

    const labels = ["НС", "НР", "СЛ", "ВН", "ЛВ", "ИН", "СВ", "ВС", "ОЩ", "Опыт", "Движение", "ОБ", "БВ", "Раны", "Безумие", "Порча"];
    const values = [
      ...STATS.map(stat => data.stats[stat]), data.xp, data.movement, data.armor,
      data.toughness, data.wounds, data.insanity, data.corruption
    ];
    for (let index = 0; index < labels.length; index += 1) {
      const number = index + 3;
      const valueStyle = number >= 12 ? 7 : 6;
      const image = number === 3
        ? textCell("C3", "ПОРТРЕТ\nНЕ ПРИКРЕПЛЁН", 4)
        : blankCell(`C${number}`, 4);
      rows.push(row(number, [
        textCell(`A${number}`, labels[index], 1),
        textCell(`B${number}`, values[index], valueStyle),
        image,
        blankCell(`D${number}`, 4)
      ]));
    }

    const blocks = [
      [19, "Навыки", data.skills],
      [20, "Таланты", data.talents],
      [21, "Пси-силы", data.psychic],
      [22, "Особенности", data.features],
      [23, "Импланты", data.implants],
      [24, "Снаряжение", data.equipment]
    ];
    for (const [number, label, value] of blocks) {
      rows.push(row(number, [
        textCell(`A${number}`, label, 1),
        textCell(`B${number}`, value, 5),
        blankCell(`C${number}`, 5),
        blankCell(`D${number}`, 5)
      ]));
    }

    return `<?xml version="1.0" encoding="utf-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:D24"/>
<sheetViews><sheetView workbookViewId="0" showGridLines="0" zoomScale="100" zoomScaleNormal="100"/></sheetViews>
<sheetFormatPr defaultRowHeight="15.75"/>
<cols><col min="1" max="4" width="12.63" customWidth="1"/></cols>
<sheetData>${rows.join("")}</sheetData>
<mergeCells count="9"><mergeCell ref="A1:D1"/><mergeCell ref="A2:D2"/><mergeCell ref="C3:D18"/><mergeCell ref="B19:D19"/><mergeCell ref="B20:D20"/><mergeCell ref="B21:D21"/><mergeCell ref="B22:D22"/><mergeCell ref="B23:D23"/><mergeCell ref="B24:D24"/></mergeCells>
<printOptions horizontalCentered="1" verticalCentered="1"/>
<pageMargins left="0.25" right="0.25" top="0.25" bottom="0.25" header="0.1" footer="0.1"/>
<pageSetup orientation="portrait" paperSize="9" fitToWidth="1" fitToHeight="1"/>
</worksheet>`;
  }

  const stylesXml = `<?xml version="1.0" encoding="utf-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="8">
<font><sz val="8"/><color rgb="FFE5DED0"/><name val="Aptos"/></font>
<font><b/><sz val="7"/><color rgb="FFB99755"/><name val="Aptos Narrow"/></font>
<font><b/><sz val="11"/><color rgb="FFB99755"/><name val="Georgia"/></font>
<font><i/><sz val="7"/><color rgb="FFA69E8D"/><name val="Georgia"/></font>
<font><i/><sz val="8"/><color rgb="FFA69E8D"/><name val="Georgia"/></font>
<font><sz val="6"/><color rgb="FFE5DED0"/><name val="Aptos Narrow"/></font>
<font><b/><sz val="8"/><color rgb="FFA6C69A"/><name val="Consolas"/></font>
<font><b/><sz val="8"/><color rgb="FFEED79A"/><name val="Consolas"/></font>
</fonts>
<fills count="7">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF101314"/><bgColor rgb="FF101314"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF171B1D"/><bgColor rgb="FF171B1D"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1A1F21"/><bgColor rgb="FF1A1F21"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF282216"/><bgColor rgb="FF282216"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF202629"/><bgColor rgb="FF202629"/></patternFill></fill>
</fills>
<borders count="5">
<border/>
<border><left style="thin"><color rgb="FF695533"/></left><right style="thin"><color rgb="FF695533"/></right><top/><bottom style="thin"><color rgb="FF403B31"/></bottom></border>
<border><left style="medium"><color rgb="FFB99755"/></left><right style="medium"><color rgb="FFB99755"/></right><top style="medium"><color rgb="FFB99755"/></top><bottom style="medium"><color rgb="FFB99755"/></bottom></border>
<border><left style="thin"><color rgb="FF695533"/></left><right style="thin"><color rgb="FF695533"/></right><top/><bottom style="thin"><color rgb="FF695533"/></bottom></border>
<border><left style="thin"><color rgb="FFB99755"/></left><right style="thin"><color rgb="FFB99755"/></right><top style="thin"><color rgb="FFB99755"/></top><bottom style="thin"><color rgb="FFB99755"/></bottom></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="2" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="4" borderId="3" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="6" borderId="4" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
<xf numFmtId="0" fontId="7" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" shrinkToFit="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

  const staticEntries = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="/xl/workbook.xml" Id="rId1"/></Relationships>`,
    "xl/workbook.xml": `<?xml version="1.0" encoding="utf-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Персонаж" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">'Персонаж'!$A$1:$D$24</definedName></definedNames></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="/xl/styles.xml" Id="rId2"/><Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="/xl/worksheets/sheet1.xml" Id="rId1"/></Relationships>`,
    "xl/styles.xml": stylesXml
  };

  function u16(bytes, offset, value) {
    bytes[offset] = value & 255;
    bytes[offset + 1] = (value >>> 8) & 255;
  }
  function u32(bytes, offset, value) {
    bytes[offset] = value & 255;
    bytes[offset + 1] = (value >>> 8) & 255;
    bytes[offset + 2] = (value >>> 16) & 255;
    bytes[offset + 3] = (value >>> 24) & 255;
  }
  function join(parts) {
    const output = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
      output.set(part, offset);
      offset += part.length;
    }
    return output;
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      table[index] = value >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function zip(entries) {
    const locals = [];
    const centrals = [];
    let localOffset = 0;
    for (const [name, content] of Object.entries(entries)) {
      const nameBytes = enc.encode(name);
      const data = typeof content === "string" ? enc.encode(content) : content;
      const crc = crc32(data);
      const local = new Uint8Array(30 + nameBytes.length);
      u32(local, 0, 0x04034b50); u16(local, 4, 20); u16(local, 6, 0x0800); u16(local, 8, 0);
      u16(local, 10, 0); u16(local, 12, 0x0021); u32(local, 14, crc); u32(local, 18, data.length); u32(local, 22, data.length);
      u16(local, 26, nameBytes.length); u16(local, 28, 0); local.set(nameBytes, 30);
      locals.push(local, data);

      const central = new Uint8Array(46 + nameBytes.length);
      u32(central, 0, 0x02014b50); u16(central, 4, 20); u16(central, 6, 20); u16(central, 8, 0x0800); u16(central, 10, 0);
      u16(central, 12, 0); u16(central, 14, 0x0021); u32(central, 16, crc); u32(central, 20, data.length); u32(central, 24, data.length);
      u16(central, 28, nameBytes.length); u16(central, 30, 0); u16(central, 32, 0); u16(central, 34, 0); u16(central, 36, 0);
      u32(central, 38, 0); u32(central, 42, localOffset); central.set(nameBytes, 46);
      centrals.push(central);
      localOffset += local.length + data.length;
    }
    const directory = join(centrals);
    const end = new Uint8Array(22);
    u32(end, 0, 0x06054b50); u16(end, 4, 0); u16(end, 6, 0); u16(end, 8, centrals.length); u16(end, 10, centrals.length);
    u32(end, 12, directory.length); u32(end, 16, localOffset); u16(end, 20, 0);
    return join([...locals, directory, end]);
  }

  function buildWorkbook(character) {
    return zip({
      ...staticEntries,
      "xl/worksheets/sheet1.xml": sheetXml(exportData(character))
    });
  }

  function filename(value) {
    return (clean(value) || "personazh").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_").slice(0, 80);
  }

  function download(character) {
    const blob = new Blob([buildWorkbook(character)], { type: XLSX_MIME });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename(character?.name)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  globalThis.KADAT_XLSX_EXPORT_INTERNALS = { exportData, sheetXml, buildWorkbook, zip, crc32 };
  if (typeof document === "undefined") return;

  const toolbar = document.querySelector(".result-toolbar");
  if (!toolbar) return;
  let button = document.querySelector("#export-xlsx");
  if (!button) {
    button = document.createElement("button");
    button.id = "export-xlsx";
    button.type = "button";
    button.className = "secondary";
    button.textContent = "Выгрузить в Excel";
    button.disabled = true;
    toolbar.insertBefore(button, toolbar.querySelector(".result-document-code"));
  }

  let lastCharacter = null;
  const previousRender = renderResult;
  renderResult = function (character) {
    previousRender(character);
    lastCharacter = character;
    button.disabled = false;
  };

  button.addEventListener("click", () => {
    if (!lastCharacter) return;
    const label = button.textContent;
    button.disabled = true;
    button.textContent = "Формирование XLSX…";
    try {
      download(lastCharacter);
    } catch (error) {
      console.error(error);
      alert(`Не удалось сформировать Excel-файл: ${error?.message ?? error}`);
    } finally {
      button.textContent = label;
      button.disabled = false;
    }
  });

  document.querySelector("#reset-button")?.addEventListener("click", () => {
    lastCharacter = null;
    button.disabled = true;
  });
})();
