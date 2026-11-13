// Build every Fieldwise email from one source.
// usage: node build.js
//   dist/templates/<id>.html  ready to send: {{merge_tags}} left in, images from the hosted kit
//   dist/templates/<id>.txt   plain-text version (subject on the first line)
//   dist/samples/<id>.html    the same email filled with sample data, for previews
//   dist/index.html           gallery of all of them
const fs = require("fs"), path = require("path");
const T = require("./templates.js");

const BRAND = {
  name: "Fieldwise",
  line: "Websites, search and brand",
  tagline: "Grow where it counts.",
  email: "fieldwisesolutions1@gmail.com",
  phone: "+91 92014 79878",
  tel: "+919201479878",
  assets: "https://fieldwise-brand-kit.vercel.app/email/assets",
};
const C = {
  page: "#F3F1EC", card: "#FFFFFF", soft: "#F7F4EF", sand: "#ECE7DE", line: "#E7E3DB",
  ink: "#18241F", body: "#3A443E", muted: "#6B746E", faint: "#8A918B", green: "#2C8A64", greenDk: "#1F6B4C",
};
const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const SIZES = JSON.parse(fs.readFileSync(path.join(__dirname, "assets/sizes.json"), "utf8"));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const strip = (h) => String(h).replace(/<br\s*\/?>/g, "\n").replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, (m, href, t) => (href.startsWith("mailto:") || href.startsWith("tel:") || t === href ? t : `${t} (${href})`)).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&rsquo;/g, "'").replace(/&middot;/g, "·");

function makeImg(base) {
  return (name, o = {}) => {
    const file = name + (name.startsWith("banner") || name === "band" ? ".jpg" : ".png");
    const [w, h] = o.w ? [o.w, Math.round((o.w / SIZES[name][0]) * SIZES[name][1])] : SIZES[name];
    return `<img src="${base}/${file}" width="${w}" height="${h}" alt="${esc(o.alt || "")}" style="display:block;border:0;outline:none;text-decoration:none;width:${o.fluid ? "100%" : w + "px"};${o.fluid ? "max-width:" + w + "px;" : ""}height:auto;${o.style || ""}"${o.cls ? ` class="${o.cls}"` : ""}>`;
  };
}

