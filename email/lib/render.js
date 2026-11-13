// Fieldwise email renderer: a JSON spec in, email-safe HTML and plain text out.
// Every block type is documented in GUIDE.md ("Blocks"). Unknown blocks throw.
const fs = require("fs"), path = require("path");

const ROOT = path.join(__dirname, "..");
const BRAND = {
  name: "Fieldwise",
  line: "Websites, search and brand",
  tagline: "Grow where it counts.",
  email: "fieldwisesolutions1@gmail.com",
  phone: "+91 92014 79878",
  tel: "+919201479878",
  whatsapp: "https://wa.me/919201479878",
  host: "https://fieldwise-brand-kit.vercel.app/email/assets",
};
const C = {
  page: "#F3F1EC", card: "#FFFFFF", soft: "#F7F4EF", sand: "#ECE7DE", line: "#E7E3DB",
  ink: "#18241F", body: "#3A443E", muted: "#6B746E", faint: "#8A918B", green: "#2C8A64",
  slate: "#1D2225", slate2: "#262C30", onDark: "#F1F0EC", onDark2: "#AEB5AF", lime: "#B6D46A",
};
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const W = 600, PAD = 36, IN = W - PAD * 2; // card width, side padding, inner width

/* ---------- assets ---------- */
const ASSET_DIR = path.join(ROOT, "assets");
function dims(file) { // PNG or JPEG pixel size, read from the header
  const b = fs.readFileSync(file);
  if (b[0] === 0x89) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  let i = 2; while (i < b.length) { const m = b[i + 1], len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + len; }
  return [W, W / 2];
}
const SIZES = JSON.parse(fs.readFileSync(path.join(ASSET_DIR, "sizes.json"), "utf8"));
// "banner-live" or "u/acme-phone" -> { file, w, h } in display px; http(s) URLs pass through
function asset(src) {
  if (/^(https?:|cid:|data:)/.test(src)) return { url: src };
  const base = src.replace(/\.(png|jpe?g)$/, "");
  for (const ext of [".jpg", ".png"]) {
    const f = path.join(ASSET_DIR, base + ext);
    if (fs.existsSync(f)) {
      let [w, h] = SIZES[base] || dims(f).map((x) => x / (base.startsWith("u/") ? 2 : 3));
      return { file: base + ext, w: Math.round(w), h: Math.round(h) };
    }
  }
  throw new Error(`image not found: ${src} (look in brand/email/assets/, or pass a full https:// URL)`);
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (h) => String(h ?? "").replace(/<br\s*\/?>/g, "\n").replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, (m, href, t) => (/^(mailto|tel):/.test(href) || t === href ? t : `${t} (${href})`)).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&rsquo;/g, "’").replace(/&middot;/g, "·");

