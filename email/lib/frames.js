// Device frames for screenshots in emails. Each returns HTML for a fixed-size element to screenshot.
// src is an image URL (data:, file: or https:).
const SOFT = "#F7F4EF";

// A browser window on the soft sand panel. Display width w (css px).
function browser(src, w = 528, o = {}) {
  const bar = 26, ih = Math.round(w * (o.ratio || 0.625));
  return `<div style="width:${w + 32}px;padding:16px;background:${o.bg || SOFT};box-sizing:border-box">
    <div style="border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 1px 2px rgba(24,36,31,.08),0 10px 28px -10px rgba(24,36,31,.28)">
      <div style="height:${bar}px;background:#EFECE6;display:flex;align-items:center;gap:6px;padding:0 11px">
        <i style="width:8px;height:8px;border-radius:50%;background:#D6D1C7"></i><i style="width:8px;height:8px;border-radius:50%;background:#D6D1C7"></i><i style="width:8px;height:8px;border-radius:50%;background:#D6D1C7"></i>
        ${o.url ? `<span style="margin-left:10px;flex:1;height:16px;border-radius:5px;background:#fff;font:500 9.5px/16px Inter,system-ui,sans-serif;color:#7A817C;padding:0 8px;white-space:nowrap;overflow:hidden">${o.url}</span>` : ""}
      </div>
      <img src="${src}" style="display:block;width:${w}px;height:${ih}px;object-fit:cover;object-position:top">
    </div></div>`;
}

// A phone (no brand), screen 390 x 844 scaled to width w.
function phone(src, w = 220, o = {}) {
  const k = w / 390, sh = Math.round(844 * k), bz = Math.round(9 * k * 1.6), r = Math.round(44 * k);
  return `<div style="display:inline-block;padding:${o.pad ?? 18}px ${o.pad ?? 18}px ${(o.pad ?? 18) + 22}px;background:${o.bg || "transparent"}">
    <div style="width:${w + bz * 2}px;border-radius:${r + bz}px;background:#1B2023;padding:${bz}px;box-sizing:border-box;box-shadow:0 2px 4px rgba(24,36,31,.12),0 18px 40px -14px rgba(24,36,31,.45)">
      <div style="position:relative;width:${w}px;height:${sh}px;border-radius:${r}px;overflow:hidden;background:#fff">
        <img src="${src}" style="display:block;width:${w}px;height:${sh}px;object-fit:cover;object-position:top">
        <i style="position:absolute;left:50%;top:${Math.round(10 * k)}px;width:${Math.round(110 * k)}px;height:${Math.round(32 * k)}px;margin-left:-${Math.round(55 * k)}px;border-radius:99px;background:#1B2023"></i>
      </div></div></div>`;
}

module.exports = { browser, phone, SOFT };
