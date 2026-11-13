/* Fieldwise brand kit playground. Needs pebbles.js and layouts.js first. */
(() => {
  "use strict";
  const P = Pebbles, PAL = P.PAL, INK = "#18241F";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad2 = (n) => String(n).padStart(2, "0");
  const LAY = window.LAYOUTS, byKey = Object.fromEntries(LAY.map((l) => [l.key, l]));

  /* ---------- state ---------- */
  const DEF = { v: 3, L: "nine-432", pal: "field", mat: "glass", ori: "r", wm: "sans", stars: [], me: { name: "Your Name", role: "Co-founder", email: "fieldwisesolutions1@gmail.com", phone: "+91 92014 79878" } };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let state = clone(DEF);
  try { const s = JSON.parse(localStorage.getItem("fw-kit") || "null"); if (s) state = { ...state, ...s, me: { ...DEF.me, ...(s.me || {}) } }; } catch (e) {}
  if (!["sans", "inter"].includes(state.wm)) state.wm = "sans";
  // Archive picks are a preview only: every visit opens on the chosen logo.
  state.L = DEF.L; state.pal = DEF.pal; state.v = 3;
  state.stars = (state.stars || []).filter((k) => byKey[k]);
  const save = () => { try { localStorage.setItem("fw-kit", JSON.stringify({ ...state, L: DEF.L, pal: DEF.pal })); } catch (e) {} };

  /* ---------- glass sets ---------- */
  const SETS = {
    shore: { name: "Shore", line: "The mix you'd find on a beach.", dots: [PAL.cobalt, PAL.aqua, PAL.bottle, PAL.citrine] },
    deep: { name: "Deep sea", line: "Blues and teals, one stone lit.", cool: [PAL.cobalt, "#2B8C93", PAL.aqua, "#3552A8", PAL.teal, PAL.sky] },
    field: { name: "Field", line: "Greens from bottle to lime.", cool: [PAL.bottle, PAL.seafoam, PAL.moss, PAL.lime, PAL.teal, "#A9D9B9", "#4E9C6E"] },
    milk: { name: "Milk glass", line: "Frosted white, one stone lit.", cool: ["#D8E1D9", "#CBD6D0", "#E3E8E1", "#D2DCDA"] },
    bottle: { name: "Bottle", line: "One green, many depths.", cool: ["#2C8A64", "#5FB48A", "#1F6E52", "#86D3AE", "#3F9E78"] },
  };
  for (const k in SETS) if (!SETS[k].dots) SETS[k].dots = [...SETS[k].cool.slice(0, 3), PAL.citrine];
  const WARM = new Set([PAL.citrine, PAL.amber, PAL.copper]);
  const MATS = [
    ["glass", "Glass", "Screens, covers, social. Shadows and light included."],
    ["glow", "Glass, dark", "On dark surfaces the glass glows instead of casting a shadow."],
    ["tint", "Two-tone", "Print. Each stone in two flat inks: body and light."],
    ["flat", "Flat", "One flat colour per stone. Signs, embroidery, small print."],
    ["mono", "One colour", "Receipts, stamps, fax, foil, laser-cut. Any single ink."],
    ["outline", "Line", "Engraving and blind embossing only."],
  ];
  const WMS = [["sans", "Google Sans Flex", "Plain and quiet. Recommended."], ["inter", "Inter Tight", "The current site font."]];

  function items(L = state.L, o = {}) {
    const pal = o.pal || state.pal, ori = o.ori || state.ori, S = SETS[pal];
    let its = byKey[L].stones.map((s) => ({ poly: s.poly, color: PAL[s.color] || s.color }));
    if (S.cool) {
      const seen = new Map();
      its = its.map((it) => {
        if (WARM.has(it.color)) return { ...it, color: PAL.citrine };
        if (!seen.has(it.color)) seen.set(it.color, S.cool[seen.size % S.cool.length]);
        return { ...it, color: seen.get(it.color) };
      });
    }
    if (ori === "r") its = its.map((it) => ({ ...it, poly: it.poly.map(([x, y]) => [1000 - x, y]).reverse() }));
    return its;
  }

  /* ---------- images ---------- */
  const cache = new Map();
  const uri = (svg) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const bucket = (px) => [96, 192, 384, 768, 1400].find((b) => b >= px) || 1400;
  // The mark as an <img>, sized by the visual height of the stones (shadow room handled with margins).
  function markImg(mat, h, o = {}) {
    const L = o.L || state.L, its = o.items || items(L, o);
    const glassy = mat === "glass" || mat === "glow";
    const bb = P.bbox(its.flatMap((i) => i.poly)), S = Math.max(bb.w, bb.h), pad = 0.02 * S, room = glassy ? 0.19 * S : 0;
    const res = bucket(h * 1.6 * (o.dpr || 1));
    const key = [L, o.pal || state.pal, o.ori || state.ori, mat, o.ink || "", res, o.items ? JSON.stringify(its).length : ""].join("|");
    let src = cache.get(key);
    if (!src) { src = uri(P.render(its, { size: res, material: mat, pad: 0.02, room: glassy, ink: o.ink })); cache.set(key, src); }
    const k = h / (bb.h + 2 * pad);
    const H = (bb.h + 2 * pad + 1.25 * room) * k;
    const m = glassy ? `margin:${(-0.25 * room * k).toFixed(2)}px ${(-room * k).toFixed(2)}px ${(-room * k).toFixed(2)}px ${(-0.25 * room * k).toFixed(2)}px;` : "";
    return `<img class="mk ${o.cls || ""}" alt="${esc(o.alt || "")}" src="${src}" style="height:${H.toFixed(2)}px;width:auto;${m}${o.style || ""}">`;
  }
  // Mark pushed into a container corner so its right angle sits on the corner (bleeds off the edges).
  function cornerMark(mat, h, o = {}) {
    const right = (o.ori || state.ori) === "r", bleed = o.bleed ?? 0.1;
    const pos = `position:absolute;bottom:${-h * bleed}px;${right ? "right" : "left"}:${-h * bleed}px;`;
    const img = markImg(mat, h, o);
    return img.replace('style="', `style="${pos}`).replace(/margin:[^;]+;/, (mm) => (right ? mm : mm));
  }
  // One stone of the current mark, for bullets and accents.
  function stoneImg(i, h, o = {}) {
    const its = items(o.L, o), sorted = its.slice().sort((a, b) => Math.abs(P.area(b.poly)) - Math.abs(P.area(a.poly)));
    const st = sorted[i % sorted.length];
    const it = [{ poly: st.poly, color: o.color || st.color }];
    return markImg(o.mat || "tint", h, { ...o, items: it, L: (o.L || state.L) + "#s" + i + (o.color || "") });
  }
  // A field of loose stones (the brand pattern), cropped to w x h.
  const POOL = LAY.filter((l) => l.key === "nine-432").flatMap((l) => l.stones.map((s) => { const c = P.centroid(s.poly); return s.poly.map(([x, y]) => [x - c[0], y - c[1]]); }));
  function fieldSrc(w, h, o = {}) {
    const seed = o.seed || 7, sc = o.scale || 0.32, mat = o.mat || "tint", lit = o.lit ?? 0.07, gap = o.gap ?? 14;
    const key = ["field", w, h, seed, sc, mat, state.pal, lit, o.only || "", o.density || 1].join("|");
    let src = cache.get(key);
    if (!src) {
      const R = P.rng(seed), S = SETS[state.pal];
      const cool = S.cool || [PAL.cobalt, PAL.aqua, PAL.seafoam, PAL.bottle, PAL.teal, PAL.sky, PAL.milk, PAL.lime];
      const placed = [], its = [];
      const tries = Math.round(1400 * (o.density || 1));
      for (let t = 0; t < tries; t++) {
        const base = POOL[Math.floor(R() * POOL.length)], s = sc * (0.55 + R() * 0.7);
        const poly = P.transform(base.map(([x, y]) => [x * s, y * s]), { rot: R() * 6.28, about: [0, 0] });
        const r = Math.max(...poly.map(([x, y]) => Math.hypot(x, y)));
        const x = -r * 0.6 + R() * (w + r * 1.2), y = -r * 0.6 + R() * (h + r * 1.2);
        if (o.only && !o.only(x, y, w, h)) continue;
        if (placed.some((p) => Math.hypot(p[0] - x, p[1] - y) < p[2] + r * 0.82 + gap)) continue;
        placed.push([x, y, r * 0.82]);
        its.push({ poly: poly.map(([a, b]) => [a + x, b + y]), color: R() < lit ? PAL.citrine : cool[Math.floor(R() * cool.length)] });
      }
      src = uri(P.render(its, { size: Math.max(w, 300), material: mat, viewBox: [0, 0, w, h], ref: 1000 * sc, shadow: 0.12 }).replace(/width="[^"]+" height="[^"]+"/, `width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"`));
      cache.set(key, src);
    }
    return src;
  }
  const fieldImg = (w, h, o = {}) => `<img alt="" src="${fieldSrc(w, h, o)}" style="position:absolute;inset:0;width:100%;height:100%;${o.style || ""}">`;
  const wmFont = () => ({ sans: "'Google Sans Flex', 'Inter Tight', sans-serif", inter: "'Inter Tight', sans-serif", serif: "'Instrument Serif', serif" }[state.wm]);
  function lockup({ mat = "tint", fs = 40, color = INK, stacked = false, ink, gap } = {}) {
    const mh = stacked ? fs * 2.2 : fs * 1.42;
    return `<span class="lk${stacked ? " st" : ""}" style="font-size:${fs}px;color:${color};${gap ? `gap:${gap}em;` : ""}">${markImg(mat, mh, { ink, alt: "Fieldwise" })}<span class="wm">Fieldwise</span></span>`;
  }
  // Which version a medium uses, given the chosen material.
  const pm = () => ({ glass: "tint", glow: "tint", tint: "tint", flat: "flat", mono: "mono", outline: "mono" }[state.mat]);
  const dm = (dark) => (dark ? ({ glass: "glow", glow: "glow", tint: "tint", flat: "flat", mono: "mono", outline: "mono" }[state.mat]) : ({ glass: "glass", glow: "glass", tint: "tint", flat: "flat", mono: "mono", outline: "outline" }[state.mat]));

  /* ---------- icons ---------- */
  const IC = {
    choose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><path d="M17 13.6l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/></svg>',
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M19.5 4.5c.8 0 1 .6 1 1.3v12.4c0 1.3-.7 2.3-2.1 2.3H6c-1.3 0-1.7-1-.9-1.8L18 4.9c.5-.4.9-.4 1.5-.4z"/><ellipse cx="16.6" cy="16.4" rx="2" ry="1.6"/></svg>',
    colour: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3.5c3.4 3.9 6 7.3 6 10.3a6 6 0 0 1-12 0c0-3 2.6-6.4 6-10.3z"/><path d="M9 14.5a3 3 0 0 0 3 3" stroke-linecap="round"/></svg>',
    type: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 18.5L8.5 5.5l5 13M5.4 13.7h6.2"/><path d="M20.5 11.5v7M20.5 13.8c-.6-1.6-4.5-1.9-4.5 1.3 0 3.2 3.9 2.9 4.5 1.3"/></svg>',
    apply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="4" y="3.5" width="11" height="15" rx="1.6"/><path d="M8 21h10.5a1.5 1.5 0 0 0 1.5-1.5V7.5" stroke-linecap="round"/><path d="M7 7.5h5M7 10.5h5" stroke-linecap="round"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z"/></svg>',
    starOn: '<svg viewBox="0 0 24 24" fill="#F1BB52" stroke="#C99528" stroke-width="1.4" stroke-linejoin="round"><path d="M12 3.8l2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
  };
  const FINAL = "nine-432", SHORT = new Set([5, 6, 7, 8, 10, 11, 14]);
  const VIEWS = [["mark", "Mark", "How to use it"], ["colour", "Colour", "Glass and neutrals"], ["type", "Type", "Wordmark and text"], ["apply", "Apply", "Print, digital, social"]];

  const NOISE = uri('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .32  0 0 0 0 .27  0 0 0 0 .2  -.9 0 0 0 .62"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>');
  document.documentElement.style.setProperty("--noise", `url("${NOISE}")`);

  /* ---------- small helpers ---------- */
  const lay = () => byKey[state.L];
  const markName = (k = state.L) => `No. ${pad2(byKey[k].n)} · ${byKey[k].kind}`;
  const dotsHTML = (k) => `<span class="dots">${SETS[k].dots.map((c) => `<i style="background:${c}"></i>`).join("")}</span>`;
  function toast(msg) { const t = $("#toast"); t.innerHTML = `<i class="tdot"></i>${esc(msg)}`; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("on"), 1600); }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg || "Copied"); }
    catch (e) { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast(msg || "Copied"); } catch (e2) { toast("Couldn't copy here"); } ta.remove(); }
  }
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const cmyk = (h) => { const [r, g, b] = hexRgb(h).map((v) => v / 255), k = 1 - Math.max(r, g, b), f = (x) => Math.round(((1 - x - k) / (1 - k || 1)) * 100); return `${f(r)} ${f(g)} ${f(b)} ${Math.round(k * 100)}`; };
  const lum = (h) => { const c = hexRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

  /* ---------- customise panel ---------- */
  function panelHTML() {
    const l = lay();
    const cur = state.L === FINAL && state.pal === "field";
    return `<div class="cz">
      <button class="cur" data-act="wp"><span class="cur-m">${markImg("glass", 58)}</span><span class="cur-t"><b>no. ${pad2(lay().n)}</b><span>${lay().kind.toLowerCase()} · ${SETS[state.pal].name.toLowerCase()}${cur ? "" : " · trying"}</span></span><span class="cur-a">archive</span></button>
      <div><div class="cz-h"><span>Material</span></div>
        <div class="opts three" data-glide="mat">${MATS.map(([k, n]) => `<button data-set="mat" data-v="${k}" aria-pressed="${state.mat === k}">${n}</button>`).join("")}</div></div>
      <div><div class="cz-h"><span>Right angle</span></div>
        <div class="opts" data-glide="ori"><button data-set="ori" data-v="r" aria-pressed="${state.ori === "r"}">◢ Bottom right</button><button data-set="ori" data-v="l" aria-pressed="${state.ori === "l"}">◣ Bottom left</button></div></div>
      <div><div class="cz-h"><span>Wordmark</span></div>
        <div class="opts" data-glide="wm">${WMS.map(([k, n]) => `<button class="f-${k}" data-set="wm" data-v="${k}" aria-pressed="${state.wm === k}">${k === "sans" ? "Sans" : k === "inter" ? "Inter" : "Serif"}</button>`).join("")}</div></div>
      <div class="cz-end"><a class="reset" href="#water">water lab</a><button class="reset" data-act="reset">reset everything</button></div>
    </div>`;
  }

  /* ---------- views ---------- */
  const R = {};

  R.choose = () => {
    const stars = state.stars;
    return `
    <header class="view-head"><span class="eyebrow">Choose</span><h1>Find the one.</h1>
      <p class="lede">Every mark is a different handful of sea glass, settled into a right angle. Star the ones you like, then compare them side by side at the sizes they'll really be used.</p></header>
    <div class="picker" id="picker" data-keep="picker">${LAY.map((x) => `
      <article class="pk${x.key === state.L ? " on" : ""}" data-k="${x.key}">
        <div class="pk-st">${markImg("glass", 230, { L: x.key, alt: markName(x.key) })}</div>
        <div class="pk-b"><div><b>No. ${pad2(x.n)}</b><span>${x.kind}</span></div>
          <div class="pk-a"><button class="ic star" data-act="star" data-k="${x.key}" aria-pressed="${stars.includes(x.key)}" aria-label="Star No. ${x.n}">${stars.includes(x.key) ? IC.starOn : IC.star}</button>
          <button class="use${x.key === state.L ? " on" : ""}" data-set="L" data-v="${x.key}">${x.key === state.L ? IC.check + "In use" : "Use"}</button></div></div>
      </article>`).join("")}</div>
    <div class="pk-nav"><div class="pk-dots" id="pkDots" data-glide="dots">${LAY.map((x, i) => `<b data-dot="${i}" aria-pressed="false" aria-label="Mark ${x.n}"></b>`).join("")}</div><span id="pkN"></span></div>
    <section class="block" id="compare"><h2>Compare</h2>
      ${stars.length ? `<p class="sub">Your starred marks in the places that matter most: big on sand, next to the name, as a favicon, and printed in one colour on a receipt.</p>
      <div class="cmp">${stars.map((k) => `
        <div class="cmp-c">
          <div class="cmp-h"><b>${markName(k)}</b><button class="mini" data-set="L" data-v="${k}">${k === state.L ? "In use" : "Use"}</button></div>
          <div class="cmp-big">${markImg("glass", 150, { L: k })}</div>
          <div class="cmp-lk">${markImg("tint", 30, { L: k })}<span class="wm" style="font-size:22px">Fieldwise</span></div>
          <div class="cmp-sm"><span>${markImg("flat", 32, { L: k })}<i>32</i></span><span>${markImg("flat", 20, { L: k })}<i>20</i></span><span class="tab">${markImg("flat", 14, { L: k })}<em>Fieldwise</em></span></div>
          <div class="cmp-rc">${markImg("mono", 34, { L: k, ink: "#111" })}<span>FIELDWISE</span><span>Receipt FW-R-0418</span></div>
        </div>`).join("")}</div>` : `<p class="sub">Tap the star on any mark above and it shows up here, next to the others you starred.</p>`}
    </section>`;
  };

  R.mark = () => {
    const l = lay(), its = items();
    const xFrac = (() => { const warm = its.find((i) => i.color === PAL.citrine) || its[its.length - 1]; const b = P.bbox(warm.poly), all = P.bbox(its.flatMap((i) => i.poly)); return b.h / all.h; })();
    return `
    <header class="view-head"><span class="eyebrow">Mark · ${markName()}</span><h1>Sea glass, set into a right angle.</h1>
      <p class="lede">Sea glass starts as broken glass. The sea tumbles it smooth, and someone picks the pieces up one by one and sets them down in order. That's the work: many different things, arranged until they make one clear shape.</p></header>
    <div class="hero ${state.mat === "glow" ? "dark" : ["glass"].includes(state.mat) ? "" : "paper"}" id="hero">
      <div class="hero-meta"><span></span><button class="pill" data-act="replay">${IC.play}Replay</button></div></div>
    <div class="why">
      <div><b>A right angle</b><span>Square and level, like a set square. It's also the corner of a field.</span></div>
      <div><b>Loose stones</b><span>No two the same shape. The biggest sit in the corner, the small ones work out to the tips.</span></div>
      <div><b>One lit stone</b><span>The citrine piece is the old favicon's amber dot. It's the only warm stone in any layout.</span></div>
    </div>
    <section class="block"><h2>logo files</h2>
      <div class="block-body files">${LOGO_FILES.map((f) => `<div class="file"><div class="fv" style="background:${f.bg}">${logoPreview(f)}</div><div class="ft"><b>${f.name}</b><div class="fbs">${fileBtns(logoPath(f, "png"), f.svg || f.kind === "insta" ? logoPath(f, "svg") : "")}</div></div></div>`).join("")}</div></section>
    <section class="block"><h2>Lockups</h2><p class="sub">The mark sits to the left of the name, about one and a half times the height of the capitals. Stack it only where the space is square.</p>
      <div class="block-body lockups">
        <div class="lc" style="background:var(--stage)">${lockup({ mat: "glass", fs: 46 })}<span class="c">Glass on sand · website and screens</span></div>
        <div class="lc" style="background:#FBFAF6">${lockup({ mat: pm(), fs: 46 })}<span class="c">Print · letterheads, cards, documents</span></div>
        <div class="lc" style="background:#F4F0E8">${lockup({ mat: "glass", fs: 40, stacked: true })}<span class="c">Stacked · square spaces</span></div>
        <div class="lc dk" style="background:var(--night)">${lockup({ mat: "glow", fs: 46, color: "#EEF2EE" })}<span class="c">Glass on dark</span></div>
        <div class="lc" style="background:#fff">${lockup({ mat: "mono", fs: 46 })}<span class="c">One colour</span></div>
        <div class="lc dk" style="background:#2C8A64">${lockup({ mat: "mono", fs: 46, color: "#fff", ink: "#fff" })}<span class="c">Reversed out of bottle green</span></div>
      </div></section>
    <section class="block"><h2>Sizes</h2><p class="sub">Glass needs room for its light. Below 32 px use the flat version; below 20 px the stones run together, so use the favicon crop.</p>
      <div class="block-body sizes">
        <div class="r">${[128, 72, 48].map((s) => `<figure><div style="background:var(--stage)">${markImg("glass", s)}</div><figcaption>${s} px</figcaption></figure>`).join("")}
          ${[48, 32, 24, 16].map((s) => `<figure><div style="background:#fff;border:1px solid var(--line)">${markImg("flat", s)}</div><figcaption>${s} px flat</figcaption></figure>`).join("")}</div>
        <p class="note">In print: 10 mm wide at the smallest for flat and two-tone, 14 mm for glass, 15 mm for thermal receipts.</p></div></section>
    <section class="block"><h2>Clear space</h2><p class="sub">Keep a margin of <b>x</b> around the mark on every side, where <b>x</b> is the height of the citrine stone. Nothing else goes inside it.</p>
      <div class="block-body two">
        <div class="panel"><div class="clear" style="--x:${Math.round(160 * xFrac)}px"><div class="box">${markImg("flat", 160)}<span class="x" style="left:50%;top:${-Math.round(160 * xFrac) / 2 - 8}px;transform:translateX(-50%)">x</span><span class="x" style="top:50%;left:${-Math.round(160 * xFrac) / 2 - 4}px;transform:translateY(-50%)">x</span></div></div></div>
        <div class="panel"><div class="clear" style="--x:${Math.round(56 * 1.42 * xFrac)}px"><div class="box" style="display:flex">${lockup({ mat: "flat", fs: 56 })}</div></div></div>
      </div></section>
    <section class="block"><h2>Keep it whole</h2><p class="sub">The stones are already arranged. Leave them as they are.</p>
      <div class="block-body donts">
        <div class="dont"><div class="dv">${markImg("flat", 110, { style: "transform:scaleX(1.55)" })}</div><div class="dt"><i>✕</i>Don't stretch it</div></div>
        <div class="dont"><div class="dv">${markImg("flat", 110, { style: "transform:rotate(28deg)" })}</div><div class="dt"><i>✕</i>Don't rotate it</div></div>
        <div class="dont"><div class="dv">${markImg("flat", 110, { items: its.map((it, i) => ({ ...it, color: ["#E0457B", "#7B3FE4", "#FF7A1A", "#E8D21D", "#1DB4E8"][i % 5] })), L: state.L + "#bad" })}</div><div class="dt"><i>✕</i>Don't use colours outside the glass</div></div>
        <div class="dont"><div class="dv">${markImg("flat", 110, { style: "filter:drop-shadow(6px 8px 0 #18241F) drop-shadow(0 0 2px #18241F)" })}</div><div class="dt"><i>✕</i>Don't add outlines or effects</div></div>
        <div class="dont"><div class="dv" style="background:repeating-linear-gradient(115deg,#E2574C 0 22px,#3E7FD8 22px 44px,#F2C335 44px 66px)">${markImg("glass", 110)}</div><div class="dt"><i>✕</i>Don't put glass on busy backgrounds</div></div>
        <div class="dont"><div class="dv"><span class="lk" style="font-size:24px;color:${INK}">${markImg("flat", 34)}<span style="font:italic 700 24px Georgia,serif;letter-spacing:.06em">FieldWise</span></span></div><div class="dt"><i>✕</i>Don't re-set the name</div></div>
      </div></section>
    <section class="block" id="motion"><h2>Motion</h2><p class="sub">On screen the stones arrive scattered and settle into the corner, biggest first, on one soft spring. It plays once, then rests. With reduced motion turned on, the mark simply appears.</p>
      <div class="block-body"><div class="mstage ${state.mat === "glow" ? "dark" : ""}" id="mstage"></div>
        <div class="mctl"><button class="pill solid" data-act="mplay">${IC.play}Play</button></div>
        <div class="specs" style="margin-top:14px"><div class="panel"><b>1.5 s</b><span>each stone's travel</span></div><div class="panel"><b>0.9 s</b><span>spread of start times, corner first</span></div><div class="panel"><b>Soft spring</b><span>cubic-bezier(.22, 1.18, .36, 1)</span></div><div class="panel"><b>Once</b><span>never loops on a page</span></div></div>
        <h3 style="margin-top:30px;font-size:18px">Loading</h3><p class="sub" style="color:var(--ink-2);margin-top:4px">For waits, the stones start as milk glass and light up one at a time, then fade back.</p>
        <div class="loaders" style="margin-top:14px"><div class="loader" style="background:var(--stage)"><div class="ls" id="ld1"></div><span>On sand</span></div><div class="loader dk" style="background:var(--night)"><div class="ls" id="ld2"></div><span>On dark</span></div></div>
      </div></section>`;
  };

  const COLORS = [
    ["bottle", "Bottle", "Primary. Buttons, links, reversed panels."], ["seafoam", "Seafoam", "Soft fills, highlights, charts."], ["aqua", "Aqua", "Glass and charts."], ["teal", "Teal", "Glass, icons, secondary buttons."],
    ["cobalt", "Cobalt", "The deep note. Use sparingly."], ["sky", "Sky", "Quiet glass and backgrounds."], ["lime", "Lime", "Glass only. Never for text."], ["citrine", "Citrine", "The lit stone. One per layout, never a background."],
    ["milk", "Milk", "Frosted glass, empty and inactive states."], ["lavender", "Lavender", "Rare. Glass only."], ["copper", "Copper", "Rare warm accent in patterns."],
  ];
  const NEUTRALS = [["Ink", "#18241F", "Text, one-colour mark", "#EEF2EE"], ["Sand", "#ECE7DE", "Behind glass", INK], ["Paper", "#FBFAF6", "Documents and cards", INK], ["Night", "#1B2023", "Dark surfaces", "#EEF2EE"], ["Stone", "#868D87", "Captions, rules", "#fff"]];
  R.colour = () => `
    <header class="view-head"><span class="eyebrow">Colour</span><h1>Sand, ink, and a handful of glass.</h1>
      <p class="lede">Most of every layout is sand or paper with ink type. The glass colours come in small amounts, the way a few stones sit on a beach. Citrine is the one warm note.</p></header>
    <section class="block" style="margin-top:0"><h2>Glass</h2><p class="sub">Each swatch is one stone from your mark, cast in that colour. Tap a code to copy it.</p>
      <div class="block-body swatches">${COLORS.map(([k, n, d], i) => { const h = PAL[k]; const [r, g, b] = hexRgb(h); return `
        <div class="sw"><div class="sv">${stoneImg(i, 92, { mat: "glass", color: h })}</div>
          <div class="st"><b>${n}</b><p>${d}</p><dl class="codes"><dt>HEX</dt><dd><button class="copy" data-copy="${h}">${h}</button></dd><dt>RGB</dt><dd><button class="copy" data-copy="${r}, ${g}, ${b}">${r} ${g} ${b}</button></dd><dt>CMYK</dt><dd><span>${cmyk(h)}</span></dd></dl></div></div>`; }).join("")}</div></section>
    <section class="block"><h2>Neutrals</h2>
      <div class="block-body neutrals">${NEUTRALS.map(([n, h, d, t]) => `<div class="nt" style="background:${h};color:${t}"><div><b>${n}</b><p>${d}</p></div><button class="copy" style="color:${t};text-align:left;padding:0" data-copy="${h}"><span>${h}</span></button></div>`).join("")}</div></section>
    <section class="block"><h2>How much of each</h2>
      <div class="block-body ratio"><div style="flex:62;background:#ECE7DE;color:${INK}">Sand & paper <span>62%</span></div><div style="flex:18;background:${INK};color:#EEF2EE">Ink <span>18%</span></div><div style="flex:16;background:linear-gradient(90deg,${PAL.bottle},${PAL.aqua},${PAL.cobalt});color:#fff">Glass <span>16%</span></div><div style="flex:4;background:${PAL.citrine};color:${INK}"></div></div>
      <p class="note" style="margin-top:8px">Citrine stays under 5%. It's the stone that's lit, not a theme colour.</p></section>
    <section class="block"><h2>Text on colour</h2><p class="sub">Contrast ratios against WCAG. 4.5 or more is fine for body text; 3 or more for large headings only.</p>
      <div class="block-body pairs">${[[INK, "#ECE7DE"], [INK, "#FBFAF6"], ["#FFFFFF", PAL.bottle], ["#EEF2EE", "#1B2023"], [INK, PAL.citrine], [INK, PAL.seafoam], ["#FFFFFF", PAL.cobalt], ["#FFFFFF", PAL.aqua]].map(([f, b]) => { const c = contrast(f, b); return `<div class="pair" style="background:${b};color:${f}"><b>Grow where it counts.</b><span><i style="font-style:normal">${f} on ${b}</i><i style="font-style:normal">${c.toFixed(1)} · ${c >= 4.5 ? "Body" : c >= 3 ? "Large only" : "Avoid"}</i></span></div>`; }).join("")}</div>
      <p class="note" style="margin-top:10px">CMYK values are starting points converted from screen colour. Ask your printer for a proof before a large run.</p></section>`;

  R.type = () => `
    <header class="view-head"><span class="eyebrow">Type</span><h1>Plain, dark and quiet.</h1>
      <p class="lede">The glass carries the character, so the type stays out of its way: one sans for everything people read, and a matching mono for numbers, codes and receipts.</p></header>
    <section class="block" style="margin-top:0"><h2>Wordmark</h2><p class="sub">Pick the face for the name. It updates across the whole kit.</p>
      <div class="block-body wms">${WMS.map(([k, n, d]) => `<button class="wmc" data-set="wm" data-v="${k}" aria-pressed="${state.wm === k}"><div class="wv">${lockup({ mat: "tint", fs: 40 }).replace('<span class="wm">', `<span class="wm" style="font-family:${({ sans: "'Google Sans Flex'", inter: "'Inter Tight'", serif: "'Instrument Serif'" })[k]};${k === "inter" ? "font-weight:600;letter-spacing:-.03em" : k === "serif" ? "font-weight:400;letter-spacing:-.01em;font-size:1.12em" : ""}">`)}</div><div class="wt"><b>${n}</b><span>${d}</span></div></button>`).join("")}</div></section>
    <section class="block"><h2>Typefaces</h2>
      <div class="block-body faces">
        <div class="face"><span class="eyebrow">Text and headings</span><div class="aa">Aa</div><b style="font-size:22px;font-weight:500">Google Sans Flex</b><div class="w"><span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span><span style="font-weight:600">Semibold</span></div><div class="glyphs">ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 ₹ & ? !</div><p class="note">Free on Google Fonts. Use Medium for headings and Regular for text. Avoid Bold.</p></div>
        <div class="face"><span class="eyebrow">Numbers and codes</span><div class="aa mono" style="letter-spacing:-.02em">0₹9</div><b style="font-size:22px;font-weight:500">Google Sans Code</b><div class="w mono"><span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span></div><div class="glyphs mono">FW-2026-014 · ₹97,940.00 · 12/11/2026 · fieldwisesolutions1@gmail.com</div><p class="note">Invoices, receipts, tables, order numbers and anything people copy.</p></div>
      </div></section>
    <section class="block"><h2>Scale</h2>
      <dl class="block-body scale">
        <div class="sr"><dt><b>Display</b>56 / 60 · Medium · −3%</dt><dd style="font-size:clamp(34px,5vw,56px);line-height:1.07;letter-spacing:-.03em;font-weight:500">Grow where it counts.</dd></div>
        <div class="sr"><dt><b>Heading 1</b>40 / 46 · Medium · −2.5%</dt><dd style="font-size:clamp(28px,3.6vw,40px);line-height:1.15;letter-spacing:-.025em;font-weight:500">Everything your presence needs.</dd></div>
        <div class="sr"><dt><b>Heading 2</b>28 / 34 · Medium · −2%</dt><dd style="font-size:clamp(22px,2.6vw,28px);line-height:1.2;letter-spacing:-.02em;font-weight:500">From first call to steady growth.</dd></div>
        <div class="sr"><dt><b>Heading 3</b>20 / 28 · Medium</dt><dd style="font-size:20px;line-height:1.4;font-weight:500">Websites, search and brand</dd></div>
        <div class="sr"><dt><b>Body</b>16 / 26 · Regular</dt><dd style="font-size:16px;line-height:1.62;color:var(--ink-2)">Designed around what your customers came to find, built to load quickly on any phone, and simple for your team to update.</dd></div>
        <div class="sr"><dt><b>Small</b>13 / 20 · Regular</dt><dd style="font-size:13px;line-height:1.55;color:var(--ink-2)">Pay within 15 days. Bank transfer or UPI.</dd></div>
        <div class="sr"><dt><b>Label</b>12 · Medium · +8% · caps</dt><dd style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:500;color:var(--ink-3)">Growth & online presence studio</dd></div>
        <div class="sr"><dt><b>Figures</b>Google Sans Code · tabular</dt><dd class="mono" style="font-size:16px;font-variant-numeric:tabular-nums">₹ 45,000.00  ·  ₹ 14,940.00  ·  ₹ 97,940.00</dd></div>
      </dl></section>
    <section class="block"><h2>Voice</h2><p class="sub">From the studio's own principles.</p>
      <div class="block-body voice">
        <div class="panel"><b>Clarity first</b><p>Every page answers one question well.</p><div class="eg"><span class="y">Book a room</span><span class="n">Explore our accommodation solutions</span></div></div>
        <div class="panel"><b>Plain numbers</b><p>Say what moved and what didn't. No vanity metrics.</p><div class="eg"><span class="y">Enquiries up 40% since June</span><span class="n">Massive growth in engagement!</span></div></div>
        <div class="panel"><b>Yours to keep</b><p>Talk about what the client owns, not what we control.</p><div class="eg"><span class="y">Your domain, your code, your accounts</span><span class="n">Our proprietary platform</span></div></div>
        <div class="panel"><b>Short and warm</b><p>Write like a person who knows the work.</p><div class="eg"><span class="y">Your site is live. Here's what's next.</span><span class="n">We are pleased to inform you that…</span></div></div>
      </div></section>`;

  /* ---------- applications ---------- */
  const me = () => state.me;
  const CAT = { print: "Print", digital: "Digital", social: "Social" };
  const desk = (inner, o = {}) => `<div class="scene ${o.cls || ""}" style="${o.bg ? `background-color:${o.bg};` : ""}">${inner}</div>`;
  const page = (w, h, inner, o = {}) => `<div class="paper ${o.cls || ""}" style="width:${w}px;height:${h}px;${o.style || ""}">${inner}</div>`;

  function cardFront() {
    const m = me();
    return `<div class="a-card"><div class="cf-top">${lockup({ mat: pm(), fs: 25 })}</div>
      <div class="cf-who"><b>${esc(m.name)}</b><span>${esc(m.role)}</span></div>
      <div class="cf-con"><span>${esc(m.email)}</span><span>${esc(m.phone)}</span></div></div>`;
  }
  function cardBack() {
    return `<div class="a-card back ${state.ori}">${cornerMark(pm(), 470, { bleed: 0.06 })}<span class="cb-wm wm">Fieldwise</span><span class="cb-tag">Grow where it counts.</span></div>`;
  }
  function letterBody(kind) {
    const m = me();
    const head = `<header class="d-head">${lockup({ mat: pm(), fs: 22 })}<div class="d-ct"><span>${esc(m.email)}</span><span>${esc(m.phone)}</span></div></header>`;
    const foot = `<footer class="d-foot ${state.ori}"><span>Fieldwise · Websites, search, brand and web apps</span></footer><div class="d-corner ${state.ori}">${cornerMark(pm(), 150, { bleed: 0.12 })}</div>`;
    if (kind === "letter") return head + `
      <div class="d-meta"><div><span>To</span><b>Sample Client Pvt Ltd</b><p>Attn: Operations</p></div><div><span>Date</span><b>12 November 2026</b></div></div>
      <h3 class="d-subj">Proposal: a faster website, local search and online booking</h3>
      <div class="d-text"><p>Hello,</p>
      <p>Thank you for walking us through how bookings reach you today. Most still start with a phone call, and the website is slow to load on mobile, so people who find you on Google often leave before they call.</p>
      <p>We propose three pieces of work: a new six-page website built to load quickly on any phone, a simple booking form that sends each request to your team on WhatsApp and email, and a cleaned-up Google Business Profile so the right hours, photos and reviews show up in search.</p>
      <p>We work in short rounds, with something real to review every week. The full plan, timeline and costs are attached. We'd be glad to walk you through it on a call this week.</p>
      <p>Warm regards,</p></div>
      <div class="d-sig"><b>${esc(m.name)}</b><span>${esc(m.role)}, Fieldwise</span></div>` + foot;
    // invoice
    const rows = [["Website design and build", "6 pages, mobile first", 1, 45000], ["Booking flow", "Form to WhatsApp and email", 1, 12000], ["Local search setup", "Google Business Profile", 1, 8000], ["Hosting and care", "Per month, 12 months", 12, 1500]];
    const fmt = (n) => n.toLocaleString("en-IN");
    const sub = rows.reduce((s, r) => s + r[2] * r[3], 0), gst = Math.round(sub * 0.18);
    return head + `
      <div class="i-top"><h2 class="i-h">Invoice</h2><dl class="i-no"><dt>Number</dt><dd>FW-2026-014</dd><dt>Issued</dt><dd>12 Nov 2026</dd><dt>Due</dt><dd>27 Nov 2026</dd></dl></div>
      <div class="d-meta"><div><span>Billed to</span><b>Sample Client Pvt Ltd</b><p>Accounts team</p></div><div><span>From</span><b>Fieldwise</b><p>${esc(m.email)}</p></div></div>
      <table class="i-t"><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>
      ${rows.map(([a, b, q, r]) => `<tr><td><b>${a}</b><span>${b}</span></td><td>${q}</td><td>${fmt(r)}</td><td>${fmt(q * r)}</td></tr>`).join("")}</tbody></table>
      <div class="i-sum"><div><span>Subtotal</span><span>₹ ${fmt(sub)}</span></div><div><span>GST 18%</span><span>₹ ${fmt(gst)}</span></div><div class="tot"><span>Total due</span><span>₹ ${fmt(sub + gst)}</span></div></div>
      <div class="i-pay"><b>Payment</b><span>Bank transfer or UPI within 15 days. Account details are on the cover email.</span></div>` + foot;
  }
  function receipt() {
    const lines = [["Website build, 50%", "22,500.00"], ["Booking flow", "12,000.00"]];
    return `<div class="a-rc"><div class="rc-h">${markImg("mono", 64, { ink: "#141414" })}<b class="wm">Fieldwise</b><span>Websites · Search · Brand</span></div>
      <div class="rc-r"><span>Receipt</span><span>FW-R-0418</span></div><div class="rc-r"><span>Date</span><span>12/11/2026 14:32</span></div><div class="rc-r"><span>Client</span><span>Sample Client</span></div>
      <div class="rc-hr"></div>${lines.map(([a, b]) => `<div class="rc-r"><span>${a}</span><span>${b}</span></div>`).join("")}
      <div class="rc-r"><span>GST 18%</span><span>6,210.00</span></div><div class="rc-hr"></div>
      <div class="rc-r big"><span>PAID</span><span>₹40,710.00</span></div><div class="rc-r"><span>UPI ref</span><span>4318 2207 9915</span></div>
      <div class="rc-hr"></div><p class="rc-thx">Thank you for working with us.</p><p class="rc-f">${esc(me().email)}</p></div>`;
  }
  const SERVICES = [["Websites", "Fast, considered, easy to run."], ["Search & SEO", "Show up when it matters."], ["Brand & identity", "Be recognised everywhere."], ["Local presence", "Own your neighbourhood."], ["Content & social", "Say it well, everywhere."], ["Web apps & tools", "Booking flows, dashboards, internal tools."]];
  const STEPS = [["Listen", "Who you serve, what they search for, and where you're losing them today."], ["Plan", "What to build, what to fix first, and how we'll both know it's working."], ["Build", "Design and development in focused rounds, with something real to review each step."], ["Grow", "After launch we keep tuning search and content, and tell you plainly what changed."]];
  function broCover() {
    return `<div class="a-bro cover">${lockup({ mat: pm(), fs: 19 })}<div class="bc-t"><h2>Grow where it counts.</h2><p>Websites, search and brand for businesses that want to be found, trusted and chosen online.</p></div>${cornerMark(state.mat === "mono" || state.mat === "outline" ? "mono" : "glass", 470, { bleed: 0.05 })}</div>`;
  }
  function broSpread() {
    return `<div class="a-bro spread"><div class="pg l"><span class="lab">What we do</span><h3>Everything your presence needs. Nothing it doesn't.</h3>
      <ul class="svc">${SERVICES.map(([a, b], i) => `<li><span class="bul">${stoneImg(i, 24, { mat: pm() })}</span><div><b>${a}</b><span>${b}</span></div></li>`).join("")}</ul></div>
      <div class="pg r"><span class="lab">How we work</span><h3>From first call to steady growth.</h3>
      <ol class="stp">${STEPS.map(([a, b], i) => `<li><i>0${i + 1}</i><div><b>${a}</b><span>${b}</span></div></li>`).join("")}</ol>
      <div class="cta"><b>Start a project</b><span>${esc(me().email)}</span><span>${esc(me().phone)}</span></div></div></div>`;
  }
  function broBack() {
    return `<div class="a-bro backc"><div class="bb-c">${markImg("mono", 64, { ink: "#FFFFFF" })}<b class="wm">Fieldwise</b><p>Your presence should work as hard as you do.</p></div><div class="bb-f"><span>${esc(me().email)}</span><span>${esc(me().phone)}</span></div></div>`;
  }
  function envelope() {
    return `<div class="a-env">${lockup({ mat: pm(), fs: 17 })}<span class="ev-ret">${esc(me().email)}</span><div class="ev-win"><b>Sample Client Pvt Ltd</b><span>Accounts team</span><span>Address line one</span><span>City 000 000</span></div>${cornerMark(pm(), 150, { bleed: 0.1 })}</div>`;
  }
  function stickerSheet() {
    const its = items(), sorted = its.slice().sort((a, b) => Math.abs(P.area(b.poly)) - Math.abs(P.area(a.poly)));
    const mat = state.mat === "mono" || state.mat === "outline" ? "mono" : state.mat === "flat" ? "flat" : "tint";
    const die = (its2, h, key) => {
      const bb = P.bbox(its2.flatMap((i) => i.poly)), S = Math.max(bb.w, bb.h), pd = 0.14 * S;
      const vb = [bb.x - pd, bb.y - pd, bb.w + 2 * pd, bb.h + 2 * pd];
      const inner = P.render(its2, { size: 400, material: mat, viewBox: vb }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
      const out = its2.map((i) => `<path d="${P.smoothPath(i.poly)}"/>`).join("");
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}"><g fill="#fff" stroke="#fff" stroke-width="${0.11 * S}" stroke-linejoin="round" filter="drop-shadow(0 ${0.012 * S}px ${0.014 * S}px rgba(40,30,10,.35))">${out}</g>${inner}</svg>`;
      return `<img alt="" src="${uri(svg)}" style="height:${h}px;width:auto">`;
    };
    const s = (i, x, y, h, r) => `<div class="stk" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)">${die([sorted[i % sorted.length]], h)}</div>`;
    return `<div class="a-stk"><div class="stk" style="left:70px;top:70px">${die(its, 420)}</div>
      <div class="stk pillst" style="left:560px;top:110px;transform:rotate(-4deg)"><span class="lk" style="font-size:44px;color:${INK}">${markImg(mat, 62)}<span class="wm">Fieldwise</span></span></div>
      <div class="stk circ" style="left:600px;top:330px"><div>${markImg(mat, 150)}</div></div>
      ${s(0, 90, 600, 210, -8)}${s(1, 360, 640, 170, 12)}${s(2, 590, 690, 150, -16)}${s(3, 800, 620, 120, 20)}${s(4, 170, 860, 100, 6)}${s(5, 420, 870, 90, -10)}${s(6, 840, 830, 80, 0)}</div>`;
  }
  function stampEmboss() {
    const ink = "#2F3F8F";
    const text = "FIELDWISE · GROW WHERE IT COUNTS · ";
    const ring = `<svg viewBox="0 0 300 300" class="stp-ring"><defs><path id="rp" d="M150,150 m-112,0 a112,112 0 1,1 224,0 a112,112 0 1,1 -224,0"/><filter id="rough"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.55"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
      <g filter="url(#rough)" fill="${ink}" stroke="${ink}"><circle cx="150" cy="150" r="140" fill="none" stroke-width="7"/><circle cx="150" cy="150" r="88" fill="none" stroke-width="3"/>
      <text font-family="Google Sans Flex, sans-serif" font-size="22" font-weight="600" stroke="none"><textPath href="#rp" textLength="700" lengthAdjust="spacing">${text}</textPath></text>
      <image href="${uri(P.render(items(), { size: 300, material: "mono", ink, pad: 0.02 }))}" x="100" y="100" width="100" height="100"/></g></svg>`;
    return `<div class="a-stamp"><div class="kraft">${ring}</div>
      <div class="emb">${markImg("mono", 150, { ink: "#ECE6DA", cls: "emb-m" })}<span class="wm emb-w">Fieldwise</span></div></div>`;
  }
  function email() {
    const m = me();
    return `<div class="a-mail"><div class="ml-bar"><i></i><i></i><i></i></div>
      <div class="ml-hd"><b>Your new website is live</b><div class="ml-from">${markImg(pm(), 22)}<div><span><b>Fieldwise</b> &lt;${esc(m.email)}&gt;</span><span>to you · 10:42</span></div></div></div>
      <div class="ml-body"><div class="em">
        <div class="em-top">${lockup({ mat: pm(), fs: 20 })}</div>
        <div class="em-hero">${fieldImg(600, 200, { seed: 21, scale: 0.17, mat: state.mat === "mono" || state.mat === "outline" ? "mono" : state.mat === "glow" ? "glass" : state.mat })}</div>
        <div class="em-in"><h2>Your new website is live.</h2>
          <p>Hi there, the new site went live this morning. It loads in under two seconds on a mid-range phone, and every booking request now reaches your team on WhatsApp and email.</p>
          <a class="em-btn">Visit your site</a>
          <h3>What happens next</h3>
          <ul>${[["This week", "We watch the first bookings come in and fix anything that feels slow."], ["In two weeks", "Your Google Business Profile updates with the new hours and photos."], ["Every month", "A one-page note on what moved and what didn't."]].map(([a, b], i) => `<li><span class="bul">${stoneImg(i + 1, 17, { mat: pm() })}</span><div><b>${a}</b><span>${b}</span></div></li>`).join("")}</ul>
          <p>Reply to this email with anything you'd like changed.<br>${esc(m.name)}, Fieldwise</p></div>
        <div class="em-ft">${markImg("mono", 20, { ink: "#868D87" })}<span>Fieldwise · Websites, search and brand<br>${esc(m.email)} · ${esc(m.phone)}</span><span>You're receiving this because we're working on your project.</span></div>
      </div></div></div>`;
  }
  function signature() {
    const m = me();
    return `<div class="a-mail sig"><div class="ml-bar"><i></i><i></i><i></i></div><div class="ml-hd"><b>Re: Website and search</b><div class="ml-from"><div><span>To: Sample Client</span></div></div></div>
      <div class="ml-body plain"><p>Hi there,</p><p>Thanks for the photos. We'll add them to the rooms page today and send you a preview link by tomorrow evening.</p><p>Best,</p>
      <div class="esig"><div class="es-m">${markImg(state.mat === "glass" || state.mat === "glow" ? "glass" : pm(), 46)}</div><div class="es-t"><b>${esc(m.name)}</b><span>${esc(m.role)}, Fieldwise</span><span class="es-c">${esc(m.phone)} · ${esc(m.email)}</span></div></div></div></div>`;
  }
  function website() {
    return `<div class="a-web"><div class="wb-bar"><i></i><i></i><i></i><span class="wb-url">fieldwise</span></div>
      <div class="wb-page"><nav class="wb-nav">${lockup({ mat: state.mat === "glow" ? "glass" : dm(false), fs: 21 })}<span>Services</span><span>Work</span><span>Process</span><span>About</span><b>Start a project</b></nav>
      <div class="wb-hero"><div class="wb-t"><span class="lab">Growth & online presence studio</span><h1>Grow where it counts.</h1><p>Websites, search and brand for businesses that want to be found, trusted and chosen online.</p><div class="wb-b"><b>Start a project</b><span>See our work</span></div></div>
      <div class="wb-art">${markImg(dm(false), 380)}</div></div></div></div>`;
  }
  function phoneHome() {
    const apps = ["#E9E4DA", "#D7DFE8", "#E6DCCF", "#DCE6DD", "#E4DCE6", "#D9E3E3", "#EAE1D2", "#DDE0E6", "#E3E7DA", "#E6D9D9", "#D8E3EA", "#E9E2D8"];
    return `<div class="a-phone"><div class="ph-scr"><div class="ph-sb"><b>9:41</b><span>●●● ▮</span></div>
      <div class="ph-grid">${apps.map((c, i) => i === 5 ? `<div class="ph-app"><div class="ph-ic fw">${markImg("glass", 40)}</div><span>Fieldwise</span></div>` : `<div class="ph-app"><div class="ph-ic" style="background:${c}"></div><span>&nbsp;</span></div>`).join("")}</div>
      <div class="ph-dock">${[0, 1, 2, 3].map((i) => `<div class="ph-ic" style="background:${apps[i + 6]}"></div>`).join("")}</div></div></div>`;
  }
  function tabs() {
    return `<div class="a-tabs"><div class="tb-row"><div class="tb on">${markImg("flat", 18)}<span>Fieldwise · Grow where it counts</span><i>×</i></div><div class="tb"><em class="tb-blank"></em><span>New tab</span><i>×</i></div></div>
      <div class="tb-url"><span>fieldwise</span></div>
      <div class="tb-fav">${[64, 32, 16].map((s) => `<figure>${markImg("flat", s)}<figcaption>${s} px</figcaption></figure>`).join("")}<figure><div class="tb-sq">${markImg("glass", 70)}</div><figcaption>180 px touch icon</figcaption></figure></div></div>`;
  }
  function slide() {
    return `<div class="a-slide">${cornerMark(state.mat === "glow" ? "glass" : dm(false), 620, { bleed: 0.04 })}<div class="wsl-t"><span class="lab">Sample Client · Website and search</span><h1>Project kickoff</h1><p>12 November 2026</p></div><div class="sl-f">${lockup({ mat: dm(false) === "glass" ? "tint" : dm(false), fs: 22 })}</div></div>`;
  }
  function igPost() {
    return `<div class="a-ig">${lockup({ mat: pm(), fs: 34 })}<h1>Grow where<br>it counts.</h1>${cornerMark(dm(false), 640, { bleed: 0.05 })}</div>`;
  }
  function igStory() {
    return `<div class="a-story">${fieldImg(1080, 1920, { seed: 3, scale: 0.5, mat: dm(true), lit: 0.06, density: 0.5, only: (x, y) => y > 1080 })}<div class="sy-t">${lockup({ mat: dm(true), fs: 40, color: "#EEF2EE" })}<h1>Your presence should work as hard as you do.</h1><p>Websites, search and brand.</p><b>Start a project</b></div></div>`;
  }
  function linkedin() {
    return `<div class="a-li">${fieldImg(1584, 396, { seed: 11, scale: 0.2, mat: dm(false), only: (x) => x > 1290 })}<div class="li-t"><h1>Websites, search and brand<br>for businesses that want to be found.</h1><span>${esc(me().email)}</span></div></div>`;
  }
  function avatars() {
    return `<div class="a-av"><div class="av" style="background:#ECE7DE">${markImg(dm(false), 300)}</div><div class="av" style="background:#1B2023">${markImg(dm(true), 300)}</div></div>`;
  }

  // Logo files, exported by export.js into files/logo/ for the chosen mark.
  const LOGO_FILES = [
    { id: "mark-glass", name: "mark · glass", bg: "var(--stage)", kind: "mark", mat: "glass", svg: true },
    { id: "mark-two-tone", name: "mark · two-tone", bg: "#FBFAF6", kind: "mark", mat: "tint", svg: true },
    { id: "mark-flat", name: "mark · flat", bg: "#FBFAF6", kind: "mark", mat: "flat", svg: true },
    { id: "mark-black", name: "mark · black", bg: "#fff", kind: "mark", mat: "mono", ink: "#18241F", svg: true },
    { id: "mark-white", name: "mark · white", bg: "#1B2023", kind: "mark", mat: "mono", ink: "#FFFFFF", svg: true },
    { id: "logo-glass", name: "logo · glass", bg: "var(--stage)", kind: "lockup", mat: "glass" },
    { id: "logo", name: "logo · print", bg: "#FBFAF6", kind: "lockup", mat: "tint" },
    { id: "logo-white", name: "logo · white", bg: "#1B2023", kind: "lockup", mat: "mono", ink: "#FFFFFF", color: "#FFFFFF" },
    { id: "logo-stacked", name: "logo · stacked", bg: "#F4F0E8", kind: "stacked", mat: "glass" },
    { id: "app-icon", name: "app icon", bg: "#E4DED3", kind: "icon", mat: "glass" },
    { id: "favicon", name: "favicon", bg: "#fff", kind: "mark", mat: "flat", svg: true, small: true },
    { id: "instagram", name: "instagram profile", bg: "#E4DED3", kind: "insta", path: "instagram/fieldwise-instagram" },
  ];
  const logoPreview = (f) => f.kind === "lockup" ? lockup({ mat: f.mat, fs: 22, color: f.color || INK, ink: f.ink })
    : f.kind === "stacked" ? lockup({ mat: f.mat, fs: 16, stacked: true })
    : f.kind === "icon" ? `<span class="ic-sq">${markImg("glass", 40)}</span>`
    : f.kind === "insta" ? `<span class="ic-ci">${markImg("glass", 44)}</span>`
    : markImg(f.mat, f.small ? 28 : 64, { ink: f.ink });
  const logoPath = (f, ext) => (f.path || "files/logo/" + f.id) + "." + ext;
  // Each application, as the artwork itself (not the desk scene), exported into files/apply/.
  const PIECES = {
    card: [["front", () => cardFront(), ".a-card", 1.25], ["back", () => cardBack(), ".a-card", 1.25]],
    letter: [["letterhead", () => page(794, 1123, letterBody("letter"), { cls: "a-doc" }), ".paper", 3.2]],
    invoice: [["invoice", () => page(794, 1123, letterBody("invoice"), { cls: "a-doc" }), ".paper", 3.2]],
    receipt: [["receipt", () => receipt(), ".a-rc", 2.2]],
    env: [["envelope", () => envelope(), ".a-env", 2.4]],
    brocover: [["cover", () => broCover(), ".a-bro", 2.9], ["back", () => broBack(), ".a-bro", 2.9]],
    brospread: [["inside", () => broSpread(), ".a-bro", 2.9]],
    stickers: [["sheet", () => stickerSheet(), ".a-stk", 2]],
    stamp: [["mockup", null, null, 1]],
    email: [["email", () => email(), ".em", 2]],
    sig: [["signature", () => `<div style="background:#fff;padding:24px 28px;display:inline-block">${signature().match(/<div class="esig">[\s\S]*?<\/div><\/div><\/div>/)[0]}</div>`, "div", 2]],
    web: [["header", () => website(), ".a-web", 1]],
    phone: [["icon", () => `<div class="big-ic" style="width:1024px;height:1024px;border-radius:0">${markImg("glass", 600)}</div>`, ".big-ic", 1]],
    tabs: [["mockup", null, null, 1]],
    slide: [["title slide", () => slide(), ".a-slide", 1.3334]],
    ig: [["post", () => igPost(), ".a-ig", 1]],
    story: [["story", () => igStory(), ".a-story", 1]],
    li: [["banner", () => linkedin(), ".a-li", 1]],
    av: [["sand", () => `<div class="av" style="background:#ECE7DE;box-shadow:none">${markImg(dm(false), 300)}</div>`, ".av", 2.5], ["dark", () => `<div class="av" style="background:#1B2023;box-shadow:none">${markImg(dm(true), 300)}</div>`, ".av", 2.5]],
  };
  const pieceSlug = (n) => n.replace(/\s+/g, "-");
  const piecePath = (id, n) => `files/apply/${id}-${pieceSlug(n)}.png`;
  const fileName = (p) => "fieldwise-" + p.split("/").pop();
  async function copyImg(url) {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw 0;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": fetch(url).then((r) => { if (!r.ok) throw 0; return r.blob(); }) })]);
      buzz(8); toast("image copied");
    } catch (e) { toast("can't copy here, use download"); }
  }
  function dl(url) { const a = document.createElement("a"); a.href = url; a.download = fileName(url); document.body.appendChild(a); a.click(); a.remove(); buzz(6); }
  const DL_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/></svg>';
  const fileBtns = (png, svg) => `<button class="fb" data-act="dl" data-u="${png}">${DL_IC}png</button>${svg ? `<button class="fb" data-act="dl" data-u="${svg}">${DL_IC}svg</button>` : ""}<button class="fb" data-act="cp" data-u="${png}">${IC.copy}copy</button>`;

  const ARTS = [
    { id: "card", cat: "print", title: "Visiting card", spec: "85 × 55 mm · 400 gsm uncoated · spot UV on the stones", w: 1600, h: 1200, html: () => desk(`<div class="sc-card back" style="left:640px;top:150px;transform:rotate(6deg)">${cardBack()}</div><div class="sc-card" style="left:110px;top:520px;transform:rotate(-4deg)">${cardFront()}</div>`) },
    { id: "letter", cat: "print", title: "Letterhead", spec: "A4 · 120 gsm uncoated · two-tone mark, corner stones bleed off", w: 1600, h: 1200, html: () => desk(`<div class="sc-a4" style="left:440px;top:46px;transform:rotate(-1.5deg) scale(1)">${page(794, 1123, letterBody("letter"), { cls: "a-doc" })}</div><div class="sc-a4 under" style="left:520px;top:70px;transform:rotate(3deg)">${page(794, 1123, "", { cls: "a-doc" })}</div>`) },
    { id: "invoice", cat: "print", title: "Invoice", spec: "A4 · same system as the letterhead · figures in Google Sans Code", w: 1600, h: 1200, html: () => desk(`<div class="sc-a4" style="left:403px;top:38px">${page(794, 1123, letterBody("invoice"), { cls: "a-doc" })}</div>`) },
    { id: "receipt", cat: "print", title: "Thermal receipt", spec: "80 mm roll · black only · one-colour mark at 18 mm", w: 1600, h: 1200, html: () => desk(`<div class="sc-rc" style="left:585px;top:150px;transform:rotate(-2deg) scale(1.45);transform-origin:50% 0">${receipt()}</div>`, { bg: "#CFC8BB" }) },
    { id: "env", cat: "print", title: "Envelope", spec: "DL 220 × 110 mm · window right · stones in the corner", w: 1600, h: 1200, html: () => desk(`<div class="sc-env" style="left:330px;top:150px;transform:rotate(3deg)">${envelope()}</div><div class="sc-card" style="left:90px;top:720px;transform:rotate(-7deg)">${cardFront()}</div>`) },
    { id: "brocover", cat: "print", title: "Brochure, cover and back", spec: "A5 · 300 gsm cover, matte laminate · glass printed at 300 dpi", w: 1600, h: 1200, html: () => desk(`<div class="sc-a5" style="left:880px;top:170px;transform:rotate(3deg)">${broBack()}</div><div class="sc-a5" style="left:150px;top:150px;transform:rotate(-3deg)">${broCover()}</div>`) },
    { id: "brospread", cat: "print", title: "Brochure, inside", spec: "A5 spread · services and process from the website", w: 1600, h: 1200, html: () => desk(`<div class="sc-spread" style="left:80px;top:170px">${broSpread()}</div>`) },
    { id: "stickers", cat: "print", title: "Sticker sheet", spec: "Kiss-cut vinyl · every stone is its own sticker", w: 1600, h: 1200, html: () => desk(`<div class="sc-stk" style="left:300px;top:100px;transform:rotate(-2deg)">${stickerSheet()}</div>`) },
    { id: "stamp", cat: "print", title: "Stamp and emboss", spec: "Self-inking stamp for parcels · blind emboss for folders", w: 1600, h: 1200, html: () => desk(stampEmboss()) },
    { id: "email", cat: "digital", title: "Email", spec: "600 px wide · works in Gmail, Outlook and Apple Mail", w: 1600, h: 1200, html: () => desk(`<div class="sc-win" style="left:140px;top:60px">${email()}</div>`, { cls: "soft" }) },
    { id: "sig", cat: "digital", title: "Email signature", spec: "Mark at 46 px · name, role, phone, email", w: 1600, h: 1200, html: () => desk(`<div class="sc-win" style="left:200px;top:200px">${signature()}</div>`, { cls: "soft" }) },
    { id: "web", cat: "digital", title: "Website header", spec: "Glass lockup in the nav, the mark as the hero", w: 1600, h: 1200, html: () => desk(`<div class="sc-win" style="left:80px;top:130px">${website()}</div>`, { cls: "soft" }) },
    { id: "phone", cat: "digital", title: "App icon", spec: "Glass on sand · 1024 px master", w: 1600, h: 1200, html: () => desk(`<div class="sc-phone" style="left:300px;top:130px">${phoneHome()}</div><div class="sc-icon" style="left:900px;top:330px"><div class="big-ic">${markImg("glass", 230)}</div><span>1024 px master · glass on sand</span></div>`, { cls: "soft" }) },
    { id: "tabs", cat: "digital", title: "Favicon and browser tab", spec: "Flat at 16, 32 and 64 px · glass touch icon", w: 1600, h: 1200, html: () => desk(`<div class="sc-win" style="left:160px;top:250px">${tabs()}</div>`, { cls: "soft" }) },
    { id: "slide", cat: "digital", title: "Presentation", spec: "16:9 title slide", w: 1600, h: 1200, html: () => desk(`<div class="sc-slide" style="left:80px;top:150px">${slide()}</div>`, { cls: "soft" }) },
    { id: "ig", cat: "social", title: "Instagram post", spec: "1080 × 1080", w: 1080, h: 1080, fit: "contain", html: igPost },
    { id: "story", cat: "social", title: "Instagram story", spec: "1080 × 1920 · on dark, the glass glows", w: 1080, h: 1920, fit: "contain", html: igStory },
    { id: "li", cat: "social", title: "LinkedIn banner", spec: "1584 × 396 · left side kept clear for the profile photo", w: 1584, h: 396, fit: "contain", html: linkedin },
    { id: "av", cat: "social", title: "Profile pictures", spec: "Circle crop · sand and dark", w: 1200, h: 640, fit: "contain", html: avatars },
  ];

  R.water = () => `
    <div class="wlab"><div class="wlab-stage" id="labStage"></div><div class="wlab-side wctl" id="labCtl"></div></div>`;

  R.apply = () => {
    const m = me(), f = state.cat || "all";
    const list = ARTS.filter((a) => f === "all" || a.cat === f);
    return `
    <header class="view-head"><span class="eyebrow">Apply</span><h1>The mark at work.</h1>
      <p class="lede">Every piece is designed at its real size and updates with your choices: the mark, the glass, the angle, the wordmark and your details below. Tap any piece to see it large.</p></header>
    <details class="me" ${state.meOpen ? "open" : ""}><summary><span>Your details</span><em>${esc(m.name)} · ${esc(m.role)}</em></summary>
      <div class="me-f">${[["name", "Name"], ["role", "Role"], ["email", "Email"], ["phone", "Phone"]].map(([k, l]) => `<label><span>${l}</span><input id="me-${k}" data-me="${k}" value="${esc(m[k])}" autocomplete="off"></label>`).join("")}</div></details>
    <div class="filters" role="tablist" data-glide="cat" data-keep="cat">${[["all", "All", ARTS.length], ...Object.entries(CAT).map(([k, n]) => [k, n, ARTS.filter((a) => a.cat === k).length])].map(([k, n, c]) => `<button data-act="cat" data-v="${k}" aria-pressed="${f === k}">${n}<span class="c">${c}</span></button>`).join("")}</div>
    <div class="apps">${list.map((a) => { const pc = PIECES[a.id] || [], first = pc[0] ? piecePath(a.id, pc[0][0]) : ""; return `<div class="app-card"><button class="fr-btn" data-act="open" data-id="${a.id}" aria-label="open ${a.title}"><div class="fr" data-art="${a.id}"></div></button><div class="cap"><div class="cap-t"><b>${a.title}</b>${pc.length > 1 ? `<span>${pc.length} files</span>` : ""}</div><div class="fbs">${first ? `<button class="fb ic-only" data-act="${pc.length > 1 ? "open" : "dl"}" data-id="${a.id}" data-u="${first}" aria-label="download">${DL_IC}</button><button class="fb ic-only" data-act="cp" data-u="${first}" aria-label="copy image">${IC.copy}</button>` : ""}</div></div></div>`; }).join("")}</div>`;
  };

  /* ---------- artboard placement ---------- */
  function mountArt(el, a, mode = "cover") {
    if (!el._art || el._art !== a.id + "|" + stamp) { el.innerHTML = `<div class="ab" style="width:${a.w}px;height:${a.h}px">${a.html()}</div>`; el._art = a.id + "|" + stamp; }
    fitArt(el, a, mode);
  }
  function fitArt(el, a, mode) {
    const ab = el.firstElementChild; if (!ab) return;
    const W = el.clientWidth, H = el.clientHeight;
    const k = mode === "cover" ? 1 : el.classList.contains("v") ? 0.94 : 0.84;
    const s = mode === "cover" ? Math.max(W / a.w, H / a.h) : Math.min(W / a.w, H / a.h) * k;
    ab.style.transform = `translate(${(W - a.w * s) / 2}px, ${(H - a.h * s) / 2}px) scale(${s})`;
  }
  const ro = new ResizeObserver((es) => es.forEach((e) => { const a = ARTS.find((x) => x.id === e.target.dataset.art); if (a) fitArt(e.target, a, e.target.dataset.mode || "cover"); }));
  let stamp = 1;
  function mountAll(root = document) {
    $$(".fr[data-art]", root).forEach((el) => {
      const a = ARTS.find((x) => x.id === el.dataset.art);
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { el.dataset.mode = el.dataset.mode || a.fit || "cover"; mountArt(el, a, el.dataset.mode); ro.observe(el); io.disconnect(); } }), { rootMargin: "400px" });
      io.observe(el);
    });
  }

  /* ---------- viewer ---------- */
  let vList = [], vIdx = 0;
  function openViewer(id) {
    const f = state.cat || "all";
    vList = ARTS.filter((a) => f === "all" || a.cat === f); vIdx = Math.max(0, vList.findIndex((a) => a.id === id));
    const v = $("#viewer"); v.hidden = false; document.body.style.overflow = "hidden";
    const tr = $("#track"); tr.innerHTML = vList.map((a) => `<div class="slide"><div class="fr v" data-art="${a.id}" data-mode="contain"></div></div>`).join("");
    requestAnimationFrame(() => { tr.scrollLeft = vIdx * tr.clientWidth; mountViewer(); });
  }
  function mountViewer() {
    const a = vList[vIdx]; $("#vT").textContent = a.title; $("#vS").textContent = a.spec; $("#vN").textContent = `${vIdx + 1} / ${vList.length}`;
    $("#vDl").innerHTML = (PIECES[a.id] || []).map(([n]) => `<div class="vd"><span>${n}</span>${fileBtns(piecePath(a.id, n))}</div>`).join("");
    $$("#track .fr").forEach((el, i) => { if (Math.abs(i - vIdx) <= 1) { mountArt(el, vList[i], "contain"); ro.observe(el); } });
  }
  function closeViewer() { $("#viewer").hidden = true; document.body.style.overflow = ""; $("#track").innerHTML = ""; }
  function go(d) { const tr = $("#track"); vIdx = Math.min(vList.length - 1, Math.max(0, vIdx + d)); tr.scrollTo({ left: vIdx * tr.clientWidth, behavior: "smooth" }); mountViewer(); }

  /* ---------- motion ---------- */
  function heroSVG(el, its, mat, size) { el.innerHTML = P.render(its, { size, material: mat, animatable: true, pad: 0.04 }); return el.firstElementChild; }
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function assemble(svg, its) {
    if (reduce() || !svg) return;
    const Rr = P.rng((Date.now() & 0xffff) + 1), corner = state.ori === "r" ? [1000, 1000] : [0, 1000];
    const order = its.map((it, i) => ({ i, d: Math.hypot(...P.sub(P.centroid(it.poly), corner)) })).sort((a, b) => a.d - b.d);
    order.forEach(({ i }, rank) => {
      const c0 = P.centroid(its[i].poly), ang = Rr() * Math.PI * 2, dist = 420 + Rr() * 420;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist * 0.6, rot = (Rr() - 0.5) * 120;
      svg.querySelectorAll(`[data-i="${i}"]`).forEach((el) => {
        el.style.transformOrigin = `${c0[0]}px ${c0[1]}px`;
        el.animate([{ transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }, { opacity: 1, offset: 0.25 }, { transform: "none", opacity: 1 }], { duration: 1500, delay: 150 + rank * (900 / its.length), easing: "cubic-bezier(.22,1.18,.36,1)", fill: "backwards" });
      });
    });
  }
  /* ---------- water ---------- */
  const WATER_UNUSED = phoneish() ? { strength: 1.5, swirl: 14, fade: 0.9, split: 0.32, sheen: 0.5, size: 1.3, force: 6500, simRes: 96, pressureIters: 14 }
                           : { strength: 1.5, swirl: 16, fade: 0.85, split: 0.32, sheen: 0.5, size: 1.25, force: 6500, simRes: 128, pressureIters: 18 };
  function phoneish() { return matchMedia("(max-width: 959px), (pointer: coarse)").matches; }
  let noiseImg = new Image(); noiseImg.src = NOISE; let noisePat = null;
  function sandBg(ctx, w, h, kind) {
    const base = kind === "dark" ? "#1B2023" : kind === "paper" ? "#F7F5F0" : kind === "wet" ? "#E2DACB" : "#ECE7DE";
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    if (noiseImg.complete && noiseImg.naturalWidth) { noisePat = noisePat || ctx.createPattern(noiseImg, "repeat"); ctx.save(); ctx.globalAlpha = kind === "dark" ? 0.1 : 0.28; ctx.globalCompositeOperation = kind === "dark" ? "screen" : "multiply"; ctx.fillStyle = noisePat; ctx.fillRect(0, 0, w, h); ctx.restore(); }
    if (kind !== "dark") { ctx.save(); ctx.lineWidth = 1.2; ctx.strokeStyle = kind === "paper" ? "rgba(90,75,50,.035)" : "rgba(90,70,40,.06)";
      for (let y = -40, i = 0; y < h + 40; y += 17, i++) { ctx.beginPath(); for (let x = -10; x <= w + 10; x += 12) { const yy = y + Math.sin(x * 0.018 + i * 0.7) * 5 + Math.sin(x * 0.051 + i * 1.9) * 2; x < 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      ctx.restore(); }
    let g = ctx.createRadialGradient(w * 0.18, -h * 0.1, 0, w * 0.18, -h * 0.1, Math.max(w, h) * 1.1);
    g.addColorStop(0, kind === "dark" ? "rgba(190,215,230,.07)" : "rgba(255,252,244,.55)"); g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    g = ctx.createRadialGradient(w, h, 0, w, h, Math.max(w, h) * 0.9);
    g.addColorStop(0, kind === "dark" ? "rgba(0,0,0,.35)" : "rgba(70,55,30,.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  // Each stone as two images (its shadow and its glass), so they can fly in one by one under the water.
  function stoneLayers(its, mat, px) {
    const all = P.bbox(its.flatMap((i) => i.poly)), S = Math.max(all.w, all.h), pad = 0.04 * S, room = 0.19 * S;
    const vb = [all.x - pad - 0.25 * room, all.y - pad - 0.25 * room, all.w + 2 * pad + 1.25 * room, all.h + 2 * pad + 1.25 * room];
    const svg = P.render(its, { size: px, material: mat, viewBox: vb, animatable: true });
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml"), ser = new XMLSerializer();
    const make = (i, cls) => {
      const d = doc.cloneNode(true);
      d.querySelectorAll("[data-i]").forEach((g) => { if (+g.getAttribute("data-i") !== i || g.getAttribute("class") !== cls) g.remove(); });
      if (!d.querySelector("[data-i]")) return null;
      const im = new Image(); im.decoding = "async"; im.src = uri(ser.serializeToString(d)); return im;
    };
    return { all, pad, vb, sh: its.map((_, i) => make(i, "sh")), pb: its.map((_, i) => make(i, "pb")), c: its.map((it) => P.centroid(it.poly)) };
  }
  let heroPond = null, heroKey = "", heroL = null, heroPlan = null;
  const easeBack = (u) => { const c1 = 1.1, c3 = c1 + 1, x = u - 1; return 1 + c3 * x * x * x + c1 * x * x; };
  function heroPaint(ctx, w, h, t, pond) {
    const kind = state.mat === "glow" ? "dark" : state.mat === "glass" ? "sand" : "paper";
    sandBg(ctx, w, h, kind);
    if (!heroL) return;
    const L = heroL, cw = L.all.w + 2 * L.pad, ch = L.all.h + 2 * L.pad;
    const k = Math.min((w * (w < 600 ? 0.66 : 0.5)) / cw, (h * 0.66) / ch);
    const cx = L.all.x + L.all.w / 2, cy = L.all.y + L.all.h / 2;
    const ox = w / 2 - (cx - L.vb[0]) * k, oy = h * 0.47 - (cy - L.vb[1]) * k, W = L.vb[2] * k, H = L.vb[3] * k;
    const plan = heroPlan;
    for (const layer of ["sh", "pb"]) L[layer].forEach((im, i) => {
      if (!im || !im.complete || !im.naturalWidth) return;
      let a = 1, dx = 0, dy = 0, r = 0;
      if (plan && isFinite(t)) {
        const p = plan[i], u = Math.max(0, Math.min(1, (t - p.delay) / 1500));
        if (u <= 0) return;
        const e = easeBack(u); a = Math.min(1, u / 0.22); dx = (1 - e) * p.dx; dy = (1 - e) * p.dy; r = (1 - e) * p.rot;
        if (layer === "pb" && u > 0.5 && !p.landed) { p.landed = true; const c = L.c[i]; pond.ripple((ox + (c[0] - L.vb[0]) * k) / w, (oy + (c[1] - L.vb[1]) * k) / h, (0.22 + 0.22 * p.size)); }
      }
      const c = L.c[i], px = ox + (c[0] - L.vb[0]) * k, py = oy + (c[1] - L.vb[1]) * k;
      ctx.save(); ctx.globalAlpha = a;
      ctx.translate(px + dx * k, py + dy * k); ctx.rotate(r); ctx.translate(-px, -py);
      ctx.drawImage(im, ox, oy, W, H); ctx.restore();
    });
  }
  function drawHero(play) {
    const host = $("#hero"); if (!host) return;
    if (!heroPond) { heroPond = new Pond({ paint: heroPaint, onTouch: () => buzz(6), ...pondOpts("hero") }); applyWater("hero"); }
    heroPond.attach(host);
    const its = items(), key = [state.L, state.pal, state.ori, state.mat].join("|");
    const go = () => {
      if (play) {
        const Rr = P.rng((Date.now() & 0xffff) + 3), corner = state.ori === "r" ? [1000, 1000] : [0, 1000];
        const big = Math.max(...its.map((it) => Math.abs(P.area(it.poly))));
        const order = its.map((it, i) => ({ i, d: Math.hypot(...P.sub(P.centroid(it.poly), corner)) })).sort((a, b) => a.d - b.d);
        heroPlan = []; order.forEach(({ i }, rank) => { const ang = Rr() * Math.PI * 2, dist = 380 + Rr() * 380; heroPlan[i] = { delay: 200 + rank * (900 / its.length), dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist * 0.6 - 120, rot: (Rr() - 0.5) * 2, size: Math.abs(P.area(its[i].poly)) / big }; });
        heroPond.play(200 + 900 + 1600);
      } else heroPond.paint();
    };
    if (key !== heroKey || !heroL) {
      heroKey = key;
      const px = Math.min(1500, Math.round((heroPond.w || host.clientWidth || 800) * Math.min(devicePixelRatio || 1, 2) * 0.75));
      heroL = stoneLayers(its, state.mat, px);
      const imgs = [...heroL.sh, ...heroL.pb].filter(Boolean);
      Promise.all(imgs.map((im) => im.decode().catch(() => {}))).then(() => { if (heroKey === key) go(); });
      heroPond.paint();
    } else go();
  }

  /* ---------- water settings ---------- */
  const PRESETS = {
    yours:   { name: "your code", strength: 1, swirl: 20, fade: 1.2, split: 0.25, sheen: 0.45, size: 1, force: 6000, simRes: 128, pressureIters: 20, dpr: 2, autoWander: true, tap: 0, drip: 0, dripPower: 0.45 },
    still:   { name: "still", strength: 0.8, swirl: 6, fade: 2.2, split: 0.12, sheen: 0.2, size: 1, force: 4000, tap: 0.6, drip: 0, dripPower: 0.3 },
    shallow: { name: "shallow", strength: 1.4, swirl: 14, fade: 0.95, split: 0.28, sheen: 0.32, size: 1.25, force: 6500, tap: 1, drip: 3200, dripPower: 0.45 },
    tide:    { name: "tide pool", strength: 2.2, swirl: 28, fade: 0.55, split: 0.45, sheen: 0.7, size: 1.6, force: 9000, tap: 1.3, drip: 2000, dripPower: 0.7 },
    choppy:  { name: "choppy", strength: 3, swirl: 45, fade: 0.35, split: 0.6, sheen: 0.9, size: 2, force: 12000, tap: 1.6, drip: 900, dripPower: 1 },
  };
  const QUALITY = phoneish() ? { simRes: 96, pressureIters: 14, dpr: 2 } : { simRes: 128, pressureIters: 18, dpr: 2 };
  const PLACES = [["hero", "mark hero"], ["foot", "footer"], ["page", "whole page"]];
  const SLIDERS = [
    ["strength", "distortion", 0, 4, 0.05], ["swirl", "swirl", 0, 60, 1], ["fade", "settle", 0.1, 4, 0.05], ["split", "colour fringe", 0, 1, 0.01],
    ["sheen", "glint", 0, 1.5, 0.01], ["size", "brush", 0.3, 3, 0.05], ["force", "push", 0, 15000, 100], ["tap", "tap ripple", 0, 2, 0.05],
    ["drip", "drip every (ms, 0 = off)", 0, 8000, 100], ["dripPower", "drip size", 0, 2, 0.05],
    ["simRes", "detail", 48, 256, 16], ["pressureIters", "accuracy", 4, 40, 1], ["dpr", "pixel ratio", 1, 2, 0.25],
  ];
  const WDEF = { v: 2, hero: { enabled: true, preset: "yours", custom: {} }, foot: { enabled: true, preset: "yours", custom: {} }, page: { enabled: false, preset: "yours", custom: {} }, paused: false, place: "hero" };
  if (!state.water || state.water.v !== 2) state.water = clone(WDEF);
  state.water = Object.assign(clone(WDEF), state.water);
  for (const [p] of PLACES) state.water[p] = Object.assign(clone(WDEF[p]), state.water[p] || {});
  const wcfg = (p) => { const w = state.water[p]; return Object.assign({ autoWander: false }, QUALITY, PRESETS[w.preset] || PRESETS.yours, w.custom); };
  const toWater = (c) => ({ autoWander: !!c.autoWander, strength: c.strength, swirl: c.swirl, fade: c.fade, split: c.split, sheen: c.sheen, size: c.size, force: c.force, simRes: c.simRes, pressureIters: c.pressureIters, dprCap: c.dpr });
  const pondOpts = (p) => { const c = wcfg(p); return { water: toWater(c), drip: c.drip, dripPower: c.dripPower, tap: c.tap, dpr: c.dpr }; };
  let pagePond = null;
  const pondFor = (p) => (p === "hero" ? heroPond : p === "foot" ? footPond : pagePond);
  function applyWater(p) {
    if (p === "page") {
      const on = state.water.page.enabled && !state.water.paused;
      if (on && !pagePond) { pagePond = new Pond({ paint: pagePaint, fixed: true, ...pondOpts("page") }); document.body.prepend(pagePond.el); }
      if (!on && pagePond) { pagePond.destroy(); pagePond = null; return; }
    }
    if (p === state.water.place && typeof cfgPreview === "function") cfgPreview();
    const pond = pondFor(p); if (!pond) return;
    const c = wcfg(p);
    pond.config({ ...toWater(c), drip: c.drip, dripPower: c.dripPower, tap: c.tap, enabled: state.water[p].enabled && !state.water.paused });
    if (pond.o.dpr !== c.dpr) { pond.o.dpr = c.dpr; pond.resize(); }
  }
  const applyAll = (p) => { applyWater(p); if (p === state.water.place) cfgPreview(); };
  function pagePaint(ctx, w, h) {
    const dark = matchMedia("(prefers-color-scheme: dark)").matches && document.documentElement.dataset.theme !== "light" || document.documentElement.dataset.theme === "dark";
    ctx.fillStyle = dark ? "#15191B" : "#F2EFE8"; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.lineWidth = 1.1; ctx.strokeStyle = dark ? "rgba(255,255,255,.035)" : "rgba(90,70,40,.05)";
    for (let y = -40, i = 0; y < h + 40; y += 19, i++) { ctx.beginPath(); for (let x = -10; x <= w + 10; x += 14) { const yy = y + Math.sin(x * 0.014 + i * 0.7) * 6 + Math.sin(x * 0.043 + i * 1.9) * 2; x < 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
    ctx.restore();
  }
  const fmtV = (k, v) => (k === "drip" ? (v ? `${(v / 1000).toFixed(1)} s` : "off") : k === "force" ? Math.round(v) : k === "simRes" || k === "pressureIters" || k === "swirl" ? Math.round(v) : (+v).toFixed(2));
  const GROUPS = [["surface", ["strength", "split", "sheen"]], ["flow", ["swirl", "fade", "force", "size"]], ["touch", ["tap"]], ["drips", ["drip", "dripPower"]], ["quality", ["simRes", "pressureIters", "dpr"]]];
  const SL = Object.fromEntries(SLIDERS.map((x) => [x[0], x]));
  const pct = (k, v) => { const [, , a, b] = SL[k]; return Math.max(0, Math.min(100, ((v - a) / (b - a)) * 100)).toFixed(1) + "%"; };
  function sliderHTML(k, c, base) {
    const [, n, a, b, st] = SL[k], changed = c[k] !== base[k];
    return `<div class="wsl"><span class="wsl-t"><label for="wr-${k}">${n.replace(" (ms, 0 = off)", "")}</label><button class="wv${changed ? " ch" : ""}" data-act="wkreset" data-k="${k}" id="wo-${k}" title="back to the preset">${fmtV(k, c[k])}</button></span><input type="range" id="wr-${k}" data-wk="${k}" min="${a}" max="${b}" step="${st}" value="${c[k]}" style="--p:${pct(k, c[k])}"></div>`;
  }
  const WKEYS = ["strength", "swirl", "fade", "split", "sheen", "size", "force", "simRes", "pressureIters", "dpr", "autoWander", "tap", "drip", "dripPower"];
  const pickCfg = (c) => Object.fromEntries(WKEYS.map((k) => [k, c[k]]));
  function snippet(c, label) {
    const n = (v) => (typeof v === "boolean" ? v : Math.round(v * 1000) / 1000);
    return `// Fieldwise water${label ? ", " + label : ""}\nconst water = new WaterLayer(canvas, {\n  strength: ${n(c.strength)}, swirl: ${n(c.swirl)}, fade: ${n(c.fade)}, split: ${n(c.split)}, sheen: ${n(c.sheen)},\n  size: ${n(c.size)}, force: ${n(c.force)}, simRes: ${n(c.simRes)}, pressureIters: ${n(c.pressureIters)}, dprCap: ${n(c.dpr)},\n  autoWander: ${!!c.autoWander},\n});\n// kit extras: tap ripple ${n(c.tap)}, drip every ${n(c.drip)} ms, drip size ${n(c.dripPower)}`;
  }
  // Read values from JSON or from a WaterLayer snippet.
  function parseCfg(text) {
    const out = {}; let m; const re = /([A-Za-z]+)\s*["']?\s*:\s*(true|false|-?\d*\.?\d+)/g;
    const alias = { dprCap: "dpr" };
    while ((m = re.exec(text))) { const k = alias[m[1]] || m[1]; if (WKEYS.includes(k)) out[k] = m[2] === "true" ? true : m[2] === "false" ? false : +m[2]; }
    const ex = /tap ripple (-?[\d.]+), drip every (-?[\d.]+) ms, drip size (-?[\d.]+)/.exec(text);
    if (ex) { out.tap = +ex[1]; out.drip = +ex[2]; out.dripPower = +ex[3]; }
    return out;
  }
  const linkFor = (W) => location.origin + location.pathname + "?w=" + btoa(unescape(encodeURIComponent(JSON.stringify({ hero: W.hero, foot: W.foot, page: W.page })))) + "#water";
  async function send(text, url) {
    try { if (navigator.share) { await navigator.share({ title: "Fieldwise water", text, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    copy(text + "\n" + url, "copied, paste it anywhere");
  }
  function savedHTML() {
    const L = state.waterSaved || [];
    return `<section class="wg"><h4>saved</h4>
      <div class="sv-new"><input id="svName" placeholder="name this water" autocomplete="off" maxlength="40"><button data-act="wsave">save</button></div>
      ${L.length ? `<div class="sv-list">${L.map((x, i) => `<div class="sv-row"><button class="sv-use" data-act="wload" data-i="${i}">${esc(x.name)}</button><button class="sv-b" data-act="wsend1" data-i="${i}">send</button><button class="sv-b" data-act="wcopy1" data-i="${i}">copy</button><button class="sv-b sv-x" data-act="wdrop" data-i="${i}" aria-label="remove ${esc(x.name)}">×</button></div>`).join("")}</div>` : ""}
    </section>
    <section class="wg"><h4>share</h4>
      <div class="wp-act"><button data-act="wcode">copy values</button><button data-act="wcopy">copy json</button><button data-act="wlink">copy link</button><button data-act="wsend">send</button><button data-act="wpaste">paste values</button></div>
      <div class="paste" id="pasteBox" hidden><textarea id="pasteTxt" rows="5" placeholder="paste a WaterLayer config or JSON"></textarea><button data-act="wpasteok">use these values</button></div>
    </section>`;
  }
  function waterTabHTML(withPreview = true) {
    const W = state.water, p = W.place, w = W[p], c = wcfg(p), custom = Object.keys(w.custom).length > 0;
    const base = Object.assign({ autoWander: false }, QUALITY, PRESETS[w.preset] || PRESETS.yours);
    return `
      
      <div class="seg3" data-glide="wplace">${PLACES.map(([k, n]) => `<button data-act="wplace" data-v="${k}" aria-pressed="${p === k}">${n}</button>`).join("")}</div>
      <label class="sw-row"><span>water here</span><input type="checkbox" class="tog" data-wk="enabled" ${w.enabled ? "checked" : ""}></label>
      <div><div class="wp-l">feel${custom ? " · tweaked" : ""}</div><div class="seg4" data-glide="wpreset">${Object.entries(PRESETS).map(([k, x]) => `<button data-act="wpreset" data-v="${k}" aria-pressed="${!custom && w.preset === k}">${x.name}</button>`).join("")}</div></div>
      ${GROUPS.map(([g, keys]) => {
        const body = (g === "touch" ? `<label class="sw-row sm"><span>drift until touched</span><input type="checkbox" class="tog" data-wk="autoWander" ${c.autoWander ? "checked" : ""}></label>` : "") + keys.map((k) => sliderHTML(k, c, base)).join("");
        return g === "quality" ? `<details class="wg"${state.wq ? " open" : ""}><summary>${g}</summary>${body}</details>` : `<section class="wg"><h4>${g}</h4>${body}</section>`;
      }).join("")}
      <label class="sw-row"><span>pause all water</span><input type="checkbox" class="tog" data-wk="paused" ${W.paused ? "checked" : ""}></label>
      <div class="wp-act"><button data-act="wreset">reset</button><button data-act="wall">use for all places</button>${p !== "page" ? `<button data-act="wshow">show it</button>` : ""}</div>
      ${savedHTML()}`;
  }
  function archiveTabHTML() {
    const grid = (list, key) => `<div class="ar-grid" data-glide="ar-${key}" data-glide-style="ring">${list.map((x) => `<button data-set="L" data-v="${x.key}" aria-pressed="${state.L === x.key}" aria-label="${markName(x.key)}"><span class="k">${pad2(x.n)}</span>${markImg("glass", 56, { L: x.key })}</button>`).join("")}</div>`;
    const off = state.L !== FINAL || state.pal !== "field";
    return `
      ${off ? `<button class="ar-back" data-act="final">back to no. 06 in field</button>` : ""}
      <div><div class="wp-l">the mark</div>${grid(LAY.filter((x) => x.key === FINAL), "final")}</div>
      <div><div class="wp-l">shortlist</div>${grid(LAY.filter((x) => SHORT.has(x.n) && x.key !== FINAL), "short")}</div>
      <div><div class="wp-l">earlier</div>${grid(LAY.filter((x) => !SHORT.has(x.n)), "early")}</div>
      <div><div class="wp-l">glass</div><div class="pals" data-glide="ar-pals">${Object.entries(SETS).map(([k, x]) => `<button data-set="pal" data-v="${k}" aria-pressed="${state.pal === k}">${dotsHTML(k)}<span>${x.name}</span></button>`).join("")}</div></div>`;
  }
  let wpPond = null, wpMark = null, wpMarkKey = "";
  function wpPaint(ctx, w, h, t, pond) {
    const p = state.water.place;
    if (p === "foot") return footPaint(ctx, w, h);
    if (p === "page") return pagePaint(ctx, w, h);
    sandBg(ctx, w, h, state.mat === "glow" ? "dark" : "sand");
    const key = [state.L, state.pal, state.ori, state.mat].join("|");
    if (wpMarkKey !== key) { wpMarkKey = key; wpMark = new Image(); wpMark.src = uri(P.render(items(), { size: 700, material: state.mat === "glow" ? "glow" : "glass", pad: 0.04, room: true })); wpMark.decode().then(() => wpPond && wpPond.paint()).catch(() => {}); }
    if (wpMark.complete && wpMark.naturalWidth) { const s = Math.min((h * 0.86) / wpMark.naturalHeight, (w * 0.7) / wpMark.naturalWidth); const iw = wpMark.naturalWidth * s, ih = wpMark.naturalHeight * s; ctx.drawImage(wpMark, (w - iw) / 2 + iw * 0.06, (h - ih) / 2 + ih * 0.06, iw, ih); }
  }
  function cfgPreview() {
    if (!wpPond) return;
    const c = wcfg(state.water.place);
    wpPond.config({ ...toWater(c), drip: c.drip, dripPower: c.dripPower, tap: c.tap, enabled: !state.water.paused });
    if (wpPond.o.dpr !== c.dpr) { wpPond.o.dpr = c.dpr; wpPond.resize(); }
    if (wpPond.water && c.autoWander) { wpPond.water.touched = false; wpPond.water._wp = null; }
  }
  function drawLab(keepScroll) {
    const ctl = $("#labCtl"), stage = $("#labStage"); if (!ctl) return;
    const y = ctl.scrollTop;
    ctl.innerHTML = waterTabHTML(false);
    ctl.scrollTop = keepScroll ? y : 0;
    if (!wpPond) wpPond = new Pond({ paint: wpPaint, onTouch: () => buzz(5), ...pondOpts(state.water.place) });
    wpPond.attach(stage); cfgPreview(); wpPond.paint();
    glides(ctl);
  }
  const redrawCtl = (keep) => (view === "water" ? drawLab(keep) : drawWP(keep));
  function drawWP(keepScroll) {
    const b = $("#wpb"); if (!b) return;
    const y = b.scrollTop;
    b.innerHTML = archiveTabHTML();
    b.scrollTop = keepScroll ? y : 0;
    glides($("#wp"));
  }
  function openWP(on) {
    const el = $("#wp"); el.hidden = !on; document.body.classList.toggle("wp-on", on);
    if (on) { drawWP(); buzz(6); } else if (wpPond && view !== "water") { wpPond.destroy(); wpPond = null; }
  }
  document.addEventListener("toggle", (e) => { if (e.target.classList && e.target.classList.contains("wg")) { state.wq = e.target.open; save(); } }, true);
  document.addEventListener("input", (e) => {
    const k = e.target.dataset && e.target.dataset.wk; if (!k) return;
    const W = state.water, p = W.place;
    if (k === "paused") { W.paused = e.target.checked; PLACES.forEach(([x]) => applyWater(x)); cfgPreview(); }
    else if (k === "enabled") { W[p].enabled = e.target.checked; applyWater(p); }
    else if (k === "autoWander") { W[p].custom.autoWander = e.target.checked; applyWater(p); cfgPreview(); const pond = pondFor(p); if (pond && pond.water && e.target.checked) { pond.water.touched = false; pond.water._wp = null; } }
    else {
      const v = +e.target.value; W[p].custom[k] = v;
      e.target.style.setProperty("--p", pct(k, v));
      const o = $("#wo-" + k); if (o) { o.textContent = fmtV(k, v); o.classList.add("ch"); }
      applyWater(p);
      const box = e.target.closest(".wctl") || $("#wpb");
      const l = box.querySelector(".wp-l"); if (l) l.textContent = "feel · tweaked";
      box.querySelectorAll('[data-act="wpreset"]').forEach((x) => x.setAttribute("aria-pressed", "false")); glides(box);
    }
    clearTimeout(drawWP._t); drawWP._t = setTimeout(save, 300);
  });
  // A shared link carries the water settings: ?w=…
  (() => {
    const q = new URLSearchParams(location.search).get("w"); if (!q) return;
    try {
      const o = JSON.parse(decodeURIComponent(escape(atob(q))));
      for (const [p] of PLACES) if (o[p]) state.water[p] = Object.assign(clone(WDEF[p]), o[p]);
      save(); history.replaceState(null, "", location.pathname + location.hash);
      setTimeout(() => toast("water settings loaded from the link"), 600);
    } catch (e) {}
  })();
  addEventListener("keydown", (e) => { if (e.key === "w" && !/input|textarea/i.test(e.target.tagName) && !e.metaKey && !e.ctrlKey) location.hash = view === "water" ? "mark" : "water"; });

  /* ---------- footer pond ---------- */
  let footPond = null;
  function footPaint(ctx, w, h) {
    sandBg(ctx, w, h, "wet");
    const bw = Math.round(w / 40) * 40, bh = Math.round(h / 40) * 40;
    const fim = footPaint._img && footPaint._key === bw + "x" + bh + state.pal ? footPaint._img : null;
    if (!fim) {
      footPaint._key = bw + "x" + bh + state.pal;
      const im = new Image(); im.src = fieldSrc(bw * 2, bh * 2, { seed: 9, scale: w < 600 ? 0.3 : 0.36, mat: "glass", lit: 0.06, density: 0.6, gap: 34, only: (x, y, W, H) => W < 1000 ? (y > H * 0.36 && y < H * 0.66) : (x > W * 0.52 && y > H * 0.04 && y < H * 0.5) });
      footPaint._img = im; im.decode().then(() => footPond && footPond.paint()).catch(() => {});
    } else if (fim.complete) { ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(fim, 0, 0, w, h); ctx.restore(); }
    const fs = Math.min(w * 0.235, 300);
    ctx.save();
    ctx.font = `${state.wm === "serif" ? 400 : state.wm === "inter" ? 600 : 500} ${fs * (state.wm === "serif" ? 1.12 : 1)}px ${wmFont()}`;
    try { ctx.letterSpacing = `${-0.035 * fs}px`; } catch (e) {}
    ctx.fillStyle = "#18241F"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Fieldwise", w * 0.04, h - fs * 0.2);
    ctx.restore();
  }
  function drawFoot() {
    const host = $("#footWater"); if (!host) return;
    if (!footPond) {
      footPond = new Pond({ paint: footPaint, onTouch: () => buzz(6), ...pondOpts("foot") }); applyWater("foot");
      footPond.attach(host);
      document.fonts && document.fonts.ready.then(() => footPond.paint());
    } else footPond.paint();
  }
  function drawMotion(play, L) {
    const el = $("#mstage"); if (!el) return;
    const its = items(L || state.L);
    el.innerHTML = P.render(its, { size: 700, material: state.mat === "glow" ? "glow" : state.mat, animatable: true, pad: 0.04 });
    if (play) assemble(el.firstElementChild, its);
  }
  let loaderAnims = [];
  function drawLoaders() {
    loaderAnims.forEach((a) => a.cancel()); loaderAnims = [];
    [["#ld1", "glass"], ["#ld2", "glow"]].forEach(([sel, mat]) => {
      const el = $(sel); if (!el) return;
      const its = items(), milk = its.map((it) => ({ ...it, color: "#D8E1D9" }));
      el.innerHTML = P.render(milk, { size: 300, material: mat, pad: 0.04 }) + P.render(its, { size: 300, material: mat, pad: 0.04, animatable: true });
      if (reduce()) return;
      const top = el.lastElementChild, corner = state.ori === "r" ? [1000, 1000] : [0, 1000];
      const order = its.map((it, i) => ({ i, d: Math.hypot(...P.sub(P.centroid(it.poly), corner)) })).sort((a, b) => a.d - b.d);
      const step = 160, total = its.length * step + 1400;
      order.forEach(({ i }, rank) => top.querySelectorAll(`[data-i="${i}"]`).forEach((g) => {
        const t0 = (rank * step) / total, t1 = (rank * step + 380) / total, t2 = (its.length * step + 700) / total, t3 = (its.length * step + 1100) / total;
        loaderAnims.push(g.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: t0 }, { opacity: 1, offset: t1 }, { opacity: 1, offset: t2 }, { opacity: 0, offset: t3 }, { opacity: 0, offset: 1 }], { duration: total, iterations: Infinity, easing: "ease-in-out" }));
      }));
    });
  }

  /* ---------- choose: carousel count on phones ---------- */
  function watchPicker() {
    const pk = $("#picker"); if (!pk) return;
    const cards = $$(".pk", pk), dots = $("#pkDots");
    const upd = () => {
      if (!phone()) { cards.forEach((c) => { c.style.transform = ""; c.style.opacity = ""; }); return; }
      const pr = pk.getBoundingClientRect(), mid = pr.left + pr.width / 2; let best = 0, bd = 1e9;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect(), d = (r.left + r.width / 2 - mid) / r.width, a = Math.min(Math.abs(d), 1);
        c.style.transform = `scale(${(1 - 0.07 * a).toFixed(4)})`; c.style.opacity = (1 - 0.45 * a).toFixed(3);
        if (Math.abs(d) < bd) { bd = Math.abs(d); best = i; }
      });
      if (dots && dots._i !== best) { if (dots._i != null) buzz(3); dots._i = best; $$("b", dots).forEach((b, i) => b.setAttribute("aria-pressed", String(i === best))); glides(dots); $("#pkN").textContent = `${best + 1} / ${LAY.length}`; }
    };
    pk.addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true });
    pk._upd = upd;
    if (phone()) { const cur = cards.findIndex((x) => x.dataset.k === state.L); if (cur > 0) pk.scrollLeft = cur * (cards[0].getBoundingClientRect().width + 12); }
    upd();
  }
  const phone = () => matchMedia("(max-width: 959px)").matches;

  /* ---------- render + routing ---------- */
  let view = "";
  function draw(play) {
    stamp++;
    const main = $("#view"); main.innerHTML = R[view]();
    $$(".cz-host").forEach((h) => (h.innerHTML = panelHTML()));
    $$("[data-nav]").forEach((a) => a.setAttribute("aria-current", a.dataset.nav === view ? "page" : "false"));
    const v = VIEWS.find((x) => x[0] === view) || ["water", "Water"]; $("#tbT").textContent = v[1]; document.body.dataset.view = view; $("#tbS").textContent = markName();
    document.documentElement.dataset.wm = state.wm;
    if (view === "mark") { drawHero(play); drawMotion(false); drawLoaders(); } else { loaderAnims.forEach((a) => a.cancel()); loaderAnims = []; }
    if (view === "apply") mountAll(main);
    if (view === "choose") watchPicker();
  }
  function route(first) {
    const h = location.hash.slice(1);
    const next = VIEWS.some((v) => v[0] === h) || h === "water" ? h : "mark";
    const changed = next !== view; view = next;
    if (changed && !first) window.scrollTo({ top: 0, behavior: "instant" });
    draw(true, changed || first);
  }
  window.addEventListener("hashchange", () => route());

  function set(key, v) {
    state[key] = v; save();
    const keepY = window.scrollY;
    const pkLeft = $("#picker")?.scrollLeft;
    buzz(8);
    draw(key === "L" || key === "ori" || key === "mat");
    window.scrollTo(0, keepY);
    if (pkLeft != null && $("#picker")) $("#picker").scrollLeft = pkLeft;
    if (key === "L") toast(markName() + " in use");
  }

  document.addEventListener("click", (e) => {
    const dot = e.target.closest("[data-dot]");
    if (dot) { const pk = $("#picker"), c = $$(".pk", pk)[+dot.dataset.dot]; pk.scrollTo({ left: c.offsetLeft - (pk.clientWidth - c.offsetWidth) / 2, behavior: "smooth" }); return; }
    const b = e.target.closest("[data-set],[data-act],[data-copy]"); if (!b) return;
    if (b.dataset.copy) return copy(b.dataset.copy, b.dataset.copy + " copied");
    if (b.dataset.act === "dl") return dl(b.dataset.u);
    if (b.dataset.act === "cp") return copyImg(b.dataset.u);
    if (b.dataset.set) return set(b.dataset.set, b.dataset.v);
    const act = b.dataset.act;
    if (act === "star") { const k = b.dataset.k; state.stars = state.stars.includes(k) ? state.stars.filter((x) => x !== k) : [...state.stars, k]; save(); const y = scrollY, pl = $("#picker")?.scrollLeft; draw(false); scrollTo(0, y); if ($("#picker")) { $("#picker").scrollLeft = pl; $("#picker")._upd && $("#picker")._upd(); }
      const on = state.stars.includes(k); buzz(on ? [6, 40, 12] : 6);
      if (on) $$(`.star[data-k="${k}"]`).forEach((x) => x.classList.add("lit"));
      toast(on ? "Starred · it's in Compare" : "Unstarred"); }
    else if (act === "replay") { buzz(6); drawHero(true); }
    else if (act === "mplay") drawMotion(true);
    else if (act === "mnext") { const i = LAY.findIndex((l) => l.key === (drawMotion._L || state.L)); drawMotion._L = LAY[(i + 1) % LAY.length].key; drawMotion(true, drawMotion._L); }
    else if (act === "copysvg") { copy(P.render(items(), { size: 1000, material: b.dataset.v, pad: 0.04, room: b.dataset.v === "glass" || b.dataset.v === "glow" }), "SVG copied"); }
    else if (act === "cat") { state.cat = b.dataset.v; save(); draw(false); }
    else if (act === "open") openViewer(b.dataset.id);
    else if (act === "close") closeViewer();
    else if (act === "vprev") go(-1);
    else if (act === "vnext") go(1);
    else if (act === "sheet") { buzz(6); toggleSheet(true); }
    else if (act === "wp") { toggleSheet(false); openWP(true); }
    else if (act === "wpclose") openWP(false);
    else if (act === "wplace") { state.water.place = b.dataset.v; save(); wpMarkKey = ""; redrawCtl(); }
    else if (act === "wtab") { state.stab = b.dataset.v; save(); drawWP(); }
    else if (act === "wkreset") { const p = state.water.place, k = b.dataset.k; delete state.water[p].custom[k]; save(); applyWater(p); redrawCtl(true); }
    else if (act === "wall") { const p = state.water.place, src = state.water[p]; for (const [x] of PLACES) if (x !== p) { state.water[x].preset = src.preset; state.water[x].custom = clone(src.custom); applyWater(x); } save(); toast("same water everywhere"); }
    else if (act === "wlink") copy(linkFor(state.water), "link copied");
    else if (act === "wlab") { openWP(false); location.hash = "water"; }
    else if (act === "wcode") { const p = state.water.place; copy(snippet(wcfg(p), PLACES.find((x) => x[0] === p)[1]), "values copied"); }
    else if (act === "wsend") { const p = state.water.place; send(snippet(wcfg(p), PLACES.find((x) => x[0] === p)[1]), linkFor(state.water)); }
    else if (act === "wpaste") { const bx = $("#pasteBox"); bx.hidden = !bx.hidden; if (!bx.hidden) $("#pasteTxt").focus(); }
    else if (act === "wpasteok") { const v = parseCfg($("#pasteTxt").value), p = state.water.place; if (!Object.keys(v).length) { toast("no values found in that"); return; } state.water[p].preset = "yours"; state.water[p].custom = v; save(); applyWater(p); redrawCtl(true); toast(Object.keys(v).length + " values applied"); }
    else if (act === "wsave") { const inp = $("#svName"), p = state.water.place, list = (state.waterSaved = state.waterSaved || []); const name = (inp.value || "").trim() || "water " + (list.length + 1); list.unshift({ name, cfg: pickCfg(wcfg(p)) }); save(); redrawCtl(true); buzz([6, 30, 8]); toast("saved " + name); }
    else if (act === "wload") { const x = state.waterSaved[+b.dataset.i], p = state.water.place; state.water[p].preset = "yours"; state.water[p].custom = clone(x.cfg); save(); applyWater(p); redrawCtl(true); if (wpPond) wpPond.ripple(0.5, 0.5, 0.8); toast(x.name + " on " + PLACES.find((y) => y[0] === p)[1]); }
    else if (act === "wcopy1") { const x = state.waterSaved[+b.dataset.i]; copy(snippet(x.cfg, x.name), "values copied"); }
    else if (act === "wsend1") { const x = state.waterSaved[+b.dataset.i], p = state.water.place, W = clone(state.water); W[p] = { enabled: true, preset: "yours", custom: clone(x.cfg) }; send(snippet(x.cfg, x.name), linkFor(W)); }
    else if (act === "wdrop") { const i = +b.dataset.i, x = state.waterSaved[i]; state.waterSaved.splice(i, 1); save(); redrawCtl(true); toast("removed " + x.name); }
    else if (act === "final") { state.L = FINAL; state.pal = "field"; save(); draw(true); drawWP(true); toast("no. 06 in field"); }
    else if (act === "wpreset") { const p = state.water.place; state.water[p].preset = b.dataset.v; state.water[p].custom = {}; save(); applyWater(p); redrawCtl(true); if (wpPond) wpPond.ripple(0.5, 0.5, 0.8); }
    else if (act === "wreset") { const p = state.water.place; state.water[p] = clone(WDEF[p]); save(); applyWater(p); redrawCtl(true); toast("back to the default water"); }
    else if (act === "wcopy") { copy(JSON.stringify({ hero: wcfg("hero"), footer: wcfg("foot"), page: wcfg("page") }, null, 2), "water settings copied"); }
    else if (act === "wshow") { const p = state.water.place; if (p === "hero") { if (view !== "mark") location.hash = "mark"; else scrollTo({ top: 0, behavior: "smooth" }); } else document.querySelector(".foot").scrollIntoView({ behavior: "smooth", block: "end" }); }
    else if (act === "sheetclose") toggleSheet(false);
    else if (act === "reset") { state = { ...clone(DEF), water: state.water }; save(); draw(true); toast("back to no. 06 in field"); }
  });
  document.addEventListener("input", (e) => {
    const k = e.target.dataset.me; if (!k) return;
    state.me[k] = e.target.value; save();
    clearTimeout(document._meT); document._meT = setTimeout(() => { stamp++; $$(".fr[data-art]").forEach((el) => { el._art = null; const a = ARTS.find((x) => x.id === el.dataset.art); if (el.firstElementChild) mountArt(el, a, el.dataset.mode || "cover"); }); const s = $(".me summary em"); if (s) s.textContent = `${state.me.name} · ${state.me.role}`; }, 250);
  });
  document.addEventListener("toggle", (e) => { if (e.target.classList?.contains("me")) { state.meOpen = e.target.open; save(); } }, true);
  document.addEventListener("keydown", (e) => {
    if ($("#viewer").hidden) { if (e.key === "Escape") toggleSheet(false); return; }
    if (e.key === "Escape") closeViewer(); else if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1);
  });
  function toggleSheet(on) { if (on) requestAnimationFrame(() => { const m = $("#sheet .marks"), b = m && m.querySelector('[aria-pressed="true"]'); if (b) m.scrollLeft = b.offsetLeft - m.clientWidth / 2 + b.clientWidth / 2; }); $("#sheet").classList.toggle("on", on); $("#scrim").classList.toggle("on", on); $("#sheet").setAttribute("aria-hidden", String(!on)); }
  $("#scrim").addEventListener("click", () => toggleSheet(false));
  $("#track").addEventListener("scroll", () => { const tr = $("#track"); const i = Math.round(tr.scrollLeft / tr.clientWidth); if (i !== vIdx) { vIdx = i; mountViewer(); } }, { passive: true });
  // swipe the sheet down to close
  (() => { let y0 = null; const sh = $("#sheet"); sh.addEventListener("touchstart", (e) => { if (e.target.closest(".marks,.pals") || sh.querySelector(".sh-b").scrollTop > 0) return; y0 = e.touches[0].clientY; }, { passive: true }); sh.addEventListener("touchmove", (e) => { if (y0 == null) return; const d = e.touches[0].clientY - y0; if (d > 0) sh.style.transform = `translateY(${d}px)`; }, { passive: true }); sh.addEventListener("touchend", (e) => { if (y0 == null) return; const d = e.changedTouches[0].clientY - y0; sh.style.transform = ""; y0 = null; if (d > 90) toggleSheet(false); }); })();

  /* ---------- shell ---------- */
  $("#navD").innerHTML = VIEWS.map(([k, n, d]) => `<a href="#${k}" data-nav="${k}">${IC[k]}<span>${n}</span>${k === "choose" ? `<span class="n">${LAY.length}</span>` : k === "apply" ? `<span class="n">${ARTS.length}</span>` : ""}</a>`).join("");
  $("#tabs").innerHTML = VIEWS.map(([k, n]) => `<a href="#${k}" data-nav="${k}"><i>${IC[k]}</i><span>${n}</span></a>`).join("");
  $("#brandMark").innerHTML = markImg("glass", 30); $("#tbMark").innerHTML = markImg("glass", 26);
  $(".cz-open").innerHTML = IC.sliders + "Customise";
  $("#vClose").innerHTML = IC.close; $("#vPrev").innerHTML = IC.prev; $("#vNext").innerHTML = IC.next;
  const brandRefresh = () => { $("#brandMark").innerHTML = markImg("glass", 30); $("#tbMark").innerHTML = markImg("glass", 26); };
  const NEXT = { choose: ["mark", "How the mark works"], mark: ["colour", "The glass and the neutrals"], colour: ["type", "The wordmark and the text"], type: ["apply", "The mark on cards, letters, email and social"], apply: ["mark", "Back to the mark"], water: ["mark", "Back to the mark"] };
  const nextHTML = () => { const [k, d] = NEXT[view], v = VIEWS.find((x) => x[0] === k); return `<a class="next" href="#${k}"><span class="next-k">${view === "apply" ? "Start again" : "Next"}</span><b>${v[1]}</b><span class="next-d">${d}</span><i class="next-a">${IC.next}</i></a>`; };
  function keepScroll() { const m = {}; $$("[data-keep]").forEach((el) => { m[(el.closest("[data-host]")?.dataset.host || "x") + el.dataset.keep] = el.scrollLeft; }); return m; }
  function restoreScroll(m) { $$("[data-keep]").forEach((el) => { const v = m[(el.closest("[data-host]")?.dataset.host || "x") + el.dataset.keep]; if (v != null) el.scrollLeft = v; }); }
  const _draw = draw;
  draw = function (p, enter) {
    const keep = keepScroll();
    _draw(p);
    brandRefresh(); restoreScroll(keep);
    if (!enter) { const pk = $("#picker"); if (pk && pk._upd) pk._upd(); }
    glides();
    drawFoot();
    if (enter) { enterView(); reveals(); }
    if ($("#wp") && !$("#wp").hidden) drawWP(true);
    if (view === "water") { if (!$("#wp").hidden) openWP(false); drawLab(!enter); }
    else if (wpPond && $("#wp").hidden) { wpPond.destroy(); wpPond = null; }
    watchTitle();
  };

  /* ---------- micro-interactions ---------- */
  function buzz(p) { try { if (navigator.vibrate && phoneish()) navigator.vibrate(p); } catch (e) {} }
  // A glass pebble that glides to whichever option is selected in a group.
  const glideMem = new Map();
  function glides(root) {
    const list = root ? (root.matches("[data-glide]") ? [root] : $$("[data-glide]", root)) : $$("[data-glide]");
    list.forEach((c) => {
      if (!c.offsetWidth) return;
      const key = (c.closest("[data-host]")?.dataset.host || "x") + ":" + c.dataset.glide;
      let peb = c.querySelector(":scope > .peb");
      if (!peb) { peb = document.createElement("i"); peb.className = "peb" + (c.dataset.glideStyle ? " " + c.dataset.glideStyle : ""); peb.setAttribute("aria-hidden", "true"); c.prepend(peb); }
      const sel = c.querySelector(':scope > [aria-pressed="true"], :scope > [aria-current="page"]');
      if (!sel) { peb.style.opacity = 0; glideMem.delete(key); return; }
      const cr = c.getBoundingClientRect(), r = sel.getBoundingClientRect(), ins = +(c.dataset.glideInset || 0);
      const q = { x: r.left - cr.left + c.scrollLeft - c.clientLeft + ins, y: r.top - cr.top + c.scrollTop - c.clientTop + ins, w: r.width - 2 * ins, h: r.height - 2 * ins, br: getComputedStyle(sel).borderRadius };
      const put = (z) => { peb.style.transform = `translate(${z.x}px, ${z.y}px)`; peb.style.width = z.w + "px"; peb.style.height = z.h + "px"; peb.style.borderRadius = z.br; };
      const old = glideMem.get(key);
      if (old && (Math.abs(old.x - q.x) > 0.5 || Math.abs(old.y - q.y) > 0.5 || Math.abs(old.w - q.w) > 0.5)) {
        peb.style.transition = "none"; put(old); peb.getBoundingClientRect(); peb.style.transition = "";
        requestAnimationFrame(() => put(q));
      } else put(q);
      peb.style.opacity = 1; glideMem.set(key, q);
    });
  }
  window.addEventListener("resize", () => { glideMem.clear(); glides(); });
  // Water rings where you touch.
  document.addEventListener("pointerdown", (e) => {
    const t = e.target.closest("button, .app-card, .nav a, .tabbar a, .next, .pk-dots b"); if (!t || e.button > 0) return;
    const r = t.getBoundingClientRect(), d = Math.max(r.width, r.height) * 1.5, sp = document.createElement("span");
    if (t.closest(".tabbar")) buzz(5);
  }, { passive: true });
  const quiet = () => navigator.webdriver || reduce();
  function enterView() {
    if (quiet()) return;
    const v = $("#view"); v.classList.remove("enter"); v.offsetWidth; v.classList.add("enter");
    setTimeout(() => v.classList.remove("enter"), 700);
  }
  let rvIO;
  function reveals() {
    if (quiet()) return;
    rvIO && rvIO.disconnect();
    const els = $$("#view .tile, #view .sw, #view .app-card, #view .lc, #view .panel, #view .dont, #view .set, #view .wmc, #view .nt, #view .pair, #view .face, #view .cmp-c, #view .sizes, #view .scale, #view .mstage, #view .picker .pk, #view .ratio");
    const vh = innerHeight;
    els.forEach((el) => { if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add("rv"); });
    rvIO = new IntersectionObserver((es) => {
      let n = 0;
      es.forEach((en) => { if (!en.isIntersecting) return; const el = en.target; rvIO.unobserve(el); el.style.setProperty("--d", (n++ * 55) + "ms"); el.classList.remove("rv"); el.classList.add("rv-in"); setTimeout(() => { el.classList.remove("rv-in"); el.style.removeProperty("--d"); }, 1400); });
    }, { rootMargin: "0px 0px -6% 0px" });
    $$(".rv").forEach((el) => rvIO.observe(el));
  }
  // Phone top bar: brand at rest, the page title once the big heading scrolls away.
  let titleIO;
  function watchTitle() {
    titleIO && titleIO.disconnect();
    const h = $("#view .view-head h1"); if (!h) return;
    titleIO = new IntersectionObserver((es) => document.body.classList.toggle("past", !es[0].isIntersecting), { rootMargin: "-60px 0px 0px 0px" });
    titleIO.observe(h);
  }
  addEventListener("scroll", () => document.body.classList.toggle("scrolled", scrollY > 6), { passive: true });
  window.KIT = { ARTS, PIECES, LOGO_FILES, mountArt, state: () => state, set, items, markImg, stoneImg, fieldSrc, lockup, render: P.render, piecePath, logoPath, pieceSlug };
  route(true);
  applyWater("page");
})();