/* ---------- small pieces ---------- */
function ctx(base) {
  const src = (a) => (a.url ? a.url : `${base}/${a.file}`);
  // image at its display size; fluid = shrink on phones
  const img = (name, o = {}) => {
    const a = asset(name), w = o.w || a.w || IN, h = o.w && a.w ? Math.round((o.w / a.w) * a.h) : (o.h || a.h);
    return `<img src="${src(a)}" width="${w}"${h ? ` height="${h}"` : ""} alt="${esc(o.alt || "")}" style="display:block;border:0;outline:none;text-decoration:none;${o.fluid ? `width:100%;max-width:${w}px;` : `width:${w}px;`}height:auto;${o.style || ""}"${o.cls ? ` class="${o.cls}"` : ""}>`;
  };
  return { img, src };
}
const T = (size, color, extra = "") => `font-family:${FONT};font-size:${size}px;line-height:${size >= 24 ? 1.15 : size >= 16 ? 1.5 : 1.55};color:${color};${extra}`;
const p = (html, o = {}) => `<p class="${o.cls || "body"}" style="margin:0 0 ${o.mb ?? 16}px;${T(o.size || 15, o.color || C.body, o.extra || "")}">${html}</p>`;
function button(label, href, o = {}) {
  const dark = o.onDark, bg = o.secondary ? (dark ? C.slate2 : C.soft) : dark ? C.onDark : C.green, fg = o.secondary ? (dark ? C.onDark : C.ink) : dark ? C.ink : "#FFFFFF";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${o.margin || "8px 0 24px"};"${o.center ? ' align="center"' : ""}><tr><td class="${o.secondary ? "soft" : "btn"}" bgcolor="${bg}" style="border-radius:999px;background:${bg};mso-padding-alt:14px 26px;"><a href="${esc(href)}" target="_blank" style="display:inline-block;padding:14px 26px;${T(15, fg, "line-height:1;font-weight:500;text-decoration:none;border-radius:999px;")}">${label}&nbsp;&rarr;</a></td></tr></table>`;
}
const stoneFor = (tone, i) => ({ green: "stone-1", grey: "stone-grey", amber: "stone-amber" }[tone] || ["stone-1", "stone-2", "stone-3", "stone-4"][i % 4]);
const lineDiv = (m = "22px 0") => `<div class="lineb" style="height:1px;line-height:1px;font-size:1px;background:${C.line};margin:${m};">&nbsp;</div>`;
const cols = (cells, gap = 16) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells.map((c, i) => `<td class="col" valign="top" width="${Math.floor(100 / cells.length)}%" style="padding:0 ${i < cells.length - 1 ? gap / 2 : 0}px 0 ${i ? gap / 2 : 0}px;">${c}</td>`).join("")}</tr></table>`;

/* ---------- blocks ---------- */
// Each returns { html, text, bleed }. bleed = full card width (hero, banner, stats).
const BLOCKS = {
  hero(b, k) {
    const dark = !!b.dark, bg = dark ? C.slate : C.sand, art = b.art || (dark ? "mark-hero-glow" : "mark-hero");
    const a = asset(art), aw = Math.min(a.w || 210, 220);
    const textCol = `<td class="col hero-t" valign="middle" style="padding:40px 12px 40px ${PAD}px;">
      ${b.kicker ? `<p style="margin:0 0 10px;${T(14, dark ? C.lime : C.green, "font-weight:500;")}">${b.kicker}</p>` : ""}
      <h1 class="${dark ? "" : "ink "}h1" style="margin:0 0 12px;${T(32, dark ? C.onDark : C.ink, "font-weight:600;letter-spacing:-0.025em;")}">${b.title}</h1>
      ${b.text ? `<p class="${dark ? "" : "body"}" style="margin:0 0 ${b.button ? 20 : 0}px;${T(16, dark ? C.onDark2 : C.body)}">${b.text}</p>` : ""}
      ${b.button ? button(b.button.label, b.button.href, { onDark: dark, margin: "0" }) : ""}
    </td>`;
    const artCol = `<td class="col hero-a" valign="middle" align="center" width="${aw + 24}" style="padding:24px ${PAD - 12}px 24px 0;">${k.img(art, { alt: b.artAlt || "", w: aw })}</td>`;
    return {
      bleed: true,
      html: `<tr><td class="${dark ? "dark" : "sand"}" bgcolor="${bg}" style="background:${bg};padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl"><tr>${artCol.replace('<td ', '<td dir="ltr" ')}${textCol.replace('<td ', '<td dir="ltr" ')}</tr></table></td></tr>`,
      text: [strip(b.kicker), strip(b.title), strip(b.text), b.button ? `${strip(b.button.label)}: ${b.button.href}` : ""].filter(Boolean).join("\n\n"),
    };
  },
  banner(b, k) { return { bleed: true, html: `<tr><td style="padding:0;line-height:0;">${k.img(b.src || "banner-welcome", { alt: b.alt || "", fluid: true, w: W })}</td></tr>`, text: "" }; },
  heading(b) {
    const big = (b.level || 1) === 1;
    return { html: big ? `<h1 class="ink h1" style="margin:0 0 14px;${T(28, C.ink, "font-weight:600;letter-spacing:-0.02em;")}">${b.text}</h1>` : `<h2 class="ink" style="margin:28px 0 12px;${T(17, C.ink, "font-weight:600;letter-spacing:-0.01em;")}">${b.text}</h2>`, text: strip(b.text) };
  },
  text(b, k, o) { return { html: p(b.text, { cls: o.letter ? "pl" : "body", color: o.letter ? "#222222" : C.body, size: o.letter ? 15 : 15 }), text: strip(b.text) }; },
  small(b) { return { html: p(b.text, { cls: "muted", size: 13, color: C.muted, mb: 14 }), text: strip(b.text) }; },
  numbered(b, k, o) {
    const c = o.letter ? "#222222" : C.body;
    return { html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${b.items.map((x, i) => `<tr><td valign="top" style="padding:0 10px 6px 0;${T(15, c)}" class="${o.letter ? "pl" : "body"}">${i + 1}.</td><td style="padding:0 0 6px;${T(15, c)}" class="${o.letter ? "pl" : "body"}">${x}</td></tr>`).join("")}</table>`, text: b.items.map((x, i) => `${i + 1}. ${strip(x)}`).join("\n") };
  },
  list(b, k) {
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;">${b.items.map((x, i) => {
        const [t, d] = Array.isArray(x) ? x : [null, x];
        return `<tr><td valign="top" width="28" style="width:28px;padding:5px 0 12px;">${k.img(stoneFor(b.stone, i))}</td><td valign="top" class="body" style="padding:0 0 12px;${T(15, C.body)}">${t ? `<b class="ink" style="display:block;font-weight:600;color:${C.ink};">${t}</b>` : ""}${d}</td></tr>`;
      }).join("")}</table>`,
      text: b.items.map((x) => (Array.isArray(x) ? `- ${strip(x[0])}: ${strip(x[1])}` : `- ${strip(x)}`)).join("\n"),
    };
  },
  steps(b, k) {
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 16px;">${b.items.map(([t, d], i) => `<tr>
        <td valign="top" width="46" style="width:46px;padding:0 0 ${i < b.items.length - 1 ? 0 : 4}px;">${k.img("step-" + ((i % 4) + 1), { alt: String(i + 1) })}${i < b.items.length - 1 ? `<div class="lineb" style="width:2px;height:26px;margin:4px 0 4px 15px;background:${C.line};font-size:1px;line-height:1px;">&nbsp;</div>` : ""}</td>
        <td valign="top" style="padding:5px 0 14px;"><p class="ink" style="margin:0 0 3px;${T(15.5, C.ink, "font-weight:600;")}">${t}</p><p class="body" style="margin:0;${T(14.5, C.body)}">${d}</p></td></tr>`).join("")}</table>`,
      text: b.items.map(([t, d], i) => `${i + 1}. ${strip(t)}: ${strip(d)}`).join("\n"),
    };
  },
  button(b) { return { html: button(b.label, b.href, { secondary: b.style === "secondary" }), text: `${strip(b.label)}: ${b.href}` }; },
  details(b) {
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="soft" bgcolor="${C.soft}" style="margin:6px 0 22px;background:${C.soft};border-radius:16px;"><tr><td style="padding:${b.title ? 18 : 10}px 22px 10px;">${b.title ? `<p class="ink" style="margin:0 0 6px;${T(14.5, C.ink, "font-weight:600;")}">${b.title}</p>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${b.rows.map(([kk, v], i) => `<tr><td valign="top" width="38%" class="muted line" style="padding:9px 12px 9px 0;${T(14, C.muted)}${i ? `border-top:1px solid ${C.line};` : ""}">${kk}</td><td valign="top" class="ink line" style="padding:9px 0;${T(14, C.ink)}${i ? `border-top:1px solid ${C.line};` : ""}">${v}</td></tr>`).join("")}</table></td></tr></table>`,
      text: [b.title && strip(b.title), ...b.rows.map(([kk, v]) => `${strip(kk)}: ${strip(v)}`)].filter(Boolean).join("\n"),
    };
  },
  note(b) {
    const g = b.tone === "green", bg = g ? "#E6F1EA" : C.soft;
    return { html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="${g ? "soft2" : "soft"}" bgcolor="${bg}" style="margin:4px 0 20px;background:${bg};border-radius:16px;"><tr><td class="body" style="padding:16px 20px;${T(14.5, C.body)}">${b.title ? `<b class="ink" style="display:block;margin:0 0 4px;font-weight:600;color:${C.ink};">${b.title}</b>` : ""}${b.text}</td></tr></table>`, text: [b.title && strip(b.title), strip(b.text)].filter(Boolean).join("\n") };
  },
  table(b) {
    const { head, rows, foot = [] } = b, td = (al, extra = "") => `${T(14, C.ink, `text-align:${al};${extra}`)}`;
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;">
        <tr>${head.map((h, i) => `<td class="muted line" style="${td(i ? "right" : "left", `padding:0 0 8px;color:${C.muted};font-size:12.5px;border-bottom:1px solid ${C.line};`)}">${h}</td>`).join("")}</tr>
        ${rows.map((r) => `<tr><td class="line" style="${td("left", `padding:13px 12px 13px 0;border-bottom:1px solid ${C.line};`)}"><b class="ink" style="font-weight:500;color:${C.ink};">${r[0]}</b>${r[1] ? `<br><span class="muted" style="font-size:13px;color:${C.muted};">${r[1]}</span>` : ""}</td><td class="ink line" valign="top" style="${td("right", `padding:13px 0;border-bottom:1px solid ${C.line};white-space:nowrap;`)}">${r[2]}</td></tr>`).join("")}
        ${foot.map(([kk, v], i) => { const last = i === foot.length - 1; return `<tr><td class="${last ? "ink" : "muted"}" style="${td("left", `padding:${i ? 6 : 14}px 12px 0 0;${last ? "font-weight:600;font-size:16px;" : `color:${C.muted};`}`)}">${kk}</td><td class="ink" style="${td("right", `padding:${i ? 6 : 14}px 0 0;white-space:nowrap;${last ? "font-weight:600;font-size:16px;" : ""}`)}">${v}</td></tr>`; }).join("")}
      </table>`,
      text: [...rows.map((r) => `${strip(r[0])}${r[1] ? ` (${strip(r[1])})` : ""}: ${strip(r[2])}`), ...foot.map(([kk, v]) => `${strip(kk)}: ${strip(v)}`)].join("\n"),
    };
  },
  metrics(b) {
    const cell = ([label, value, delta]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="soft" bgcolor="${C.soft}" style="background:${C.soft};border-radius:16px;margin:0 0 12px;"><tr><td style="padding:16px 18px;"><p class="muted" style="margin:0 0 6px;${T(13, C.muted)}">${label}</p><p class="ink" style="margin:0;${T(30, C.ink, "font-weight:600;letter-spacing:-0.02em;")}">${value}</p>${delta ? `<p class="up" style="margin:6px 0 0;${T(13, C.green)}">${delta}</p>` : ""}</td></tr></table>`;
    const rows = []; for (let i = 0; i < b.items.length; i += 2) rows.push(b.items.slice(i, i + 2));
    return { html: `<div style="margin:4px 0 8px;">${rows.map((r) => cols(r.map(cell), 12)).join("")}</div>`, text: b.items.map(([l, v, d]) => `${strip(l)}: ${strip(v)}${d ? ` (${strip(d)})` : ""}`).join("\n") };
  },
  stats(b, k) { // dark band of big numbers, full width
    const cell = ([value, label]) => `<p style="margin:0 0 4px;${T(34, C.onDark, "font-weight:600;letter-spacing:-0.03em;")}">${value}</p><p style="margin:0 0 18px;${T(13.5, C.onDark2)}">${label}</p>`;
    return {
      bleed: true,
      html: `<tr><td class="dark" bgcolor="${C.slate}" style="background:${C.slate};padding:30px ${PAD}px 12px;">${b.title ? `<p style="margin:0 0 18px;${T(15, C.onDark, "font-weight:600;")}">${b.title}</p>` : ""}${cols(b.items.map(cell), 16)}</td></tr>`,
      text: [b.title && strip(b.title), ...b.items.map(([v, l]) => `${strip(v)} ${strip(l)}`)].filter(Boolean).join("\n"),
    };
  },
  status(b, k) {
    const S = { good: ["stone-1", "good", C.green], work: ["stone-amber", "needs work", "#A86F12"], missing: ["stone-grey", "missing", C.muted] };
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 14px;">${b.items.map(([s, t, d], i) => `<tr><td valign="top" width="30" class="line" style="width:30px;padding:${i ? 18 : 4}px 0 16px;${i ? `border-top:1px solid ${C.line};` : ""}">${k.img(S[s][0])}</td><td valign="top" class="line" style="padding:${i ? 14 : 0}px 0 16px;${i ? `border-top:1px solid ${C.line};` : ""}"><p style="margin:0 0 4px;${T(12.5, S[s][2])}">${S[s][1]}</p><p class="ink" style="margin:0 0 4px;${T(15.5, C.ink, "font-weight:600;")}">${t}</p><p class="body" style="margin:0;${T(14.5, C.body)}">${d}</p></td></tr>`).join("")}</table>`,
      text: b.items.map(([s, t, d]) => `[${S[s][1]}] ${strip(t)}\n${strip(d)}`).join("\n\n"),
    };
  },
  quote(b) {
    return { html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="soft" bgcolor="${C.soft}" style="margin:6px 0 22px;background:${C.soft};border-radius:16px;"><tr><td style="padding:22px 24px;"><p class="ink" style="margin:0 0 12px;${T(18, C.ink, "line-height:1.45;letter-spacing:-0.01em;")}">“${b.text}”</p><p class="muted" style="margin:0;${T(13.5, C.muted)}">${b.by}</p></td></tr></table>`, text: `“${strip(b.text)}”\n— ${strip(b.by)}` };
  },
  divider() { return { html: lineDiv(), text: "—" }; },
  spacer(b) { return { html: `<div style="height:${b.size || 12}px;line-height:1px;font-size:1px;">&nbsp;</div>`, text: "" }; },
  image(b, k) {
    const im = k.img(b.src, { alt: b.alt, fluid: true, w: b.width || Math.min(asset(b.src).w || IN, IN), style: b.round === false ? "" : "border-radius:12px;" });
    return { html: `<div style="margin:6px 0 ${b.caption ? 8 : 20}px;">${b.href ? `<a href="${esc(b.href)}" target="_blank">${im}</a>` : im}</div>${b.caption ? p(b.caption, { cls: "muted", size: 13, color: C.muted, mb: 20 }) : ""}`, text: b.caption ? strip(b.caption) : b.href ? b.href : "" };
  },
  phone(b, k) { // phone screenshot beside text: their site today, or the new one
    const shot = `<td class="col" valign="middle" width="190" style="width:190px;padding:0 18px 0 0;" align="center">${k.img(b.src, { alt: b.alt || "", w: 176 })}</td>`;
    const txt = `<td class="col" valign="middle" style="padding:0;">${b.kicker ? `<p style="margin:0 0 6px;${T(13.5, b.tone === "bad" ? "#A86F12" : C.green, "font-weight:500;")}">${b.kicker}</p>` : ""}<p class="ink" style="margin:0 0 8px;${T(19, C.ink, "font-weight:600;letter-spacing:-0.015em;line-height:1.3;")}">${b.title}</p>${b.text ? `<p class="body" style="margin:0 0 12px;${T(14.5, C.body)}">${b.text}</p>` : ""}${b.items ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0">${b.items.map((x, i) => `<tr><td valign="top" width="24" style="padding:4px 0 8px;">${k.img(stoneFor(b.tone === "bad" ? "amber" : "green", i))}</td><td class="body" style="padding:0 0 8px;${T(14, C.body)}">${x}</td></tr>`).join("")}</table>` : ""}</td>`;
    return { html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="soft" bgcolor="${C.soft}" style="margin:6px 0 22px;background:${C.soft};border-radius:18px;"><tr><td style="padding:14px 20px 14px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${shot}${txt}</tr></table></td></tr></table>`, text: [strip(b.kicker), strip(b.title), strip(b.text), ...(b.items || []).map((x) => "- " + strip(x))].filter(Boolean).join("\n") };
  },
  work(b, k) { // our projects: framed screenshots with a line each
    const card = (x, w) => `${x.href ? `<a href="${esc(x.href)}" target="_blank">` : ""}${k.img(x.src, { alt: x.title, fluid: true, w, cls: "fl", style: "border-radius:14px;" })}${x.href ? "</a>" : ""}<p class="ink" style="margin:12px 0 4px;${T(15, C.ink, "font-weight:600;")}">${x.title}</p><p class="body" style="margin:0 0 18px;${T(14, C.body)}">${x.text}</p>`;
    const one = b.items.length === 1;
    const rows = []; for (let i = 0; i < b.items.length; i += 2) rows.push(b.items.slice(i, i + 2));
    return { html: `${b.title ? `<h2 class="ink" style="margin:28px 0 12px;${T(17, C.ink, "font-weight:600;")}">${b.title}</h2>` : ""}<div style="margin:0 0 6px;">${one ? card(b.items[0], IN) : rows.map((r) => cols(r.map((x) => card(x, (IN - 16) / 2)).concat(r.length === 1 ? [""] : []), 16)).join("")}</div>`, text: [b.title && strip(b.title), ...b.items.map((x) => `- ${strip(x.title)}: ${strip(x.text)}${x.href ? ` (${x.href})` : ""}`)].filter(Boolean).join("\n") };
  },
  features(b, k) {
    const cell = ([t, d], i) => `${k.img(stoneFor(b.stone, i), { w: 22 })}<p class="ink" style="margin:10px 0 4px;${T(15, C.ink, "font-weight:600;")}">${t}</p><p class="body" style="margin:0 0 18px;${T(14, C.body)}">${d}</p>`;
    return { html: `<div style="margin:6px 0 8px;">${cols(b.items.map(cell), 20)}</div>`, text: b.items.map(([t, d]) => `- ${strip(t)}: ${strip(d)}`).join("\n") };
  },
  cta(b, k) {
    return { html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="sand" bgcolor="${C.sand}" style="margin:10px 0 22px;background:${C.sand};border-radius:18px;"><tr><td valign="middle" style="padding:24px 8px 24px 24px;"><p class="ink" style="margin:0 0 6px;${T(19, C.ink, "font-weight:600;letter-spacing:-0.015em;line-height:1.3;")}">${b.title}</p>${b.text ? `<p class="body" style="margin:0 0 16px;${T(14.5, C.body)}">${b.text}</p>` : ""}${button(b.button.label, b.button.href, { margin: "0" })}</td><td class="hide-s" valign="bottom" align="right" width="96" style="padding:0 18px 16px 0;">${k.img("mark-tint", { w: 64 })}</td></tr></table>`, text: [strip(b.title), strip(b.text), `${strip(b.button.label)}: ${b.button.href}`].filter(Boolean).join("\n") };
  },
  progress(b) {
    const n = b.labels.length, cur = b.current;
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 22px;"><tr>${b.labels.map((l, i) => `<td width="${Math.floor(100 / n)}%" valign="top" style="padding:0 ${i < n - 1 ? 3 : 0}px 0 ${i ? 3 : 0}px;"><div class="${i < cur ? "" : "lineb"}" style="height:6px;line-height:6px;font-size:1px;border-radius:6px;background:${i < cur ? C.green : C.line};">&nbsp;</div><p class="${i === cur - 1 ? "ink" : "muted"}" style="margin:8px 0 0;${T(12.5, i === cur - 1 ? C.ink : C.muted, i === cur - 1 ? "font-weight:600;" : "")}">${l}</p></td>`).join("")}</tr></table>`,
      text: b.labels.map((l, i) => `${i < cur ? "[x]" : "[ ]"} ${strip(l)}`).join("  "),
    };
  },
  signoff(b, k, o) {
    const s = b.text || "Thanks,";
    return {
      html: `${p(s, { cls: o.letter ? "pl" : "body", color: o.letter ? "#222222" : C.body, mb: 0, extra: "margin-top:24px;" })}<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 ${o.letter ? 0 : 10}px;"><tr>
        <td valign="middle" style="padding:0 14px 0 0;">${k.img("avatar", { alt: "Fieldwise", w: 48, style: "border-radius:50%;" })}</td>
        <td valign="middle">
          <p class="ink" style="margin:0;${T(15, C.ink, "font-weight:600;line-height:1.35;")}">{{sender_name}}</p>
          <p class="muted" style="margin:0;${T(13.5, C.muted, "line-height:1.45;")}">{{sender_role}}, Fieldwise</p>
          <p class="muted" style="margin:2px 0 0;${T(13, C.muted, "line-height:1.5;")}"><a href="tel:${BRAND.tel}" style="color:${C.muted};text-decoration:none;">${BRAND.phone}</a> &middot; <a href="${BRAND.whatsapp}" style="color:${C.green};text-decoration:none;">WhatsApp</a></p>
        </td></tr></table>`,
      text: `${s}\n{{sender_name}}\n{{sender_role}}, Fieldwise\n${BRAND.phone}`,
    };
  },
  ps(b, k, o) { return { html: p(b.text, { cls: o.letter ? "pl" : "body", color: o.letter ? "#222222" : C.body, extra: "margin-top:22px;" }), text: strip(b.text) }; },
};
const TYPES = Object.keys(BLOCKS);

/* ---------- page ---------- */
const STYLE = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
  img { -ms-interpolation-mode: bicubic; }
  a { color: ${C.green}; }
  .dk { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
  @media (max-width: 620px) {
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .h1 { font-size: 26px !important; }
    .col { display: block !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box; padding-left: 0 !important; padding-right: 0 !important; }
    .hero-t { padding: 4px 22px 34px !important; }
    .hero-a { padding: 26px 22px 8px !important; text-align: left !important; }
    .hero-a img { width: 132px !important; }
    .hide-s { display: none !important; }
    .fl { width: 100% !important; max-width: 100% !important; }
    .outer { padding: 0 !important; }
    .card { border-radius: 0 !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg { background: #15191B !important; }
    .card { background: #1D2225 !important; }
    .soft, .sand { background: #262C30 !important; }
    .soft2 { background: #22332B !important; }
    .ink, .ink b { color: #F1F0EC !important; }
    .body, .pl { color: #C9CEC9 !important; }
    .muted { color: #9AA19B !important; }
    .line { border-color: #30373B !important; }
    .lineb { background: #30373B !important; }
    .up { color: #8FD3A9 !important; }
    .lt { display: none !important; }
    .dk { display: block !important; max-height: none !important; }
  }
  [data-ogsc] .card { background: #1D2225 !important; }
  [data-ogsc] .ink { color: #F1F0EC !important; }
  [data-ogsc] .body { color: #C9CEC9 !important; }`;
const head = (title) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(title)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><!--<![endif]-->
<style>${STYLE}
</style>
</head>`;
const preheader = (t) => `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(t)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;

function renderBlocks(spec, k, o) {
  const out = [], text = [];
  let run = [];
  const flush = (last) => { if (run.length) { out.push({ inline: run.join("\n") }); run = []; } };
  spec.blocks.forEach((b, i) => {
    if (!b || !BLOCKS[b.type]) throw new Error(`block ${i + 1}: unknown type "${b && b.type}". Use one of: ${TYPES.join(", ")}`);
    const r = BLOCKS[b.type](b, k, o);
    if (r.bleed && !o.letter) { flush(); out.push({ bleed: r.html }); }
    else if (r.bleed) run.push(r.html.replace(/^<tr><td/, '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 22px;border-radius:16px;overflow:hidden;"><tr><td') + "</table>");
    else run.push(r.html);
    if (r.text) text.push(r.text);
  });
  flush();
  return { parts: out, text: text.join("\n\n") };
}

function footer(spec, k) {
  const why = spec.unsubscribe ? `You&rsquo;re receiving this because you signed up or worked with us. <a href="{{unsubscribe_link}}" style="color:inherit;">Unsubscribe</a>` : "You&rsquo;re receiving this because we&rsquo;re working together.";
  const links = (c) => `<a href="mailto:${BRAND.email}" style="color:${c};text-decoration:none;">Email</a> &middot; <a href="${BRAND.whatsapp}" style="color:${c};text-decoration:none;">WhatsApp</a> &middot; <a href="tel:${BRAND.tel}" style="color:${c};text-decoration:none;">${BRAND.phone}</a>`;
  if (spec.footer === "dark") return `<tr><td style="padding:0;line-height:0;">${k.img("band-dark", { fluid: true, w: W })}</td></tr>
  <tr><td class="dark px" bgcolor="${C.slate}" style="background:${C.slate};padding:22px ${PAD}px 30px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td valign="top" width="28" style="width:28px;padding:2px 0 0;">${k.img("mark-small-white")}</td><td style="${T(13, C.onDark2, "line-height:1.6;")}">
      <b style="font-weight:600;color:${C.onDark};">Fieldwise</b> &middot; ${BRAND.line}. ${BRAND.tagline}<br>${links(C.onDark2)}<br><span style="font-size:12px;">${why}</span></td></tr></table></td></tr>`;
  return `<tr><td class="px" style="padding:6px ${PAD}px 30px;">${lineDiv("0 0 20px")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td valign="top" width="28" style="width:28px;padding:2px 0 0;">${k.img("mark-grey")}</td><td class="muted" style="${T(12.5, C.faint, "line-height:1.6;")}">
      <b class="muted" style="font-weight:600;color:${C.muted};">Fieldwise</b> &middot; ${BRAND.line}. ${BRAND.tagline}<br>${links(C.faint)}<br>${why}</td></tr></table></td></tr>`;
}

// spec -> { html, text }. base = where images load from (hosted URL, or a relative path for previews)
function render(spec, base = BRAND.host) {
  const k = ctx(base), letter = spec.kind === "letter";
  const { parts, text } = renderBlocks(spec, k, { letter });
  let html;
  if (letter) {
    html = `${head(spec.subject)}
<body class="card" style="margin:0;padding:0;background:#FFFFFF;">
${preheader(spec.preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="#FFFFFF" style="background:#FFFFFF;">
<tr><td class="px" style="padding:28px 24px;">
<!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<div style="max-width:560px;">
${parts.map((x) => x.inline).join("\n")}
</div>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
  } else {
    const corner = spec.label ? `<td align="right" valign="middle" class="muted" style="${T(13, C.muted)}">${spec.label}</td>` : "";
    const firstBleed = parts[0] && parts[0].bleed;
    html = `${head(spec.subject)}
<body class="bg" style="margin:0;padding:0;background:${C.page};">
${preheader(spec.preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" class="outer" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="${W}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="${C.card}" style="max-width:${W}px;background:${C.card};border-radius:20px;overflow:hidden;">
  <tr><td class="px" style="padding:24px ${PAD}px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle"><a href="mailto:${BRAND.email}" style="text-decoration:none;">${k.img("logo", { alt: "Fieldwise", cls: "lt" })}<!--[if !mso]><!--><div class="dk">${k.img("logo-white", { alt: "Fieldwise" })}</div><!--<![endif]--></a></td>${corner}
  </tr></table></td></tr>
  ${firstBleed ? "" : `<tr><td class="px" style="padding:0 ${PAD}px;">${lineDiv("0")}</td></tr>`}
  ${parts.map((x, i) => (x.bleed ? x.bleed : `<tr><td class="px" style="padding:${i === 0 || parts[i - 1].bleed ? 32 : 4}px ${PAD}px ${parts[i + 1] && parts[i + 1].bleed ? 14 : 8}px;">\n${x.inline}\n</td></tr>`)).join("\n  ")}
  ${footer(spec, k)}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
  }
  const foot = letter ? "" : `\n\n--\nFieldwise · ${BRAND.line}. ${BRAND.tagline}\n${BRAND.email} · ${BRAND.phone}${spec.unsubscribe ? "\nUnsubscribe: {{unsubscribe_link}}" : ""}`;
  return { html, text: `${text.replace(/\n{3,}/g, "\n\n").trim()}${foot}\n` };
}

/* ---------- checks: what makes an email off-brand or weak ---------- */
const BANNED = ["hope this finds you well", "hope you are doing well", "i wanted to reach out", "just checking in", "touch base", "circle back", "synergy", "leverage", "cutting-edge", "cutting edge", "world-class", "world class", "game-changer", "game changer", "revolutionize", "revolutionise", "unlock", "elevate", "seamless", "supercharge", "next-level", "in today's digital age", "don't hesitate", "dear sir", "dear madam", "kindly"];
function lint(spec, filled) {
  const errors = [], warns = [];
  const all = JSON.stringify(spec.blocks), plainText = filled ? filled.text : "";
  if (!spec.subject) errors.push("subject is missing");
  if (!spec.preheader) errors.push("preheader is missing (the grey preview line after the subject)");
  if (!["branded", "letter"].includes(spec.kind)) errors.push('kind must be "branded" or "letter"');
  if (!Array.isArray(spec.blocks) || !spec.blocks.length) errors.push("blocks is empty");
  (spec.blocks || []).forEach((b, i) => {
    if (!b || !BLOCKS[b.type]) errors.push(`block ${i + 1}: unknown type "${b && b.type}"`);
    if (b && (b.type === "image" || b.type === "phone") && !b.alt && b.type === "image") errors.push(`block ${i + 1}: image needs alt text`);
    if (b && b.type === "hero" && !b.title) errors.push(`block ${i + 1}: hero needs a title`);
    if (b && ["image", "phone", "banner"].includes(b.type) && b.src) { try { asset(b.src); } catch (e) { errors.push(`block ${i + 1}: ${e.message}`); } }
    if (b && b.type === "work") (b.items || []).forEach((x) => { try { asset(x.src); } catch (e) { errors.push(`block ${i + 1}: ${e.message}`); } });
  });
  if (spec.subject && spec.subject.length > 60) warns.push(`subject is ${spec.subject.length} characters; keep it under 60 so it isn't cut off on phones`);
  if (/!/.test(spec.subject || "")) warns.push("subject has an exclamation mark");
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test((spec.subject || "") + all)) warns.push("emoji found; Fieldwise emails don't use them");
  if (/\b[A-Z]{4,}\b/.test((spec.subject || "").replace(/\{\{[^}]+\}\}/g, ""))) warns.push("subject has a word in capitals");
  if (spec.preheader && (spec.preheader.length < 20 || spec.preheader.length > 110)) warns.push(`preheader is ${spec.preheader.length} characters; aim for 20 to 110`);
  const lower = (spec.subject + " " + all).toLowerCase();
  for (const w of BANNED) if (lower.includes(w)) warns.push(`avoid "${w}"`);
  const buttons = (spec.blocks || []).filter((b) => b && (b.type === "button" || (b.button && ["hero", "cta"].includes(b.type)))).length;
  if (buttons > 2) warns.push(`${buttons} buttons; one main ask per email reads better`);
  const visual = (spec.blocks || []).some((b) => b && ["hero", "banner", "image", "phone", "work", "stats", "steps", "features", "metrics", "status", "cta"].includes(b.type));
  if (spec.kind === "branded" && !visual) warns.push("no visual block (hero, banner, image, phone, work, steps, features, stats); branded emails should have at least one");
  if (spec.kind === "branded" && spec.blocks && spec.blocks[0] && !["hero", "banner", "heading"].includes(spec.blocks[0].type)) warns.push("start a branded email with a hero, banner or heading");
  if (!(spec.blocks || []).some((b) => b && b.type === "signoff")) warns.push("no signoff block; emails come from a person");
  if (plainText) {
    const words = plainText.split(/\s+/).filter(Boolean).length;
    if (spec.group === "cold" && spec.kind === "letter" && words > 190) warns.push(`${words} words; first-touch cold emails work best under about 150 words of text`);
    const left = [...new Set([...(filled.html + (filled.subject || "")).matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/g)].map((m) => m[1]))].filter((t) => !["sender_name", "sender_role", "unsubscribe_link"].includes(t));
    if (left.length) warns.push(`unfilled tags: ${left.map((t) => `{{${t}}}`).join(", ")}`);
  }
  return { errors, warns };
}

const fill = (s, data) => String(s).replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (m, k) => (data && k in data ? data[k] : m));
const tagsIn = (s) => [...new Set([...String(s).matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/g)].map((m) => m[1]))];

module.exports = { render, lint, fill, tagsIn, asset, BRAND, C, TYPES, ROOT };
