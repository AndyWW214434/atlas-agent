/* Atlas — agent UI */
(() => {
  const $ = (id) => document.getElementById(id);
  const esc = window.escapeHtml;
  const md = window.renderMarkdown;

  // ---------- Icons ----------
  const P = {
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
    stop: '<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" stroke="none"/>',
    clip: '<path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l8.6-8.6a4 4 0 1 1 5.7 5.7l-8.6 8.6a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    terminal: '<path d="m4 17 6-6-6-6"/><path d="M12 19h8"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>',
    filePen: '<path d="M12 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v4"/><path d="M14 2v6h6"/><path d="m18.4 14.6 2 2L15 22h-2v-2z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    pointer: '<path d="m4 4 7 17 2.5-7.5L21 11 4 4z"/>',
    keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>',
    scroll: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    prev: '<path d="M19 20 9 12l10-8v16z"/><path d="M5 19V5"/>',
    next: '<path d="m5 4 10 8-10 8V4z"/><path d="M19 5v14"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    external: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    checkFill: '<circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="m7.5 12.5 3 3 6-6.5" stroke="#fff" stroke-width="2.2"/>',
    circle: '<circle cx="12" cy="12" r="8.5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    slides: '<path d="M2 3h20M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3M7 21l5-5 5 5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    sparkle: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    library: '<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',
    automation: '<rect x="3" y="3" width="8" height="8" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect x="13" y="13" width="8" height="8" rx="2"/>',
    grid: '<circle cx="7" cy="7" r="3.2"/><circle cx="17" cy="7" r="3.2"/><circle cx="7" cy="17" r="3.2"/><circle cx="17" cy="17" r="3.2"/>',
    dots: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    folderPlus: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6M9 13h6"/>',
    spark: '<path d="M12 3c.5 4.5 1.9 6.5 6 7.5-4.1 1-5.5 3-6 7.5-.5-4.5-1.9-6.5-6-7.5 4.1-1 5.5-3 6-7.5z"/><path d="M19 2v4M17 4h4"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    folderBox: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M9 13h6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    archive: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>',
    filter: '<path d="M3 6h18M7 12h10M10 18h4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    gridView: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a6 6 0 0 1-12 0V8z"/>',
    chevRight: '<path d="m9 18 6-6-6-6"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r=".9" fill="currentColor"/><circle cx="18" cy="13.5" r=".9" fill="currentColor"/>',
    notebook: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 2v20M11 7h6M11 11h6"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5M12 17.5h.01"/>',
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.5L21 8H6"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3z"/>',
    audio: '<path d="M2 12h2M6 8v8M10 5v14M14 9v6M18 7v10M22 12h-2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.9-2.4L3.4 16a2 2 0 0 1 3.2-2.4L8 15"/>',
  };
  const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24">${P[name] || ""}</svg>`;
  // Our own mark: an "m" in a ring, drawn in the current text color.
  const LOGO = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="13.5"/><path d="M10 21.5V12l6 6.5 6-6.5v9.5"/></svg>';

  // ---------- State ----------
  const S = {
    config: { agent: "Atlas" },
    tasks: [],
    taskId: null,
    events: [],
    status: "idle",
    plan: [],
    title: "",
    es: null,
    nodes: new Map(),
    groups: null,
    sections: [],
    dirty: new Set(),
    cpIndex: 0,
    live: true,
    cpOpen: false,
    cpUserClosed: false,
    collapsedSteps: new Set(),
    openThinking: new Set(),
    planOpen: false,
    snapshotLoaded: false,
    pendingDeletes: new Set(),
  };

  // ---------- Helpers ----------
  function relTime(ts) {
    const d = new Date(ts * 1000), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const days = (now - d) / 864e5;
    if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "numeric", day: "numeric" });
  }
  function fmtSize(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1048576).toFixed(1)} MB`;
  }
  function taskIcon(title) {
    const t = (title || "").toLowerCase();
    if (/web|site|page|landing|html/.test(t)) return "layout";
    if (/slide|deck|presentation/.test(t)) return "slides";
    if (/data|chart|analy|stat|plot/.test(t)) return "chart";
    if (/sheet|csv|excel|table/.test(t)) return "table";
    if (/trip|travel|itinerary|flight|visit/.test(t)) return "plane";
    if (/code|script|app|bug|python|api/.test(t)) return "code";
    if (/research|report|compare|market|study/.test(t)) return "book";
    return "sparkle";
  }
  const EXT_COLORS = { md: "#3b82f6", txt: "#64748b", html: "#ea580c", htm: "#ea580c", css: "#2563eb", js: "#ca8a04", ts: "#2563eb", py: "#16a34a", json: "#7c3aed", csv: "#15803d", xlsx: "#15803d", pdf: "#dc2626", png: "#9333ea", jpg: "#9333ea", jpeg: "#9333ea", svg: "#db2777", docx: "#1d4ed8", pptx: "#c2410c", ipynb: "#f37726" };
  function fileIcon(path) {
    const ext = (path.split(".").pop() || "").toLowerCase();
    const color = EXT_COLORS[ext] || "#78716c";
    return `<div class="fc-icon" style="background:${color}">${esc(ext.slice(0, 4).toUpperCase() || "FILE")}</div>`;
  }
  const fileUrl = (path, download) => `/api/tasks/${S.taskId}/files/${path.split("/").map(encodeURIComponent).join("/")}${download ? "?download=1" : ""}`;

  // Pull a (possibly incomplete) string field out of streaming tool-input JSON.
  function partialField(src, key) {
    if (!src) return undefined;
    const m = new RegExp(`"${key}"\\s*:\\s*"`).exec(src);
    if (!m) return undefined;
    let out = "", i = m.index + m[0].length;
    const map = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", '"': '"', "\\": "\\", "/": "/" };
    while (i < src.length) {
      const c = src[i];
      if (c === '"') break;
      if (c === "\\") {
        const n = src[i + 1];
        if (n === undefined) break;
        if (n === "u") {
          const hex = src.slice(i + 2, i + 6);
          if (hex.length < 4) break;
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
          continue;
        }
        out += map[n] ?? n;
        i += 2;
        continue;
      }
      out += c;
      i++;
    }
    return out;
  }
  const inputOf = (ev, key) => (ev.input && ev.input[key] !== undefined ? ev.input[key] : partialField(ev.partial, key));

  // ---------- Tool metadata ----------
  function toolMeta(ev) {
    const a = (k) => inputOf(ev, k);
    const short = (u) => (u || "").replace(/^https?:\/\/(www\.)?/, "");
    switch (ev.name) {
      case "shell": return { app: "Terminal", icon: "terminal", label: "Executing command", arg: a("command") };
      case "write_file": return { app: "Editor", icon: "filePen", label: "Creating file", arg: a("path") };
      case "edit_file": return { app: "Editor", icon: "filePen", label: "Editing file", arg: a("path") };
      case "read_file": return { app: "Editor", icon: "file", label: "Reading file", arg: a("path") };
      case "web_search": return { app: "Search", icon: "search", label: "Searching", arg: a("query") };
      case "web_fetch": return { app: "Browser", icon: "globe", label: "Fetching page", arg: short(a("url")) };
      case "browser": {
        const act = a("action");
        const idx = a("index") !== undefined ? `#${a("index")}` : "";
        const m = {
          navigate: ["globe", "Browsing", short(a("url"))], new_tab: ["globe", "Opening new tab", short(a("url"))],
          snapshot: ["eye", "Scanning page elements", ""], screenshot: ["eye", "Viewing page", ""],
          click: ["pointer", "Clicking element", idx || (a("x") !== undefined ? `(${a("x")}, ${a("y")})` : "")],
          hover: ["pointer", "Hovering", idx], type: ["keyboard", "Entering text", `${idx} ${a("text") || ""}`.trim()],
          press: ["keyboard", "Pressing key", a("key")], select: ["pointer", "Selecting option", `${idx} ${a("value") || ""}`.trim()],
          scroll: ["scroll", "Scrolling page", a("direction") || "down"], back: ["globe", "Going back", ""],
          forward: ["globe", "Going forward", ""], reload: ["globe", "Reloading page", ""],
          read: ["eye", "Reading page text", ""], eval: ["code", "Running script", a("script")],
          wait: ["eye", "Waiting", a("seconds") ? `${a("seconds")}s` : ""], find: ["search", "Finding on page", a("text")],
          switch_tab: ["globe", "Switching tab", a("tab") !== undefined ? `#${a("tab")}` : ""],
          close_tab: ["x", "Closing tab", ""], upload: ["file", "Uploading file", a("path")],
        }[act] || ["globe", "Using browser", ""];
        return { app: "Browser", icon: m[0], label: m[1], arg: m[2] };
      }
      case "code_execution": case "bash_code_execution": case "text_editor_code_execution":
        return { app: "Terminal", icon: "code", label: "Filtering results", arg: a("command") || a("code") };
      default: return { app: "Tool", icon: "sparkle", label: ev.name, arg: "" };
    }
  }

  // ---------- Small helpers ----------
  async function api(url, opts = {}) {
    const init = { ...opts };
    if (opts.json !== undefined) {
      init.method = init.method || "POST";
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(opts.json);
    }
    const r = await fetch(url, init);
    if (!r.ok) {
      let msg = await r.text();
      try { msg = JSON.parse(msg).detail || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  }
  function toast(text, action) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    let timer;
    const close = () => { t.classList.add("out"); setTimeout(() => t.remove(), 400); };
    if (action) {
      const b = document.createElement("button");
      b.className = "toast-action";
      b.textContent = action.label;
      b.onclick = () => { clearTimeout(timer); action.onClick(); close(); };
      t.appendChild(b);
    }
    document.body.appendChild(t);
    timer = setTimeout(() => { close(); if (action && action.onExpire) action.onExpire(); }, action ? 8000 : 2600);
  }
  function closePops() { document.querySelectorAll(".pop").forEach((p) => (p.hidden = true)); }
  function togglePop(el) { const open = el.hidden; closePops(); el.hidden = !open; }
  document.addEventListener("click", (e) => { if (!e.target.closest(".pop") && !e.target.closest("[data-pop]")) closePops(); });

  // ---------- Model choice (top bar) ----------
  const PREF_KEY = "atlas.model";
  const models = () => S.config.models || [];
  const modelInfo = (id) => models().find((m) => m.id === id) || { id, label: id || "", tier: id || "", description: "" };
  function savedModel() {
    try { return localStorage.getItem(PREF_KEY); } catch { return null; }
  }
  function defaultModel() {
    const saved = savedModel();
    return models().some((m) => m.id === saved) ? saved : S.config.model;
  }
  function setModel(id, remember) {
    S.model = id;
    if (remember) { try { localStorage.setItem(PREF_KEY, id); } catch {} }
    renderModelSwitch();
  }
  function renderModelSwitch() {
    const cur = modelInfo(S.model);
    $("model-btn").innerHTML = `<span>${esc(cur.tier || cur.label)}</span>${icon("down")}`;
    $("model-pop").innerHTML = models().map((m) => `
      <button class="mp-item" data-model="${esc(m.id)}">
        <div><div class="mp-name">${esc(m.tier)}<span class="mp-model">${esc(m.price)}</span></div><div class="mp-desc">${esc(m.description)}</div></div>
        <span class="mp-check">${m.id === S.model ? icon("check") : ""}</span>
      </button>`).join("") +
      `<div class="mp-foot">Used for new tasks and your next message. Prices are per 1M input / output tokens; credits are charged from the actual cost.</div>`;
  }
  $("model-btn").dataset.pop = "1";
  $("model-btn").onclick = () => togglePop($("model-pop"));
  $("model-pop").onclick = (e) => {
    const b = e.target.closest("[data-model]");
    if (!b) return;
    setModel(b.dataset.model, true);
    closePops();
  };

  // ---------- Credits ----------
  async function loadCredits() {
    try { S.credits = await api("/api/credits"); } catch { return; }
    renderCredits();
  }
  function renderCredits() {
    const c = S.credits;
    if (!c) return;
    $("credit-count").textContent = c.balance.toLocaleString();
    $("plan-name").textContent = `${c.plan_name} plan`;
    if (c.fixed) {  // cloud mode: one free daily allowance for everyone, no plans or top-ups
      $("credit-pop").innerHTML = `
      <div class="cr-head"><span class="cr-plan">${esc(c.plan_name)}</span></div>
      <div class="cr-row"><span class="lbl">${icon("calendar")}Daily credits <span class="q" title="A free daily allowance. 1 credit is about $0.01 of AI usage.">?</span></span><span>${c.daily_left.toLocaleString()}</span></div>
      <div class="cr-sub"><span>Refresh to ${c.daily.toLocaleString()} at 00:00 (server time) every day</span></div>
      ${c.server_busy ? `<div class="cr-sub"><span>Atlas has reached today's limit for all users.</span></div>` : ""}
      <button class="cr-link" data-usage>View usage ${icon("chevRight")}</button>`;
      return;
    }
    $("credit-pop").innerHTML = `
      <div class="cr-head"><span class="cr-plan">${esc(c.plan_name)}</span><button class="btn primary" data-upgrade>Upgrade</button></div>
      <div class="cr-row"><span class="lbl">${icon("spark")}Credits <span class="q" title="Top-up credits. Used after your daily credits run out.">?</span></span><span>${c.bonus.toLocaleString()}</span></div>
      <div class="cr-sub"><span>Top-up credits</span><span>${c.bonus.toLocaleString()}</span></div>
      <div class="cr-row"><span class="lbl">${icon("calendar")}Daily refresh credits <span class="q" title="A fresh daily budget. 1 credit is about $0.01 of AI usage.">?</span></span><span>${c.daily_left.toLocaleString()}</span></div>
      <div class="cr-sub"><span>Refresh to ${c.daily.toLocaleString()} at 00:00 every day</span></div>
      <button class="cr-link" data-usage>View usage ${icon("chevRight")}</button>`;
  }
  $("credit-btn").dataset.pop = "1";
  $("credit-btn").onclick = () => togglePop($("credit-pop"));
  $("credit-pop").onclick = (e) => {
    if (e.target.closest("[data-upgrade]")) { closePops(); openUpgrade(); }
    if (e.target.closest("[data-usage]")) { closePops(); navigate("/usage"); }
  };
  $("upgrade-btn").onclick = () => openUpgrade();
  function openUpgrade() {
    const c = S.credits || { plans: {} };
    if (c.fixed) return toast(`Everyone gets ${c.daily.toLocaleString()} free credits a day. They refresh at midnight.`);
    showModal("Plans", "", `
      <div class="form" style="max-width:none">
        <div class="hint" style="font-size:14px">This app runs on your own Claude API key. Credits are a local daily budget so tasks can't overspend: 1 credit ≈ $0.01 of AI usage. Changing plan here costs nothing; it just sets the budget.</div>
        <div class="plan-grid">${Object.entries(c.plans).map(([k, p]) => `
          <div class="plan-card2 ${k === c.plan ? "cur" : ""}"><div class="pn">${esc(p.name)}</div><div class="pd">${p.daily.toLocaleString()} credits / day</div><div class="pu">≈ $${(p.daily * c.credit_usd).toFixed(0)} of usage per day</div>
            ${k === c.plan ? `<span class="tag on">Current plan</span>` : `<button class="btn primary" data-plan="${k}">Switch to ${esc(p.name)}</button>`}</div>`).join("")}</div>
        <label>Add top-up credits<span class="row"><input type="number" id="topup" min="0" step="100" placeholder="e.g. 500"><button class="btn" data-topup style="flex:none">Add</button></span>
          <span class="hint">Top-up credits don't expire and are used after the daily credits.</span></label>
      </div>`);
  }
  $("modal").addEventListener("click", async (e) => {
    const p = e.target.closest("[data-plan]");
    const t = e.target.closest("[data-topup]");
    if (!p && !t) return;
    S.credits = await api("/api/credits/plan", { json: p ? { plan: p.dataset.plan } : { add_bonus: +($("topup").value || 0) } });
    renderCredits();
    openUpgrade();
    toast(p ? "Plan updated" : "Credits added");
  });

  // ---------- Plugins state (used by the composer's quick toggles) ----------
  async function loadPlugins() {
    try { S.plugins = await api("/api/plugins"); } catch { S.plugins = { builtin: {}, connectors: [] }; }
  }
  const BUILTIN_LABELS = { browser: ["globe", "My Browser"], search: ["search", "Web Search"], terminal: ["terminal", "Terminal & Code"] };
  async function setBuiltin(key, enabled) {
    S.plugins = await api("/api/plugins/builtin", { json: { key, enabled } });
  }
  async function setConnector(id, enabled) {
    S.plugins = await api(`/api/plugins/connectors/${id}`, { method: "PATCH", json: { enabled } });
  }

  // ---------- Composer ----------
  function makeComposer(root, { placeholder, onSend, onStop, top }) {
    root.innerHTML = `
      ${top ? `<div class="cmp-top" style="position:relative">
          <button data-act="where" data-pop="1">${icon("laptop")}This Mac</button>
          <button data-act="project" data-pop="1">${icon("folderBox")}<span class="proj-label">Choose project</span></button>
          <div class="pop proj-pop where-pop" hidden></div>
        </div>` : ""}
      <div class="cmp-files"></div>
      <textarea rows="1" placeholder="${esc(placeholder)}"></textarea>
      <div class="cmp-row">
        <div style="position:relative"><button class="round-btn" data-act="attach" data-pop="1" title="Add files">${icon("plus")}</button>
          <div class="pop attach-pop" hidden>
            <button class="pop-item" data-attach="upload">${icon("upload")}Upload from computer</button>
            <button class="pop-item" data-attach="library">${icon("library")}Add from Library</button>
          </div></div>
        <div style="position:relative"><button class="round-btn" data-act="tools" data-pop="1" title="Plugins">${icon("sliders")}</button>
          <div class="pop tools-pop" hidden></div></div>
        <span class="mode-slot"></span>
        <input type="file" multiple hidden>
        <span class="spacer"></span>
        <button class="mic-btn" data-act="mic" title="Dictate">${icon("mic")}</button>
        <button class="send-btn" data-act="send" title="Send">${icon("up")}</button>
      </div>`;
    const ta = root.querySelector("textarea");
    const fileInput = root.querySelector("input[type=file]");
    const filesEl = root.querySelector(".cmp-files");
    const sendBtn = root.querySelector("[data-act=send]");
    const attachPop = root.querySelector(".attach-pop");
    const toolsPop = root.querySelector(".tools-pop");
    const topPop = root.querySelector(".proj-pop");
    let files = [], libItems = [], running = false, projectId = null, fixedProject = null;
    let mode = null, importUrl = "";
    const modeSlot = root.querySelector(".mode-slot");
    const renderMode = () => {
      ta.placeholder = mode ? mode.placeholder : placeholder;
      modeSlot.innerHTML = !mode ? "" : `<span class="mode-chip">${icon(mode.icon)}${esc(mode.chip)}<button data-mode-clear title="Exit ${esc(mode.chip)} mode">${icon("x")}</button></span>` +
        (mode.importable ? `<span style="position:relative"><button class="mode-chip ghost" data-import data-pop="1">${icon("globe")}${importUrl ? esc(importUrl.replace(/^https?:\/\//, "").slice(0, 28)) : "Import from…"}</button>
          <div class="pop import-pop" hidden><div class="import-box"><div class="mm-head">Start from an existing website</div>
            <input class="import-url" placeholder="https://example.com" value="${esc(importUrl)}" spellcheck="false">
            <div class="ask-actions"><button class="btn primary sm" data-import-save>Use this site</button>${importUrl ? `<button class="btn sm" data-import-clear>Remove</button>` : ""}</div>
            <div class="ask-hint">Atlas opens it in its browser, studies the layout and content, then builds your version.</div></div></div></span>` : "") +
        (mode.options || []).map((o, i) => `<span style="position:relative"><button class="mode-chip ghost" data-optchip="${i}" data-pop="1">${icon(o.icon)}${esc(o.value)}${icon("down", "xs")}</button>
          <div class="pop opt-pop" data-optpop="${i}" hidden>${o.label ? `<div class="mm-head" style="padding:6px 10px">${esc(o.label)}</div>` : ""}${o.choices.map(([v, d]) => `
            <button class="pop-item opt-choice ${v === o.value ? "on" : ""}" data-optval="${i}" data-v="${esc(v)}"><span><b>${esc(v)}</b>${d ? `<span class="oc-desc">${esc(d)}</span>` : ""}</span>${v === o.value ? icon("check") : ""}</button>`).join("")}</div></span>`).join("");
    };

    const refresh = () => {
      ta.style.height = "auto";
      if (ta.value) ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
      sendBtn.classList.toggle("stop", running);
      sendBtn.classList.toggle("ready", !running && ta.value.trim().length > 0);
      sendBtn.innerHTML = running ? icon("stop") : icon("up");
      sendBtn.title = running ? "Stop" : "Send";
      filesEl.innerHTML = files.map((f, i) => `<span class="cmp-file">${icon("file")}${esc(f.name)}<button data-rm="${i}">${icon("x")}</button></span>`).join("") +
        libItems.map((f, i) => `<span class="cmp-file">${icon("library")}${esc(f.name)}<button data-rmlib="${i}">${icon("x")}</button></span>`).join("");
      filesEl.hidden = !files.length && !libItems.length;
      const label = root.querySelector(".proj-label");
      if (label) {
        const p = (S.projects || []).find((x) => x.id === projectId);
        label.textContent = p ? p.name : "Choose project";
        label.parentElement.classList.toggle("chip-proj", !!p);
      }
    };
    const send = () => {
      if (running) return onStop && onStop();
      const text = ta.value.trim();
      if (!text) return;
      const sent = { files, libIds: libItems.map((l) => l.id), projectId: fixedProject || projectId, mode: mode && mode.key, importUrl, prefs: mode && mode.prefs ? mode.prefs() : "" };
      if (mode && mode.onSend) { ta.value = ""; refresh(); return mode.onSend(text, sent); }
      ta.value = ""; files = []; libItems = []; refresh();
      onSend(text, sent);
    };
    const renderTools = () => {
      const p = S.plugins || { builtin: {}, connectors: [] };
      toolsPop.innerHTML = `<div class="mm-head" style="padding:6px 10px">Plugins for this task</div>` +
        Object.entries(BUILTIN_LABELS).map(([k, [ic, name]]) => `<div class="tp-row">${icon(ic)}<span class="grow">${name}</span><button class="switch ${p.builtin[k] ? "on" : ""}" data-builtin="${k}"></button></div>`).join("") +
        p.connectors.map((c) => `<div class="tp-row">${icon("plug")}<span class="grow">${esc(c.name)}</span><button class="switch ${c.enabled ? "on" : ""}" data-conn="${c.id}"></button></div>`).join("") +
        `<button class="pop-item" data-manage>${icon("grid")}Manage plugins</button>`;
    };
    const renderTop = (what) => {
      if (what === "where") {
        topPop.innerHTML = S.config.cloud
          ? `<div style="padding:8px 10px;font-size:13.5px;line-height:1.5">Each task gets its own <b>cloud computer</b>: a private Linux sandbox with a terminal, files and a Chrome browser. It pauses between messages and picks up where it left off.</div>`
          : `<div style="padding:8px 10px;font-size:13.5px;line-height:1.5">Tasks run on <b>this Mac</b>: each gets its own workspace folder and its own isolated browser session.</div>`;
        return;
      }
      topPop.innerHTML = `<button class="pop-item ${!projectId ? "on" : ""}" data-proj="">${icon("x")}No project</button>` +
        (S.projects || []).map((p) => `<button class="pop-item ${p.id === projectId ? "on" : ""}" data-proj="${p.id}">${icon("folderBox")}${esc(p.name)}</button>`).join("") +
        `<button class="pop-item" data-proj="__new">${icon("plus")}New project</button>`;
    };

    ta.addEventListener("input", refresh);
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); }
    });
    root.addEventListener("click", async (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "attach") togglePop(attachPop);
      if (act === "tools") { renderTools(); togglePop(toolsPop); }
      if (act === "where" || act === "project") { renderTop(act); togglePop(topPop); }
      if (act === "send") send();
      if (act === "mic") dictate(ta, e.target.closest(".mic-btn"), refresh);
      const at = e.target.closest("[data-attach]");
      if (at) {
        closePops();
        if (at.dataset.attach === "upload") fileInput.click();
        else pickFromLibrary((items) => { libItems = libItems.concat(items.filter((i) => !libItems.some((l) => l.id === i.id))); refresh(); });
      }
      const sw = e.target.closest("[data-builtin],[data-conn]");
      if (sw) {
        const on = !sw.classList.contains("on");
        sw.classList.toggle("on", on);
        try { sw.dataset.builtin ? await setBuiltin(sw.dataset.builtin, on) : await setConnector(sw.dataset.conn, on); }
        catch (err) { sw.classList.toggle("on", !on); toast(err.message); }
      }
      if (e.target.closest("[data-manage]")) { closePops(); navigate("/plugins"); }
      if (e.target.closest("[data-mode-clear]")) { const was = mode; mode = null; importUrl = ""; renderMode(); if (was && was.onClear) was.onClear(); return; }
      if (e.target.closest("[data-import]")) { togglePop(root.querySelector(".import-pop")); root.querySelector(".import-url").focus(); return; }
      if (e.target.closest("[data-import-save]")) {
        const v = root.querySelector(".import-url").value.trim();
        if (v && !/^https?:\/\/\S+\.\S+/.test(v)) return toast("Enter a full web address, like https://example.com");
        importUrl = v; closePops(); renderMode(); ta.focus(); return;
      }
      if (e.target.closest("[data-import-clear]")) { importUrl = ""; closePops(); renderMode(); return; }
      const oc = e.target.closest("[data-optchip]");
      if (oc) return togglePop(root.querySelector(`[data-optpop="${oc.dataset.optchip}"]`));
      const ov = e.target.closest("[data-optval]");
      if (ov) { mode.options[+ov.dataset.optval].value = ov.dataset.v; closePops(); renderMode(); return; }
      const pj = e.target.closest("[data-proj]");
      if (pj) {
        closePops();
        if (pj.dataset.proj === "__new") return newProject();
        projectId = pj.dataset.proj || null;
        refresh();
      }
      const rm = e.target.closest("[data-rm]");
      if (rm) { files.splice(+rm.dataset.rm, 1); refresh(); }
      const rml = e.target.closest("[data-rmlib]");
      if (rml) { libItems.splice(+rml.dataset.rmlib, 1); refresh(); }
    });
    fileInput.onchange = () => { files = files.concat([...fileInput.files]); fileInput.value = ""; refresh(); };
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) root.querySelector(".mic-btn").hidden = true;
    refresh();
    return {
      setMode(m) { mode = m; importUrl = ""; renderMode(); ta.focus(); },
      getMode() { return mode; },
      setRunning(v) { running = v; refresh(); },
      setText(t) { ta.value = t; refresh(); ta.focus(); ta.setSelectionRange(t.length, t.length); },
      addLibItems(items) { libItems = libItems.concat(items.filter((i) => !libItems.some((l) => l.id === i.id))); refresh(); ta.focus(); },
      setProject(id, fixed) { projectId = id; fixedProject = fixed ? id : null; refresh(); },
      refresh,
      focus() { ta.focus(); },
    };
  }

  let recognition = null;
  function dictate(ta, btn, refresh) {
    if (recognition) { recognition.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.interimResults = true;
    recognition.continuous = true;
    const base = ta.value ? ta.value.replace(/\s*$/, " ") : "";
    recognition.onresult = (ev) => {
      ta.value = base + [...ev.results].map((r) => r[0].transcript).join("");
      refresh();
    };
    recognition.onend = () => { recognition = null; btn.classList.remove("rec"); };
    recognition.onerror = () => { toast("Dictation isn't available here."); };
    btn.classList.add("rec");
    recognition.start();
  }

  function handleStartError(err) {
    toast(err.message);
    if (/credits/i.test(err.message)) openUpgrade();
  }
  async function startTask(text, sent) {
    const fd = new FormData();
    fd.append("text", text);
    fd.append("model", S.model);
    if (sent.projectId) fd.append("project_id", sent.projectId);
    if (sent.mode) fd.append("mode", sent.mode);
    let full = text;
    if (sent.importUrl) full += `\n\nStart from this existing website (study it first): ${sent.importUrl}`;
    if (sent.prefs) full += `\n\nPreferences: ${sent.prefs}`;
    fd.set("text", full);
    fd.append("library_ids", sent.libIds.join(","));
    sent.files.forEach((f) => fd.append("files", f));
    try {
      const { id } = await api("/api/tasks", { method: "POST", body: fd });
      openTask(id, true);
      loadTasks();
      loadCredits();
    } catch (err) { handleStartError(err); }
  }

  const homeComposer = makeComposer($("home-composer"), {
    placeholder: "Assign a task or type / for more", top: true, onSend: startTask,
  });

  const taskComposer = makeComposer($("task-composer"), {
    placeholder: "Send message to Atlas",
    onSend: async (text, sent) => {
      const fd = new FormData();
      fd.append("text", text);
      fd.append("model", S.model);
      fd.append("library_ids", sent.libIds.join(","));
      sent.files.forEach((f) => fd.append("files", f));
      try { await api(`/api/tasks/${S.taskId}/messages`, { method: "POST", body: fd }); loadCredits(); }
      catch (err) { handleStartError(err); }
    },
    onStop: () => fetch(`/api/tasks/${S.taskId}/stop`, { method: "POST" }),
  });

  // ---------- Home ----------
  $("local-file-card").onclick = () => $("local-file-input").click();
  $("local-file-input").onchange = async () => {
    const input = $("local-file-input");
    if (!input.files.length) return;
    const items = await uploadToLibrary([...input.files]);
    input.value = "";
    if (items.length) { homeComposer.addLibItems(items); toast(`Added ${items.length} file${items.length > 1 ? "s" : ""} to your Library`); }
  };

  // ---------- Build & Create ----------
  const OPTION_ART = {
    site: `<div class="oa site"><i class="dots"></i><b class="l1"></b><b class="l2"></b><span class="btn-b"></span><span class="band"></span></div>`,
    chat: `<div class="oa chat"><span class="side"></span><span class="b1"></span><span class="b2"></span><span class="b3"></span></div>`,
    phone: `<div class="oa phone"><div class="frame"><span class="hd"></span><span class="r"></span><span class="r"></span><span class="r"></span></div></div>`,
    game: `<div class="oa game"><span class="sky"></span><span class="ground"></span><span class="p p1"></span><span class="p p2"></span><span class="hero"></span><span class="coin"></span></div>`,
    flow: `<div class="oa flow"><span class="n n1"></span><span class="n n2">✦</span><span class="n n3"></span><span class="n n4"></span><i class="w1"></i><i class="w2"></i><i class="w3"></i></div>`,
    nb: `<div class="oa nb"><div class="cell"><em>In [1]</em><b></b><b class="s"></b></div><div class="cell out"><span style="height:40%"></span><span style="height:70%"></span><span style="height:55%"></span><span style="height:90%"></span></div></div>`,
    slides: `<div class="oa slides"><div class="deck"><b class="t"></b><b class="s"></b><span class="pic"></span></div></div>`,
    doc: `<div class="oa doc"><div class="page"><b class="t"></b><b></b><b></b><b class="s"></b><b></b><b class="s"></b></div></div>`,
    sheet: `<div class="oa sheet"><div class="grid">${"<span></span>".repeat(20)}</div></div>`,
    image: `<div class="oa image"><span class="ph p1"></span><span class="ph p2"></span></div>`,
    video: `<div class="oa video"><div class="scr"><span class="play"></span></div></div>`,
    audio: `<div class="oa audio">${[30, 55, 80, 45, 95, 60, 35, 75, 50, 90, 40, 65, 30, 85, 55, 45].map((h) => `<span style="height:${h}%"></span>`).join("")}</div>`,
    viz: `<div class="oa viz"><span style="height:35%"></span><span style="height:60%"></span><span style="height:45%"></span><span style="height:80%"></span><span style="height:65%"></span><i></i></div>`,
  };
  const BUILD_OPTIONS = [
    { key: "website", label: "Website", art: "site", chip: "Website", icon: "layout", title: "Build a website", placeholder: "Describe the website you want to build", importable: true },
    { key: "chatbot", label: "Chatbot", art: "chat", chip: "Chatbot", icon: "chat", title: "Build a chatbot", placeholder: "Describe the chatbot you want to build" },
    { key: "mobile", label: "Mobile app", art: "phone", chip: "Develop apps", icon: "phone", title: "Build a mobile app", placeholder: "Describe the app you want to build" },
    { key: "game", label: "Game development", art: "game", chip: "Create games", icon: "gamepad", title: "Create a game", placeholder: "Describe the game you want to build" },
    { key: "automation", label: "Automations", art: "flow", chip: "Automation", icon: "automation", title: "Build an automation", placeholder: "Describe what should happen, and when" },
    { key: "notebook", label: "Jupyter notebook", art: "nb", chip: "Notebook", icon: "notebook", title: "Build a Jupyter notebook", placeholder: "Describe the notebook you want to create" },
  ];
  const CREATE_OPTIONS = [
    { key: "slides", section: "Document", label: "Slides", art: "slides", chip: "Slides", icon: "slides", title: "Create a presentation", placeholder: "Describe your presentation topic",
      options: [{ key: "style", icon: "slides", value: "Standard", choices: [["Standard", "Fast, versatile HTML deck: best for most presentations"], ["PowerPoint", "Native .pptx file you can edit in PowerPoint or Keynote"]] },
        { key: "pages", icon: "list", value: "8–12", label: "Pages to generate", choices: [["4–8"], ["8–12"], ["12–16"], ["16–20"], ["20–24"]] }] },
    { key: "document", section: "Document", label: "Document", art: "doc", chip: "Document", icon: "file", title: "Create a document", placeholder: "Describe the document you want to create" },
    { key: "spreadsheet", section: "Document", label: "Spreadsheet", art: "sheet", chip: "Spreadsheet", icon: "table", title: "Create a spreadsheet", placeholder: "Upload a spreadsheet to analyze or start one from scratch" },
    { key: "visualization", section: "Document", label: "Visualization", art: "viz", chip: "Visualization", icon: "chart", title: "Create a visualization", placeholder: "Upload your data and tell Atlas how to visualize it" },
    { key: "design", section: "Media", label: "Image", art: "image", chip: "Design", icon: "image", title: "Create a design", placeholder: "Describe the image you want to create",
      note: "Designs are made with code (type, shapes, illustration) and saved as PNG. Atlas can't generate photos.",
      options: [{ key: "size", icon: "layout", value: "Instagram post (1080×1350)", label: "Canvas size", choices: [["Instagram post (1080×1350)"], ["Story / Reel cover (1080×1920)"], ["Square (1080×1080)"], ["Poster (1240×1754)"], ["Banner (1584×396)"], ["Slide (1920×1080)"]] }] },
    { key: "video", section: "Media", label: "Video", art: "video", chip: "Video", icon: "video", title: "Create a video", placeholder: "Describe the video you want to create",
      note: "Videos are motion graphics made with code and saved as WebM, without sound. Atlas can't generate camera footage.",
      options: [{ key: "aspect", icon: "layout", value: "16:9", label: "Aspect ratio", choices: [["16:9", "Landscape · 1920×1080"], ["9:16", "Vertical · 1080×1920"], ["1:1", "Square · 1080×1080"]] },
        { key: "length", icon: "clock", value: "10 s", label: "Length", choices: [["5 s"], ["10 s"], ["15 s"], ["30 s"]] }] },
    { key: "audio", section: "Media", label: "Audio", art: "audio", chip: "Audio", icon: "audio", title: "Create audio", placeholder: "Describe the audio you want to create",
      get note() { return S.config.cloud ? "Speech uses a built-in text-to-speech voice (robotic, not studio quality); sound effects and music loops are synthesized with code." : "Speech uses your Mac's built-in voices; sound effects and music loops are synthesized with code."; },
      options: [{ key: "format", icon: "audio", value: "Narration", label: "Format", choices: [["Narration", "One voice reads your script"], ["Podcast", "Two hosts in conversation"], ["Sound effects", "Short synthesized sounds"], ["Music loop", "A simple synthesized loop"]] }] },
  ];
  const ALL_OPTIONS = BUILD_OPTIONS.concat(CREATE_OPTIONS);
  const MODE_LABEL = Object.fromEntries(ALL_OPTIONS.map((o) => [o.key, o.chip]));

  const IDEAS = {
    chatbot: [["book", "Build a study buddy that quizzes me on my uploaded notes"], ["chat", "Build a support bot that answers order and shipping questions"], ["sparkle", "Build a recipe bot that plans meals from what's in my fridge"], ["globe", "Build a language tutor bot for daily conversation practice"], ["help", "Build an FAQ bot for a small neighborhood gym"], ["plane", "Build a travel planner bot that drafts day-by-day itineraries"]],
    mobile: [["check", "Build a habit tracker with streaks and daily reminders"], ["chart", "Build a workout logger with progress charts"], ["book", "Build a flashcard app with spaced repetition"], ["table", "Build a shared grocery list app for a household"], ["spark", "Build a budget app that tracks daily spending"], ["calendar", "Build a plant-watering reminder app"]],
    notebook: [["chart", "Analyze monthly sales trends with sample data"], ["sparkle", "Compare three time-series forecasting models"], ["check", "Analyze an A/B test with significance testing"], ["globe", "Explore a public dataset on world population"], ["book", "Write a beginner tutorial on linear regression"], ["table", "Measure risk and return for a five-stock portfolio"]],
    automation: [["calendar", "Every morning at 8am, summarize the top tech news into a short brief"], ["globe", "Every Monday, check three competitor pricing pages and report what changed"], ["spark", "Every day at 6pm, check tomorrow's weather and tell me if I need an umbrella"], ["book", "Every Friday, find the five most-discussed new AI papers and summarize them"], ["zap", "When a webhook arrives with an order, add it to a CSV ledger"], ["eye", "Every hour, check whether a product page says it's back in stock"]],
    slides: [["spark", "A 10-slide pitch deck for a meal-kit startup"], ["book", "Lecture slides explaining how vaccines train the immune system"], ["chart", "A quarterly business review with charts"], ["check", "An onboarding deck for new engineers on a small team"], ["plane", "A travel guide deck for a week in Lisbon"], ["table", "A deck on the basics of personal investing"]],
    document: [["file", "A one-page proposal for a community garden"], ["table", "A competitive analysis of three note-taking apps"], ["book", "An explainer on how interest rates affect mortgages"], ["globe", "A research brief on remote-work productivity, with sources"], ["pen", "A cover letter for a junior data analyst role"], ["layout", "A user guide for a small online store's admin panel"]],
    spreadsheet: [["table", "A monthly household budget with categories and totals"], ["chart", "A sales tracker with formulas and a chart"], ["layout", "A comparison of 10 laptops with specs and prices"], ["calendar", "A project timeline with tasks, owners and dates"], ["spark", "A loan amortization schedule"], ["pen", "A content calendar for a month of social posts"]],
    design: [["image", "Design a poster for a summer jazz night in the park"], ["layout", "Design three Instagram posts for a bakery's grand opening"], ["pen", "Design a logo and brand sheet for a bike repair shop"], ["phone", "Design a mobile app screen for a meditation timer"], ["spark", "Design a LinkedIn banner for a freelance data consultant"], ["calendar", "Design an event flyer for a neighborhood book swap"]],
    video: [["sparkle", "A 10-second animated logo reveal for my studio, Northwind"], ["phone", "A vertical ad announcing a coffee shop's new oat latte"], ["chart", "An animated bar chart race of the world's largest cities"], ["bulb", "An animated explainer of how solar panels make electricity"], ["pen", "An animated quote card for social media"], ["clock", "A countdown intro for a weekly podcast"]],
    audio: [["audio", "A 1-minute narrated summary of today's tech news"], ["chat", "A two-host podcast episode on the history of coffee"], ["spark", "A calm 3-minute guided breathing exercise"], ["book", "Narrate my uploaded document as an audiobook"], ["zap", "A set of UI sound effects: click, success, error, notification"], ["sparkle", "A gentle bedtime story for kids"]],
    visualization: [["globe", "Chart CO2 emissions by country since 1990"], ["file", "Visualize my uploaded CSV in the clearest way"], ["chart", "Compare life expectancy across continents over time"], ["table", "Show US unemployment by month over 20 years"], ["sparkle", "Show the planets' sizes and distances to scale"], ["zap", "Chart the growth of renewable energy worldwide"]],
  };
  const WEBSITE_CATS = [
    ["E-commerce", ["Build an online store for handmade ceramics", "Build a specialty coffee subscription shop", "Build a secondhand sneaker marketplace", "Build a plant shop with care guides", "Build a print-on-demand poster store", "Build a bakery site with online pre-orders"]],
    ["Landing Page", ["Build a launch page for a habit-tracking app", "Build a waitlist page for a robot vacuum", "Build a landing page for a local yoga studio", "Build an event page for a design conference", "Build a signup page for a climate-tech newsletter", "Build a promo page for an indie board game"]],
    ["Dashboard", ["Build a sales dashboard with sample data", "Build a personal finance dashboard", "Build a website analytics dashboard", "Build a fitness progress dashboard", "Build a project status dashboard for a small team", "Build an air-quality dashboard for five cities"]],
    ["Corporate", ["Build a site for an architecture firm", "Build a site for a regional logistics company", "Build a site for a boutique law practice", "Build a site for a solar panel installer", "Build a site for an accounting firm", "Build a site for a family dental clinic"]],
    ["Portfolio", ["Build a portfolio for a wedding photographer", "Build a portfolio for a UX designer", "Build a portfolio for a software engineer", "Build a portfolio for a children's book illustrator", "Build a portfolio for an architecture student", "Build a portfolio for a jazz musician"]],
    ["SaaS", ["Build a marketing site with pricing for an invoicing tool", "Build a site for an AI meeting-notes app", "Build a site for a team scheduling tool", "Build a site for an email marketing platform", "Build a site for an API uptime monitor", "Build a site for a customer feedback tool"]],
    ["Link-in-bio", ["Build a link-in-bio page for a cooking creator", "Build a link-in-bio page for a podcast", "Build a link-in-bio page for a fitness coach", "Build a link-in-bio page for a ceramic artist", "Build a link-in-bio page for an indie band", "Build a link-in-bio page for a travel vlogger"]],
    ["Blog", ["Build a travel blog with a map of trips", "Build a tech blog with code highlighting", "Build a cooking blog with recipe cards", "Build a personal finance blog", "Build a book review blog with ratings", "Build a running blog with race reports"]],
    ["Mini Games", ["Build a memory card matching game", "Build a typing speed test", "Build a 2048 puzzle game", "Build a trivia quiz with a timer", "Build tic-tac-toe against the computer", "Build a daily word-guess game"]],
    ["Productivity", ["Build a Pomodoro focus timer", "Build a kanban board that saves locally", "Build a habit tracker with streaks", "Build a markdown notes app", "Build a trip expense splitter", "Build a unit converter"]],
  ];
  const GAME_IDEAS = {
    Arcade: ["A neon snake game with power-ups and a leaderboard", "A brick breaker with bouncing multiball", "An endless runner through a city at night"],
    Action: ["A top-down space shooter with boss waves", "A side-scrolling platformer with double jump", "A dungeon crawler with sword combat"],
    Puzzle: ["A sliding-tile puzzle with picture levels", "A match-three gem game with combos", "A laser-mirror reflection puzzle"],
    Strategy: ["A tower defense game with upgradeable towers", "A turn-based tactics game on a hex grid", "A tiny city builder with happiness and taxes"],
    Sports: ["A mini golf game with ten holes", "A penalty-kick shootout", "A top-down kart racer with drifting"],
    Casual: ["A cozy fishing game with a collection book", "A cat café idle game", "A balloon-pop rhythm game"],
  };
  const HOME = { panel: null, cat: 0, genre: "Arcade", seed: 0, theme: 0, template: "", vizFormat: "Graph", vizCharts: new Set() };
  // Our own slide themes (name, background, text, accent, description sent to the agent).
  const SLIDE_THEMES = [
    ["Classic", "#ffffff", "#1c1c1a", "#2f7ff5", "white background, near-black text, serif headings, one blue accent"],
    ["Midnight", "#0f172a", "#e2e8f0", "#38bdf8", "deep navy background, light text, electric blue accents, modern sans"],
    ["Sunrise", "linear-gradient(135deg,#fde68a,#f97316)", "#1c1c1a", "#9a3412", "warm yellow-to-orange gradients, bold rounded sans headings"],
    ["Editorial", "#f5f1e8", "#111111", "#b91c1c", "magazine style: cream paper, large serif titles, thin rules, red accent"],
    ["Mono", "#fafafa", "#111111", "#111111", "minimal black and white, generous whitespace, grotesk type"],
    ["Forest", "#14532d", "#ecfdf5", "#86efac", "deep green background, cream text, soft green accents, natural feel"],
    ["Neon", "#09090b", "#fafafa", "#a3e635", "black background, neon lime and pink accents, techy monospace details"],
    ["Pastel", "#fdf2f8", "#4a044e", "#db2777", "soft pastel pinks and lilacs, rounded shapes, friendly"],
    ["Blueprint", "#1e3a8a", "#dbeafe", "#ffffff", "blueprint blue with a fine grid, white line drawings, technical"],
    ["Terracotta", "#fff7ed", "#7c2d12", "#ea580c", "earthy terracotta and sand tones, warm serif headings"],
  ];
  const VIZ_FORMATS = [["Graph", "chart"], ["Slides", "slides"], ["Website", "layout"], ["Spreadsheet", "table"], ["Report", "file"]];
  const CHART_ART = {
    Bar: `<svg viewBox="0 0 60 36"><rect x="6" y="20" width="7" height="14"/><rect x="17" y="10" width="7" height="24"/><rect x="28" y="16" width="7" height="18"/><rect x="39" y="5" width="7" height="29"/></svg>`,
    Line: `<svg viewBox="0 0 60 36"><polyline points="4,28 14,20 24,24 34,10 44,14 56,6" fill="none" stroke-width="2.5"/></svg>`,
    Pie: `<svg viewBox="0 0 60 36"><circle cx="30" cy="18" r="14" opacity=".35"/><path d="M30 18V4a14 14 0 0 1 12.1 21z"/></svg>`,
    Scatter: `<svg viewBox="0 0 60 36">${[[8, 26], [14, 22], [20, 24], [26, 16], [32, 18], [38, 11], [44, 13], [50, 7], [18, 14], [40, 22]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join("")}</svg>`,
    "Heat map": `<svg viewBox="0 0 60 36">${[...Array(18)].map((_, i) => `<rect x="${8 + (i % 6) * 7.5}" y="${5 + Math.floor(i / 6) * 9}" width="6.5" height="8" opacity="${0.2 + ((i * 37) % 80) / 100}"/>`).join("")}</svg>`,
    Bubble: `<svg viewBox="0 0 60 36"><circle cx="14" cy="22" r="7" opacity=".6"/><circle cx="30" cy="14" r="10" opacity=".45"/><circle cx="46" cy="22" r="5" opacity=".75"/></svg>`,
  };
  const shuffle = (arr, seed) => arr.map((x, i) => [x, Math.sin(i * 9301 + seed * 49297) % 1]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);

  function showHomePanel(name) {
    HOME.panel = name;
    stopSnake();
    $("hero-brand").hidden = !!name;
    $("home-cards").hidden = !!name;
    $("home-panel").hidden = !name;
    if (name) renderHomePanel();
  }
  function renderHomePanel() {
    const p = $("home-panel");
    const name = HOME.panel;
    if (name === "build" || name === "create") {
      const optCard = (o) => `<button class="opt" data-opt="${o.key}"><span class="opt-thumb">${OPTION_ART[o.art]}</span><span class="opt-label">${o.label}</span></button>`;
      const body = name === "build"
        ? `<div class="opt-grid">${BUILD_OPTIONS.map(optCard).join("")}</div><div class="hp-foot">Desktop apps, widgets and browser extensions aren't included: they need a desktop app this tool doesn't have.</div>`
        : ["Document", "Media"].map((sec) => `<div class="opt-sec">${sec}</div><div class="opt-grid">${CREATE_OPTIONS.filter((o) => o.section === sec).map(optCard).join("")}</div>`).join("");
      p.innerHTML = `<div class="hp"><div class="hp-head"><span>${name === "build" ? "Build" : "Create"}</span><button class="icon-btn" data-hp-close>${icon("x")}</button></div>${body}</div>`;
      return;
    }
    const opt = ALL_OPTIONS.find((o) => o.key === name);
    if (name === "website") {
      const [catName, ideas] = WEBSITE_CATS[HOME.cat];
      p.innerHTML = `<div class="hp"><div class="hp-head"><span>${opt.title}</span><span class="hp-tools">
          <button class="icon-btn" data-cat-scroll="-1">${icon("back")}</button><button class="icon-btn" data-cat-scroll="1">${icon("chevRight")}</button><button class="icon-btn" data-hp-close>${icon("x")}</button></span></div>
        <div class="cat-row" id="cat-row">${WEBSITE_CATS.map(([c], i) => `<button class="cat ${i === HOME.cat ? "on" : ""}" data-cat="${i}"><span class="cat-name">${c}</span><span class="cat-thumb">${catArt(i)}</span></button>`).join("")}</div>
        <div class="hp-sub"><span>Explore ideas</span><button class="icon-btn" data-hp-refresh title="More ideas">${icon("refresh")}</button></div>
        <div class="idea-grid three">${shuffle(ideas, HOME.seed).slice(0, 3).map((t) => ideaCard(catIcon(catName), t)).join("")}</div></div>`;
      const row = $("cat-row"), on = row.querySelector(".cat.on");
      if (on) row.scrollLeft = HOME.cat > 3 ? on.offsetLeft - row.offsetLeft - 8 : 0;
      return;
    }
    if (name === "game") {
      p.innerHTML = `<div class="hp game-hp"><div class="game-hero"><div class="hp-head" style="justify-content:flex-end"><button class="icon-btn" data-hp-close>${icon("x")}</button></div>
          <div class="game-title">Press start on any idea.</div><div class="game-sub">Atlas builds it in code: rules, levels, art and sound.</div>
          <canvas id="snake" width="480" height="200" tabindex="0" aria-label="Snake game. Click to start, arrow keys to move."></canvas></div>
        <div class="hp-sub"><span>Explore ideas</span><span class="genre-tabs">${Object.keys(GAME_IDEAS).map((g) => `<button class="tab-btn sm ${g === HOME.genre ? "on" : ""}" data-genre="${g}">${g}</button>`).join("")}</span></div>
        <div class="idea-grid three">${GAME_IDEAS[HOME.genre].map((t) => ideaCard("gamepad", t)).join("")}</div></div>`;
      startSnake($("snake"));
      return;
    }
    const head = (extra = "") => `<div class="hp-head"><span>${opt.title}</span><span class="hp-tools">${extra}<button class="icon-btn" data-hp-refresh title="Shuffle ideas">${icon("refresh")}</button><button class="icon-btn" data-hp-close>${icon("x")}</button></span></div>`;
    if (name === "slides") {
      p.innerHTML = `<div class="hp">${head()}
        <div class="idea-grid three">${shuffle(IDEAS.slides, HOME.seed).slice(0, 3).map(([ic, t]) => ideaCard(ic, t)).join("")}</div>
        <div class="hp-sub"><span>Choose a template</span><span class="hp-tools">
          <button class="ghost-btn" data-import-template>${icon("upload")}Import template</button>
          <button class="icon-btn" data-theme-scroll="-1">${icon("back")}</button><button class="icon-btn" data-theme-scroll="1">${icon("chevRight")}</button></span></div>
        <div class="cat-row" id="theme-row">${HOME.template ? `<button class="theme on" data-theme="-1"><span class="theme-thumb imported">${icon("file")}<b>${esc(HOME.template)}</b></span><span class="cat-name">Imported</span></button>` : ""}${SLIDE_THEMES.map(([n, bg, fg, ac], i) => `
          <button class="theme ${!HOME.template && i === HOME.theme ? "on" : ""}" data-theme="${i}"><span class="theme-thumb" style="background:${bg};color:${fg}">
            <b style="background:${fg}"></b><i style="background:${ac}"></i><em style="background:${fg}"></em></span><span class="cat-name">${n}</span></button>`).join("")}</div>
        <input type="file" id="template-input" accept=".pptx,.pdf,.key,.html,.png,.jpg" hidden></div>`;
      return;
    }
    if (name === "visualization") {
      p.innerHTML = `<div class="hp">${head()}
        <div class="idea-grid three">${shuffle(IDEAS.visualization, HOME.seed).slice(0, 3).map(([ic, t]) => ideaCard(ic, t)).join("")}</div>
        <div class="hp-sub"><span>Choose output format</span></div>
        <div class="fmt-row">${VIZ_FORMATS.map(([f, ic]) => `<button class="fmt ${HOME.vizFormat === f ? "on" : ""}" data-vizfmt="${f}">${icon(ic)}<span>${f}</span></button>`).join("")}</div>
        <div class="hp-sub"><span>Preferred charts <span class="hint-inline">optional, pick any</span></span></div>
        <div class="fmt-row">${Object.entries(CHART_ART).map(([c, svg]) => `<button class="fmt chart ${HOME.vizCharts.has(c) ? "on" : ""}" data-vizchart="${c}">${svg}<span>${c}</span></button>`).join("")}</div></div>`;
      return;
    }
    p.innerHTML = `<div class="hp">${head()}
      <div class="idea-grid">${shuffle(IDEAS[name], HOME.seed).map(([ic, t]) => ideaCard(ic, t)).join("")}</div>
      ${opt.note ? `<div class="hp-foot">${esc(opt.note)}</div>` : ""}</div>`;
  }
  // The preferences line sent with Create tasks: composer dropdowns plus panel selections.
  function modePrefs(opt, options) {
    const parts = (options || []).map((o) => `${o.label || o.key}: ${o.value}`);
    if (opt.key === "slides") {
      if (HOME.template) parts.push(`theme: match the attached template file (${HOME.template})`);
      else { const t = SLIDE_THEMES[HOME.theme]; parts.push(`theme: ${t[0]} (${t[4]}; background ${t[1]}, text ${t[2]}, accent ${t[3]})`); }
    }
    if (opt.key === "visualization") {
      parts.push(`output format: ${HOME.vizFormat}`);
      if (HOME.vizCharts.size) parts.push(`preferred charts: ${[...HOME.vizCharts].join(", ")}`);
    }
    return parts.join("; ");
  }
  const ideaCard = (ic, text) => `<button class="idea" data-idea="${esc(text)}">${icon(ic)}<span>${esc(text)}</span></button>`;
  const catIcon = (c) => ({ "E-commerce": "cart", "Landing Page": "layout", Dashboard: "chart", Corporate: "building", Portfolio: "image", SaaS: "zap", "Link-in-bio": "globe", Blog: "pen", "Mini Games": "gamepad", Productivity: "check" })[c] || "layout";
  function catArt(i) {
    const k = ["shop", "landing", "dash", "corp", "port", "saas", "bio", "blog", "games", "prod"][i];
    return `<span class="ca ${k}"><i class="dots"></i><b></b><b class="s"></b><span class="blk"></span><span class="blk"></span><span class="blk"></span></span>`;
  }
  function chooseOption(key) {
    const opt = ALL_OPTIONS.find((o) => o.key === key);
    HOME.seed = 0;
    showHomePanel(key);
    const options = (opt.options || []).map((o) => ({ ...o }));
    homeComposer.setMode({
      ...opt,
      options,
      prefs: () => modePrefs(opt, options),
      onClear: () => showHomePanel(null),
      onSend: key === "automation" ? (text) => automationFromText(text) : null,
    });
  }
  $("home-cards").addEventListener("click", (e) => {
    const s = e.target.closest("[data-start]");
    if (s) showHomePanel(s.dataset.start);
  });
  $("home-panel").addEventListener("click", (e) => {
    const t = (sel) => e.target.closest(sel);
    if (t("[data-hp-close]")) { showHomePanel(null); return homeComposer.setMode(null); }
    if (t("[data-opt]")) return chooseOption(t("[data-opt]").dataset.opt);
    if (t("[data-cat]")) { HOME.cat = +t("[data-cat]").dataset.cat; HOME.seed = 0; return renderHomePanel(); }
    if (t("[data-cat-scroll]")) { $("cat-row").scrollBy({ left: +t("[data-cat-scroll]").dataset.catScroll * 320, behavior: "smooth" }); return; }
    if (t("[data-hp-refresh]")) { HOME.seed += 1; return renderHomePanel(); }
    if (t("[data-genre]")) { HOME.genre = t("[data-genre]").dataset.genre; return renderHomePanel(); }
    if (t("[data-theme]")) { const i = +t("[data-theme]").dataset.theme; if (i >= 0) { HOME.theme = i; HOME.template = ""; } return renderHomePanel(); }
    if (t("[data-theme-scroll]")) { $("theme-row").scrollBy({ left: +t("[data-theme-scroll]").dataset.themeScroll * 320, behavior: "smooth" }); return; }
    if (t("[data-import-template]")) return $("template-input").click();
    if (t("[data-vizfmt]")) { HOME.vizFormat = t("[data-vizfmt]").dataset.vizfmt; return renderHomePanel(); }
    if (t("[data-vizchart]")) { const c = t("[data-vizchart]").dataset.vizchart; HOME.vizCharts.has(c) ? HOME.vizCharts.delete(c) : HOME.vizCharts.add(c); return renderHomePanel(); }
    if (t("[data-idea]")) homeComposer.setText(t("[data-idea]").dataset.idea);
  });
  $("home-panel").addEventListener("change", async (e) => {
    if (e.target.id !== "template-input" || !e.target.files.length) return;
    const items = await uploadToLibrary([...e.target.files]);
    if (!items.length) return;
    homeComposer.addLibItems(items);
    HOME.template = items[0].name;
    renderHomePanel();
    toast("Template attached; the deck will match its style");
  });

  // Automation mode: turn the description into a workflow (schedule guessed from the wording) and open the editor.
  function automationFromText(text) {
    const t = text.toLowerCase();
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const time = (() => {
      const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
      if (m) { let h = +m[1] % 12; if (m[3] === "pm") h += 12; return `${String(h).padStart(2, "0")}:${m[2] || "00"}`; }
      if (/morning/.test(t)) return "08:00";
      if (/evening|night/.test(t)) return "18:00";
      return "09:00";
    })();
    const schedule = { frequency: "daily", time, weekday: 0, every_hours: 6 };
    let kind = "schedule";
    const day = days.findIndex((d) => t.includes(d));
    if (/webhook|when .*(arrives|is received|comes in)/.test(t)) kind = "trigger";
    else if (/every (\d+ )?hours?|hourly/.test(t)) { schedule.frequency = "hourly"; schedule.every_hours = +(t.match(/every (\d+) hours?/) || [0, 1])[1]; }
    else if (/weekday/.test(t)) schedule.frequency = "weekdays";
    else if (day >= 0) { schedule.frequency = "weekly"; schedule.weekday = day; }
    if (kind === "schedule" && /^(when|if)\b/.test(t)) { kind = "advanced"; schedule.every_hours = 6; }
    navigate("/automations");
    editAutomation({ kind, name: text.replace(/^(every|each)[^,]*,\s*/i, "").slice(0, 60), prompt: text, condition: kind === "advanced" ? text : "", schedule, model: S.model });
  }

  // A small Snake game for the game-development hero (our own code).
  let snakeStop = null;
  function stopSnake() { if (snakeStop) { snakeStop(); snakeStop = null; } }
  function startSnake(canvas) {
    const ctx = canvas.getContext("2d");
    const C = 20, W = canvas.width / C, H = canvas.height / C;
    const css = getComputedStyle(document.documentElement);
    const col = (v, d) => (css.getPropertyValue(v).trim() || d);
    let snake, dir, next, food, score, timer = null, best = 0;
    const place = () => { do { food = [Math.floor(Math.random() * W), Math.floor(Math.random() * H)]; } while (snake.some(([x, y]) => x === food[0] && y === food[1])); };
    const draw = (msg) => {
      ctx.fillStyle = col("--soft", "#efefee"); ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (snake) {
        ctx.fillStyle = "#e8783c"; ctx.fillRect(food[0] * C + 4, food[1] * C + 4, C - 8, C - 8);
        snake.forEach(([x, y], i) => { ctx.fillStyle = i ? col("--text-2", "#555") : col("--text", "#1c1c1a"); ctx.fillRect(x * C + 1, y * C + 1, C - 2, C - 2); });
        ctx.fillStyle = col("--muted", "#888"); ctx.font = "600 13px ui-monospace, Menlo, monospace"; ctx.fillText(`SCORE ${score}  BEST ${best}`, 10, 18);
      }
      if (msg) {
        ctx.fillStyle = col("--text", "#1c1c1a"); ctx.font = "700 18px ui-monospace, Menlo, monospace"; ctx.textAlign = "center";
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2 + 6); ctx.textAlign = "left";
      }
    };
    const tick = () => {
      dir = next;
      const head = [(snake[0][0] + dir[0] + W) % W, (snake[0][1] + dir[1] + H) % H];
      if (snake.some(([x, y]) => x === head[0] && y === head[1])) { clearInterval(timer); timer = null; best = Math.max(best, score); return draw("GAME OVER - CLICK TO RETRY"); }
      snake.unshift(head);
      if (head[0] === food[0] && head[1] === food[1]) { score++; place(); } else snake.pop();
      draw();
    };
    const start = () => {
      snake = [[6, 5], [5, 5], [4, 5]]; dir = next = [1, 0]; score = 0; place();
      clearInterval(timer); timer = setInterval(tick, 110); canvas.focus(); draw();
    };
    const keys = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const onKey = (e) => {
      const k = keys[e.key];
      if (!k || !timer) return;
      e.preventDefault();
      if (k[0] !== -dir[0] || k[1] !== -dir[1]) next = k;
    };
    canvas.addEventListener("click", start);
    canvas.addEventListener("keydown", onKey);
    draw("SNAKE - CLICK TO START");
    snakeStop = () => { clearInterval(timer); canvas.removeEventListener("keydown", onKey); };
  }

  // ---------- Jupyter notebook viewer ----------
  function renderNotebook(nb) {
    const src = (x) => (Array.isArray(x) ? x.join("") : x || "");
    const clean = (t) => t.replace(/\x1b\[[0-9;]*m/g, "");
    const out = (o) => {
      if (o.output_type === "stream") return `<pre class="nb-out ${o.name === "stderr" ? "warn" : ""}">${esc(clean(src(o.text)))}</pre>`;
      if (o.output_type === "error") return `<pre class="nb-out err">${esc(clean((o.traceback || []).join("\n")) || `${o.ename}: ${o.evalue}`)}</pre>`;
      const d = o.data || {};
      if (d["image/png"]) return `<img class="nb-img" alt="" src="data:image/png;base64,${src(d["image/png"]).replace(/\s/g, "")}">`;
      if (d["image/jpeg"]) return `<img class="nb-img" alt="" src="data:image/jpeg;base64,${src(d["image/jpeg"]).replace(/\s/g, "")}">`;
      if (d["image/svg+xml"]) return `<img class="nb-img" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(src(d["image/svg+xml"]))}">`;
      if (d["text/html"]) return `<iframe class="nb-html" sandbox="allow-same-origin" srcdoc="${esc(`<style>body{font:13px -apple-system,sans-serif;margin:0;color:#222}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:4px 8px;text-align:right}th{background:#f5f5f4}</style>` + src(d["text/html"]))}" onload="this.style.height=(this.contentDocument.body.scrollHeight+4)+'px'"></iframe>`;
      if (d["text/markdown"]) return `<div class="md">${md(src(d["text/markdown"]))}</div>`;
      if (d["text/plain"]) return `<pre class="nb-out">${esc(clean(src(d["text/plain"])))}</pre>`;
      return "";
    };
    const lang = (nb.metadata && (nb.metadata.kernelspec || {}).display_name) || "Python 3";
    return `<div class="nb"><div class="nb-bar">${icon("notebook")}<span>${esc(lang)}</span><span class="nb-count">${(nb.cells || []).length} cells</span></div>` + (nb.cells || []).map((c) => {
      if (c.cell_type === "markdown") return `<div class="nb-cell md-cell"><div class="nb-prompt"></div><div class="md">${md(src(c.source))}</div></div>`;
      if (c.cell_type !== "code") return `<div class="nb-cell"><div class="nb-prompt"></div><pre class="nb-out">${esc(src(c.source))}</pre></div>`;
      const n = c.execution_count == null ? " " : c.execution_count;
      const outs = (c.outputs || []).map(out).join("");
      return `<div class="nb-cell"><div class="nb-prompt">In [${n}]:</div><pre class="nb-code"><code>${esc(src(c.source))}</code></pre></div>` +
        (outs ? `<div class="nb-cell nb-outs"><div class="nb-prompt out">${(c.outputs || []).some((o) => o.output_type === "execute_result") ? `Out [${n}]:` : ""}</div><div class="nb-outwrap">${outs}</div></div>` : "");
    }).join("") + `</div>`;
  }
  async function showNotebook(name, url, actions) {
    try {
      const nb = await (await fetch(url)).json();
      showModal(name, actions, renderNotebook(nb));
    } catch {
      showModal(name, actions, `<div class="cp-empty">This notebook couldn't be read.</div>`);
    }
  }

  // ---------- Sidebar ----------
  async function loadTasks() {
    try { S.tasks = await api("/api/tasks"); } catch { return; }
    renderTasks();
  }
  function renderTasks() {
    const q = ($("search-input").value || "").toLowerCase();
    const list = S.tasks.filter((t) => !S.pendingDeletes.has(t.id) && (!q || t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q)));
    $("task-list").innerHTML = list.length ? list.map((t) => `
      <div class="task-row" data-id="${t.id}">
        <button class="nav-item ${t.id === S.taskId ? "active" : ""}" title="${esc(t.title)}">
          <span class="t-dot ${t.status === "running" ? "running" : ""}">${t.status === "running" ? "" : icon(taskIcon(t.title))}</span><span class="t-title">${esc(t.title)}</span></button>
        <button class="icon-btn row-del" data-del="${t.id}" title="Delete task">${icon("trash")}</button>
      </div>`).join("") : `<div class="sb-empty">${q ? "No matching tasks" : "No tasks yet"}</div>`;
  }
  $("task-list").onclick = async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      e.stopPropagation();
      // No confirmation dialog: hide it now, delete for real after 8 s unless the user clicks Undo.
      const id = del.dataset.del;
      S.pendingDeletes.add(id);
      if (id === S.taskId) goHome(true);
      renderTasks();
      toast("Task deleted", {
        label: "Undo",
        onClick: () => { S.pendingDeletes.delete(id); renderTasks(); },
        onExpire: async () => {
          if (!S.pendingDeletes.has(id)) return;
          await fetch(`/api/tasks/${id}`, { method: "DELETE" });
          S.pendingDeletes.delete(id);
          loadTasks();
        },
      });
      return;
    }
    const row = e.target.closest(".task-row");
    if (row) openTask(row.dataset.id, true);
  };
  async function loadProjects() {
    try { S.projects = await api("/api/projects"); } catch { S.projects = []; }
    $("project-list").innerHTML = S.projects.map((p) => `<button class="nav-item ${curPath() === "/project/" + p.id ? "active" : ""}" data-project="${p.id}"><span class="ni">${icon("folderBox")}</span><span class="t-title">${esc(p.name)}</span></button>`).join("");
    homeComposer.refresh();
  }
  $("project-list").onclick = (e) => { const b = e.target.closest("[data-project]"); if (b) navigate(`/project/${b.dataset.project}`); };
  $("new-project").onclick = () => newProject();
  function newProject() {
    showModal("New project", "", `
      <div class="form">
        <label>Name<input id="np-name" placeholder="e.g. Q4 market research" autofocus></label>
        <label>Instructions <span class="hint">Applied to every task in this project, e.g. audience, tone, sources to prefer.</span><textarea id="np-instr"></textarea></label>
        <div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="np-save">Create project</button></div>
      </div>`);
    $("np-save").onclick = async () => {
      const name = $("np-name").value.trim();
      if (!name) return toast("Give the project a name");
      const p = await api("/api/projects", { json: { name, instructions: $("np-instr").value } });
      closeModal();
      await loadProjects();
      navigate(`/project/${p.id}`);
    };
  }
  $("search-input").oninput = renderTasks;
  $("sb-search-btn").onclick = () => { const s = $("sb-search"); s.hidden = !s.hidden; if (!s.hidden) $("search-input").focus(); };
  $("sb-collapse").onclick = () => $("sidebar").classList.add("collapsed");
  $("sb-open").onclick = () => $("sidebar").classList.remove("collapsed");
  document.querySelectorAll(".sb-nav [data-nav], .brand[data-nav]").forEach((b) => (b.onclick = (e) => {
    e.preventDefault();
    navigate(b.dataset.nav === "home" ? "/" : `/${b.dataset.nav}`);
  }));
  $("more-btn").dataset.pop = "1";
  $("more-btn").onclick = () => togglePop($("more-menu"));
  $("more-menu").onclick = (e) => {
    const m = e.target.closest("[data-more]")?.dataset.more;
    closePops();
    if (m === "logins") openVault();
    if (m === "usage") navigate("/usage");
    if (m === "theme") toggleTheme();
    if (m === "signout") signOut();
  };
  function currentTheme() {
    const set = document.documentElement.dataset.theme;
    return set || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("atlas.theme", next); } catch {}
    $("theme-label").textContent = next === "dark" ? "Light mode" : "Dark mode";
  }

  // ---------- Routing ----------
  // The static demo keeps the page address after "#" (static hosts only serve real files).
  const curPath = () => (window.ATLAS_STATIC ? location.hash.slice(1) || "/" : location.pathname);
  const toUrl = (path) => (window.ATLAS_STATIC ? `/index.html#${path}` : path);
  const VIEWS = ["home", "task", "library", "automations", "plugins", "project", "usage"];
  function showView(name) {
    VIEWS.forEach((v) => ($(v).hidden = v !== name));
    document.querySelectorAll(".sb-nav .nav-item[data-nav]").forEach((b) => b.classList.toggle("active", b.dataset.nav === name && name !== "home"));
    document.querySelectorAll("#project-list [data-project]").forEach((b) => b.classList.toggle("active", curPath() === "/project/" + b.dataset.project));
    closePops();
  }
  function navigate(path) {
    if (curPath() !== path) history.pushState({}, "", toUrl(path));
    route();
  }
  function leaveTask() {
    closeStream();
    S.taskId = null;
    renderTasks();
  }
  function goHome(push) {
    if (push && curPath() !== "/") history.pushState({}, "", toUrl("/"));
    leaveTask();
    showView("home");
    showHomePanel(null);
    homeComposer.setMode(null);
    document.title = "Atlas";
    setModel(defaultModel(), false);
    homeComposer.focus();
  }
  function openTask(id, push) {
    if (push) history.pushState({}, "", toUrl(`/task/${id}`));
    closeStream();
    Object.assign(S, {
      taskId: id, events: [], plan: [], status: "idle", title: "", nodes: new Map(), groups: null, sections: [],
      dirty: new Set(), cpIndex: 0, live: true, cpUserClosed: false, snapshotLoaded: false, planOpen: false, liveFrame: null,
    });
    showView("task");
    $("timeline").innerHTML = '<div id="tl-footer"></div>';
    setComputer(false);
    renderTasks();
    connect(id);
  }
  window.addEventListener("popstate", route);
  function route() {
    const p = curPath();
    let m;
    if ((m = p.match(/^\/task\/([\w-]+)/))) return openTask(m[1], false);
    if (p === "/library") { leaveTask(); showView("library"); document.title = "Library - Atlas"; return renderLibrary(true); }
    if (p === "/automations") { leaveTask(); showView("automations"); document.title = "Automations - Atlas"; return renderAutomations(); }
    if (p === "/plugins") { leaveTask(); showView("plugins"); document.title = "Plugins - Atlas"; return renderPlugins(); }
    if (p === "/usage") { leaveTask(); showView("usage"); document.title = "Usage - Atlas"; return renderUsage(); }
    if ((m = p.match(/^\/project\/([\w-]+)/))) { leaveTask(); showView("project"); return renderProject(m[1]); }
    goHome(false);
  }

  // ---------- Streaming ----------
  function closeStream() { if (S.es) { S.es.close(); S.es = null; } }
  function connect(id) {
    const es = new EventSource(`/api/tasks/${id}/stream`);
    S.es = es;
    es.onmessage = (m) => { if (S.es === es) handleOp(JSON.parse(m.data)); };
    es.onerror = () => {
      if (S.es !== es) return;
      if (es.readyState === EventSource.CLOSED) setTimeout(() => S.taskId === id && S.es === es && openTask(id, false), 2000);
    };
  }

  function handleOp(op) {
    if (op.op === "snapshot" && S.config.demo) return replaySnapshot(op);
    if (op.op === "snapshot") {
      $("timeline").innerHTML = '<div id="tl-footer"></div>';
      S.nodes = new Map(); S.groups = null; S.sections = []; S.events = [];
      S.plan = op.plan || []; S.status = op.status; S.title = op.title;
      if (op.agent) S.config.agent = op.agent;
      if (op.model) setModel(op.model, false);
      op.events.forEach((ev) => addEvent(ev, false));
      S.snapshotLoaded = true;
      const tools = toolEvents();
      if (tools.length && window.innerWidth > 1000 && S.status === "running") setComputer(true);
      S.cpIndex = Math.max(0, tools.length - 1);
      afterStatus();
      scrollToBottom(true);
      return;
    }
    if (op.op === "frame") {
      S.liveFrame = "data:image/jpeg;base64," + op.data;
      const img = $("live-frame");
      if (img) img.src = S.liveFrame;
      else if (S.cpOpen && S.events.some((e) => e.type === "ask" && e.kind === "handoff" && e.status === "pending")) renderComputer();
      return;
    }
    if (op.op === "add") { addEvent(op.event, true); return; }
    const ev = S.events[op.id];
    if (op.op === "append" && ev) { ev[op.field] = (ev[op.field] || "") + op.value; markDirty(ev); }
    else if (op.op === "update" && ev) { Object.assign(ev, op.fields); markDirty(ev); }
    else if (op.op === "status") {
      const wasRunning = S.status === "running";
      S.status = op.status; S.plan = op.plan || []; S.title = op.title;
      afterStatus();
      if (wasRunning !== (S.status === "running")) { loadTasks(); loadCredits(); }
    }
  }

  // Demo: play a recorded task back step by step, as if it were running live.
  let replayTimer = null;
  function replaySnapshot(op) {
    clearTimeout(replayTimer);
    $("timeline").innerHTML = '<div id="tl-footer"></div>';
    S.nodes = new Map(); S.groups = null; S.sections = []; S.events = [];
    S.title = op.title; S.plan = []; S.status = "running"; S.snapshotLoaded = true; S.live = true;
    if (op.model) setModel(op.model, false);
    const taskId = S.taskId;
    const events = op.events.slice();
    let i = 0;
    const bar = document.createElement("div");
    bar.className = "replay-bar";
    bar.innerHTML = `<span class="spinner"></span><span>Replaying a recorded task</span><button data-skip>Skip to end</button>`;
    $("timeline-scroll").before(bar);
    const finish = () => {
      clearTimeout(replayTimer);
      while (i < events.length) addEvent(events[i++], false);
      S.status = op.status; S.plan = op.plan || [];
      bar.remove();
      afterStatus();
      scrollToBottom(true);
    };
    bar.querySelector("[data-skip]").onclick = finish;
    const step = () => {
      if (S.taskId !== taskId) { bar.remove(); return; }
      if (i >= events.length) return finish();
      const ev = events[i++];
      // Show the plan as the recording progresses: steps before this event's step count as done.
      if (op.plan && ev.step != null) S.plan = op.plan.map((p, k) => ({ ...p, status: k < ev.step ? "done" : k === ev.step ? "in_progress" : "pending" }));
      addEvent(ev, true);
      afterStatus();
      const delay = { user: 900, text: 700, thinking: 250, tool: 650, ask: 900, files: 500 }[ev.type] || 400;
      replayTimer = setTimeout(step, delay);
    };
    if (window.innerWidth > 1000 && events.some((e) => e.type === "tool")) setComputer(true);
    afterStatus();
    replayTimer = setTimeout(step, 300);
  }

  function afterStatus() {
    $("task-title").textContent = S.title;
    document.title = `${S.title} - ${S.config.agent}`;
    taskComposer.setRunning(S.status === "running");
    renderPlan();
    refreshSections();
    if (S.events.length) markDirty(S.events[S.events.length - 1]);
    renderFooter();
    renderComputer();
  }

  // ---------- Timeline ----------
  const toolEvents = () => S.events.filter((e) => e.type === "tool");

  function containerFor(ev) {
    const tl = $("timeline");
    const footer = $("tl-footer");
    if (ev.type === "user") { S.groups = null; return { parent: tl, before: footer }; }
    if (!S.groups) {
      const g = document.createElement("div");
      g.className = "agent";
      g.innerHTML = `<div class="agent-head"><span class="logo-mark">${LOGO}</span><span class="wordmark">${esc(S.config.agent.toLowerCase())}</span></div>`;
      tl.insertBefore(g, footer);
      S.groups = { el: g, step: null, body: null };
    }
    const g = S.groups;
    if (ev.step === null || ev.step === undefined) { g.step = null; g.body = null; return { parent: g.el }; }
    if (g.step !== ev.step || !g.body) {
      const sec = document.createElement("div");
      sec.className = "step";
      sec.dataset.step = ev.step;
      const key = `${S.sections.length}`;
      sec.dataset.key = key;
      if (S.collapsedSteps.has(`${S.taskId}:${key}`)) sec.classList.add("collapsed");
      sec.innerHTML = `<div class="step-head"></div><div class="step-body"></div>`;
      sec.querySelector(".step-head").onclick = () => {
        sec.classList.toggle("collapsed");
        const k = `${S.taskId}:${key}`;
        sec.classList.contains("collapsed") ? S.collapsedSteps.add(k) : S.collapsedSteps.delete(k);
      };
      g.el.appendChild(sec);
      S.sections.push(sec);
      g.step = ev.step;
      g.body = sec.querySelector(".step-body");
      renderSectionHead(sec);
    }
    return { parent: g.body };
  }

  function stepIcon(status) {
    if (status === "done") return `<span class="st-icon done">${icon("checkFill")}</span>`;
    if (status === "in_progress") return S.status === "running" ? `<span class="st-icon running"><span class="spinner"></span></span>` : `<span class="st-icon pending">${icon("circle")}</span>`;
    return `<span class="st-icon pending">${icon("circle")}</span>`;
  }
  function renderSectionHead(sec) {
    const step = S.plan[+sec.dataset.step];
    const isLast = sec === S.sections[S.sections.length - 1];
    let status = step ? step.status : "done";
    if (!isLast && status === "in_progress") status = "done";
    sec.querySelector(".step-head").innerHTML = `${stepIcon(status)}<span class="st-title">${esc(step ? step.title : "Step")}</span><span class="chev">${icon("down")}</span>`;
  }
  function refreshSections() { S.sections.forEach(renderSectionHead); }

  function addEvent(ev, live) {
    const prev = S.events[S.events.length - 1];
    S.events[ev.id] = ev;
    const { parent, before } = containerFor(ev);
    const node = document.createElement("div");
    node.dataset.id = ev.id;
    S.nodes.set(ev.id, node);
    renderNode(ev, node);
    before ? parent.insertBefore(node, before) : parent.appendChild(node);
    if (prev) markDirty(prev);
    if (ev.type === "ask" && live && ev.kind === "handoff") { S.live = true; S.cpUserClosed = false; setComputer(true); }
    if (ev.type === "tool" && live) {
      if (S.live) S.cpIndex = toolEvents().length - 1;
      if (!S.cpOpen && !S.cpUserClosed && window.innerWidth > 1000) setComputer(true);
      renderComputer();
    }
    if (live) { renderFooter(); scrollToBottom(ev.type === "user"); }
  }

  function markDirty(ev) {
    S.dirty.add(ev.id);
    if (S.dirty.size === 1) requestAnimationFrame(flush);
  }
  function flush() {
    const ids = [...S.dirty];
    S.dirty.clear();
    let computer = false;
    for (const id of ids) {
      const ev = S.events[id], node = S.nodes.get(id);
      if (ev && node) renderNode(ev, node);
      if (ev && (ev.type === "tool" || ev.type === "ask")) computer = true;
    }
    if (computer) renderComputer();
    renderFooter();
    scrollToBottom();
  }

  function renderNode(ev, node) {
    const isLast = ev.id === S.events.length - 1;
    const running = S.status === "running";
    switch (ev.type) {
      case "user": {
        node.className = "msg-user";
        const att = (ev.attachments || []).map((p) => `<button class="file-card" data-file="${esc(p)}">${fileIcon(p)}<div class="fc-main"><div class="fc-name">${esc(p.split("/").pop())}</div></div></button>`).join("");
        node.innerHTML = `${att ? `<div class="att">${att}</div>` : ""}<div class="bubble">${esc(ev.text)}</div><div class="msg-time">${ev.mode && MODE_LABEL[ev.mode] ? `<span class="mode-chip sm">${esc(MODE_LABEL[ev.mode])}</span>` : ""}${relTime(ev.ts)}${ev.model ? ` · ${esc(modelInfo(ev.model).tier || modelInfo(ev.model).label)}` : ""}</div>`;
        break;
      }
      case "text":
        node.className = "md";
        node.hidden = !(ev.text || "").trim();
        node.innerHTML = md(ev.text || "");
        break;
      case "thinking": {
        const liveNow = isLast && running;
        node.className = `thinking ${S.openThinking.has(ev.id) ? "open" : ""} ${liveNow ? "live" : ""}`;
        node.hidden = !liveNow && !(ev.text || "").trim();
        node.innerHTML = `<div class="thinking-head">${icon("bulb")}<span class="lbl">${liveNow ? "Thinking" : "Thought process"}</span><span class="chev">${icon("down")}</span></div><div class="thinking-body">${esc(ev.text || "")}</div>`;
        node.firstChild.onclick = () => { S.openThinking.has(ev.id) ? S.openThinking.delete(ev.id) : S.openThinking.add(ev.id); renderNode(ev, node); };
        break;
      }
      case "tool": {
        const m = toolMeta(ev);
        const tools = toolEvents();
        const selected = S.cpOpen && tools[S.cpIndex] === ev;
        const status = ev.status === "running" && !running ? "done" : ev.status;
        node.className = `tool-pill ${status} ${selected ? "selected" : ""}`;
        node.innerHTML = `<span class="tp-icon">${icon(m.icon)}</span><span class="tp-label">${esc(m.label)}</span>${m.arg ? `<span class="tp-arg">${esc(String(m.arg).split("\n")[0].slice(0, 200))}</span>` : ""}`;
        node.onclick = () => {
          S.cpIndex = toolEvents().indexOf(ev);
          S.live = false;
          setComputer(true);
        };
        break;
      }
      case "ask": {
        const handoff = ev.kind === "handoff";
        const creds = ev.kind === "credentials";
        const pending = ev.status === "pending";
        if (pending && node.dataset.state === "pending") break; // keep what the user is typing
        node.dataset.state = ev.status;
        node.className = `ask-card ${pending ? "pending" : ""}`;
        let foot = "";
        if (pending && creds) {
          foot = `<div class="cred-form">
              <input data-cred="label" placeholder="Name, e.g. Gmail" value="${esc(ev.label || "")}" autocomplete="off">
              <input data-cred="username" placeholder="Username or email" autocomplete="off" spellcheck="false">
              <input data-cred="password" type="password" placeholder="Password" autocomplete="new-password">
              <div class="ask-actions"><button class="btn primary" data-cred-save="${ev.id}">Save and continue</button><button class="btn" data-ask="${ev.id}" data-answer="declined">Cancel</button></div>
              <div class="ask-hint">${icon("lock")} ${S.config.cloud ? "Stored encrypted in your account." : "Stored encrypted on this computer (key in your system keychain)."} ${esc(S.config.agent)} types it into the sign-in page for you, but never sees it, and the AI model never receives it. Manage saved logins with the lock button in the sidebar.</div>
            </div>`;
        } else if (pending) {
          foot = handoff
            ? `<div class="ask-actions"><button class="btn primary" data-ask="${ev.id}" data-answer="done">I'm done, continue</button></div>
               <div class="ask-hint">The live browser on the right is yours. Click and type in it directly. ${esc(S.config.agent)} never sees what you type.</div>`
            : `<input class="ask-note" data-note="${ev.id}" placeholder="Add a note (optional)">
               <div class="ask-actions"><button class="btn primary" data-ask="${ev.id}" data-answer="approved">Approve</button><button class="btn" data-ask="${ev.id}" data-answer="declined">Decline</button></div>`;
        } else {
          const label = { approved: "You approved this", declined: "You declined this", provided: `Saved login “${ev.label || ""}”`, done: "You finished and handed back", expired: "No longer waiting (server restarted)", cancelled: "Cancelled" }[ev.status === "answered" ? ev.answer : ev.status] || "";
          foot = `<div class="ask-result ${ev.answer === "declined" || ev.status !== "answered" ? "no" : "yes"}">${icon(ev.answer === "declined" || ev.status !== "answered" ? "x" : "check")}${esc(label)}${ev.note ? ` · “${esc(ev.note)}”` : ""}</div>`;
        }
        node.innerHTML = `<div class="ask-head">${icon(handoff ? "hand" : creds ? "lock" : "shield")}<span>${handoff ? "Your turn" : creds ? "Sign-in needed" : "Approval needed"}</span></div><div class="md">${md(ev.message || "")}</div>${foot}`;
        break;
      }
      case "files": {
        node.className = "files-block";
        const files = ev.files || [];
        const shown = files.slice(0, 6);
        node.innerHTML = `<div class="files-grid">${shown.map((f) => `<button class="file-card" data-file="${esc(f.path)}">${fileIcon(f.path)}<div class="fc-main"><div class="fc-name">${esc(f.path.split("/").pop())}</div><div class="fc-meta">${esc(f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/")) + " · " : "")}${fmtSize(f.size)}</div></div></button>`).join("")}</div>
          <button class="files-all" data-allfiles style="margin-top:8px">${icon("folder")}View all files in this task</button>`;
        break;
      }
      case "notice":
        node.className = "notice";
        node.textContent = ev.text;
        break;
      case "error":
        node.className = "error-box";
        node.textContent = ev.text;
        break;
      default:
        node.hidden = true;
    }
  }

  function renderFooter() {
    const f = $("tl-footer");
    if (!f) return;
    const last = S.events[S.events.length - 1];
    if (S.status === "running") {
      const streamingText = last && (last.type === "text" && last.text) || (last && last.type === "thinking");
      const runningTool = last && last.type === "tool" && last.status === "running";
      f.className = "working";
      f.innerHTML = streamingText || runningTool ? "" : `<span class="spinner"></span>Working`;
    } else if (last && last.type !== "user" && last.type !== "error" && S.snapshotLoaded) {
      f.className = "completed";
      f.innerHTML = `${icon("check")}Task completed`;
    } else {
      f.className = ""; f.innerHTML = "";
    }
  }

  // Follow new output unless the user has scrolled up to read.
  let stick = true, programmatic = false;
  $("timeline-scroll").addEventListener("scroll", () => {
    const sc = $("timeline-scroll");
    if (!programmatic) stick = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 80;
    programmatic = false;
  });
  function scrollToBottom(force) {
    const sc = $("timeline-scroll");
    if (force) stick = true;
    if (stick && sc.scrollHeight - sc.scrollTop - sc.clientHeight > 1) {
      programmatic = true;
      sc.scrollTop = sc.scrollHeight;
    }
  }
  new ResizeObserver(() => scrollToBottom()).observe($("timeline"));

  $("timeline").addEventListener("click", (e) => {
    const ans = e.target.closest("[data-ask]");
    if (ans) return answerAsk(+ans.dataset.ask, ans.dataset.answer);
    const save = e.target.closest("[data-cred-save]");
    if (save) return saveCredentials(+save.dataset.credSave, save.closest(".cred-form"));
    const f = e.target.closest("[data-file]");
    if (f) return openFile(f.dataset.file);
    if (e.target.closest("[data-allfiles]")) openFiles();
  });

  async function answerAsk(id, answer) {
    const noteEl = document.querySelector(`[data-note="${id}"]`);
    const r = await fetch(`/api/tasks/${S.taskId}/respond`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, answer, note: noteEl ? noteEl.value : "" }),
    });
    if (!r.ok) alert("Could not send your answer: " + (await r.text()));
  }

  async function saveCredentials(id, form) {
    const val = (k) => form.querySelector(`[data-cred="${k}"]`).value;
    const credentials = { label: val("label").trim(), username: val("username").trim(), password: val("password") };
    if (!credentials.label || !credentials.username || !credentials.password) return alert("Please fill in the name, username and password.");
    const r = await fetch(`/api/tasks/${S.taskId}/respond`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, answer: "provided", credentials }),
    });
    form.querySelector('[data-cred="password"]').value = "";
    if (!r.ok) alert("Could not save: " + (await r.text()));
  }

  async function openVault() {
    const items = await (await fetch("/api/vault")).json();
    showModal("Saved logins", "", items.length ? items.map((v) => `
      <div class="file-row" style="cursor:default"><div class="fc-icon" style="background:#475569">${icon("lock")}</div>
        <div class="fc-main" style="flex:1"><div class="fc-name">${esc(v.label)}</div><div class="fc-meta">${esc(v.username)} · password hidden</div></div>
        <button class="btn sm" data-vault-del="${esc(v.id)}">Delete</button></div>`).join("") +
      `<div class="ask-hint" style="padding:14px 20px">Passwords are encrypted ${S.config.cloud ? "in your account" : "on this computer"} and can't be viewed here, only deleted.</div>` :
      `<div class="cp-empty">No saved logins yet. When a task needs you to sign in, ${esc(S.config.agent)} will ask.</div>`);
  }
  $("vault-btn").onclick = openVault;
  $("modal").addEventListener("click", async (e) => {
    const d = e.target.closest("[data-vault-del]");
    if (!d || !confirm("Delete this saved login?")) return;
    await fetch(`/api/vault/${d.dataset.vaultDel}`, { method: "DELETE" });
    openVault();
  });

  // ---------- Plan ----------
  function renderPlan() {
    const card = $("plan-card");
    if (!S.plan.length) { card.hidden = true; return; }
    card.hidden = false;
    const doneCount = S.plan.filter((s) => s.status === "done").length;
    const curIdx = S.plan.findIndex((s) => s.status === "in_progress");
    const cur = S.plan[curIdx] || (doneCount === S.plan.length ? S.plan[S.plan.length - 1] : S.plan.find((s) => s.status === "pending"));
    const curStatus = doneCount === S.plan.length ? "done" : (curIdx >= 0 ? "in_progress" : "pending");
    card.className = `plan-card ${S.planOpen ? "open" : ""}`;
    card.innerHTML = `
      <div class="plan-summary">${stepIcon(curStatus)}<span class="ps-title">${esc(cur ? cur.title : "")}</span><span class="ps-count">${Math.min(doneCount + (curIdx >= 0 ? 1 : 0), S.plan.length)} / ${S.plan.length}</span><span class="chev">${icon("down")}</span></div>
      <div class="plan-list">${S.plan.map((s) => `<div class="plan-item ${s.status}">${stepIcon(s.status)}<span>${esc(s.title)}</span></div>`).join("")}</div>`;
    card.querySelector(".plan-summary").onclick = () => { S.planOpen = !S.planOpen; renderPlan(); };
  }

  // ---------- Computer ----------
  function setComputer(open) {
    S.cpOpen = open;
    $("computer").hidden = !open;
    $("computer-btn").hidden = open;
    if (open) renderComputer();
    toolEvents().forEach(markDirty);
  }
  $("cp-close").onclick = () => { S.cpUserClosed = true; setComputer(false); };
  $("computer-btn").onclick = () => { S.cpUserClosed = false; setComputer(true); };
  $("cp-prev").onclick = () => { S.live = false; S.cpIndex = Math.max(0, S.cpIndex - 1); renderComputer(); toolEvents().forEach(markDirty); };
  $("cp-next").onclick = () => {
    const n = toolEvents().length;
    S.cpIndex = Math.min(n - 1, S.cpIndex + 1);
    S.live = S.cpIndex === n - 1;
    renderComputer(); toolEvents().forEach(markDirty);
  };
  $("cp-slider").oninput = (e) => {
    const n = toolEvents().length;
    S.cpIndex = +e.target.value;
    S.live = S.cpIndex === n - 1;
    renderComputer(); toolEvents().forEach(markDirty);
  };
  $("cp-live").onclick = () => { S.live = true; S.cpIndex = toolEvents().length - 1; renderComputer(); toolEvents().forEach(markDirty); };

  let lastCpKey = "";
  function renderComputer() {
    if (!S.cpOpen) return;
    const tools = toolEvents();
    const agent = S.config.agent;
    $("cp-title").textContent = `${agent}'s Computer`;
    const handoff = S.events.find((e) => e.type === "ask" && e.kind === "handoff" && e.status === "pending");
    $("computer").classList.toggle("takeover", !!handoff);
    if (handoff) {
      $("cp-status").innerHTML = `<div class="cp-app">${icon("hand")}</div><div class="cp-status-text"><div class="cp-using"><b>You're in control</b></div><div class="cp-action">Click and type in the browser below</div></div>`;
      $("cp-bar").innerHTML = `<span class="url">Take-over mode</span><button class="btn primary sm" data-ask="${handoff.id}" data-answer="done">I'm done</button>`;
      const body = $("cp-body");
      if (!body.querySelector("img.interactive")) {
        body.innerHTML = S.liveFrame
          ? `<img class="shot interactive" id="live-frame" tabindex="0" alt="Live browser" src="${S.liveFrame}">`
          : `<div class="cp-empty"><span class="spinner"></span></div>`;
      }
      return;
    }
    if (S.live) S.cpIndex = Math.max(0, tools.length - 1);
    const slider = $("cp-slider");
    slider.max = Math.max(0, tools.length - 1);
    slider.value = S.cpIndex;
    slider.disabled = tools.length < 2;
    const liveBtn = $("cp-live");
    liveBtn.classList.toggle("on", S.live && S.status === "running");
    liveBtn.querySelector(".txt").textContent = S.live ? (S.status === "running" ? "live" : "latest") : "Jump to live";

    const ev = tools[S.cpIndex];
    if (!ev) {
      $("cp-status").innerHTML = `<div class="cp-app">${icon("monitor")}</div><div class="cp-status-text"><div class="cp-using">${esc(agent)} is idle</div></div>`;
      $("cp-bar").innerHTML = "";
      $("cp-body").innerHTML = `<div class="cp-empty">${esc(agent)}'s actions will appear here.</div>`;
      return;
    }
    const m = toolMeta(ev);
    const working = ev.status === "running" && S.status === "running";
    $("cp-status").innerHTML = `<div class="cp-app">${icon(m.icon)}</div><div class="cp-status-text"><div class="cp-using">${esc(agent)} ${working ? "is using" : "used"} <b>${m.app}</b></div><div class="cp-action">${esc(m.label)}${m.arg ? ` <code>${esc(String(m.arg).split("\n")[0].slice(0, 120))}</code>` : ""}</div></div>`;

    const body = $("cp-body");
    const key = `${S.taskId}:${ev.id}`;
    const wasAtBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 40;
    let bar = "", html = "";
    const a = (k) => inputOf(ev, k);
    switch (ev.name) {
      case "shell":
        bar = `<span class="fname">${icon("terminal")}</span><span class="fname">shell</span>`;
        html = `<div class="term"><span class="prompt">atlas@workspace:~$</span> <span class="cmd">${esc(a("command") || "")}</span>\n<span class="out">${esc(ev.output || "")}</span></div>`;
        break;
      case "write_file": case "read_file": case "edit_file": {
        const path = a("path") || "";
        bar = `<span class="fname">${esc(path)}</span>`;
        let text;
        if (ev.name === "write_file") text = a("content") || "";
        else if (ev.name === "edit_file") text = ev.content;
        else text = ev.output || "";
        if (ev.name === "edit_file" && text === undefined) {
          const oldS = a("old_str") || "", newS = a("new_str") || "";
          html = `<div class="term">${oldS.split("\n").map((l) => `<span style="color:var(--red)">- ${esc(l)}</span>`).join("\n")}\n${newS.split("\n").map((l) => `<span style="color:var(--green)">+ ${esc(l)}</span>`).join("\n")}</div>`;
        } else if (ev.name === "read_file") {
          html = `<div class="term">${esc(text)}</div>`;
        } else {
          const lines = (text || "").split("\n");
          html = `<div class="editor"><div class="ln">${lines.map((_, i) => i + 1).join("\n")}</div><div class="code">${esc(text || "")}</div></div>`;
        }
        if (ev.status === "error") html += `<div class="term" style="color:var(--red)">${esc(ev.output || "")}</div>`;
        break;
      }
      case "browser": {
        const meta = ev.meta || {};
        const url = meta.url || ((ev.output || "").match(/^URL: (.*)$/m) || [])[1] || a("url") || "";
        const tabs = meta.tabs || [];
        const isLatest = tools[tools.length - 1] === ev;
        const liveView = S.live && isLatest && S.status === "running" && S.liveFrame;
        bar = (tabs.length > 1 ? `<div class="tabstrip">${tabs.map((t) => `<span class="tab ${t.active ? "active" : ""}">${esc(t.title || t.url || "New tab")}</span>`).join("")}</div>` : "") +
          `<span class="url">${esc(url)}</span>${liveView ? '<span class="live-badge"><span class="dot"></span>LIVE</span>' : ""}`;
        if (liveView) html = `<img class="shot" id="live-frame" src="${S.liveFrame}" alt="Live browser view">`;
        else if (ev.image) html = `<img class="shot" src="${ev.image}" alt="Browser screenshot">`;
        else if (ev.status === "error") html = `<div class="term" style="color:var(--red)">${esc(ev.output || "")}</div>`;
        else if (ev.status === "done") html = `<div class="term"><span class="out">${esc(ev.output || "")}</span></div>`;
        else html = `<div class="cp-empty"><span class="spinner"></span></div>`;
        break;
      }
      case "web_search": {
        bar = `<span class="url">${icon("search")} ${esc(a("query") || "")}</span>`;
        const results = ev.results || [];
        html = results.length ? `<div class="search-results">${results.map((r) => `<div class="sr"><div class="sr-url">${esc(r.url)}</div><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title || r.url)}</a>${r.age ? `<div class="fc-meta">${esc(r.age)}</div>` : ""}</div>`).join("")}</div>` :
          ev.status === "error" ? `<div class="term" style="color:var(--red)">${esc(ev.output || "")}</div>` : `<div class="cp-empty"><span class="spinner"></span></div>`;
        break;
      }
      case "web_fetch": {
        bar = `<span class="url">${esc(ev.url || a("url") || "")}</span>`;
        html = ev.status === "running" ? `<div class="cp-empty"><span class="spinner"></span></div>` :
          `<div class="fetch-text">${ev.page_title ? `<div style="font-weight:600;color:var(--text);font-size:15px;margin-bottom:8px">${esc(ev.page_title)}</div>` : ""}${esc(ev.output || "")}</div>`;
        break;
      }
      default: {
        const code = a("command") || a("code") || "";
        bar = `<span class="fname">sandbox</span>`;
        html = `<div class="term">${code ? `<span class="cmd">${esc(code)}</span>\n` : ""}<span class="out">${esc(ev.output || "")}</span></div>`;
      }
    }
    $("cp-bar").innerHTML = bar;
    body.innerHTML = html;
    if (key !== lastCpKey) body.scrollTop = working ? body.scrollHeight : 0;
    else if (wasAtBottom && working) body.scrollTop = body.scrollHeight;
    lastCpKey = key;
  }

  // ---------- Take-over input ----------
  const sendInput = (payload) => fetch(`/api/tasks/${S.taskId}/input`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  }).catch(() => {});
  const liveImg = (e) => e.target.closest && e.target.closest("img.interactive");
  $("cp-body").addEventListener("click", (e) => {
    const img = liveImg(e);
    if (!img) return;
    const r = img.getBoundingClientRect();
    img.focus();
    sendInput({ type: "click", x: Math.round(((e.clientX - r.left) / r.width) * 1280), y: Math.round(((e.clientY - r.top) / r.height) * 800) });
  });
  $("cp-body").addEventListener("keydown", (e) => {
    if (!liveImg(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!e.key || ["Shift", "Control", "Alt", "Meta", "CapsLock", "Dead", "Unidentified"].includes(e.key)) return;
    e.preventDefault();
    sendInput({ type: "key", key: e.key === " " ? "Space" : e.key });
  });
  $("cp-body").addEventListener("paste", (e) => {
    if (!liveImg(e)) return;
    e.preventDefault();
    sendInput({ type: "text", text: e.clipboardData.getData("text") });
  });
  $("cp-body").addEventListener("wheel", (e) => {
    if (!liveImg(e)) return;
    e.preventDefault();
    sendInput({ type: "scroll", dy: Math.round(e.deltaY) });
  }, { passive: false });
  $("cp-bar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ask]");
    if (b) answerAsk(+b.dataset.ask, b.dataset.answer);
  });

  // ---------- Files ----------
  function showModal(title, actions, bodyHtml) {
    $("modal-title").textContent = title;
    $("modal-actions").innerHTML = actions + `<button class="icon-btn" data-close title="Close">${icon("x")}</button>`;
    $("modal-body").innerHTML = bodyHtml;
    $("modal").hidden = false;
  }
  function closeModal() { $("modal").hidden = true; $("modal-body").innerHTML = ""; }
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal") || e.target.closest("[data-close]")) closeModal();
    const f = e.target.closest("[data-file]");
    if (f) openFile(f.dataset.file);
    if (e.target.closest("[data-allfiles]")) openFiles();
  });

  async function openFiles() {
    const files = await (await fetch(`/api/tasks/${S.taskId}/files`)).json();
    showModal("All files in this task", "", files.length ? files.map((f) => `
      <div class="file-row" data-file="${esc(f.path)}">${fileIcon(f.path)}<div class="fc-main" style="flex:1"><div class="fc-name">${esc(f.path)}</div><div class="fc-meta">${fmtSize(f.size)} · ${relTime(f.mtime)}</div></div></div>`).join("") :
      `<div class="cp-empty">No files yet.</div>`);
  }
  $("files-btn").onclick = openFiles;
  $("files-btn").querySelector(".ic").innerHTML = icon("folder");

  async function openFile(path) {
    const url = fileUrl(path);
    const ext = (path.split(".").pop() || "").toLowerCase();
    const actions = `<button class="all-files ghost-btn" data-allfiles>${icon("folder")}All files</button><a class="icon-btn" href="${url}" target="_blank" title="Open in new tab">${icon("external")}</a><a class="icon-btn" href="${fileUrl(path, true)}" title="Download">${icon("download")}</a>`;
    const name = path.split("/").pop();
    if (ext === "ipynb") return showNotebook(name, url, actions);
    if (["webm", "mp4", "mov", "m4v"].includes(ext)) return showModal(name, actions, `<div class="media-wrap"><video src="${url}" controls autoplay loop playsinline></video></div>`);
    if (["m4a", "mp3", "wav", "aiff", "aif", "ogg", "flac"].includes(ext)) return showModal(name, actions, `<div class="media-wrap audio-wrap">${icon("audio")}<audio src="${url}" controls></audio></div>`);
    if (["html", "htm", "pdf"].includes(ext)) return showModal(name, actions, `<iframe src="${url}"></iframe>`);
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return showModal(name, actions, `<img class="full" src="${url}" alt="">`);
    if (["xlsx", "xls", "docx", "pptx", "zip"].includes(ext)) return showModal(name, actions, `<div class="cp-empty">Preview not available. Use the download button.</div>`);
    const text = await (await fetch(url)).text();
    if (ext === "md" || ext === "markdown") return showModal(name, actions, `<div class="md">${md(text)}</div>`);
    if (ext === "csv" && text.length < 400000) {
      const rows = text.trim().split("\n").slice(0, 500).map((r) => r.split(","));
      return showModal(name, actions, `<div class="md" style="max-width:none"><div class="table-wrap"><table><thead><tr>${rows[0].map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></div>`);
    }
    showModal(name, actions, `<pre class="raw">${esc(text)}</pre>`);
  }

  // ---------- Library ----------
  const LIB_TABS = [["all", "All"], ["text", "Text & PDF"], ["slides", "Slides"], ["spreadsheets", "Spreadsheets"], ["images", "Images"], ["videos", "Videos"], ["audio", "Audio"], ["others", "Others"]];
  const LIB = { items: [], tab: "all", q: "", view: "grid", sort: "newest" };
  const libUrl = (it, download) => `/api/library/${it.id}${download ? "?download=1" : ""}`;
  async function uploadToLibrary(files) {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try { return await api("/api/library", { method: "POST", body: fd }); }
    catch (err) { toast(err.message); return []; }
  }
  async function renderLibrary(reload) {
    if (reload) { try { LIB.items = await api("/api/library"); } catch { LIB.items = []; } }
    let items = LIB.items.filter((i) => (LIB.tab === "all" || i.kind === LIB.tab) && (!LIB.q || i.name.toLowerCase().includes(LIB.q)));
    if (LIB.sort === "name") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (LIB.sort === "oldest") items = [...items].sort((a, b) => a.created - b.created);
    const root = $("library");
    const thumb = (it) => it.kind === "images" ? `<img src="${libUrl(it)}" alt="" loading="lazy">` : fileIcon(it.name);
    const actions = (it) => `<div class="lib-actions">
        <button data-lib-use="${it.id}" title="Use in a new task">${icon("plus")}</button>
        <a href="${libUrl(it, true)}" title="Download">${icon("download")}</a>
        <button data-lib-del="${it.id}" title="Delete">${icon("trash")}</button></div>`;
    const tabName = (LIB_TABS.find(([k]) => k === LIB.tab) || [0, "Documents"])[1];
    const body = !items.length ? `
      <div class="empty"><span class="big-ic">${icon("archive")}</span><h3>Nothing in ${LIB.tab === "all" ? "Documents" : esc(tabName)}</h3>
        <p>${LIB.q ? "No files match your search." : "Documents you upload will appear here, ready to use in any task."}</p>
        <div style="display:flex;gap:10px"><button class="btn dark" data-lib-upload>${icon("upload")}Upload files</button><button class="btn light" data-nav-home>${icon("pen")}New task</button></div></div>` :
      LIB.view === "grid"
        ? `<div class="lib-grid">${items.map((it) => `<div class="lib-card" data-lib-open="${it.id}"><div class="lib-thumb">${thumb(it)}</div>
            <div class="lib-meta"><div class="fc-name">${esc(it.name)}</div><div class="fc-meta">${fmtSize(it.size)} · ${relTime(it.created)}</div></div>${actions(it)}</div>`).join("")}</div>`
        : `<div class="lib-list">${items.map((it) => `<div class="lib-row" data-lib-open="${it.id}">${fileIcon(it.name)}
            <div class="fc-main" style="flex:1"><div class="fc-name">${esc(it.name)}</div><div class="fc-meta">${fmtSize(it.size)} · ${relTime(it.created)}</div></div>${actions(it)}</div>`).join("")}</div>`;
    root.innerHTML = `<div class="page-inner">
      <div class="page-head"><h1>Library</h1>
        <div class="page-tools">
          <label class="search-box">${icon("search")}<input id="lib-q" placeholder="Search files" value="${esc(LIB.q)}"></label>
          <button class="tool-btn" data-lib-sort title="Sort: ${LIB.sort}">${icon("filter")}</button>
          <div class="seg"><button class="${LIB.view === "grid" ? "on" : ""}" data-lib-view="grid" title="Grid">${icon("gridView")}</button><button class="${LIB.view === "list" ? "on" : ""}" data-lib-view="list" title="List">${icon("list")}</button></div>
          <button class="tool-btn" data-lib-upload title="Upload files">${icon("upload")}</button>
        </div></div>
      <div class="tabs">${LIB_TABS.map(([k, label]) => `<button class="tab-btn ${LIB.tab === k ? "on" : ""}" data-lib-tab="${k}">${label}</button>`).join("")}</div>
      ${body}
      <input type="file" id="lib-input" multiple hidden></div>`;
    const q = $("lib-q");
    q.oninput = () => { LIB.q = q.value.toLowerCase(); const pos = q.selectionStart; renderLibrary(false); const nq = $("lib-q"); nq.focus(); nq.setSelectionRange(pos, pos); };
    $("lib-input").onchange = async () => {
      const added = await uploadToLibrary([...$("lib-input").files]);
      if (added.length) toast(`Uploaded ${added.length} file${added.length > 1 ? "s" : ""}`);
      renderLibrary(true);
    };
  }
  $("library").addEventListener("click", async (e) => {
    const t = (sel) => e.target.closest(sel);
    if (t("[data-lib-tab]")) { LIB.tab = t("[data-lib-tab]").dataset.libTab; return renderLibrary(false); }
    if (t("[data-lib-view]")) { LIB.view = t("[data-lib-view]").dataset.libView; return renderLibrary(false); }
    if (t("[data-lib-sort]")) { LIB.sort = { newest: "oldest", oldest: "name", name: "newest" }[LIB.sort]; toast(`Sorted by ${LIB.sort}`); return renderLibrary(false); }
    if (t("[data-lib-upload]")) return $("lib-input").click();
    if (t("[data-nav-home]")) return navigate("/");
    if (t("a[href]")) return;
    const del = t("[data-lib-del]");
    if (del) {
      if (!confirm("Delete this file from your Library?")) return;
      await fetch(`/api/library/${del.dataset.libDel}`, { method: "DELETE" });
      return renderLibrary(true);
    }
    const use = t("[data-lib-use]");
    if (use) {
      const it = LIB.items.find((i) => i.id === use.dataset.libUse);
      navigate("/");
      homeComposer.addLibItems([it]);
      return;
    }
    const open = t("[data-lib-open]");
    if (open) openLibFile(LIB.items.find((i) => i.id === open.dataset.libOpen));
  });
  $("library").addEventListener("dragover", (e) => { e.preventDefault(); $("library").classList.add("drop-hint"); });
  $("library").addEventListener("dragleave", () => $("library").classList.remove("drop-hint"));
  $("library").addEventListener("drop", async (e) => {
    e.preventDefault();
    $("library").classList.remove("drop-hint");
    if (e.dataTransfer.files.length) { await uploadToLibrary([...e.dataTransfer.files]); renderLibrary(true); }
  });
  async function openLibFile(it) {
    const url = libUrl(it), ext = (it.name.split(".").pop() || "").toLowerCase();
    const actions = `<a class="icon-btn" href="${url}" target="_blank" title="Open in new tab">${icon("external")}</a><a class="icon-btn" href="${libUrl(it, true)}" title="Download">${icon("download")}</a>`;
    if (ext === "ipynb") return showNotebook(it.name, url, actions);
    if (["html", "htm", "pdf"].includes(ext)) return showModal(it.name, actions, `<iframe src="${url}"></iframe>`);
    if (it.kind === "images") return showModal(it.name, actions, `<img class="full" src="${url}" alt="">`);
    if (it.kind === "videos") return showModal(it.name, actions, `<video src="${url}" controls style="width:100%;max-height:100%"></video>`);
    if (it.kind === "audio") return showModal(it.name, actions, `<div style="padding:40px"><audio src="${url}" controls style="width:100%"></audio></div>`);
    if (["txt", "md", "csv", "json", "xml", "tsv"].includes(ext)) {
      const text = await (await fetch(url)).text();
      return showModal(it.name, actions, ext === "md" ? `<div class="md">${md(text)}</div>` : `<pre class="raw">${esc(text.slice(0, 400000))}</pre>`);
    }
    showModal(it.name, actions, `<div class="cp-empty">Preview not available. Use the download button.</div>`);
  }
  async function pickFromLibrary(onPick) {
    let items = [];
    try { items = await api("/api/library"); } catch {}
    showModal("Add from Library", "", items.length ? `
      <div class="lib-list" style="margin:14px 20px;border-radius:12px">${items.map((it) => `
        <label class="lib-row" style="cursor:pointer"><input type="checkbox" value="${it.id}">${fileIcon(it.name)}
          <div class="fc-main" style="flex:1"><div class="fc-name">${esc(it.name)}</div><div class="fc-meta">${fmtSize(it.size)}</div></div></label>`).join("")}</div>
      <div class="form" style="padding-top:0"><div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="pick-add">Add selected</button></div></div>` :
      `<div class="empty"><span class="big-ic">${icon("archive")}</span><h3>Your Library is empty</h3><p>Upload files from the Library page or the home screen.</p></div>`);
    const add = $("pick-add");
    if (add) add.onclick = () => {
      const ids = [...document.querySelectorAll("#modal-body input:checked")].map((c) => c.value);
      onPick(items.filter((i) => ids.includes(i.id)));
      closeModal();
    };
  }

  // ---------- Automations ----------
  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  function fmtWhen(ts) {
    if (!ts) return "";
    const d = new Date(ts * 1000);
    return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }
  function describeAutomation(a) {
    const s = a.schedule || {};
    if (a.kind === "trigger") return "Runs when its webhook is called";
    if (a.kind === "advanced") return `Checks every ${s.every_hours || 1} h: ${a.condition}`;
    return {
      once: `Once on ${s.at ? new Date(s.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "?"}`,
      hourly: `Every ${s.every_hours || 1} hour${(s.every_hours || 1) > 1 ? "s" : ""}`,
      daily: `Every day at ${s.time || "09:00"}`,
      weekdays: `Weekdays at ${s.time || "09:00"}`,
      weekly: `Every ${WEEKDAYS[+s.weekday || 0]} at ${s.time || "09:00"}`,
    }[s.frequency || "daily"];
  }
  const KIND_ICON = { schedule: "calendar", trigger: "zap", advanced: "sparkle" };
  async function renderAutomations() {
    let list = [];
    try { list = await api("/api/automations"); } catch {}
    S.automations = list;
    const now = new Date();
    const days = [...Array(7)].map((_, i) => { const d = new Date(now); d.setDate(now.getDate() - 3 + i); return d; });
    const cards = `
      <div class="auto-cards">
        <div class="acard" data-new-auto="schedule"><div class="acard-art">
            <div class="mini"><div style="font-weight:600">${now.toLocaleString([], { month: "long" })} ${icon("down", "xs")}</div>
              <div class="mini-cal">${days.map((d) => `<div>${d.toLocaleDateString([], { weekday: "short" })}<b class="${d.toDateString() === now.toDateString() ? "sel" : ""}">${d.getDate()}</b></div>`).join("")}</div></div>
            <div class="mini-arrow">⌄⌄</div>
            <div class="mini"><span class="brand-mark sm"></span><div><b>Scheduled time reached</b>—Atlas is comparing this week's results with last week's…</div><span class="mini-file">${icon("file")}Weekly_report.md</span></div>
          </div><div class="acard-body"><h3>Schedule</h3><p>Automate recurring work by choosing when and how often Atlas should run.</p></div></div>
        <div class="acard" data-new-auto="trigger"><div class="acard-art">
            <div class="mini"><div style="display:flex;align-items:center;gap:8px">${icon("zap")}<b>Webhook received</b><span style="color:var(--red)">•</span></div><span class="mini-file">${icon("code")}POST /api/hooks/…</span></div>
            <div class="mini-arrow">⌄⌄</div>
            <div class="mini"><span class="brand-mark sm"></span><div><b>Event received</b>—Atlas is reading the payload, updating the tracker…</div><span class="mini-file">${icon("table")}Saved to tracker.csv</span></div>
          </div><div class="acard-body"><h3>Trigger</h3><p>Choose an event and define what Atlas should do when it happens.</p></div></div>
        <div class="acard" data-new-auto="advanced"><div class="acard-art">
            <div class="mini"><span class="mini-file" style="margin:0 0 8px">${icon("sparkle")}Customized condition</span><div>When competitor pricing changes, compare it with ours and update the battlecard.</div></div>
            <div class="mini-arrow">⌄⌄</div>
            <div class="mini"><span class="brand-mark sm"></span><div class="mini-flow"><span>Monitor pricing</span><span class="y">Detect changes</span><span class="g">Update card</span><span>Compare plans</span></div></div>
          </div><div class="acard-body"><h3>Advanced automation <span class="beta">Beta</span></h3><p>Describe when Atlas should act and what it should do in your own words.</p></div></div>
      </div>`;
    const root = $("automations");
    if (!list.length) {
      root.innerHTML = `<div class="page-inner"><div class="page-head"><h1>Automations</h1></div>
        <div class="auto-hero"><h1>Create your first automation</h1><p>Use schedules for recurring work, triggers for specific events, or describe when Atlas should act in your own words.</p></div>
        ${cards}<div class="auto-cta"><button class="btn dark" data-new-auto="schedule">Get started</button></div></div>`;
    } else {
      root.innerHTML = `<div class="page-inner"><div class="page-head"><h1>Automations</h1><button class="btn dark" data-new-auto="schedule">${icon("plus")}New automation</button></div>
        <div class="auto-list">${list.map((a) => `
          <div class="arow"><span class="kind-ic">${icon(KIND_ICON[a.kind])}</span>
            <div class="grow"><div class="name">${esc(a.name)}</div>
              <div class="meta">${esc(describeAutomation(a))}${a.enabled && a.next_run ? ` · Next: ${fmtWhen(a.next_run)}` : ""}${!a.enabled ? " · Paused" : ""}</div>
              ${a.kind === "trigger" ? `<div class="code-line" style="margin-top:8px">POST ${location.origin}/api/hooks/${esc(a.token)}</div>` : ""}
              ${a.runs && a.runs.length ? `<div class="runs">Recent runs: ${a.runs.slice(0, 5).map((r) => `<a href="/task/${r.task_id}" data-run="${r.task_id}">${fmtWhen(r.at)}</a>`).join(" · ")}</div>` : ""}
            </div>
            <button class="switch ${a.enabled ? "on" : ""}" data-auto-toggle="${a.id}" title="${a.enabled ? "Pause" : "Resume"}"></button>
            <button class="btn light" data-auto-run="${a.id}">Run now</button>
            <button class="icon-btn" data-auto-edit="${a.id}" title="Edit">${icon("pen")}</button>
            <button class="icon-btn" data-auto-del="${a.id}" title="Delete">${icon("trash")}</button>
          </div>`).join("")}</div>
        <div class="sb-label" style="margin:30px 0 12px;padding:0">Start another</div>${cards}</div>`;
    }
    root.querySelectorAll(".brand-mark.sm").forEach((el) => (el.innerHTML = LOGO));
  }
  $("automations").addEventListener("click", async (e) => {
    const t = (sel) => e.target.closest(sel);
    const run = t("[data-run]");
    if (run) { e.preventDefault(); return openTask(run.dataset.run, true); }
    if (t("[data-new-auto]")) return editAutomation({ kind: t("[data-new-auto]").dataset.newAuto });
    const ed = t("[data-auto-edit]");
    if (ed) return editAutomation(S.automations.find((a) => a.id === ed.dataset.autoEdit));
    const tg = t("[data-auto-toggle]");
    if (tg) { await api(`/api/automations/${tg.dataset.autoToggle}`, { method: "PATCH", json: { enabled: !tg.classList.contains("on") } }); return renderAutomations(); }
    const rn = t("[data-auto-run]");
    if (rn) {
      try { const { task_id } = await api(`/api/automations/${rn.dataset.autoRun}/run`, { method: "POST" }); loadTasks(); openTask(task_id, true); }
      catch (err) { handleStartError(err); }
      return;
    }
    const del = t("[data-auto-del]");
    if (del && confirm("Delete this automation?")) { await fetch(`/api/automations/${del.dataset.autoDel}`, { method: "DELETE" }); renderAutomations(); }
  });
  function editAutomation(a) {
    a = { kind: "schedule", schedule: { frequency: "daily", time: "09:00", weekday: 0, every_hours: 6 }, ...a };
    const s = { frequency: "daily", time: "09:00", weekday: 0, every_hours: 6, ...(a.schedule || {}) };
    const opt = (v, cur, label) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${label}</option>`;
    showModal(a.id ? "Edit automation" : "New automation", "", `
      <div class="form">
        <div class="kind-seg">${["schedule", "trigger", "advanced"].map((k) => `<button data-kind="${k}" class="${a.kind === k ? "on" : ""}">${icon(KIND_ICON[k])} ${{ schedule: "Schedule", trigger: "Trigger", advanced: "Advanced" }[k]}</button>`).join("")}</div>
        <label>Name<input id="au-name" value="${esc(a.name || "")}" placeholder="e.g. Weekly competitor report"></label>
        <label data-for="advanced">When should Atlas act? <span class="hint">Atlas checks this condition on a schedule and only does the work when it's true.</span>
          <textarea id="au-cond" placeholder="When the price of the Sony WH-1000XM5 on bestbuy.com drops below $300">${esc(a.condition || "")}</textarea></label>
        <label>What should Atlas do?<textarea id="au-prompt" placeholder="Research this week's AI news and write a one-page summary with sources.">${esc(a.prompt || "")}</textarea></label>
        <div data-for="schedule" class="row">
          <label>Repeat<select id="au-freq">${opt("once", s.frequency, "Once")}${opt("hourly", s.frequency, "Every few hours")}${opt("daily", s.frequency, "Every day")}${opt("weekdays", s.frequency, "Weekdays")}${opt("weekly", s.frequency, "Every week")}</select></label>
          <label data-freq="daily weekdays weekly">Time<input type="time" id="au-time" value="${esc(s.time || "09:00")}"></label>
          <label data-freq="weekly">Day<select id="au-day">${WEEKDAYS.map((d, i) => opt(i, s.weekday, d)).join("")}</select></label>
          <label data-freq="once">Date and time<input type="datetime-local" id="au-at" value="${esc(s.at || "")}"></label>
        </div>
        <div class="row" data-for="hours"><label>Every<select id="au-hours">${[1, 2, 3, 6, 12, 24, 48, 168].map((h) => opt(h, s.every_hours, h === 168 ? "week" : `${h} hour${h > 1 ? "s" : ""}`)).join("")}</select></label></div>
        <div data-for="trigger" class="hint" style="font-size:13.5px">After saving you'll get a private webhook URL. Any app that can send an HTTP POST (Zapier, IFTTT, GitHub, a script) can start this automation, and the JSON it sends is passed to Atlas as data.</div>
        <div class="row">
          <label>Model<select id="au-model">${models().map((m) => opt(m.id, a.model || S.model, m.tier)).join("")}</select></label>
          <label>Project<select id="au-proj">${opt("", a.project_id || "", "No project")}${(S.projects || []).map((p) => opt(p.id, a.project_id || "", esc(p.name))).join("")}</select></label>
        </div>
        <div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="au-save">${a.id ? "Save" : "Create automation"}</button></div>
      </div>`);
    const body = $("modal-body");
    let kind = a.kind;
    const sync = () => {
      const freq = $("au-freq").value;
      body.querySelectorAll("[data-kind]").forEach((b) => b.classList.toggle("on", b.dataset.kind === kind));
      body.querySelector('[data-for="advanced"]').hidden = kind !== "advanced";
      body.querySelector('[data-for="schedule"]').hidden = kind !== "schedule";
      body.querySelector('[data-for="trigger"]').hidden = kind !== "trigger";
      body.querySelector('[data-for="hours"]').hidden = !(kind === "advanced" || (kind === "schedule" && freq === "hourly"));
      body.querySelectorAll("[data-freq]").forEach((el) => (el.hidden = !el.dataset.freq.split(" ").includes(freq)));
    };
    body.querySelectorAll("[data-kind]").forEach((b) => (b.onclick = () => { kind = b.dataset.kind; sync(); }));
    $("au-freq").onchange = sync;
    sync();
    $("au-save").onclick = async () => {
      try {
        await api("/api/automations", { json: {
          id: a.id, kind, name: $("au-name").value.trim(), prompt: $("au-prompt").value.trim(), condition: $("au-cond").value.trim(),
          model: $("au-model").value, project_id: $("au-proj").value || null, enabled: a.enabled !== false,
          schedule: { frequency: $("au-freq").value, time: $("au-time").value, weekday: +$("au-day").value, every_hours: +$("au-hours").value, at: $("au-at").value },
        } });
        closeModal();
        toast(a.id ? "Automation saved" : "Automation created");
        renderAutomations();
      } catch (err) { toast(err.message); }
    };
  }

  // ---------- Plugins ----------
  const PLUG_CATS = ["All", "Productivity", "Creativity", "Business", "Development", "Finance", "Travel", "Health"];
  const CATALOG = [
    { key: "browser", builtin: true, name: "My Browser", desc: "Let Atlas use the web in its own browser: click, type, sign in, and download files.", cat: "Productivity", ic: "globe" },
    { key: "search", builtin: true, name: "Web Search", desc: "Search the web and read pages, with sources for every fact.", cat: "Productivity", ic: "search" },
    { key: "terminal", builtin: true, name: "Terminal & Code", desc: "Run commands and code to analyze data, build apps, and convert files.", cat: "Development", ic: "terminal" },
    { key: "gmail", name: "Gmail", desc: "Draft replies, search your inbox, and summarize email threads instantly.", cat: "Productivity", letter: "M", color: "#ea4335" },
    { key: "google-calendar", name: "Google Calendar", desc: "Understand your schedule, manage events, and optimize your time effectively.", cat: "Productivity", letter: "31", color: "#4285f4" },
    { key: "google-workspace", name: "Google Workspace", desc: "Access your files, search instantly, and let Atlas help you manage documents.", cat: "Productivity", letter: "G", color: "#0f9d58" },
    { key: "notion", name: "Notion", desc: "Search workspace content, update notes, and automate workflows in Notion.", cat: "Productivity", letter: "N", color: "#191919" },
    { key: "x", name: "X / Twitter", desc: "Fetch and search public X posts by link, ID, or @handle.", cat: "Business", letter: "X", color: "#111" },
    { key: "similarweb", name: "Similarweb", desc: "Analyze website traffic and SEO data for any domain or site URL.", cat: "Business", letter: "S", color: "#1b1d4e" },
    { key: "instagram", name: "Instagram", desc: "Generate and publish posts, stories, or reels to Instagram.", cat: "Creativity", letter: "I", color: "#d62976" },
    { key: "figma", name: "Figma", desc: "Read designs and components to build matching pages.", cat: "Creativity", letter: "F", color: "#a259ff" },
    { key: "github", name: "GitHub", desc: "Search code, read issues and pull requests, and open new ones.", cat: "Development", letter: "G", color: "#24292f" },
    { key: "linear", name: "Linear", desc: "Find, create, and update issues and projects.", cat: "Development", letter: "L", color: "#5e6ad2" },
    { key: "stripe", name: "Stripe", desc: "Look up customers, payments, and subscriptions.", cat: "Finance", letter: "S", color: "#635bff" },
    { key: "maps", name: "Maps & Places", desc: "Find places, routes, travel times, and opening hours.", cat: "Travel", letter: "M", color: "#34a853" },
    { key: "strava", name: "Strava", desc: "Review your activities, training load, and progress.", cat: "Health", letter: "S", color: "#fc4c02" },
  ];
  const PLUG = { cat: "All", q: "", installedOnly: false };
  const DARK_LOGOS = new Set(["#000000", "#181717", "#092540"]);
  function plugIcon(c) {
    if (c.builtin) return `<span class="plug-ic" style="color:var(--text)">${icon(c.ic)}</span>`;
    const logo = (window.BRAND_LOGOS || {})[c.key];
    if (logo) {
      const fill = DARK_LOGOS.has(logo.hex.toLowerCase()) ? "currentColor" : logo.hex;
      return `<span class="plug-ic logo" title="${esc(logo.title)}"><svg viewBox="0 0 24 24" role="img" aria-label="${esc(logo.title)}"><path d="${logo.path}" fill="${fill}"/></svg></span>`;
    }
    return `<span class="plug-ic" style="background:${c.color}">${esc(c.letter)}</span>`;
  }
  function plugState(c) {
    const p = S.plugins || { builtin: {}, connectors: [] };
    if (c.builtin) return { on: !!p.builtin[c.key] };
    const conn = p.connectors.find((x) => x.key === c.key);
    return { on: !!(conn && conn.enabled), conn };
  }
  async function renderPlugins() {
    await loadPlugins();
    const custom = (S.plugins.connectors || []).filter((c) => !CATALOG.some((k) => k.key === c.key))
      .map((c) => ({ key: c.key, name: c.name, desc: c.description || c.url, cat: "Development", letter: c.name[0] || "C", color: "#475569", custom: true }));
    const all = CATALOG.concat(custom);
    const list = all.filter((c) => (PLUG.cat === "All" || c.cat === PLUG.cat) && (!PLUG.q || (c.name + c.desc).toLowerCase().includes(PLUG.q))
      && (!PLUG.installedOnly || plugState(c).on || plugState(c).conn));
    const featured = [["google-workspace", "Bring email, docs, and calendar together."], ["github", "Search code, issues, and pull requests across your repos."], ["notion", "Find answers in your Notion workspace."]];
    $("plugins").innerHTML = `<div class="page-inner">
      <div class="page-head"><h1>Plugins</h1><div class="page-tools">
        <button class="btn light ${PLUG.installedOnly ? "on" : ""}" data-plug-installed>${PLUG.installedOnly ? "Show all" : "Manage Connectors"}</button>
        <div class="create-wrap"><button class="btn light" data-plug-create data-pop="1">Create ${icon("down")}</button>
          <div class="pop create-pop" hidden><button class="pop-item" data-plug-custom>${icon("plug")}Custom connector (MCP)</button></div></div>
      </div></div>
      <div class="plug-feature">${featured.map(([k, text]) => { const c = CATALOG.find((x) => x.key === k); return `<button class="pf" data-plug="${k}">${plugIcon(c)}${esc(text)}</button>`; }).join("")}</div>
      <div class="plug-search"><label class="search-box">${icon("search")}<input id="plug-q" placeholder="Search" value="${esc(PLUG.q)}"></label></div>
      <div class="tabs left">${PLUG_CATS.map((c) => `<button class="tab-btn ${PLUG.cat === c ? "on" : ""}" data-plug-cat="${c}">${c}</button>`).join("")}</div>
      ${list.length ? `<div class="plug-grid">${list.map((c) => { const st = plugState(c); return `
        <div class="plug">${plugIcon(c)}<div class="grow"><div class="name">${esc(c.name)}${c.builtin ? `<span class="tag">Built-in</span>` : st.conn && !st.on ? `<span class="tag">Paused</span>` : ""}</div><div class="desc">${esc(c.desc)}</div></div>
          <button class="plug-add ${st.on ? "added" : ""}" data-plug="${esc(c.key)}" title="${st.on ? "Manage" : "Add"}">${icon(st.on ? "check" : "plus")}</button></div>`; }).join("")}</div>` :
        `<div class="empty"><h3>No plugins found</h3><p>Try another search or category.</p></div>`}
    </div>`;
    const q = $("plug-q");
    q.oninput = () => { PLUG.q = q.value.toLowerCase(); const pos = q.selectionStart; renderPlugins().then(() => { const nq = $("plug-q"); nq.focus(); nq.setSelectionRange(pos, pos); }); };
  }
  $("plugins").addEventListener("click", async (e) => {
    const t = (sel) => e.target.closest(sel);
    if (t("[data-plug-cat]")) { PLUG.cat = t("[data-plug-cat]").dataset.plugCat; return renderPlugins(); }
    if (t("[data-plug-installed]")) { PLUG.installedOnly = !PLUG.installedOnly; return renderPlugins(); }
    if (t("[data-plug-create]")) return togglePop($("plugins").querySelector(".create-pop"));
    if (t("[data-plug-custom]")) { closePops(); return connectDialog({ key: "", name: "", custom: true }); }
    const p = t("[data-plug]");
    if (!p) return;
    const c = CATALOG.find((x) => x.key === p.dataset.plug) || (S.plugins.connectors.find((x) => x.key === p.dataset.plug) && { key: p.dataset.plug, custom: true, name: S.plugins.connectors.find((x) => x.key === p.dataset.plug).name });
    if (c.builtin) {
      const on = !plugState(c).on;
      await setBuiltin(c.key, on);
      toast(`${c.name} ${on ? "enabled" : "disabled"}`);
      return renderPlugins();
    }
    const st = plugState(c);
    if (st.conn) return manageConnector(c, st.conn);
    connectDialog(c);
  });
  function connectDialog(c) {
    showModal(c.custom ? "Custom connector" : `Connect ${c.name}`, "", `
      <div class="form">
        <div class="hint" style="font-size:14px;line-height:1.55">Atlas connects to apps through <b>MCP servers</b>. Paste the MCP server URL${c.custom ? "" : ` for ${esc(c.name)}`} (from the service's developer settings, or a server you run). If it needs an access token, add it below; it's stored encrypted ${S.config.cloud ? "in your account" : "on this Mac"} and only sent to that server.</div>
        ${c.custom ? `<label>Name<input id="cn-name" placeholder="e.g. Company wiki"></label><label>Description<input id="cn-desc" placeholder="What can Atlas do with it?"></label>` : ""}
        <label>MCP server URL<input id="cn-url" placeholder="https://…/mcp" spellcheck="false"></label>
        <label>Access token <span class="hint">Optional</span><input id="cn-token" type="password" autocomplete="new-password" spellcheck="false"></label>
        <div class="actions"><button class="btn" data-close>Cancel</button><button class="btn primary" id="cn-save">Connect</button></div>
      </div>`);
    $("cn-save").onclick = async () => {
      const name = c.custom ? $("cn-name").value.trim() : c.name;
      if (!name) return toast("Give the connector a name");
      try {
        S.plugins = await api("/api/plugins/connectors", { json: {
          key: c.custom ? name : c.key, name, url: $("cn-url").value.trim(), token: $("cn-token").value,
          description: c.custom ? $("cn-desc").value.trim() : c.desc,
        } });
        closeModal();
        toast(`${name} connected`);
        renderPlugins();
      } catch (err) { toast(err.message); }
    };
  }
  function manageConnector(c, conn) {
    showModal(conn.name, "", `
      <div class="form">
        <div class="tp-row" style="padding:0"><span class="grow">Use in tasks</span><button class="switch ${conn.enabled ? "on" : ""}" id="mc-toggle"></button></div>
        <label>MCP server<div class="code-line">${esc(conn.url)}</div><span class="hint">${conn.has_token ? "An access token is stored (encrypted)." : "No access token."}</span></label>
        <div class="actions"><button class="btn" id="mc-remove" style="color:var(--red)">Remove</button><button class="btn" data-close>Done</button></div>
      </div>`);
    $("mc-toggle").onclick = async () => {
      const on = !$("mc-toggle").classList.contains("on");
      await setConnector(conn.id, on);
      $("mc-toggle").classList.toggle("on", on);
      renderPlugins();
    };
    $("mc-remove").onclick = async () => {
      if (!confirm(`Remove ${conn.name}?`)) return;
      S.plugins = await api(`/api/plugins/connectors/${conn.id}`, { method: "PATCH", json: { remove: true } });
      closeModal();
      renderPlugins();
    };
  }

  // ---------- Usage ----------
  async function renderUsage() {
    let data;
    try { data = await api("/api/usage"); } catch { return; }
    S.credits = data.summary;
    renderCredits();
    const c = data.summary;
    $("usage").innerHTML = `<div class="page-inner">
      <div class="page-head"><h1>Usage</h1><button class="btn light" data-upgrade-page>${icon("spark")}Change plan</button></div>
      <div class="stat-row">
        <div class="stat"><div class="v">${c.balance.toLocaleString()}</div><div class="k">Credits available</div></div>
        <div class="stat"><div class="v">${c.used_today.toLocaleString()}</div><div class="k">Used today (of ${c.daily.toLocaleString()} daily)</div></div>
        <div class="stat"><div class="v">${c.used_week.toLocaleString()}</div><div class="k">Used in the last 7 days</div></div>
        <div class="stat"><div class="v">${Math.floor(c.refresh_in_minutes / 60)}h ${c.refresh_in_minutes % 60}m</div><div class="k">Until daily refresh</div></div>
      </div>
      ${data.tasks.length ? `<table class="utable"><thead><tr><th>Task</th><th>Model</th><th class="num">Credits</th><th class="num">Est. cost</th><th>Last used</th></tr></thead><tbody>
        ${data.tasks.map((r) => `<tr><td><a href="/task/${r.task_id}" data-run="${r.task_id}">${esc(r.title || "Untitled")}</a></td><td>${r.models.map((m) => esc(modelInfo(m).tier || m)).join(", ")}</td><td class="num">${r.credits}</td><td class="num">$${r.usd.toFixed(3)}</td><td>${relTime(r.last)}</td></tr>`).join("")}
      </tbody></table>` : `<div class="empty"><span class="big-ic">${icon("chart")}</span><h3>No usage yet</h3><p>Credits used by your tasks will show up here.</p></div>`}
      <p class="hint" style="margin-top:14px;color:var(--muted);font-size:13px">1 credit ≈ $0.01, estimated from token counts and web searches at Claude API list prices.</p></div>`;
  }
  $("usage").addEventListener("click", (e) => {
    const r = e.target.closest("[data-run]");
    if (r) { e.preventDefault(); openTask(r.dataset.run, true); }
    if (e.target.closest("[data-upgrade-page]")) openUpgrade();
  });

  // ---------- Project ----------
  let projectComposer = null;
  async function renderProject(pid) {
    await loadProjects();
    const p = (S.projects || []).find((x) => x.id === pid);
    const root = $("project");
    if (!p) { root.innerHTML = `<div class="empty"><h3>Project not found</h3></div>`; return; }
    document.title = `${p.name} - Atlas`;
    root.innerHTML = `<div class="page-inner">
      <div class="proj-head"><span class="kind-ic">${icon("folderBox")}</span><h1>${esc(p.name)}</h1>
        <button class="icon-btn" id="pj-rename" title="Rename">${icon("pen")}</button><button class="icon-btn" id="pj-del" title="Delete project">${icon("trash")}</button></div>
      <div class="proj-grid">
        <div><div class="composer composer2" id="proj-composer"></div>
          <div class="panel" style="margin-top:18px"><h3>Tasks in this project</h3><div id="proj-tasks"></div></div></div>
        <div class="panel"><h3>Instructions</h3><div class="hint" style="font-size:12.5px;color:var(--muted);margin-bottom:8px">Applied to every new task in this project.</div>
          <textarea id="pj-instr" placeholder="e.g. Write for executives. Prefer primary sources. Use metric units.">${esc(p.instructions || "")}</textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn primary" id="pj-save">Save</button></div></div>
      </div></div>`;
    projectComposer = makeComposer($("proj-composer"), { placeholder: `Start a task in ${p.name}`, onSend: startTask });
    projectComposer.setProject(p.id, true);
    const tasks = S.tasks.filter((t) => t.project_id === p.id);
    $("proj-tasks").innerHTML = tasks.length ? tasks.map((t) => `<div class="ptask" data-run="${t.id}"><span class="t-dot ${t.status === "running" ? "running" : ""}">${t.status === "running" ? "" : icon(taskIcon(t.title))}</span><span class="t-title" style="flex:1">${esc(t.title)}</span><span class="fc-meta">${relTime(t.updated)}</span></div>`).join("")
      : `<div class="fc-meta">No tasks yet. Start one above.</div>`;
    $("proj-tasks").onclick = (e) => { const r = e.target.closest("[data-run]"); if (r) openTask(r.dataset.run, true); };
    $("pj-save").onclick = async () => { await api("/api/projects", { json: { id: p.id, name: p.name, instructions: $("pj-instr").value } }); toast("Instructions saved"); };
    $("pj-rename").onclick = async () => {
      const name = prompt("Project name", p.name);
      if (!name || !name.trim()) return;
      await api("/api/projects", { json: { id: p.id, name: name.trim(), instructions: $("pj-instr").value } });
      renderProject(p.id);
    };
    $("pj-del").onclick = async () => {
      if (!confirm("Delete this project? Its tasks are kept.")) return;
      await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
      await loadProjects();
      navigate("/");
    };
  }

  // ---------- Init ----------
  function initIcons() {
    $("sb-collapse").innerHTML = icon("panel");
    $("sb-open").innerHTML = icon("panel");
    $("sb-search-btn").innerHTML = icon("search");
    $("vault-btn").innerHTML = icon("lock");
    document.querySelectorAll("[data-icon]").forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
    document.querySelectorAll(".brand-mark, .hero-mark, .logo-mark").forEach((el) => (el.innerHTML = LOGO));
    $("computer-btn").innerHTML = icon("monitor");
    $("cp-close").innerHTML = icon("x");
    $("cp-prev").innerHTML = icon("prev");
    $("cp-next").innerHTML = icon("next");
  }

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); goHome(true); }
    if (e.key === "Escape") { closePops(); if (!$("modal").hidden) closeModal(); }
  });

  // ---------- Accounts (cloud mode) ----------
  let signupMode = false;
  function showSignin(msg, isError) {
    if (S.es) { S.es.close(); S.es = null; }
    $("signin").hidden = false;
    $("signin-title").textContent = signupMode ? "Create your account" : "Sign in";
    $("signin-submit").textContent = signupMode ? "Create account" : "Sign in";
    $("signin-switch").textContent = signupMode ? "Already have an account? Sign in" : "New here? Create an account";
    $("signin-password").autocomplete = signupMode ? "new-password" : "current-password";
    const m = $("signin-msg");
    m.hidden = !msg;
    m.textContent = msg || "";
    m.className = `signin-msg ${isError ? "err" : ""}`;
    setTimeout(() => $("signin-email").focus(), 0);
  }
  window.addEventListener("atlas:signin", () => { if (S.config?.cloud) showSignin("Your session ended. Please sign in again."); });
  $("signin-switch").onclick = () => { signupMode = !signupMode; showSignin(); };
  $("signin-form").onsubmit = async (e) => {
    e.preventDefault();
    const btn = $("signin-submit");
    btn.disabled = true;
    try {
      const r = await api(signupMode ? "/api/auth/signup" : "/api/auth/login",
        { json: { email: $("signin-email").value, password: $("signin-password").value } });
      if (r.confirm) {
        signupMode = false;
        showSignin("Almost there: we sent you an email. Click the link in it to confirm your address, then you're signed in.");
      } else location.reload();
    } catch (err) {
      showSignin(err.message, true);
    } finally {
      btn.disabled = false;
    }
  };
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/";
  }
  // The email confirmation link lands here with the session in the address's #fragment: hand it to the server.
  async function acceptEmailLink() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (!h.get("access_token") && !h.get("error_description")) return false;
    history.replaceState(null, "", location.pathname);
    if (h.get("error_description")) { showSignin(h.get("error_description"), true); return true; }
    try {
      await api("/api/auth/session", { json: { access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_in: +h.get("expires_in") || 3600 } });
      location.reload();
    } catch (err) { showSignin(err.message, true); }
    return true;
  }

  async function init() {
    try { const t = localStorage.getItem("atlas.theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
    $("theme-label").textContent = currentTheme() === "dark" ? "Light mode" : "Dark mode";
    initIcons();
    try {
      S.config = await api("/api/config");
      S.config.agent = "Atlas";
      if (S.config.cloud) {
        $("signout-item").hidden = false;
        if (await acceptEmailLink()) return;
        if (!S.config.signed_in) return showSignin();
        document.querySelectorAll('[data-act="where"]').forEach((b) => (b.innerHTML = `${icon("monitor")}Cloud computer`));
        $("upgrade-btn").style.display = "none";
        document.querySelector(".plan-pill .sep").style.display = "none";
      }
      setModel(defaultModel(), false);
      $("key-warning").hidden = S.config.has_key;
      if (S.config.demo) {
        const b = document.createElement("div");
        b.className = "demo-banner";
        b.innerHTML = `<b>Demo</b><span>Explore every page and open the example tasks in the sidebar to watch them run. Starting new tasks is turned off.</span>`;
        document.querySelector(".topbar").after(b);
      }
      $("user-name").textContent = S.config.user || "You";
      $("user-avatar").textContent = (S.config.user || "?")[0].toUpperCase();
    } catch {}
    await Promise.all([loadTasks(), loadProjects(), loadPlugins(), loadCredits()]);
    route();
    setInterval(() => { if (S.tasks.some((t) => t.status === "running")) { loadTasks(); loadCredits(); } }, 4000);
    setInterval(loadCredits, 60000);
  }
  init();
})();
