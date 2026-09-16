const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const { loadApp, root } = require("./helpers.cjs");
(async () => {
  const app = await loadApp(),
    w = app.w,
    api = w.KADAT_XLSX_EXPORT_INTERNALS;
  const d = w.KadatCharacterUI.engine.createDraft();
  d.raceId = "drukhari";
  const c = w.KadatCharacterUI.engine.build(d);
  c.name = "=1+1 <Ирис> & Тень";
  c.raceImplants = ["Аугметический глаз"];
  c.racePsychicPowers = ["Тестовая пси-сила"];
  c.talents.push("Повторяемый талант", "Повторяемый талант");
  const long = "Полный текст правила ".repeat(300);
  c.specialtyRules.push({ name: "Длинное правило", text: long });
  const bytes = Buffer.from(api.buildWorkbook(c)),
    entries = new Map();
  let offset = 0;
  while (bytes.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(bytes.readUInt16LE(offset + 8), 0);
    const size = bytes.readUInt32LE(offset + 18),
      nameLength = bytes.readUInt16LE(offset + 26),
      extra = bytes.readUInt16LE(offset + 28),
      name = bytes.subarray(offset + 30, offset + 30 + nameLength).toString();
    const content = bytes.subarray(
      offset + 30 + nameLength + extra,
      offset + 30 + nameLength + extra + size,
    );
    assert.equal(api.crc32(content), bytes.readUInt32LE(offset + 14));
    entries.set(name, content.toString());
    offset += 30 + nameLength + extra + size;
  }
  const parser = new w.DOMParser(),
    xml = (name) =>
      parser.parseFromString(entries.get(name), "application/xml");
  for (const name of entries.keys())
    if (/xml$|rels$/.test(name))
      assert.equal(
        xml(name).querySelector("parsererror"),
        null,
        `Valid XML: ${name}`,
      );
  assert.equal(xml("xl/workbook.xml").querySelectorAll("sheet").length, 4);
  const numeric = xml("xl/worksheets/sheet2.xml");
  assert.equal(numeric.querySelector('c[r="B2"]').getAttribute("t"), null);
  assert.equal(
    Number(numeric.querySelector('c[r="B2"] v').textContent),
    c.stats.НС,
  );
  const inv = xml("xl/worksheets/sheet3.xml").documentElement.textContent;
  for (const s of [
    "Повторяемый талант ×2",
    "Аугметический глаз",
    "Тестовая пси-сила",
  ])
    assert(inv.includes(s));
  const rules = xml("xl/worksheets/sheet4.xml");
  const paragraphs = [...rules.querySelectorAll("row")]
    .filter((row) => row.textContent.includes("Длинное правило"))
    .map((row) => row.querySelector('c[r^="C"] t').textContent)
    .join("");
  assert.equal(paragraphs, long);
  assert(
    rules.documentElement.textContent.includes(
      c.race.uniqueFeatures[0].accumulation,
    ),
  );
  assert(
    rules.documentElement.textContent.includes(
      c.race.uniqueFeatures[0].spending[0].text,
    ),
  );
  assert.equal(
    xml("xl/worksheets/sheet1.xml").querySelectorAll("f").length,
    0,
    "Names beginning with = stay text",
  );
  fs.mkdirSync(path.join(root, "test-output"), { recursive: true });
  fs.writeFileSync(path.join(root, "test-output/character.xlsx"), bytes);
  assert.deepEqual(app.errors, []);
  app.dom.window.close();
  console.log(
    "XLSX: ZIP/CRC, XML, 4 sheets, typed numbers, Unicode, literal formula text, long rules, repeats, implants and psychic powers OK.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
