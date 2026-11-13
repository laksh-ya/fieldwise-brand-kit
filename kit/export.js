// Export every file the kit offers for download: logo files and each application's artwork.
// usage: node export.js <out dir>   (writes <out>/files/logo/* and <out>/files/apply/*)
const { chromium } = require("../pw.js");
const fs = require("fs"), path = require("path");
(async () => {
  const out = path.resolve(process.argv[2] || "../deploy");
  const logoDir = path.join(out, "files/logo"), appDir = path.join(out, "files/apply");
  fs.mkdirSync(logoDir, { recursive: true }); fs.mkdirSync(appDir, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
  const url = "file://" + path.resolve("index.html") + "#mark";
  const errs = [];
  async function pageAt(scale) {
    const ctx = await b.newContext({ viewport: { width: 1700, height: 2000 }, deviceScaleFactor: scale, colorScheme: "light" });
    const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push(e.message));
    await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: "#probe{position:fixed;left:0;top:0;z-index:999;background:transparent} #probe .ab{position:static;transform:none} .pond,.toast{display:none!important} body > :not(#probe){display:none!important} html,body{background:transparent!important} body::before,body::after{display:none!important}" });
    return { p, ctx };
  }
  const mount = (p, html) => p.evaluate((html) => { let el = document.getElementById("probe"); if (el) el.remove(); el = document.createElement("div"); el.id = "probe"; el.innerHTML = html; document.body.appendChild(el); return document.fonts.ready; }, html);
  const settle = (p) => p.evaluate(() => Promise.all([...document.querySelectorAll("#probe img")].map((i) => i.decode().catch(() => {}))));

  // ---- logo files ----
  let { p, ctx } = await pageAt(1);
  const files = await p.evaluate(() => KIT.LOGO_FILES);
  for (const f of files) {
    if (f.kind === "insta") continue;
    if (f.svg) {
      const svg = await p.evaluate((f) => KIT.render(KIT.items(), { size: f.small ? 512 : 1000, material: f.mat, pad: 0.14, room: f.mat === "glass", ink: f.ink, bg: f.mat === "glass" ? "#ECE7DE" : undefined }), f);
      fs.writeFileSync(path.join(logoDir, f.id + ".svg"), svg);
    }
    let html;
    const glass = f.mat === "glass", SAND = "background:#ECE7DE;";
    if (f.kind === "mark") html = await p.evaluate((f) => f.mat === "glass" ? `<div style="width:2048px;height:2048px;background:#ECE7DE;display:grid;place-items:center">${KIT.render(KIT.items(), { size: 1500, material: "glass", pad: 0.04, room: true })}</div>` : `<div style="display:inline-block">${KIT.render(KIT.items(), { size: f.small ? 512 : 2000, material: f.mat, pad: 0.04, ink: f.ink })}</div>`, f);
    else if (f.kind === "lockup") html = await p.evaluate((f) => `<div class="ab" style="display:inline-block;${f.mat === "glass" ? "background:#ECE7DE;padding:140px 170px" : "padding:40px 60px 40px 30px"}">${KIT.lockup({ mat: f.mat, fs: 220, color: f.color || "#18241F", ink: f.ink })}</div>`, f);
    else if (f.kind === "stacked") html = await p.evaluate((f) => `<div class="ab" style="display:inline-block;background:#ECE7DE;padding:140px 200px">${KIT.lockup({ mat: f.mat, fs: 180, stacked: true })}</div>`, f);
    else if (f.kind === "icon") html = await p.evaluate(() => `<div style="width:1024px;height:1024px;background:linear-gradient(160deg,#F6F2EA,#E2DBCF);display:grid;place-items:center">${KIT.markImg("glass", 560)}</div>`);
    await mount(p, html); await settle(p); await p.waitForTimeout(300);
    await (await p.$("#probe > *")).screenshot({ path: path.join(logoDir, f.id + ".png"), omitBackground: !(f.kind === "icon" || glass) });
    console.log("logo", f.id);
  }
  // favicon at its real sizes
  for (const s of [32, 180]) {
    const svg = await p.evaluate((s) => KIT.render(KIT.items(), { size: s, material: s >= 180 ? "glass" : "flat", pad: 0.04, room: s >= 180 }), s);
    await mount(p, `<div style="width:${s}px;height:${s}px;display:grid;place-items:center;background:${s >= 180 ? "#ECE7DE" : "transparent"}">${svg.replace(/width="[^"]+" height="[^"]+"/, `width="${s * 0.86}" height="${s * 0.86}"`)}</div>`);
    await p.waitForTimeout(200);
    await (await p.$("#probe > *")).screenshot({ path: path.join(logoDir, s === 32 ? "favicon-32.png" : "apple-touch-icon.png"), omitBackground: s < 180 });
  }
  await ctx.close();

  // ---- applications ----
  const list = await (await pageAt(1)).p.evaluate(() => Object.entries(KIT.PIECES).map(([id, pcs]) => pcs.map(([n, , sel, sc]) => ({ id, n, sel, sc, mock: !sel }))).flat());
  const byScale = {};
  for (const x of list) (byScale[x.sc] = byScale[x.sc] || []).push(x);
  for (const [sc, items] of Object.entries(byScale)) {
    const { p, ctx } = await pageAt(+sc);
    for (const x of items) {
      const file = path.join(out, await p.evaluate(([id, n]) => KIT.piecePath(id, n), [x.id, x.n]));
      if (x.mock) {
        await p.evaluate((id) => { const a = KIT.ARTS.find((y) => y.id === id); let el = document.getElementById("probe"); if (el) el.remove(); el = document.createElement("div"); el.id = "probe"; el.className = "fr"; el.style.cssText = `position:fixed;left:0;top:0;width:${a.w}px;height:${a.h}px;z-index:999`; document.body.appendChild(el); KIT.mountArt(el, a, "cover"); }, x.id);
        await settle(p); await p.waitForTimeout(500);
        await (await p.$("#probe")).screenshot({ path: file });
      } else {
        await p.evaluate(([id, n]) => { const pc = KIT.PIECES[id].find((y) => y[0] === n); let el = document.getElementById("probe"); if (el) el.remove(); el = document.createElement("div"); el.id = "probe"; el.innerHTML = `<div class="ab">${pc[1]()}</div>`; document.body.appendChild(el); }, [x.id, x.n]);
        await settle(p); await p.waitForTimeout(400);
        const el = await p.$(`#probe .ab ${x.sel}`) || await p.$("#probe .ab > *");
        await el.screenshot({ path: file });
      }
      console.log("apply", x.id, x.n, sc);
    }
    await ctx.close();
  }
  console.log("errors", errs.slice(0, 5));
  await b.close();
})();
