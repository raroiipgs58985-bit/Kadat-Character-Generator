(function (root) {
  "use strict";
  const escape = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  const number = (value) =>
    Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  const signed = (value) => (value > 0 ? `+${number(value)}` : number(value));
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const tags = (values) =>
    values.length
      ? values.map((v) => `<span class="tag">${escape(v)}</span>`).join("")
      : '<span class="muted">Нет</span>';
  function meter(label, value, max, tone = "teal") {
    const width = Math.min(100, Math.max(0, max ? (value / max) * 100 : 0));
    return `<div class="meter ${tone}"><div><span>${escape(label)}</span><strong>${number(value)} <small>/ ${number(max)}</small></strong></div><div class="meter-track" role="img" aria-label="${escape(label)}: ${number(value)} из ${number(max)}"><span style="width:${width}%"></span></div></div>`;
  }
  function statBars(stats) {
    const max = Math.max(50, ...Object.values(stats).map(Number));
    return `<div class="stat-bars">${Object.entries(stats)
      .map(
        ([stat, value]) =>
          `<div class="stat-bar"><span>${escape(stat)}</span><div><i style="width:${Math.max(0, (value / max) * 100)}%"></i></div><strong>${number(value)}</strong></div>`,
      )
      .join("")}</div>`;
  }
  function radar(stats) {
    const entries = Object.entries(stats),
      max = Math.max(
        50,
        Math.ceil(Math.max(...Object.values(stats)) / 10) * 10,
      );
    const point = (i, radius) => [
      140 + Math.sin((i * 2 * Math.PI) / entries.length) * radius,
      140 - Math.cos((i * 2 * Math.PI) / entries.length) * radius,
    ];
    const polygon = (fraction) =>
      entries.map((_, i) => point(i, 94 * fraction).join(",")).join(" ");
    return `<figure class="profile-radar"><svg viewBox="0 0 280 280" role="img" aria-label="Профиль характеристик; шкала от 0 до ${max}"><title>${escape(entries.map(([s, v]) => `${s}: ${v}`).join(", "))}</title>${[0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${polygon(f)}" class="radar-grid"/>`).join("")}${entries
      .map(([s, v], i) => {
        const [x, y] = point(i, 119);
        return `<line x1="140" y1="140" x2="${point(i, 94)[0]}" y2="${point(i, 94)[1]}" class="radar-grid"/><text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${escape(s)}</text>`;
      })
      .join(
        "",
      )}<polygon points="${entries.map(([s, v], i) => point(i, (94 * Math.max(0, v)) / max).join(",")).join(" ")}" class="radar-area"/>${entries
      .map(([s, v], i) => {
        const [x, y] = point(i, (94 * Math.max(0, v)) / max);
        return `<circle cx="${x}" cy="${y}" r="3" class="radar-dot"/>`;
      })
      .join(
        "",
      )}</svg><figcaption>Характеристики · шкала 0–${max}</figcaption></figure>`;
  }
  function preserveFocus(node, html) {
    const active = document.activeElement,
      inside = node.contains(active);
    const focusKey = inside
      ? active.getAttribute("data-focus") || active.id
      : "";
    const start = inside ? active.selectionStart : null,
      end = inside ? active.selectionEnd : null;
    const open = [...node.querySelectorAll("details[open][data-detail]")].map(
      (n) => n.dataset.detail,
    );
    node.innerHTML = html;
    for (const item of node.querySelectorAll("details[data-detail]"))
      if (open.includes(item.dataset.detail)) item.open = true;
    if (focusKey) {
      const next = [
        ...node.querySelectorAll("input,select,textarea,button"),
      ].find((e) => (e.getAttribute("data-focus") || e.id) === focusKey);
      if (next) {
        next.focus({ preventScroll: true });
        if (
          start !== null &&
          ["text", "search", "textarea"].includes(next.type)
        )
          next.setSelectionRange(start, end);
      }
    }
  }
  function download(bytes, name, type) {
    const url = URL.createObjectURL(new Blob([bytes], { type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const fileName = (name) =>
    String(name || "kadat")
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-")
      .slice(0, 80);
  root.KadatUI = {
    escape,
    number,
    signed,
    unique,
    tags,
    meter,
    statBars,
    radar,
    preserveFocus,
    download,
    fileName,
  };
})(window);
