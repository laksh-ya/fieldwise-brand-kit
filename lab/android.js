// Check the board as an Android phone (Pixel-class): overflow + screenshots per section.
const { chromium } = require("../pw.js");
(async () => {
  const [,, url, outdir] = process.argv;
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36" });
  const p = await ctx.newPage(); p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto(url); await p.waitForTimeout(2500);
  const ov = await p.evaluate(() => { const W = document.documentElement.clientWidth; return { sw: document.documentElement.scrollWidth, W, wide: [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.right > W + 1 && !e.closest(".bar") && getComputedStyle(e).position !== "fixed"; }).slice(0, 8).map((e) => e.tagName + "." + e.className + " " + Math.round(e.getBoundingClientRect().right)) }; });
  console.log(JSON.stringify(ov));
  await p.screenshot({ path: outdir + "/a-top.png" });
  for (const s of ["#concepts", "#motion", "#lockups", "#print"]) {
    await p.$eval(s, (e) => e.scrollIntoView()); await p.waitForTimeout(s === "#motion" ? 3500 : 900);
    await p.screenshot({ path: outdir + "/a-" + s.slice(1) + ".png" });
  }
  await b.close();
})();
