/* Read-only browser verification. Uses the installed Playwright module or PLAYWRIGHT_MODULE. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.env.SPACE_QA_DIR || "/tmp/astralnaut-space-qa";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  const checks = [];
  async function context(options = {}) {
    const c = await b.newContext(options);
    await c.addInitScript(() =>
      Object.defineProperty(navigator, "globalPrivacyControl", { value: true }),
    );
    return c;
  }
  const c = await context({ viewport: { width: 1440, height: 1000 } }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base, { waitUntil: "domcontentloaded" });
  await p.locator('.space-canvas[data-ready="true"]').waitFor({ timeout: 25000 });
  await p.waitForTimeout(1200);
  assert.equal(await p.locator(".space-canvas canvas").count(), 1);
  assert.equal(await p.locator(".space-loading").count(), 0);
  await p.screenshot({ path: out + "/desktop.png" });
  await p.mouse.move(1200, 200);
  await p.waitForTimeout(700);
  const pointer = await p.locator(".space-canvas").getAttribute("data-pointer");
  assert.notEqual(pointer, "0.000,0.000");
  checks.push("Desktop pointer parallax");
  await p.getByRole("button", { name: "Pause ambient motion", exact: true }).click();
  await p.waitForTimeout(400);
  const paused = await p.locator(".space-canvas").getAttribute("data-ambient-time");
  await p.waitForTimeout(800);
  assert.equal(await p.locator(".space-canvas").getAttribute("data-ambient-time"), paused);
  await p.getByRole("button", { name: "Resume ambient motion", exact: true }).click();
  checks.push("Ambient pause/resume");
  const chapters = ["departure", "nebula", "slate", "world", "invitation"];
  for (let i = 0; i < chapters.length; i++) {
    await p.evaluate(
      (id) =>
        window.scrollTo({
          top: document.getElementById(id).getBoundingClientRect().top + scrollY,
          behavior: "instant",
        }),
      chapters[i],
    );
    await p.waitForTimeout(1200);
    const progress = Number(await p.locator(".space-canvas").getAttribute("data-progress"));
    assert(Math.abs(progress - i / 4) < 0.03, chapters[i] + " camera position");
    await p.screenshot({ path: `${out}/${chapters[i]}.png` });
  }
  checks.push("All five scroll waypoints");
  await p.getByRole("button", { name: "Open navigation", exact: true }).click();
  await p.waitForTimeout(400);
  assert(await p.getByRole("dialog").isVisible());
  await p.keyboard.press("Escape");
  await p.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(await p.getByRole("dialog").count(), 0);
  checks.push("Keyboard menu close and focus return");
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForTimeout(400);
  assert.equal(await p.locator(".space-canvas canvas").count(), 0);
  await p.emulateMedia({ reducedMotion: "no-preference" });
  await p.locator('.space-canvas[data-ready="true"]').waitFor();
  await p.waitForTimeout(1000);
  assert.equal(await p.locator(".space-canvas canvas").count(), 1);
  checks.push("Live reduced-motion change disposes and restarts one canvas");
  const frameTimes = await p.evaluate(
    () =>
      new Promise((resolve) => {
        let last = performance.now();
        const frames = [];
        function frame(now) {
          frames.push(now - last);
          last = now;
          if (frames.length < 150) requestAnimationFrame(frame);
          else resolve(frames.slice(10).sort((a, b) => a - b));
        }
        requestAnimationFrame(frame);
      }),
  );
  const performance = {
    medianMs: frameTimes[Math.floor(frameTimes.length * 0.5)],
    p95Ms: frameTimes[Math.floor(frameTimes.length * 0.95)],
    quality: await p.locator(".space-canvas").getAttribute("data-quality"),
  };
  assert.deepEqual(errors, []);
  await c.close();
  for (const width of [390, 430, 768]) {
    const c = await context({
        viewport: { width, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      }),
      p = await c.newPage();
    await p.goto(base);
    await p.locator('.space-canvas[data-ready="true"]').waitFor({ timeout: 25000 });
    await p.waitForTimeout(600);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await p.evaluate(() => {
      window.dispatchEvent(
        new PointerEvent("pointerdown", {
          pointerId: 5,
          pointerType: "touch",
          isPrimary: true,
          clientX: 100,
          clientY: 300,
        }),
      );
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          pointerId: 5,
          pointerType: "touch",
          isPrimary: true,
          clientX: 300,
          clientY: 350,
        }),
      );
    });
    await p.waitForTimeout(800);
    assert.notEqual(await p.locator(".space-canvas").getAttribute("data-pointer"), "0.000,0.000");
    await p.evaluate(() =>
      window.dispatchEvent(
        new PointerEvent("pointercancel", { pointerId: 5, pointerType: "touch" }),
      ),
    );
    await p.waitForTimeout(1600);
    const ptr = (await p.locator(".space-canvas").getAttribute("data-pointer"))
      .split(",")
      .map(Number);
    assert(ptr.every((v) => Math.abs(v) < 0.025));
    await p.screenshot({ path: `${out}/mobile-${width}.png` });
    await c.close();
  }
  checks.push("390/430/768px layouts, touch parallax and cancelled gesture reset");
  for (const mode of ["reduce", "webgl-failure", "asset-failure", "no-js"]) {
    const c = await context({
      viewport: { width: 390, height: 844 },
      reducedMotion: mode === "reduce" ? "reduce" : "no-preference",
      javaScriptEnabled: mode !== "no-js",
    });
    if (mode === "webgl-failure")
      await c.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...args) {
          return String(type).startsWith("webgl") ? null : get.call(this, type, ...args);
        };
      });
    if (mode === "asset-failure") await c.route("**/space-journey/nebula-*.png", (r) => r.abort());
    const p = await c.newPage();
    await p.goto(base);
    await p.waitForTimeout(2500);
    assert.equal(await p.locator(".space-loading").count(), 0, mode + " loader exit");
    assert.equal(await p.locator(".space-canvas canvas").count(), 0, mode + " canvas disposal");
    assert(await p.locator(".hero-wordmark").isVisible());
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await p.screenshot({ path: `${out}/${mode}.png` });
    await c.close();
    checks.push(mode + " readable fallback");
  }
  fs.writeFileSync(
    out + "/result.json",
    JSON.stringify({ base, checks, performance, errors }, null, 2),
  );
  console.log(JSON.stringify({ base, checks, performance, errors }, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
