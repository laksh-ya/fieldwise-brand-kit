const { chromium } = require("../pw.js");
(async () => {
  const [,, file, out, w = "1800", sel, scale = "1"] = process.argv;
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: +scale });
  p.on("console", (m) => console.log("console:", m.text())); p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto(file.startsWith("file:") ? file : "file://" + require("path").resolve(file)); await p.waitForTimeout(1500);
  if (sel) await (await p.$(sel)).screenshot({ path: out }); else await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
