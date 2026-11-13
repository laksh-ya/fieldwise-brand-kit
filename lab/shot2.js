// Screenshot a selector with the sticky bar released; optional wait for animation.
const { chromium } = require("../pw.js");
(async () => {
  const [,, url, out, w, sel, wait = "1500"] = process.argv;
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: +w, height: 1000 }, deviceScaleFactor: 1 });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto(url); await p.addStyleTag({ content: ":root{--barpos:static}" });
  const el = await p.$(sel); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(+wait);
  await el.screenshot({ path: out }); await b.close();
})();
