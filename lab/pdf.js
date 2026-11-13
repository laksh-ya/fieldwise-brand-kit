const { chromium } = require("../pw.js");
(async () => {
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto("file://" + require("path").resolve("../dist/fieldwise-logo-lab.html"));
  await p.evaluate(() => document.getElementById("mstage").scrollIntoView()); await p.waitForTimeout(4500);
  await p.evaluate(() => window.scrollTo(0, 0)); await p.evaluateHandle("document.fonts.ready");
  await p.emulateMedia({ media: "print", colorScheme: "light" });
  await p.pdf({ path: "../dist/fieldwise-logo-lab.pdf", format: "A4", printBackground: true, scale: 0.62, margin: { top: "12mm", bottom: "12mm", left: "10mm", right: "10mm" } });
  await b.close();
})();
