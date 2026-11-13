const { chromium } = require("../pw.js");
const path = require("path");
(async () => {
  const [,, out, dev = "android"] = process.argv;
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = dev === "android" ? await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36" }) : await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("file://" + path.resolve("index.html") + "#mark"); await p.waitForTimeout(3800);
  await p.screenshot({ path: `${out}/${dev}-1-mark.png` });
  await p.evaluate(() => document.querySelector(".foot").scrollIntoView({ block: "end" })); await p.waitForTimeout(1800);
  await p.screenshot({ path: `${out}/${dev}-2-foot.png` });
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
  await p.keyboard.press("w"); await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}/${dev}-3-water.png` });
  await p.click('[data-act="wpreset"][data-v="choppy"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/${dev}-4-choppy.png` });
  await p.click('[data-act="wplace"][data-v="page"]'); await p.waitForTimeout(300); await p.click('#wpb [data-wk="enabled"]'); await p.waitForTimeout(800);
  await p.click('[data-act="wpclose"]'); await p.goto("file://" + path.resolve("index.html") + "#choose"); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${dev}-5-choose-pagewater.png` });
  if (dev === "android") { await p.tap(".cz-open"); await p.waitForTimeout(800); await p.evaluate(() => document.querySelector(".sheet .sh-b").scrollTop = 900); await p.waitForTimeout(300); await p.screenshot({ path: `${out}/${dev}-6-sheet.png` }); }
  console.log(dev, "errors", errs);
  await b.close();
})();
