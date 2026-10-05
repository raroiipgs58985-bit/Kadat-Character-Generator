// Local CLI only; stdout is the exact plain-text copy/paste prompt.
const fs = require("node:fs");
const generator = require("./reader-prompt.js");
const file = process.argv[2];
if (!file) {
  console.error("Usage: node generate.cjs completed-session.json OR stage5a-reader-input.json");
  process.exitCode = 1;
} else {
  try {
    const input = JSON.parse(fs.readFileSync(file, "utf8"));
    process.stdout.write(input.contract_version ? generator.fromReaderInput(input) : generator.fromCompletedSession(input));
  } catch (error) {
    console.error(`${error.code || error.name}: ${error.message}`);
    process.exitCode = 1;
  }
}
