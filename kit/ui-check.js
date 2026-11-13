const { chromium } = require("../pw.js");
const path = require("path");
(async () => {
  const [,, out, dev = "android"] = process.argv;
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = dev === "android" ? await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }) : await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.resolve("index.html") + "#mark"); await p.waitForTimeout(3000);
  if (dev === "android") { await p.tap(".cz-open"); await p.waitForTimeout(700); await p.screenshot({ path: `${out}/${dev}-sheet.png` }); await p.tap("[data-act=sheetclose]"); await p.waitForTimeout(400); }
  else await p.screenshot({ path: `${out}/${dev}-mark.png` });
  await p.evaluate(() => [...document.querySelectorAll("h2")].find((h) => h.textContent === "logo files").scrollIntoView()); await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/${dev}-files.png` });
  await p.evaluate(() => (location.hash = "apply")); await p.waitForTimeout(2500);
  await p.evaluate(() => scrollTo(0, 420)); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${dev}-apply.png` });
  await p.click('.fr-btn[data-id="card"]'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${dev}-viewer.png` });
  console.log(dev, errs, await p.evaluate(() => document.querySelectorAll(".next:not([style*=none])").length));
  await b.close();
})();
