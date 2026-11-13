// Build every email in templates/ plus the gallery.
// usage: node build.js [--shots]
//   dist/templates/<id>.html  send-ready: {{tags}} left in, images from the hosted kit
//   dist/templates/<id>.txt   plain text (subject on the first line)
//   dist/templates/<id>.json  the spec, to copy and edit with draft.js
//   dist/samples/<id>.html    filled with sample.json, for previews
//   dist/index.html           the gallery; dist/guide.md the guide it shows
//   --shots                   also refresh docs/*.jpg (phone previews used in GUIDE.md)
const fs = require("fs"), path = require("path");
const { render, lint, fill, tagsIn } = require("./lib/render.js");

const ROOT = __dirname, dist = path.join(ROOT, "dist");
const sample = JSON.parse(fs.readFileSync(path.join(ROOT, "sample.json"), "utf8"));
const groups = JSON.parse(fs.readFileSync(path.join(ROOT, "groups.json"), "utf8"));
for (const d of ["templates", "samples", "assets", "docs"]) fs.rmSync(path.join(dist, d), { recursive: true, force: true });
for (const d of ["templates", "samples"]) fs.mkdirSync(path.join(dist, d), { recursive: true });
fs.cpSync(path.join(ROOT, "assets"), path.join(dist, "assets"), { recursive: true });

const specs = fs.readdirSync(path.join(ROOT, "templates")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, "templates", f), "utf8")));
const order = groups.map((g) => g[0]);
specs.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.id.localeCompare(b.id));

const index = []; let problems = 0;
for (const s of specs) {
  const live = render(s), local = render(s, "../assets");
  const missing = tagsIn(live.html + s.subject + s.preheader).filter((k) => !(k in sample));
  if (missing.length) throw new Error(`${s.id}: sample.json has no value for ${missing.join(", ")}`);
  const filled = { html: fill(local.html, sample), text: fill(local.text, sample), subject: fill(s.subject, sample) };
  const { errors, warns } = lint(s, filled);
  for (const e of errors) { console.log(`✗ ${s.id}: ${e}`); problems++; }
  for (const w of warns) console.log(`! ${s.id}: ${w}`);
  fs.writeFileSync(path.join(dist, "templates", s.id + ".html"), live.html);
  fs.writeFileSync(path.join(dist, "templates", s.id + ".txt"), `Subject: ${s.subject}\n\n${live.text}`);
  fs.copyFileSync(path.join(ROOT, "templates", s.id + ".json"), path.join(dist, "templates", s.id + ".json"));
  fs.writeFileSync(path.join(dist, "samples", s.id + ".html"), filled.html);
  index.push({ id: s.id, group: s.group, name: s.name, kind: s.kind, when: s.when, sampleSubject: fill(s.subject, sample), samplePre: fill(s.preheader, sample), tags: tagsIn(live.html + s.subject + s.preheader).filter((k) => !["sender_name", "sender_role"].includes(k)) });
}

// Gmail signature on its own
const sigSpec = { kind: "letter", subject: "Signature", preheader: "", blocks: [{ type: "signoff", text: "" }] };
const sig = (base) => render(sigSpec, base).html.match(/<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px[\s\S]*?<\/table>/)[0];
fs.writeFileSync(path.join(dist, "templates", "signature.html"), `<!-- Fieldwise email signature. Replace the two {{tags}}, open in a browser, select all, copy, and paste into Gmail > Settings > General > Signature. -->\n${sig("https://fieldwise-brand-kit.vercel.app/email/assets")}\n`);
fs.writeFileSync(path.join(dist, "samples", "signature.html"), `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:28px 24px;background:#fff">${fill(sig("../assets"), sample)}</body></html>`);
index.push({ id: "signature", group: "basics", name: "Email signature", kind: "letter", when: "Paste into Gmail settings once. Used under every email you write by hand.", sampleSubject: "", samplePre: "", tags: [] });

fs.writeFileSync(path.join(dist, "index.json"), JSON.stringify(index, null, 1));
fs.copyFileSync(path.join(ROOT, "GUIDE.md"), path.join(dist, "guide.md"));
if (fs.existsSync(path.join(ROOT, "docs"))) fs.cpSync(path.join(ROOT, "docs"), path.join(dist, "docs"), { recursive: true });
fs.writeFileSync(path.join(dist, "index.html"), require("./gallery.js")(index, groups));
console.log(`${index.length} emails built${problems ? `, ${problems} errors` : ""}`);

if (process.argv.includes("--shots")) {
  const { shoot } = require("./lib/shoot.js");
  const pick = ["cold-1-first-touch", "cold-5-the-note", "proposal", "welcome", "launch", "all-blocks"];
  fs.mkdirSync(path.join(ROOT, "docs"), { recursive: true });
  shoot(pick.map((id) => [path.join(dist, "samples", id + ".html"), path.join(ROOT, "docs", id + ".jpg")]), { width: 412 }).then(() => console.log("docs/*.jpg updated"));
}
if (problems) process.exitCode = 1;
