(() => {
  "use strict";

  const internals = globalThis.KADAT_XLSX_EXPORT_INTERNALS;
  if (!internals || typeof document === "undefined") return;

  const decoder = new TextDecoder("utf-8");
  const encoder = new TextEncoder();
  const LIST_ROWS = {
    19: "skills",
    20: "talents",
    22: "features",
    24: "equipment"
  };

  function readU16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  function readU32(bytes, offset) {
    return (
      bytes[offset]
      | (bytes[offset + 1] << 8)
      | (bytes[offset + 2] << 16)
      | (bytes[offset + 3] << 24)
    ) >>> 0;
  }

  function unzipStoredEntries(bytes) {
    const entries = {};
    let offset = 0;

    while (offset + 4 <= bytes.length && readU32(bytes, offset) === 0x04034b50) {
      const method = readU16(bytes, offset + 8);
      const compressedSize = readU32(bytes, offset + 18);
      const nameLength = readU16(bytes, offset + 26);
      const extraLength = readU16(bytes, offset + 28);
      const nameStart = offset + 30;
      const dataStart = nameStart + nameLength + extraLength;
      const dataEnd = dataStart + compressedSize;

      if (method !== 0 || dataEnd > bytes.length) {
        throw new Error("Неподдерживаемая структура XLSX-архива.");
      }

      const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
      entries[name] = bytes.slice(dataStart, dataEnd);
      offset = dataEnd;
    }

    return entries;
  }

  function escapeXml(value) {
    return String(value ?? "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function splitItems(value) {
    return String(value ?? "")
      .split(/;\s*/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function formatList(value) {
    const items = splitItems(value);
    return items.length ? items.map(item => `• ${item}`).join("\n") : "—";
  }

  function estimateRowHeight(value) {
    const lines = formatList(value).split("\n");
    const visualLines = lines.reduce((total, line) => {
      return total + Math.max(1, Math.ceil(line.length / 46));
    }, 0);
    return Math.min(409, Math.max(28, visualLines * 12 + 8));
  }

  function replaceCellText(sheetXml, rowNumber, value) {
    const ref = `B${rowNumber}`;
    const pattern = new RegExp(
      `(<c r="${ref}" s="5" t="inlineStr"><is><t xml:space="preserve">)[\\s\\S]*?(<\\/t><\\/is><\\/c>)`
    );
    return sheetXml.replace(pattern, `$1${escapeXml(value)}$2`);
  }

  function replaceRowHeight(sheetXml, rowNumber, height) {
    const pattern = new RegExp(`<row r="${rowNumber}" ht="[^"]+" customHeight="1">`);
    return sheetXml.replace(pattern, `<row r="${rowNumber}" ht="${height}" customHeight="1">`);
  }

  function patchSheetXml(source, data) {
    let sheetXml = source;

    for (const [rowText, field] of Object.entries(LIST_ROWS)) {
      const rowNumber = Number(rowText);
      const value = data[field];
      sheetXml = replaceCellText(sheetXml, rowNumber, formatList(value));
      sheetXml = replaceRowHeight(sheetXml, rowNumber, estimateRowHeight(value));
    }

    sheetXml = sheetXml.replace('fitToHeight="1"', 'fitToHeight="0"');
    return sheetXml;
  }

  function patchStylesXml(source) {
    return source
      .replace(
        '<font><sz val="6"/><color rgb="FFE5DED0"/><name val="Aptos Narrow"/></font>',
        '<font><sz val="7"/><color rgb="FFE5DED0"/><name val="Aptos Narrow"/></font>'
      )
      .replace(
        '<xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" shrinkToFit="1"/></xf>',
        '<xf numFmtId="0" fontId="5" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="top" wrapText="1"/></xf>'
      );
  }

  function buildReadableWorkbook(character) {
    const data = internals.exportData(character);
    const entries = unzipStoredEntries(internals.buildWorkbook(character));

    entries["xl/worksheets/sheet1.xml"] = encoder.encode(
      patchSheetXml(decoder.decode(entries["xl/worksheets/sheet1.xml"]), data)
    );
    entries["xl/styles.xml"] = encoder.encode(
      patchStylesXml(decoder.decode(entries["xl/styles.xml"]))
    );

    return internals.zip(entries);
  }

  function safeFilename(value) {
    return (String(value ?? "").trim() || "personazh")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "_")
      .slice(0, 80);
  }

  function download(character) {
    const blob = new Blob([buildReadableWorkbook(character)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(character?.name)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  let lastCharacter = null;
  const previousRender = renderResult;
  renderResult = function (character) {
    previousRender(character);
    lastCharacter = character;
  };

  const button = document.querySelector("#export-xlsx");
  button?.addEventListener("click", event => {
    if (!lastCharacter) return;

    event.preventDefault();
    event.stopImmediatePropagation();

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
  }, true);

  globalThis.KADAT_XLSX_READABLE_LISTS_INTERNALS = {
    splitItems,
    formatList,
    estimateRowHeight,
    patchSheetXml,
    patchStylesXml,
    buildReadableWorkbook
  };
})();
