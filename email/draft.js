#!/usr/bin/env node
// Draft one email from a spec. This is the tool to use when writing a new email (people and agents).
//
//   node draft.js <spec.json> [options]
//
//   --data <file.json>    values for the {{tags}} (merged over nothing; sample.json is NOT used)
//   --set key=value       one tag value; repeat as needed (wins over --data)
//   --sample              fill any remaining tags from sample.json (for trying things out)
//   --out <dir>           where to write (default: drafts/)
//   --png                 also write a phone-width preview PNG (needs Playwright)
//   --eml                 also write a .eml file (HTML + text + images) to import or send via the Gmail API
//   --to, --from          addresses for the .eml headers
//   --inline              put every image inside the .eml instead of loading it from the hosted kit
//   --keep-tags           allow {{tags}} to stay (for templates you load into a mail tool)
//
// Writes <out>/<id>.html, <id>.txt (and .png / .eml), then prints checks. Exits with 1 on errors.
const fs = require("fs"), path = require("path");
const { render, lint, fill, tagsIn, BRAND, ROOT } = require("./lib/render.js");

const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const has = (k) => args.includes(k);
const specPath = args.find((a) => a.endsWith(".json") && args[args.indexOf(a) - 1] !== "--data");
if (!specPath) { console.error("usage: node draft.js <spec.json> [--data values.json] [--set key=value] [--sample] [--png] [--eml]"); process.exit(1); }

const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
spec.id = path.basename(specPath, ".json"); // output files are named after the spec file
let data = {};
if (opt("--data")) data = JSON.parse(fs.readFileSync(opt("--data"), "utf8"));
args.forEach((a, i) => { if (a === "--set") { const [k, ...v] = args[i + 1].split("="); data[k] = v.join("="); } });
if (has("--sample")) data = { ...JSON.parse(fs.readFileSync(path.join(ROOT, "sample.json"), "utf8")), ...data };

const out = path.resolve(opt("--out") || path.join(ROOT, "drafts"));
fs.mkdirSync(out, { recursive: true });

let r;
try { r = render(spec); } catch (e) { console.error("✗ " + e.message); process.exit(1); }
const html = fill(r.html, data), text = fill(r.text, data), subject = fill(spec.subject, data);
const checks = lint(spec, { html, text, subject });
// a real email can't go out with {{tags}} in it; --keep-tags is for building templates for mail tools
if (!has("--keep-tags")) { const i = checks.warns.findIndex((w) => w.startsWith("unfilled tags")); if (i >= 0) checks.errors.push(checks.warns.splice(i, 1)[0] + " (fill them, or pass --keep-tags for a mail-tool template)"); }
// wording that belongs to the sample client (a dental clinic) and shouldn't survive into a real email
if (!has("--sample")) {
  const given = Object.values(data).join(" ").toLowerCase();
  const left = ["patient", "clinic", "dental", "dentist", "Asha", "Sunrise", "Bhopal", "Arera"].filter((w) => new RegExp(`\\b${w}`, "i").test(text) && !given.includes(w.toLowerCase()));
  if (left.length) checks.warns.push(`sample wording still in the email: ${left.join(", ")}. Rewrite those lines for this business`);
}
fs.writeFileSync(path.join(out, spec.id + ".html"), html);
fs.writeFileSync(path.join(out, spec.id + ".txt"), `Subject: ${subject}\n\n${text}`);
const wrote = [spec.id + ".html", spec.id + ".txt"];

(async () => {
  if (has("--png")) {
    // preview with local images so it works before anything is published
    const local = fill(render(spec, "file://" + path.join(ROOT, "assets")).html, data), tmp = path.join(out, `.${spec.id}.preview.html`);
    fs.writeFileSync(tmp, local);
    const { shoot } = require("./lib/shoot.js");
    if (await shoot([[tmp, path.join(out, spec.id + ".png")]], { width: spec.kind === "letter" ? 600 : 412 })) wrote.push(spec.id + ".png");
    fs.unlinkSync(tmp);
  }
  if (has("--eml")) { fs.writeFileSync(path.join(out, spec.id + ".eml"), eml(html, text, subject)); wrote.push(spec.id + ".eml"); }

  console.log(`subject:   ${subject}`);
  console.log(`preheader: ${fill(spec.preheader, data)}`);
  console.log(`wrote:     ${wrote.map((f) => { const r = path.relative(process.cwd(), path.join(out, f)); return r.startsWith("..") ? path.join(out, f) : r; }).join("  ")}`);
  for (const e of checks.errors) console.log("✗ " + e);
  for (const w of checks.warns) console.log("! " + w);
  if (!checks.errors.length && !checks.warns.length) console.log("✓ no issues");
  process.exit(checks.errors.length ? 1 : 0);
})();

// RFC 822 message: text + HTML; images either hosted (default) or attached inline.
function eml(html, text, subject) {
  const id = () => Math.random().toString(36).slice(2), b64 = (s) => Buffer.from(s).toString("base64").replace(/.{76}/g, "$&\r\n");
  const enc = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s).toString("base64")}?=`);
  const parts = [];
  // images not on the hosted kit (assets/u/*) or everything with --inline become cid: attachments
  html = html.replace(new RegExp(`${BRAND.host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^"]+)`, "g"), (m, file) => {
    if (!has("--inline") && !file.startsWith("u/")) return m;
    const f = path.join(ROOT, "assets", file); if (!fs.existsSync(f)) return m;
    let p = parts.find((x) => x.file === file); if (!p) parts.push((p = { file, cid: id() + "@fieldwise" }));
    return "cid:" + p.cid;
  });
  const alt = "alt-" + id(), rel = "rel-" + id();
  const altPart = [`Content-Type: multipart/alternative; boundary="${alt}"`, "", `--${alt}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64(text), `--${alt}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64(html), `--${alt}--`].join("\r\n");
  const head = [opt("--from") ? `From: ${opt("--from")}` : null, opt("--to") ? `To: ${opt("--to")}` : null, `Subject: ${enc(subject)}`, "MIME-Version: 1.0", "X-Unsent: 1"].filter(Boolean);
  if (!parts.length) return [...head, altPart].join("\r\n");
  return [...head, `Content-Type: multipart/related; boundary="${rel}"`, "", `--${rel}`, altPart, ...parts.flatMap((p) => [`--${rel}`, `Content-Type: image/${p.file.endsWith(".png") ? "png" : "jpeg"}`, "Content-Transfer-Encoding: base64", `Content-ID: <${p.cid}>`, `Content-Disposition: inline; filename="${path.basename(p.file)}"`, "", fs.readFileSync(path.join(ROOT, "assets", p.file)).toString("base64").replace(/.{76}/g, "$&\r\n")]), `--${rel}--`].join("\r\n");
}
