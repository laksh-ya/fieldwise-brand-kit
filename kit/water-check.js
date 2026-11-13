const { chromium } = require("../pw.js");
const path = require("path");
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files", "--enable-unsafe-swiftshader", "--use-angle=swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }));
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.resolve("index.html") + "#mark"); await p.waitForTimeout(6000);
  await p.screenshot({ path: out + "/wander.png" });
  await p.evaluate(() => document.querySelector(".cz-open").click()); await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-act="wp"]').click()); await p.waitForTimeout(700);
  await p.screenshot({ path: out + "/panel.png" });
  console.log(await p.evaluate(() => JSON.stringify(KIT.state().water.hero) + " pal=" + KIT.state().pal), errs);
  await b.close();
})();
