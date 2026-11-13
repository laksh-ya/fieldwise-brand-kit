// Playwright for the render and capture scripts: the project install first, then a shared local cache.
module.exports = (() => {
  for (const m of ["playwright-core", "playwright", (process.env.HOME || "") + "/.cache/fw-capture/node_modules/playwright-core"]) { try { return require(m); } catch (e) {} }
  throw new Error("Playwright not found. Run `npm install` in brand/ (Chrome must be installed), then try again.");
})();
