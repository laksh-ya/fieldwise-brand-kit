// Build: a self-contained HTML (local/offline), an artifact version (no document wrapper), and a PDF.
const fs = require("fs");
let h = fs.readFileSync("board.html", "utf8");
for (const f of ["pebbles.js", "layouts.js"]) h = h.replace(`<script src="${f}"></script>`, () => `<script>\n${fs.readFileSync(f, "utf8")}\n</script>`);
fs.mkdirSync("../dist", { recursive: true });
fs.writeFileSync("../dist/fieldwise-logo-lab.html", h);
// Artifact: the host adds doctype/html/head/body, charset and viewport.
const art = h.replace(/<!doctype html>\s*/i, "").replace(/<html[^>]*>\s*/i, "").replace(/<head>\s*/i, "")
  .replace(/<meta charset="utf-8">\s*/i, "").replace(/<meta name="viewport"[^>]*>\s*/i, "")
  .replace(/<\/head>\s*/i, "").replace(/<body>\s*/i, "").replace(/<\/body>\s*/i, "").replace(/<\/html>\s*/i, "");
fs.writeFileSync(process.argv[2] || "../dist/artifact.html", art);
console.log("html", (h.length / 1024).toFixed(0) + " KB", "| artifact starts:", art.slice(0, 40).replace(/\n/g, " "));
