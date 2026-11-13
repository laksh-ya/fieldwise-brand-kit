// Render views and every artboard for review. usage: node check.js <outdir> [desktop|android] [arts|views|all]
const { chromium } = require("../pw.js");
const path = require("path");
(async () => {
  const [,, out, dev = "desktop", what = "all", only] = process.argv;
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = dev === "android"
    ? await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36" })
    : await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  const url = "file://" + path.resolve("index.html");
  await p.goto(url); await p.waitForTimeout(1500);
  if (what !== "arts") for (const v of (only ? only.split(",") : ["choose", "mark", "colour", "type", "apply"])) {
    await p.evaluate((v) => (location.hash = v), v); await p.waitForTimeout(2600);
    if (v === "apply") { for (let y = 0; y < 8000; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(150); } await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800); }
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await p.screenshot({ path: `${out}/${dev}-${v}.png`, fullPage: true });
    console.log(v, "overflow", ov);
  }
  if (what !== "views") {
    const ids = await p.evaluate(() => KIT.ARTS.map((a) => a.id));
    for (const id of (only ? only.split(",").filter((x) => ids.includes(x)) : ids)) {
      const box = await p.evaluate((id) => { const a = KIT.ARTS.find((x) => x.id === id); let el = document.getElementById("probe"); if (el) el.remove(); el = document.createElement("div"); el.id = "probe"; el.className = "fr"; el.style.cssText = `position:fixed;left:0;top:0;width:${a.w}px;height:${a.h}px;z-index:99;aspect-ratio:auto`; document.body.appendChild(el); KIT.mountArt(el, a, "cover"); return [a.w, a.h]; }, id);
      await p.setViewportSize({ width: Math.max(1440, box[0]), height: Math.max(900, box[1]) }); await p.waitForTimeout(700);
      await (await p.$("#probe")).screenshot({ path: `${out}/art-${id}.png` });
    }
  }
  console.log("errors:", errs.slice(0, 5));
  await b.close();
})();
