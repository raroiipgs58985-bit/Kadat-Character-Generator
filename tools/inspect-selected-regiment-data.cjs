"use strict";

const path = require("node:path");
const base = path.join(process.cwd(), "regiment-data");
global.window = global;
require(path.join(base, "regiment-data-core.js"));
for (let index = 1; index <= 7; index += 1) {
  require(path.join(base, "packed", `chunk-${String(index).padStart(2, "0")}.js`));
}
require(path.join(base, "packed", "chunk-01-tail.js"));
require(path.join(base, "regiment-data-loader.js"));

(async () => {
  const data = await global.KADAT_REGIMENT_DATA_READY;
  const wanted = ["Феодальный мир", "Схола Прогенум", "Схола Прогениум", "Бунтарь", "Артиллерийский полк"];
  const result = {};
  for (const category of ["homeworlds", "origins", "commanders", "regimentTypes"]) {
    result[category] = data[category].filter(entry => wanted.includes(entry.name));
  }
  console.log("SELECTED_REGIMENT_DATA=" + JSON.stringify(result));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
