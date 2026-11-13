const { chromium } = require("../pw.js");
const path = require("path");
(async () => {
  const [,, out, dev = "android"] = process.argv;
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = dev === "android" ? await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }) : await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("file://" + path.resolve("index.html")); await p.waitForTimeout(3500);
  await p.screenshot({ path: `${out}/${dev}-home.png` });
  await p.keyboard.press("w"); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${dev}-water.png` });
  await p.evaluate(() => { const b = document.querySelector("#wpb"); b.scrollTop = 500; }); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/${dev}-water2.png` });
  await p.evaluate(() => document.querySelector('[data-act="wtab"][data-v="archive"]').click()); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/${dev}-archive.png` });
  console.log(dev, await p.evaluate(() => [location.hash, document.querySelectorAll(".tabbar a").length, KIT.state().L, KIT.state().pal]), errs);
  await b.close();
})();
