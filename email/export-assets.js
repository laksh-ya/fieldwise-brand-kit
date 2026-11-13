// Render the images the email templates use (logo, mark, stones, pattern banners) from the brand kit.
// usage: node export-assets.js   (writes ./assets/*.png at 3x, from ../kit/index.html)
const { chromium } = require("../pw.js");
const fs = require("fs"), path = require("path");
const { browser, phone } = require("./lib/frames.js");
const CASE = path.resolve(__dirname, "../../assets/case");
const dataUri = (f) => "data:image/" + path.extname(f).slice(1) + ";base64," + fs.readFileSync(f).toString("base64");

const OUT = path.join(__dirname, "assets");
const SAND = "#ECE7DE";
// [file, html built inside the kit page]. Sizes are the display size in the email; files are 3x.
const JOBS = [
  ["logo", () => `<div style="display:inline-block;padding:2px 4px">${KIT.lockup({ mat: "tint", fs: 22, color: "#18241F" })}</div>`],
  ["logo-white", () => `<div style="display:inline-block;padding:2px 4px">${KIT.lockup({ mat: "tint", fs: 22, color: "#FFFFFF" })}</div>`],
  ["logo-print", () => `<div style="display:inline-block;padding:2px 4px">${KIT.lockup({ mat: "flat", fs: 22, color: "#18241F" })}</div>`],
  ["mark", () => `<div style="display:inline-block;padding:10px">${KIT.markImg("glass", 44)}</div>`],
  ["mark-tint", () => `<div style="display:inline-block;padding:2px">${KIT.markImg("tint", 28)}</div>`],
  ["mark-grey", () => `<div style="display:inline-block;padding:1px">${KIT.markImg("mono", 18, { ink: "#9AA19B" })}</div>`],
  ["stone-1", () => `<div style="display:inline-block;padding:1px">${KIT.stoneImg(0, 14, { mat: "tint" })}</div>`],
  ["stone-2", () => `<div style="display:inline-block;padding:1px">${KIT.stoneImg(1, 14, { mat: "tint" })}</div>`],
  ["stone-3", () => `<div style="display:inline-block;padding:1px">${KIT.stoneImg(2, 14, { mat: "tint" })}</div>`],
  ["stone-4", () => `<div style="display:inline-block;padding:1px">${KIT.stoneImg(3, 14, { mat: "tint" })}</div>`],
  ["stone-amber", () => `<div style="display:inline-block;padding:1px">${KIT.stoneImg(1, 14, { mat: "tint", color: "#F1BB52" })}</div>`],
  ["mark-hero", () => `<div style="display:inline-block;line-height:0">${KIT.render(KIT.items(), { size: 210, material: "glass", pad: 0.03, room: true })}</div>`],
  ["mark-hero-glow", () => `<div style="display:inline-block;line-height:0">${KIT.render(KIT.items(), { size: 210, material: "glow", pad: 0.03, room: true })}</div>`],
  ["mark-small-white", () => `<div style="display:inline-block;padding:1px">${KIT.markImg("mono", 18, { ink: "#FFFFFF" })}</div>`],
  ["avatar", () => `<div style="display:inline-block;padding:0;line-height:0"><img src="../deploy/files/apply/av-sand.png" style="width:52px;height:52px;border-radius:50%;display:block"></div>`],
  ...[1, 2, 3, 4].map((n) => [`step-${n}`, `(() => \`<div style="display:inline-block;position:relative;padding:1px">\${KIT.stoneImg(${[0, 2, 1, 3][n - 1]}, 30, { mat: "tint" })}<b style="position:absolute;inset:0;display:grid;place-items:center;font:600 14px Inter,system-ui,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.25)">${n}</b></div>\`)`]),
  ["stone-grey", () => `<div style="display:inline-block;padding:1px">${KIT.stoneImg(2, 14, { mat: "tint", color: "#C9CEC9" })}</div>`],
];
// Pattern banners: 600 x h on sand, glass stones from mark No. 06.
const BANNERS_DARK = [["band-dark", 96, 14]];
const BANNERS = [["banner-welcome", 200, 21], ["banner-live", 200, 5], ["banner-proposal", 160, 11], ["banner-report", 160, 33], ["banner-news", 200, 47], ["banner-thanks", 160, 62], ["band", 64, 8]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: "chrome", args: ["--allow-file-access-from-files"] });
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 3, colorScheme: "light" });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.goto("file://" + path.resolve(__dirname, "../kit/index.html") + "#mark");
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  await p.evaluate(() => document.fonts.ready);
  await p.addStyleTag({ content: "#probe{position:fixed;left:0;top:0;z-index:999;background:transparent} .pond,.toast{display:none!important} body > :not(#probe){display:none!important} html,body{background:transparent!important} body::before,body::after{display:none!important}" });
  const shoot = async (name, html, opaque) => {
    await p.evaluate((html) => { let el = document.getElementById("probe"); if (el) el.remove(); el = document.createElement("div"); el.id = "probe"; el.innerHTML = html; document.body.appendChild(el); return Promise.all([document.fonts.ready, ...[...el.querySelectorAll("img")].map((i) => i.decode().catch(() => {}))]); }, html);
    await p.waitForTimeout(250);
    const el = await p.$("#probe > *"), box = await el.boundingBox();
    await el.screenshot(opaque ? { path: path.join(OUT, name + ".jpg"), type: "jpeg", quality: 80 } : { path: path.join(OUT, name + ".png"), omitBackground: true });
    console.log(name, Math.round(box.width) + "x" + Math.round(box.height));
    return box;
  };
  const sizes = {};
  for (const [name, fn] of JOBS) {
    const html = await p.evaluate(`(${typeof fn === "string" ? fn : fn.toString()})()`);
    const box = await shoot(name, html, false);
    sizes[name] = [Math.round(box.width), Math.round(box.height)];
  }
  for (const [name, h, seed] of BANNERS) {
    const html = await p.evaluate(([h, seed, SAND]) => `<div style="width:600px;height:${h}px;background:${SAND};position:relative;overflow:hidden"><img alt="" src="${KIT.fieldSrc(600, h, { seed, scale: h < 100 ? 0.09 : 0.17, mat: "glass" })}" style="position:absolute;inset:0;width:100%;height:100%"></div>`, [h, seed, SAND]);
    await shoot(name, html, true);
    sizes[name] = [600, h];
  }
  for (const [name, h, seed] of BANNERS_DARK) {
    const html = await p.evaluate(([h, seed]) => `<div style="width:600px;height:${h}px;background:#1D2225;position:relative;overflow:hidden"><img alt="" src="${KIT.fieldSrc(600, h, { seed, scale: 0.1, mat: "glow" })}" style="position:absolute;inset:0;width:100%;height:100%"></div>`, [h, seed]);
    await shoot(name, html, true); sizes[name] = [600, h];
  }
  // framed screenshots: our work (real captures) and the sample client's old and new sites
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }), q = await ctx2.newPage();
  const grab = async (file, vp, mobile) => { await q.setViewportSize(vp); await q.goto("file://" + path.join(__dirname, "sample-site", file)); await q.waitForTimeout(800); return "data:image/jpeg;base64," + (await q.screenshot({ type: "jpeg", quality: 88 })).toString("base64"); };
  const frames = [
    ["work-resort", browser(dataUri(CASE + "/shivashish/home.webp"), 528, { url: "shivashish resort" })],
    ["work-offpay", browser(dataUri(CASE + "/offpay/site-hero.webp"), 528, { url: "offpay" })],
    ["work-bus", browser(dataUri(CASE + "/marichi-bus/d-home.webp"), 528, { url: "marichi bus" })],
    ["sample-new-desktop", browser(await grab("new.html", { width: 1280, height: 800 }), 528, { url: "sunrisedental.in" })],
  ];
  const phones = [["sample-old-phone", await grab("old.html", { width: 390, height: 844 })], ["sample-new-phone", await grab("new.html", { width: 390, height: 844 })]];
  await ctx2.close();
  await p.evaluate(() => {}); // keep page
  const p2 = await (await b.newContext({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 })).newPage();
  const shoot2 = async (name, html, jpg) => {
    await p2.setContent(`<body style="margin:0;background:transparent">${html}</body>`); await p2.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
    const el = await p2.$("body > *"), box = await el.boundingBox();
    await el.screenshot({ path: path.join(OUT, name + (jpg ? ".jpg" : ".png")), ...(jpg ? { type: "jpeg", quality: 82 } : { omitBackground: true }) });
    sizes[name] = [Math.round(box.width), Math.round(box.height)]; console.log(name, sizes[name].join("x"));
  };
  for (const [n, html] of frames) await shoot2(n, html, true);
  for (const [n, uri] of phones) await shoot2(n, phone(uri, 200, { pad: 26 }), false);
  fs.writeFileSync(path.join(OUT, "sizes.json"), JSON.stringify(sizes, null, 1));
  console.log("errors", errs.slice(0, 5));
  await b.close();
})();
