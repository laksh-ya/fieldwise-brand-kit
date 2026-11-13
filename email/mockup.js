// Capture any website and frame it for an email: a phone and a browser window.
// usage: node mockup.js <url> <name>
//   writes assets/u/<name>-phone.png and assets/u/<name>-desktop.jpg (then run build.js and publish)
// Use it for a prospect's current site in a cold email or "the note", or a client's preview or live site.
const fs = require("fs"), path = require("path");
const { browser, phone } = require("./lib/frames.js");
const { chromium } = require("../pw.js");

(async () => {
  const [url, name] = process.argv.slice(2);
  if (!url || !name || !/^[a-z0-9-]+$/.test(name)) { console.error("usage: node mockup.js <url> <name: lowercase-dashes>"); process.exit(1); }
  const out = path.join(__dirname, "assets/u"); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || "chrome" });
  const load = async (vp, mobile) => {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, userAgent: mobile ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" : undefined });
    const p = await ctx.newPage(); const t0 = Date.now();
    await p.goto(url, { waitUntil: "load", timeout: 45000 }).catch(() => {});
    const ms = Date.now() - t0; await p.waitForTimeout(2500);
    const shot = await p.screenshot({ type: "jpeg", quality: 85 });
    await ctx.close();
    return { uri: "data:image/jpeg;base64," + shot.toString("base64"), ms };
  };
  const m = await load({ width: 390, height: 844 }, true), d = await load({ width: 1280, height: 800 }, false);
  const ctx = await b.newContext({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 }), p = await ctx.newPage();
  const shoot = async (html, file, opts) => { await p.setContent(`<body style="margin:0;background:transparent">${html}</body>`); await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {})))); await (await p.$("body > *")).screenshot({ path: file, ...opts }); };
  await shoot(phone(m.uri, 200, { pad: 26 }), path.join(out, name + "-phone.png"), { omitBackground: true });
  await shoot(browser(d.uri, 528, { url: url.replace(/^https?:\/\//, "").replace(/\/$/, "") }), path.join(out, name + "-desktop.jpg"), { type: "jpeg", quality: 82 });
  await b.close();
  console.log(`assets/u/${name}-phone.png  assets/u/${name}-desktop.jpg`);
  console.log(`page load on this machine: ${(m.ms / 1000).toFixed(1)} s (phone). For the real number use https://pagespeed.web.dev (mobile).`);
})();
