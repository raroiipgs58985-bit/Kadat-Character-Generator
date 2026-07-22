"use strict";

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

global.window = global;
for (const name of ["chunk-01.js", "chunk-02.js", "chunk-03.js"]) {
  require(path.join(process.cwd(), "regiment-character-link-packed", name));
}
const encoded = global.KADAT_REGIMENT_CHARACTER_LINK_PACKED_CHUNKS.join("");
const source = zlib.gunzipSync(Buffer.from(encoded, "base64")).toString("utf8");
fs.mkdirSync("diagnostic-artifact", { recursive: true });
fs.writeFileSync("diagnostic-artifact/regiment-character-link.js", source);
console.log(`Unpacked ${source.length} bytes.`);