/* ---------- blocks: each renders to HTML and to text ---------- */
function blocks(list, img, plain) {
  const P = `margin:0 0 16px;font-family:${FONT};font-size:${plain ? 15 : 15}px;line-height:1.62;color:${plain ? "#222222" : C.body};`;
  const html = [], text = [];
  for (const b of list) {
    if (b.h) { html.push(`<h1 class="ink h1" style="margin:0 0 14px;font-family:${FONT};font-size:28px;line-height:1.18;font-weight:600;letter-spacing:-0.02em;color:${C.ink};">${b.h}</h1>`); text.push(strip(b.h), ""); }
    else if (b.h2) { html.push(`<h2 class="ink" style="margin:26px 0 10px;font-family:${FONT};font-size:16px;line-height:1.35;font-weight:600;color:${C.ink};">${b.h2}</h2>`); text.push(strip(b.h2), ""); }
    else if (b.p) { html.push(`<p class="${plain ? "pl" : "body"}" style="${P}">${b.p}</p>`); text.push(strip(b.p), ""); }
    else if (b.small) { html.push(`<p class="muted" style="margin:0 0 14px;font-family:${FONT};font-size:13px;line-height:1.55;color:${C.muted};">${b.small}</p>`); text.push(strip(b.small), ""); }
    else if (b.ol) { // numbered points, used in plain emails
      html.push(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">${b.ol.map((x, i) => `<tr><td valign="top" style="padding:0 10px 6px 0;font-family:${FONT};font-size:15px;line-height:1.6;color:${plain ? "#222222" : C.body};">${i + 1}.</td><td style="padding:0 0 6px;font-family:${FONT};font-size:15px;line-height:1.6;color:${plain ? "#222222" : C.body};" class="${plain ? "pl" : "body"}">${x}</td></tr>`).join("")}</table>`);
      text.push(...b.ol.map((x, i) => `${i + 1}. ${strip(x)}`), "");
    }
    else if (b.list) { // stone bullets: [title, text] or text
      html.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;">${b.list.map((x, i) => {
        const [t, d] = Array.isArray(x) ? x : [null, x];
        return `<tr><td valign="top" width="28" style="width:28px;padding:5px 0 10px;">${img(b.stone || ["stone-1", "stone-2", "stone-3", "stone-4"][i % 4], { alt: "" })}</td><td valign="top" style="padding:0 0 10px;font-family:${FONT};font-size:15px;line-height:1.55;color:${C.body};" class="body">${t ? `<b class="ink" style="display:block;font-weight:600;color:${C.ink};">${t}</b>` : ""}${d}</td></tr>`;
      }).join("")}</table>`);
      text.push(...b.list.map((x) => (Array.isArray(x) ? `- ${strip(x[0])}: ${strip(x[1])}` : `- ${strip(x)}`)), "");
    }
    else if (b.btn) {
      const [label, href] = b.btn;
      html.push(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:${b.tight ? "4px 0 18px" : "10px 0 24px"};"><tr><td class="btn" bgcolor="${C.green}" style="border-radius:999px;background:${C.green};mso-padding-alt:13px 26px;"><a href="${href}" target="_blank" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;line-height:1;font-weight:500;color:#FFFFFF;text-decoration:none;border-radius:999px;">${label}</a></td></tr></table>`);
      text.push(`${strip(label)}: ${href}`, "");
    }
    else if (b.kv) {
      html.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="soft" bgcolor="${C.soft}" style="margin:6px 0 22px;background:${C.soft};border-radius:14px;"><tr><td style="padding:${b.title ? "16px" : "10px"} 20px 10px;">${b.title ? `<p class="ink" style="margin:0 0 6px;font-family:${FONT};font-size:14px;font-weight:600;color:${C.ink};">${b.title}</p>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${b.kv.map(([k, v], i) => `<tr><td valign="top" width="38%" class="muted line" style="padding:8px 12px 8px 0;font-family:${FONT};font-size:14px;line-height:1.45;color:${C.muted};${i ? `border-top:1px solid ${C.line};` : ""}">${k}</td><td valign="top" class="ink line" style="padding:8px 0;font-family:${FONT};font-size:14px;line-height:1.45;color:${C.ink};${i ? `border-top:1px solid ${C.line};` : ""}">${v}</td></tr>`).join("")}</table></td></tr></table>`);
      text.push(...(b.title ? [strip(b.title)] : []), ...b.kv.map(([k, v]) => `${strip(k)}: ${strip(v)}`), "");
    }
    else if (b.note) {
      html.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="soft" bgcolor="${C.soft}" style="margin:4px 0 20px;background:${C.soft};border-radius:14px;"><tr><td class="body" style="padding:16px 20px;font-family:${FONT};font-size:14.5px;line-height:1.55;color:${C.body};">${b.note}</td></tr></table>`);
      text.push(strip(b.note), "");
    }
    else if (b.table) {
      const { head, rows, foot } = b.table, td = (al, extra = "") => `font-family:${FONT};font-size:14px;line-height:1.4;text-align:${al};${extra}`;
      html.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;">
        <tr>${head.map((h, i) => `<td class="muted line" style="${td(i ? "right" : "left", `padding:0 0 8px;color:${C.muted};font-size:12.5px;border-bottom:1px solid ${C.line};`)}">${h}</td>`).join("")}</tr>
        ${rows.map((r) => `<tr><td class="line" style="${td("left", `padding:12px 12px 12px 0;border-bottom:1px solid ${C.line};`)}"><b class="ink" style="font-weight:500;color:${C.ink};">${r[0]}</b>${r[1] ? `<br><span class="muted" style="font-size:13px;color:${C.muted};">${r[1]}</span>` : ""}</td><td class="ink line" valign="top" style="${td("right", `padding:12px 0;color:${C.ink};border-bottom:1px solid ${C.line};white-space:nowrap;`)}">${r[2]}</td></tr>`).join("")}
        ${(foot || []).map(([k, v], i) => `<tr><td class="${i === foot.length - 1 ? "ink" : "muted"}" style="${td("left", `padding:${i ? 6 : 14}px 12px 0 0;${i === foot.length - 1 ? `font-weight:600;color:${C.ink};font-size:15px;` : `color:${C.muted};`}`)}">${k}</td><td class="ink" style="${td("right", `padding:${i ? 6 : 14}px 0 0;white-space:nowrap;color:${C.ink};${i === foot.length - 1 ? "font-weight:600;font-size:15px;" : ""}`)}">${v}</td></tr>`).join("")}
      </table>`);
      text.push(...rows.map((r) => `${strip(r[0])}${r[1] ? ` (${strip(r[1])})` : ""}: ${strip(r[2])}`), ...(foot || []).map(([k, v]) => `${strip(k)}: ${strip(v)}`), "");
    }
    else if (b.metrics) {
      const cell = ([label, value, delta]) => `<td class="col" width="50%" valign="top" style="padding:0 5px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="soft" bgcolor="${C.soft}" style="background:${C.soft};border-radius:14px;"><tr><td style="padding:16px 18px;"><p class="muted" style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.3;color:${C.muted};">${label}</p><p class="ink" style="margin:0;font-family:${FONT};font-size:28px;line-height:1.1;font-weight:600;letter-spacing:-0.02em;color:${C.ink};">${value}</p>${delta ? `<p style="margin:6px 0 0;font-family:${FONT};font-size:13px;line-height:1.3;color:${C.green};" class="up">${delta}</p>` : ""}</td></tr></table></td>`;
      const rows = []; for (let i = 0; i < b.metrics.length; i += 2) rows.push(b.metrics.slice(i, i + 2));
      html.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px -5px 14px;width:calc(100% + 10px);">${rows.map((r) => `<tr>${r.map(cell).join("")}</tr>`).join("")}</table>`);
      text.push(...b.metrics.map(([l, v, d]) => `${strip(l)}: ${strip(v)}${d ? ` (${strip(d)})` : ""}`), "");
    }
    else if (b.status) { // audit rows: [state, title, text]; state good | work | missing
      const S = { good: ["stone-1", "good", C.green], work: ["stone-amber", "needs work", "#A86F12"], missing: ["stone-grey", "missing", C.muted] };
      html.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 14px;">${b.status.map(([s, t, d], i) => `<tr><td valign="top" width="30" class="line" style="width:30px;padding:${i ? 18 : 4}px 0 16px;${i ? `border-top:1px solid ${C.line};` : ""}">${img(S[s][0], { alt: "" })}</td><td valign="top" class="line" style="padding:${i ? 14 : 0}px 0 16px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${FONT};"><p style="margin:0 0 4px;font-size:12.5px;line-height:1.3;color:${S[s][2]};">${S[s][1]}</p><p class="ink" style="margin:0 0 4px;font-size:15.5px;line-height:1.35;font-weight:600;color:${C.ink};">${t}</p><p class="body" style="margin:0;font-size:14.5px;line-height:1.55;color:${C.body};">${d}</p></td></tr>`).join("")}</table>`);
      text.push(...b.status.map(([s, t, d]) => `[${S[s][1]}] ${strip(t)}\n${strip(d)}`).join("\n\n").split("\n"), "");
    }
    else if (b.quote) {
      html.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;"><tr><td class="line ink" style="border-left:3px solid ${C.sand};padding:2px 0 2px 16px;font-family:${FONT};font-size:16px;line-height:1.55;color:${C.ink};">${b.quote}</td></tr></table>`);
      text.push(`"${strip(b.quote)}"`, "");
    }
    else if (b.hr) { html.push(`<div class="lineb" style="height:1px;line-height:1px;font-size:1px;background:${C.line};margin:22px 0;">&nbsp;</div>`); text.push("—", ""); }
    else if (b.sign) {
      const s = b.sign === true ? "Best," : b.sign;
      html.push(`<p class="${plain ? "pl" : "body"}" style="${P}margin:22px 0 0;">${s}</p>`);
      html.push(signature(img, plain));
      text.push(s, "{{sender_name}}", "{{sender_role}}, Fieldwise", BRAND.phone, BRAND.email, "");
    }
    else if (b.ps) { html.push(`<p class="${plain ? "pl" : "body"}" style="${P}margin:20px 0 0;">${b.ps}</p>`); text.push(strip(b.ps), ""); }
    else throw new Error("unknown block " + JSON.stringify(b));
  }
  return { html: html.join("\n"), text: text.join("\n").replace(/\n{3,}/g, "\n\n").trim() };
}

