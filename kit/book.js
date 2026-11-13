// Brand book PDF: capture sections and artboards as images, lay them out on A4 landscape pages.
// usage: node book.js <out.pdf> <scratch dir for images>
const { chromium } = require("../pw.js");
const fs = require("fs"), path = require("path");
(async () => {
  const out = path.resolve(process.argv[2] || "../dist/fieldwise-brand-kit.pdf");
  const tmp = path.resolve(process.argv[3], "book-" + Date.now()); fs.mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, colorScheme: "light" });
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(1500);
  await p.addStyleTag({ content: ".hero-meta, .tile .row, .mini, .copy-hint { display: none !important; } #view, #view * { text-transform: none !important; }" });
  const pages = [];
  const grab = async (el, name, meta) => { const f = `${tmp}/${name}.jpg`; await el.screenshot({ path: f, type: "jpeg", quality: 84 }); pages.push({ f, ...meta }); };
  await p.evaluate(() => (location.hash = "mark")); await p.waitForTimeout(3200); await p.addStyleTag({ content: ".hero-meta, .tile .row, .mini { display: none !important; } #view, #view * { text-transform: none !important; }" });
  const heroF = `${tmp}/cover.jpg`; await (await p.$("#hero")).screenshot({ path: heroF, type: "jpeg", quality: 88 });
  const sections = async (view, label) => {
    await p.evaluate((v) => (location.hash = v), view); await p.waitForTimeout(2600);
    const blocks = await p.$$("#view .block");
    for (let i = 0; i < blocks.length; i++) {
      const title = await blocks[i].$eval("h2", (h) => h.textContent).catch(() => "");
      if (title === "Motion") continue;
      await blocks[i].scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
      await grab(blocks[i], `${view}-${i}`, { section: label, title });
    }
  };
  await sections("mark", "Mark"); await sections("colour", "Colour"); await sections("type", "Type");
  const arts = await p.evaluate(() => KIT.ARTS.map((a) => ({ id: a.id, title: a.title, spec: a.spec, cat: a.cat })));
  await p.setViewportSize({ width: 1600, height: 1920 });
  for (const a of arts) {
    await p.evaluate((id) => { const a = KIT.ARTS.find((x) => x.id === id); let el = document.getElementById("probe"); if (el) el.remove(); el = document.createElement("div"); el.id = "probe"; el.className = "fr"; el.style.cssText = `position:fixed;left:0;top:0;width:${a.w}px;height:${a.h}px;z-index:99;aspect-ratio:auto`; document.body.appendChild(el); KIT.mountArt(el, a, "cover"); }, a.id);
    await p.waitForTimeout(500);
    await grab(await p.$("#probe"), "art-" + a.id, { section: { print: "Print", digital: "Digital", social: "Social" }[a.cat], title: a.title, spec: a.spec });
  }
  const st = await p.evaluate(() => KIT.state());
  const W = 1123, H = 794, mk = (x) => "file://" + x;
  const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,400..700&family=Google+Sans+Code&display=swap" rel="stylesheet"><style>
    @page { size: ${W}px ${H}px; margin: 0; } * { box-sizing: border-box; } body { margin: 0; font-family: "Google Sans Flex", sans-serif; color: #17221D; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pg { width: ${W}px; height: ${H}px; position: relative; overflow: hidden; break-after: page; background: #F2EFE8; padding: 40px 48px 36px; display: flex; flex-direction: column; }
    .hd { display: flex; justify-content: space-between; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: #868D87; font-weight: 500; }
    .im { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; margin: 18px 0 14px; }
    .im img { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 14px; }
    .ft { display: flex; justify-content: space-between; align-items: baseline; gap: 20px; } .ft b { font-weight: 500; font-size: 18px; letter-spacing: -.01em; } .ft span { font-size: 12px; color: #56605A; }
    .cv { background: #ECE7DE; padding: 0; } .cv img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .cv .t { position: absolute; left: 56px; top: 52px; } .cv h1 { font-size: 64px; font-weight: 500; letter-spacing: -.035em; margin: 10px 0 0; line-height: 1; } .cv p { font-size: 14px; color: #56605A; margin: 14px 0 0; }
    .cv .n { position: absolute; left: 56px; bottom: 44px; font: 400 12px "Google Sans Code", monospace; color: #56605A; }
  </style></head><body>
  <section class="pg cv"><img src="${mk(heroF)}"><div class="t"><div class="hd">Fieldwise</div><h1>Brand kit</h1><p>Sea glass, set into a right angle.</p></div><div class="n">November 2026</div></section>
  ${pages.map((g, i) => `<section class="pg"><div class="hd"><span>Fieldwise brand kit</span><span>${g.section} · ${String(i + 2).padStart(2, "0")}</span></div><div class="im"><img src="${mk(g.f)}"></div><div class="ft"><b>${g.title}</b><span>${g.spec || ""}</span></div></section>`).join("")}
  </body></html>`;
  fs.writeFileSync(`${tmp}/book.html`, html);
  await p.goto("file://" + `${tmp}/book.html`); await p.waitForTimeout(2000); await p.evaluateHandle("document.fonts.ready");
  await p.pdf({ path: out, width: `${W}px`, height: `${H}px`, printBackground: true, preferCSSPageSize: true });
  await b.close();
  console.log("pages", pages.length + 1, "size", (fs.statSync(out).size / 1e6).toFixed(1) + " MB", st.L);
})();
