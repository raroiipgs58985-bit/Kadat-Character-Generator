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
  const statNames = {
    НС: "Навык стрельбы",
    НР: "Навык рукопашного боя",
    СЛ: "Сила",
    ВН: "Выносливость",
    ЛВ: "Ловкость",
    ИН: "Интеллект",
    СВ: "Сила воли",
    ВС: "Восприятие",
    ОЩ: "Общение",
  };
  // A display scale, never a game cap. It grows with the actual profile.
  const statScale = (stats) =>
    Math.max(
      50,
      Math.ceil(Math.max(0, ...Object.values(stats).map(Number)) / 10) * 10,
    );
  function segments(value, max, label = "") {
    const width = Math.min(100, Math.max(0, max ? (value / max) * 100 : 0));
    return `<div class="segment-track" ${label ? `role="img" aria-label="${escape(label)}: ${number(value)}; шкала 0–${number(max)}"` : 'aria-hidden="true"'}><i style="width:${width}%"></i></div>`;
  }
  function status(label, tone = "normal") {
    const symbols = {
      normal: "·",
      active: "›",
      valid: "✓",
      warning: "!",
      error: "!",
      locked: "−",
      restricted: "◇",
    };
    return `<span class="record-status ${escape(tone)}"><span aria-hidden="true">${symbols[tone] ?? "·"}</span>${escape(label)}</span>`;
  }
  function recordHeader(code, title, subtitle, label = "Запись сформирована") {
    return `<header class="record-cover"><div class="record-cover-meta"><span>${escape(code)} // KADAT</span>${status(label, "valid")}</div><div class="record-cover-body"><div><p class="card-eyebrow">РЕЕСТР КАДАТА · К100</p><h2>${escape(title)}</h2><p>${escape(subtitle)}</p></div><div class="record-mark" aria-hidden="true">K<span>REGISTRUM</span><b>100</b></div></div></header>`;
  }
  function xpSummary(c, compact = false) {
    const total = c.startingXp + c.bonusXp;
    const spent = c.specialty.xpCost + c.advancement.spent;
    return `<section class="experience-panel ${compact ? "compact" : ""}" aria-label="Распределение опыта"><div class="instrument-heading"><span>РАСПРЕДЕЛЕНИЕ ОПЫТА</span><small>XP / ОО</small></div><div class="experience-values"><div><span>Всего</span><strong>${number(total)}</strong></div><div><span>Потрачено</span><strong>${number(spent)}</strong></div><div class="experience-remaining ${c.availableXp < 0 ? "negative" : ""}"><span>Осталось</span><strong>${number(c.availableXp)}</strong></div></div>${meter("Использовано ОО", spent, total, c.availableXp < 0 ? "red" : "gold")}<details data-detail="experience-sources"><summary>Откуда опыт и на что потрачен</summary><dl class="xp-ledger"><div><dt>Начальный опыт</dt><dd>${number(c.startingXp)}</dd></div><div><dt>Повторные таланты</dt><dd>+${number(c.bonusXp)}</dd></div><div><dt>Специальность</dt><dd>−${number(c.specialty.xpCost)}</dd></div><div><dt>Развитие</dt><dd>−${number(c.advancement.spent)}</dd></div></dl></details></section>`;
  }
  function equipment(groups) {
    const rows = new Map();
    for (const [source, items] of groups)
      for (const item of items ?? []) {
        if (!rows.has(item)) rows.set(item, []);
        rows.get(item).push(source);
      }
    return `<div class="equipment-grid">${[...rows].map(([item, sources], i) => `<article><span class="equipment-index" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><div><p>${escape(item)}</p><small class="equipment-source">${escape(unique(sources).join(" · "))}</small></div></article>`).join("") || '<p class="muted">Снаряжение не указано.</p>'}</div>`;
  }
  function recordFacts(rows, className = "") {
    return `<dl class="record-facts ${className}">${rows.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value ?? "Не выбрано")}</dd></div>`).join("")}</dl>`;
  }
  function focusSnapshot(node) {
    const active = document.activeElement;
    const attrs =
      active && node.contains(active)
        ? [...active.attributes]
            .filter(
              (a) =>
                a.name === "id" ||
                a.name.startsWith("data-") ||
                (a.name === "value" &&
                  ["checkbox", "radio"].includes(active.type)),
            )
            .map((a) => [a.name, a.value])
        : [];
    const open = [...node.querySelectorAll("details[data-detail][open]")].map(
      (e) => e.dataset.detail,
    );
    return () => {
      node.querySelectorAll("details[data-detail]").forEach((e) => {
        if (open.includes(e.dataset.detail)) e.open = true;
      });
      if (!attrs.length) return;
      const next = [
        ...node.querySelectorAll("input,select,textarea,button"),
      ].find((e) => attrs.every(([k, v]) => e.getAttribute(k) === v));
      if (next && !next.disabled) next.focus({ preventScroll: true });
    };
  }
  function focusStage(node) {
    const title = node.querySelector(".stage-heading h2");
    if (title) {
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
    node.scrollIntoView({ block: "start", behavior: "instant" });
  }
  function progress(buttons, current, problems = []) {
    buttons.forEach((button, i) => {
      const issue = problems[i];
      const complete = i < current && !issue;
      button.classList.toggle("is-active", i === current);
      button.classList.toggle("is-complete", complete);
      button.classList.toggle(
        "needs-attention",
        i <= current && Boolean(issue),
      );
      button.setAttribute("aria-current", i === current ? "step" : "false");
      const marker = button.querySelector(".wizard-roman");
      if (marker)
        marker.textContent = complete
          ? "✓"
          : i < current && issue
            ? "!"
            : String(i + 1).padStart(2, "0");
      const title = button.querySelector("strong")?.textContent || "";
      button.setAttribute(
        "aria-label",
        `${i + 1}. ${title}: ${i === current ? "текущий этап" : complete ? "заполнено" : issue && i < current ? "требует внимания" : "не пройдено"}`,
      );
    });
  }
  let feedbackTimer;
  function announce(message, tone = "valid", code = "RECORD UPDATED") {
    const node = document.querySelector("#system-feedback");
    if (!node) return;
    clearTimeout(feedbackTimer);
    node.className = `system-feedback ${tone}`;
    node.innerHTML = `<span aria-hidden="true">${escape(code)}</span><strong>${escape(message)}</strong>`;
    feedbackTimer = setTimeout(() => {
      node.classList.add("is-idle");
    }, 5500);
  }
  const tags = (values) =>
    values.length
      ? values.map((v) => `<span class="tag">${escape(v)}</span>`).join("")
      : '<span class="muted">Нет</span>';
  function meter(label, value, max, tone = "teal") {
    const width = Math.min(100, Math.max(0, max ? (value / max) * 100 : 0));
    return `<div class="meter ${tone}"><div><span>${escape(label)}</span><strong>${number(value)} <small>/ ${number(max)}</small></strong></div><div class="meter-track" role="img" aria-label="${escape(label)}: ${number(value)} из ${number(max)}"><span style="width:${width}%"></span></div></div>`;
  }
  function statBars(stats) {
    const max = statScale(stats);
    return `<div class="stat-bars"><p class="scale-caption">Шкала 0–${max} · масштаб профиля</p>${Object.entries(
      stats,
    )
      .map(
        ([stat, value]) =>
          `<div class="stat-bar"><span><abbr title="${escape(statNames[stat] ?? stat)}">${escape(stat)}</abbr></span>${segments(value, max, statNames[stat] ?? stat)}<strong>${number(value)}</strong></div>`,
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
    statNames,
    statScale,
    segments,
    status,
    recordHeader,
    xpSummary,
    equipment,
    recordFacts,
    focusSnapshot,
    focusStage,
    progress,
    announce,
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
