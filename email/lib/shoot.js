// Screenshot email HTML files (for previews and the guide). Needs Playwright and Chrome.
const path = require("path");
function pw() { try { return require("../../pw.js"); } catch (e) { return null; } }
// files: [[htmlPath, pngPath]]; width 412 = phone, 760 = desktop
async function shoot(files, { width = 760, dark = false } = {}) {
  const P = pw(); if (!P) { console.warn("preview skipped: install playwright (npm i -D playwright-core) to get PNG previews"); return false; }
  const b = await P.chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" }).catch(() => P.chromium.launch());
  const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2, colorScheme: dark ? "dark" : "light", isMobile: width < 500 });
  const p = await ctx.newPage();
  for (const [html, png] of files) {
    await p.goto("file://" + path.resolve(html)); await p.waitForTimeout(500);
    await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    await p.screenshot({ path: png, fullPage: true, ...(png.endsWith(".jpg") ? { type: "jpeg", quality: 72 } : {}) });
  }
  await b.close();
  return true;
}
module.exports = { shoot };
