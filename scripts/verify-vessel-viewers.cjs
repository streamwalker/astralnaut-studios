/* Actual rendered-model interaction checks. No email, account or purchase writes. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.argv[2] || "http://127.0.0.1:8081";
const out = process.env.VESSEL_QA_DIR || "/tmp/astralnaut-vessel-qa";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "chrome", headless: true });
  const checks = [];
  async function context(options = {}) {
    const c = await browser.newContext(options);
    await c.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }));
    return c;
  }
  async function open(page) {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    if (!await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)) await page.locator('.space-canvas[data-ready="true"]').waitFor({ timeout: 25000 });
    await page.locator(".space-loading").waitFor({ state: "hidden", timeout: 18000 });
    await page.waitForTimeout(600);
  }
  async function vessel(page, name) {
    const viewer = page.locator(`.vessel-viewer[data-vessel="${name}"]`);
    await viewer.scrollIntoViewIfNeeded();
    await page.waitForFunction(name => document.querySelector(`.vessel-viewer[data-vessel="${name}"]`)?.getAttribute("data-status") === "ready", name, { timeout: 30000 });
    await page.waitForTimeout(150);
    return viewer;
  }
  try {
    const c = await context({ viewport: { width: 1440, height: 1050 } });
    const page = await c.newPage(), errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await open(page);
    for (const name of ["santee", "ryuken"]) {
      const viewer = await vessel(page, name), surface = viewer.locator(".vessel-viewer-surface");
      assert.equal(await surface.locator("canvas").count(), 1);
      assert(Number(await surface.getAttribute("data-triangles")) > 1000, `${name} real mesh triangles`);
      const rest = await surface.getAttribute("data-orientation");
      const before = await surface.locator("canvas").screenshot();
      const box = await surface.boundingBox();
      await page.mouse.move(box.x + box.width * .45, box.y + box.height * .45);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .78, box.y + box.height * .67, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(100);
      assert.notEqual(await surface.getAttribute("data-orientation"), rest, `${name} pointer rotation`);
      assert(!before.equals(await surface.locator("canvas").screenshot()), `${name} rendered pixels changed`);
      assert.equal(await surface.getAttribute("data-dragging"), "false");
      await viewer.screenshot({ path: `${out}/${name}-rotated-desktop.png` });
      await viewer.getByRole("button", { name: "Reset view", exact: true }).click();
      await page.waitForTimeout(60);
      assert.equal(await surface.getAttribute("data-orientation"), rest);
      await surface.focus();
      await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowUp"); await page.keyboard.press("q");
      await page.waitForTimeout(60);
      assert.notEqual(await surface.getAttribute("data-orientation"), rest, `${name} keyboard three-axis rotation`);
      await page.keyboard.press("Home"); await page.waitForTimeout(60);
      assert.equal(await surface.getAttribute("data-orientation"), rest);
      await viewer.getByRole("button", { name: new RegExp(`^Zoom in`) }).click(); await page.waitForTimeout(60);
      assert(Number(await surface.getAttribute("data-zoom")) > 1);
      await viewer.getByRole("button", { name: "Reset view", exact: true }).click();
      await page.waitForTimeout(60);
      await viewer.screenshot({ path: `${out}/${name}-default-desktop.png` });
      checks.push(`${name}: actual GLB, changed rendered pixels, mouse and keyboard 3-axis rotation, reset and zoom`);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await vessel(page, "ryuken"), reducedSurface = reduced.locator(".vessel-viewer-surface");
    const idleFrames = await reducedSurface.getAttribute("data-frames");
    await page.waitForTimeout(700);
    assert.equal(await reducedSurface.getAttribute("data-frames"), idleFrames, "No idle animation render loop");
    const reducedRest = await reducedSurface.getAttribute("data-orientation");
    await reduced.getByRole("button", { name: "Rotate Starship Ryuken right", exact: true }).click();
    await page.waitForTimeout(60);
    assert.notEqual(await reducedSurface.getAttribute("data-orientation"), reducedRest, "Reduced motion retains controls");
    checks.push("Reduced motion retains live 3D manual controls; no continuous idle GPU loop");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await page.waitForTimeout(300);
    assert.equal(await reducedSurface.getAttribute("data-rendering"), "false", "Offscreen viewer suspension");
    assert.deepEqual(errors, []); await c.close();

    const mobile = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const phone = await mobile.newPage(), mobileErrors = [];
    phone.on("pageerror", error => mobileErrors.push(error.message));
    await open(phone);
    const session = await mobile.newCDPSession(phone);
    const touch = async (type, x, y) => session.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" || type === "touchCancel" ? [] : [{ x, y }] });
    for (const name of ["santee", "ryuken"]) {
      const viewer = await vessel(phone, name), surface = viewer.locator(".vessel-viewer-surface");
      assert.equal(await surface.locator("canvas").count(), 1, "Mobile has real WebGL canvas");
      await viewer.screenshot({ path: `${out}/${name}-default-mobile.png` });
      await viewer.getByRole("button", { name: "Rotate model", exact: true }).tap();
      await surface.scrollIntoViewIfNeeded();
      assert.equal(await viewer.getAttribute("data-touch-active"), "true");
      const box = await surface.boundingBox(), x = box.x + box.width * .45, y = box.y + box.height * .45;
      const rest = await surface.getAttribute("data-orientation"), scrollStart = await phone.evaluate(() => scrollY);
      await touch("touchStart", x, y);
      for (let i = 1; i <= 10; i++) await touch("touchMove", x + i * 9, y + i * 7);
      await touch("touchEnd"); await phone.waitForTimeout(150);
      assert.notEqual(await surface.getAttribute("data-orientation"), rest, `${name} native browser touch rotation`);
      assert(Math.abs(await phone.evaluate(() => scrollY) - scrollStart) < 2, "Rotation does not scroll page");
      await touch("touchStart", x, y); await touch("touchMove", x + 20, y + 10); await touch("touchCancel");
      assert.equal(await surface.getAttribute("data-dragging"), "false", "Cancelled touch releases drag");
      await viewer.screenshot({ path: `${out}/${name}-rotated-mobile.png` });
      await viewer.getByRole("button", { name: "Done", exact: true }).tap();
      await surface.scrollIntoViewIfNeeded();
      assert.equal(await viewer.getAttribute("data-touch-active"), "false");
      const box2 = await surface.boundingBox(), sx = box2.x + box2.width / 2, sy = Math.min(650, box2.y + box2.height * .7);
      const beforeScroll = await phone.evaluate(() => scrollY);
      await touch("touchStart", sx, sy);
      for (let i = 1; i <= 10; i++) await touch("touchMove", sx, sy - i * 18);
      await touch("touchEnd"); await phone.waitForTimeout(400);
      assert(await phone.evaluate(() => scrollY) > beforeScroll + 40, "Done restores vertical scroll");
      checks.push(`${name}: mobile GLB, two-axis touch rotation, cancellation, Done restores page scroll`);
    }
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(mobileErrors, []); await mobile.close();

    const initialReduced = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    const reducedPage = await initialReduced.newPage(); await open(reducedPage);
    const initialViewer = await vessel(reducedPage, "santee"), initialSurface = initialViewer.locator(".vessel-viewer-surface");
    assert.equal(await initialSurface.locator("canvas").count(), 1);
    const initialOrientation = await initialSurface.getAttribute("data-orientation");
    await initialViewer.getByRole("button", { name: "Tilt Santee Station down", exact: true }).click();
    await reducedPage.waitForTimeout(80);
    assert.notEqual(await initialSurface.getAttribute("data-orientation"), initialOrientation);
    checks.push("Initial reduced-motion page still loads real 3D and allows manual rotation");
    await initialReduced.close();

    const failure = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await failure.route("**/interactive-vessels/*-v2.glb", route => route.abort());
    const failed = await failure.newPage(); await open(failed);
    const fallback = failed.locator('.vessel-viewer[data-vessel="santee"]'); await fallback.scrollIntoViewIfNeeded();
    await failed.waitForFunction(() => document.querySelector('.vessel-viewer[data-vessel="santee"]')?.getAttribute("data-status") === "fallback");
    assert.equal(await fallback.locator("canvas").count(), 0);
    assert(await fallback.getByRole("button", { name: "Retry 3D" }).isVisible());
    assert(await fallback.getByText("3D is unavailable. Showing a rendered preview.").isVisible());
    checks.push("Failed GLB clearly shows image fallback and retry, releases canvas");
    await failure.unroute("**/interactive-vessels/*-v2.glb");
    await fallback.getByRole("button", { name: "Retry 3D" }).click();
    await failed.waitForFunction(() => document.querySelector('.vessel-viewer[data-vessel="santee"]')?.getAttribute("data-status") === "ready", null, { timeout: 30000 });
    assert.equal(await fallback.locator("canvas").count(), 1);
    checks.push("Retry restores one live renderer after asset failure");
    await failure.close();

    const noGL = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await noGL.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return /webgl/i.test(type) ? null : original.call(this, type, ...args);
      };
    });
    const noGLPage = await noGL.newPage();
    await noGLPage.goto(base, { waitUntil: "domcontentloaded" });
    await noGLPage.waitForTimeout(800);
    const unavailable = noGLPage.locator('.vessel-viewer[data-vessel="ryuken"]');
    await unavailable.scrollIntoViewIfNeeded();
    await noGLPage.waitForFunction(() => document.querySelector('.vessel-viewer[data-vessel="ryuken"]')?.getAttribute("data-status") === "fallback");
    assert.equal(await unavailable.locator("canvas").count(), 0);
    assert(await unavailable.getByRole("button", { name: "Retry 3D" }).isVisible());
    assert(await noGLPage.locator("#main-content").isVisible());
    checks.push("Unavailable WebGL preserves readable page and clearly labeled fallback");
    await noGL.close();
    fs.writeFileSync(out + "/results.json", JSON.stringify({ base, checks, physicalDevice: false }, null, 2));
    console.log(checks.join("\n"));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
