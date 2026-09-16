const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");
const root = path.resolve(__dirname, "..");
function loadDomain() {
  const context = vm.createContext({ window: {}, TextEncoder });
  for (const f of [
    "catalogs/character",
    "catalogs/advancement",
    "catalogs/regiments",
    "domain/regiment-origin",
    "domain/character",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(root, `src/${f}.js`), "utf8"),
      context,
    );
  const w = context.window;
  return {
    data: w.KADAT_DATA,
    adv: w.KADAT_ADVANCEMENT,
    regiments: w.KADAT_REGIMENT_DATA,
    api: w.KadatCharacter,
    origin: w.KADAT_REGIMENT_CHARACTER_LINK_INTERNALS,
    engine: w.KadatCharacter.createEngine(
      w.KADAT_DATA,
      w.KADAT_ADVANCEMENT,
      w.KADAT_REGIMENT_CHARACTER_LINK_INTERNALS,
      w.KADAT_REGIMENT_DATA,
    ),
  };
}
async function loadApp(storage = {}) {
  const errors = [],
    downloads = [],
    blobs = new Map();
  class LocalResources extends ResourceLoader {
    fetch(url) {
      return Promise.resolve(
        fs.readFileSync(path.join(root, new URL(url).pathname)),
      );
    }
  }
  const dom = new JSDOM(
    fs.readFileSync(path.join(root, "index.html"), "utf8"),
    {
      url: "https://kadat.test/",
      resources: new LocalResources(),
      runScripts: "dangerously",
      pretendToBeVisual: true,
      virtualConsole: new VirtualConsole()
        .on("jsdomError", (e) => errors.push(e.message))
        .on("error", (e) => errors.push(String(e))),
      beforeParse(w) {
        Object.assign(w, { TextEncoder, TextDecoder, Blob, structuredClone });
        w.scrollTo = () => {};
        w.print = () => {};
        w.HTMLElement.prototype.scrollIntoView = () => {};
        w.URL.createObjectURL = (blob) => {
          const id = `blob:test-${blobs.size}`;
          blobs.set(id, blob);
          return id;
        };
        w.URL.revokeObjectURL = (id) => blobs.delete(id);
        w.HTMLAnchorElement.prototype.click = function () {
          downloads.push({ name: this.download, blob: blobs.get(this.href) });
        };
        for (const [key, value] of Object.entries(storage))
          w.localStorage.setItem(key, value);
      },
    },
  );
  const w = dom.window;
  await new Promise((resolve) => w.addEventListener("load", resolve));
  await new Promise((resolve) => setTimeout(resolve, 0));
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  const $ = (selector) => w.document.querySelector(selector);
  const click = async (selector) => {
    const e = $(selector);
    if (!e) throw new Error(`Missing control ${selector}`);
    if (e.disabled) throw new Error(`Disabled control ${selector}`);
    e.click();
    await tick();
  };
  const fill = async (selector, value) => {
    const e = $(selector);
    if (!e) throw new Error(`Missing field ${selector}`);
    if (e.type === "checkbox") e.checked = Boolean(value);
    else e.value = String(value);
    e.dispatchEvent(
      new w.Event(
        e.tagName === "SELECT" || e.type === "checkbox" ? "change" : "input",
        { bubbles: true },
      ),
    );
    await tick();
  };
  return {
    dom,
    w,
    $,
    click,
    fill,
    tick,
    errors,
    downloads,
    storage: () =>
      Object.fromEntries(
        Object.keys(w.localStorage).map((k) => [k, w.localStorage.getItem(k)]),
      ),
  };
}
const plain = (value) => JSON.parse(JSON.stringify(value));
module.exports = { loadDomain, loadApp, plain, root };
