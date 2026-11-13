// Android frames of the new interactions: hero water, ripple, tabs, footer, sheet.
const { chromium } = require("../pw.js");
const path = require("path");
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36" });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("file://" + path.resolve("index.html") + "#mark"); 
  await p.waitForTimeout(1300); await p.screenshot({ path: `${out}/w1-landing.png` });
  await p.waitForTimeout(2600); await p.screenshot({ path: `${out}/w2-settled.png` });
  const r = await p.$eval("#hero", (e) => { const b = e.getBoundingClientRect(); return [b.left + b.width * 0.35, b.top + b.height * 0.4]; });
  await p.touchscreen.tap(r[0], r[1]); await p.waitForTimeout(260); await p.screenshot({ path: `${out}/w3-ripple.png` });
  console.log("water:", await p.evaluate(() => !!document.querySelector("#hero .pond canvas") && (document.querySelector("#hero .pond-c").getContext ? "canvas" : "")));
  await p.evaluate(() => scrollTo(0, 2000)); await p.waitForTimeout(900); await p.screenshot({ path: `${out}/w4-scrolled.png` });
  await p.evaluate(() => document.querySelector(".foot").scrollIntoView({ block: "end" })); await p.waitForTimeout(1600);
  const f = await p.$eval(".foot", (e) => { const b = e.getBoundingClientRect(); return [b.left + b.width * 0.5, b.top + b.height * 0.7]; });
  await p.touchscreen.tap(f[0], f[1]); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/w5-foot.png` });
  await p.tap(".cz-open"); await p.waitForTimeout(700);
  await p.tap('.sheet [data-set="mat"][data-v="tint"]'); await p.waitForTimeout(200); await p.screenshot({ path: `${out}/w6-sheet-mid.png` });
  await p.waitForTimeout(600); await p.screenshot({ path: `${out}/w7-sheet.png` });
  await p.tap('.sheet [data-set="mat"][data-v="glass"]'); await p.tap(".sheet [data-act=sheetclose]"); await p.waitForTimeout(500);
  await p.tap('.tabbar a[href="#choose"]'); await p.waitForTimeout(250); await p.screenshot({ path: `${out}/w8-tab-mid.png` });
  await p.waitForTimeout(900); await p.screenshot({ path: `${out}/w9-choose.png` });
  await p.tap(".pk.on .star"); await p.waitForTimeout(250); await p.screenshot({ path: `${out}/w10-star.png` });
  console.log("errors", errs);
  await b.close();
})();