function signature(img, plain) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0;"><tr>
    <td valign="middle" style="padding:0 14px 0 0;">${img("mark-tint", { alt: "Fieldwise", w: plain ? 30 : 36 })}</td>
    <td valign="middle" class="line" style="padding:0 0 0 14px;border-left:1px solid ${C.line};font-family:${FONT};">
      <p class="ink" style="margin:0;font-size:15px;line-height:1.35;font-weight:600;color:${C.ink};">{{sender_name}}</p>
      <p class="muted" style="margin:0;font-size:13.5px;line-height:1.45;color:${C.muted};">{{sender_role}}, Fieldwise</p>
      <p class="muted" style="margin:2px 0 0;font-size:13px;line-height:1.5;color:${C.muted};"><a href="tel:${BRAND.tel}" style="color:${C.muted};text-decoration:none;">${BRAND.phone}</a><br><a href="mailto:${BRAND.email}" style="color:${C.muted};text-decoration:none;">${BRAND.email}</a></p>
    </td></tr></table>`;
}

/* ---------- page shells ---------- */
const head = (title, extra = "") => `<!DOCTYPE html>
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
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  body { margin: 0 !important; padding: 0 !important; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
  img { -ms-interpolation-mode: bicubic; }
  a { color: ${C.green}; }
  .dk { display: none; max-height: 0; overflow: hidden; mso-hide: all; }
  @media (max-width: 620px) {
    .px { padding-left: 22px !important; padding-right: 22px !important; }
    .h1 { font-size: 24px !important; }
    .col { display: block !important; width: 100% !important; box-sizing: border-box; }
    .outer { padding: 0 !important; }
    .card { border-radius: 0 !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg { background: #15191B !important; }
    .card { background: #1D2225 !important; }
    .soft { background: #262C30 !important; }
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
  [data-ogsc] .body { color: #C9CEC9 !important; }
${extra}</style>
</head>`;
const pre = (t) => `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(t)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;

function branded(t, img) {
  const { html } = blocks(t.blocks, img, false);
  const corner = t.label ? `<td align="right" valign="middle" class="muted" style="font-family:${FONT};font-size:13px;color:${C.muted};">${t.label}</td>` : "";
  const foot = t.footer || "You&rsquo;re receiving this because we&rsquo;re working together.";
  return `${head(t.subject)}
<body class="bg" style="margin:0;padding:0;background:${C.page};">
${pre(t.preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" bgcolor="${C.page}" style="background:${C.page};">
<tr><td align="center" class="outer" style="padding:28px 12px;">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="${C.card}" style="max-width:600px;background:${C.card};border-radius:18px;overflow:hidden;">
  <tr><td class="px" style="padding:26px 36px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle"><a href="mailto:${BRAND.email}" style="text-decoration:none;">${img("logo", { alt: "Fieldwise", cls: "lt" })}<!--[if !mso]><!--><div class="dk">${img("logo-white", { alt: "Fieldwise" })}</div><!--<![endif]--></a></td>${corner}
  </tr></table></td></tr>
  ${t.banner ? `<tr><td style="padding:0;">${img(t.banner, { alt: "", fluid: true })}</td></tr>` : `<tr><td class="px" style="padding:0 36px;"><div class="lineb" style="height:1px;line-height:1px;font-size:1px;background:${C.line};">&nbsp;</div></td></tr>`}
  <tr><td class="px" style="padding:30px 36px 14px;">
${html}
  </td></tr>
  <tr><td class="px" style="padding:6px 36px 30px;">
    <div class="lineb" style="height:1px;line-height:1px;font-size:1px;background:${C.line};margin:0 0 20px;">&nbsp;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td valign="top" width="30" style="width:30px;padding:2px 0 0;">${img("mark-grey", { alt: "" })}</td>
      <td valign="top" style="font-family:${FONT};font-size:12.5px;line-height:1.6;color:${C.faint};" class="muted">
        <b style="font-weight:600;color:${C.muted};" class="muted">Fieldwise</b> &middot; ${BRAND.line}. ${BRAND.tagline}<br>
        <a href="mailto:${BRAND.email}" style="color:${C.faint};text-decoration:none;">${BRAND.email}</a> &middot; <a href="tel:${BRAND.tel}" style="color:${C.faint};text-decoration:none;">${BRAND.phone}</a><br>
        ${foot}
      </td></tr></table>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
}

// A personal email: what a person would send from their own inbox. No header, no banner.
function plain(t, img) {
  const { html } = blocks(t.blocks, img, true);
  return `${head(t.subject)}
<body class="card" style="margin:0;padding:0;background:#FFFFFF;">
${pre(t.preheader)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="#FFFFFF" style="background:#FFFFFF;">
<tr><td class="px" style="padding:28px 24px;">
<!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<div style="max-width:560px;">
${html}
</div>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
}

/* ---------- write ---------- */
const fill = (s, data) => s.replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/g, (m, k) => (k in data ? data[k] : m));
const tagsIn = (s) => [...new Set([...s.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/g)].map((m) => m[1]))];

const dist = path.join(__dirname, "dist");
for (const d of ["templates", "samples", "assets"]) fs.mkdirSync(path.join(dist, d), { recursive: true });
for (const f of fs.readdirSync(path.join(__dirname, "assets"))) fs.copyFileSync(path.join(__dirname, "assets", f), path.join(dist, "assets", f));

const index = [];
for (const t of T.templates) {
  const live = (t.kind === "plain" ? plain : branded)(t, makeImg(BRAND.assets));
  const local = (t.kind === "plain" ? plain : branded)(t, makeImg("../assets"));
  const txt = `Subject: ${t.subject}\n\n${blocks(t.blocks, makeImg(""), t.kind === "plain").text}\n`
    + (t.kind === "plain" ? "" : `\n--\nFieldwise · ${BRAND.line}. ${BRAND.tagline}\n${BRAND.email} · ${BRAND.phone}\n`);
  const data = { ...T.sample, ...(t.sample || {}) };
  const missing = tagsIn(live + t.preheader).filter((k) => !(k in data));
  if (missing.length) throw new Error(`${t.id}: no sample value for ${missing.join(", ")}`);
  fs.writeFileSync(path.join(dist, "templates", t.id + ".html"), live);
  fs.writeFileSync(path.join(dist, "templates", t.id + ".txt"), txt);
  fs.writeFileSync(path.join(dist, "samples", t.id + ".html"), fill(local, data));
  index.push({ id: t.id, group: t.group, name: t.name, kind: t.kind, when: t.when, subject: t.subject, preheader: t.preheader, sampleSubject: fill(t.subject, data), samplePre: fill(t.preheader, data), tags: tagsIn(live + t.subject + t.preheader).filter((k) => !["sender_name", "sender_role"].includes(k)) });
}
// signature on its own, for Gmail settings
const sig = `<!-- Fieldwise email signature. Replace the two {{tags}}, open this file in a browser, select all, copy, and paste into Gmail > Settings > Signature. -->\n` + signature(makeImg(BRAND.assets), false);
fs.writeFileSync(path.join(dist, "templates", "signature.html"), sig);
fs.writeFileSync(path.join(dist, "samples", "signature.html"), `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:28px 24px;font-family:${FONT};background:#fff}</style></head><body>` + fill(signature(makeImg("../assets"), false), T.sample) + `</body></html>`);
index.push({ id: "signature", group: "basics", name: "Email signature", kind: "plain", when: "Paste into Gmail settings once. Used under every email you write by hand.", subject: "", preheader: "", sampleSubject: "", samplePre: "", tags: [] });

fs.writeFileSync(path.join(dist, "index.json"), JSON.stringify(index, null, 1));
fs.writeFileSync(path.join(dist, "index.html"), require("./gallery.js")(index, T.groups));
console.log(index.length, "emails built");
