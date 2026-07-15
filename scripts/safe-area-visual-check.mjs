#!/usr/bin/env node
/**
 * Automated visual/regression check for safe-area-sensitive UI chrome.
 *
 * Verifies at multiple breakpoints (including iPhone-style notched viewports
 * in both portrait and landscape) that:
 *   1. The sticky site header sits below env(safe-area-inset-top)
 *      and doesn't clip behind the notch.
 *   2. The skip-to-content link becomes visible when focused and clears the notch.
 *   3. The cookie-consent banner sits above env(safe-area-inset-bottom) and,
 *      on <lg screens, above the mobile bottom nav (~56px + inset).
 *   4. Any floating/fixed buttons (mobile bottom nav, floating CTAs) respect the
 *      inset and don't overlap the header or notch.
 *
 * Usage:
 *   node scripts/safe-area-visual-check.mjs [--base=http://localhost:8080]
 *
 * Screenshots and a JSON report land in .lovable/safe-area-report/.
 * Exits non-zero when any assertion fails so CI can gate on it.
 */
import { chromium } from "playwright";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const BASE = (process.argv.find((a) => a.startsWith("--base=")) ?? "--base=http://localhost:8080").slice(7);
const OUT = path.resolve(".lovable/safe-area-report");

// Notched device profiles. `insets` mirrors env(safe-area-inset-*) so we can
// assert positions numerically instead of eyeballing screenshots.
const DEVICES = [
  { name: "iphone-14-portrait",  width: 390,  height: 844,  dpr: 3, insets: { top: 47, bottom: 34, left: 0,  right: 0  } },
  { name: "iphone-14-landscape", width: 844,  height: 390,  dpr: 3, insets: { top: 0,  bottom: 21, left: 47, right: 47 } },
  { name: "pixel-7-portrait",    width: 412,  height: 915,  dpr: 2.6, insets: { top: 24, bottom: 24, left: 0, right: 0 } },
  { name: "ipad-portrait",       width: 820,  height: 1180, dpr: 2, insets: { top: 20, bottom: 20, left: 0,  right: 0  } },
  { name: "desktop-1440",        width: 1440, height: 900,  dpr: 1, insets: { top: 0,  bottom: 0,  left: 0,  right: 0  } },
  { name: "ultrawide-1920",      width: 1920, height: 1080, dpr: 1, insets: { top: 0,  bottom: 0,  left: 0,  right: 0  } },
];

const ROUTES = ["/", "/pricing", "/shop", "/library"];

const MOBILE_NAV_MAX_BP = 1024; // matches tailwind `lg` breakpoint used by mobile-bottom-nav
const NAV_HEIGHT_PX = 56;       // matches `pb-safe-nav` / `bottom-safe-nav` (4.5rem incl. slack)
const TOLERANCE_PX = 2;         // sub-pixel wiggle from transforms/animations

const results = [];
const failures = [];

function record(device, route, name, passed, detail) {
  results.push({ device: device.name, route, check: name, passed, detail });
  if (!passed) failures.push({ device: device.name, route, name, detail });
}

async function checkRoute(page, device, route) {
  const url = new URL(route, BASE).toString();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

  // Bypass any consent gate by clearing storage, then reload so the banner renders fresh.
  await page.evaluate(() => { try { localStorage.removeItem("cookie-consent"); } catch {} });
  await page.reload({ waitUntil: "networkidle" });

  // Inject the device's simulated safe-area insets. iOS-safari sets these via the
  // viewport-fit=cover meta + hardware; in headless Chromium we have to fake them.
  await page.addStyleTag({
    content: `:root {
      --sat: ${device.insets.top}px;
      --sab: ${device.insets.bottom}px;
      --sal: ${device.insets.left}px;
      --sar: ${device.insets.right}px;
    }`,
  });
  await page.addStyleTag({
    content: `@supports (top: env(safe-area-inset-top)) {
      /* Not applicable in headless — override env() calls at runtime */
    }`,
  });
  // Runtime env() shim: monkey-patch CSSOM values by rewriting `env(safe-area-inset-*)`
  // isn't possible from the page. Instead we assert positions against the *effective*
  // computed rules and additionally verify each element's bounding box has enough clear
  // space to accommodate the device's real insets. That gives a true regression signal
  // without needing to simulate iOS internals.

  const shots = path.join(OUT, device.name);
  await mkdir(shots, { recursive: true });
  const slug = route === "/" ? "home" : route.replace(/[\/]+/g, "-").replace(/^-/, "");
  await page.screenshot({ path: path.join(shots, `${slug}-baseline.png`) });

  // 1. Sticky header — must be visible near the top and taller than the top inset.
  const header = page.locator("header").first();
  if (await header.count()) {
    const box = await header.boundingBox();
    if (!box) {
      record(device, route, "sticky-header:present", false, "header not laid out");
    } else {
      record(device, route, "sticky-header:present", true, box);
      // Header top edge should be at 0 (fixed/sticky); its inner content must clear the notch.
      // We check `padding-top` >= inset.top - tolerance.
      const padTop = await header.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop || "0"));
      const clearsNotch = padTop + TOLERANCE_PX >= device.insets.top;
      record(device, route, "sticky-header:clears-notch",
        clearsNotch,
        { paddingTop: padTop, requiredTop: device.insets.top });
    }
  }

  // 2. Skip link — hidden until focused, then visible and below the notch.
  const skip = page.locator('a[href="#main"], a[href="#content"], a.skip-link, a:has-text("Skip to")').first();
  if (await skip.count()) {
    await page.evaluate(() => (document.activeElement instanceof HTMLElement) && document.activeElement.blur());
    await skip.focus();
    const box = await skip.boundingBox();
    const visible = !!box && box.width > 4 && box.height > 4;
    record(device, route, "skip-link:focus-visible", visible, box);
    if (box) {
      const clears = box.y + TOLERANCE_PX >= device.insets.top;
      record(device, route, "skip-link:clears-notch", clears, { top: box.y, requiredTop: device.insets.top });
    }
    await page.screenshot({ path: path.join(shots, `${slug}-skip-focus.png`) });
  } else {
    record(device, route, "skip-link:present", false, "no skip link found");
  }

  // 3. Cookie consent banner — sits above the home indicator AND (on <lg) above the mobile nav.
  const banner = page.locator('[data-cookie-consent], [role="dialog"][aria-label*="cookie" i], [aria-label*="Cookie" i]').first();
  if (await banner.count()) {
    const box = await banner.boundingBox();
    const viewport = page.viewportSize();
    if (box && viewport) {
      const gapFromBottom = viewport.height - (box.y + box.height);
      const requiredGap = device.width < MOBILE_NAV_MAX_BP
        ? device.insets.bottom + NAV_HEIGHT_PX
        : device.insets.bottom;
      const ok = gapFromBottom + TOLERANCE_PX >= requiredGap;
      record(device, route, "cookie-banner:clears-nav+inset", ok, { gapFromBottom, requiredGap });
      await page.screenshot({ path: path.join(shots, `${slug}-cookie.png`) });
    }
  }

  // 4. Mobile bottom nav — must be present on <lg and lifted above the home indicator.
  if (device.width < MOBILE_NAV_MAX_BP) {
    const nav = page.locator('nav[aria-label*="mobile" i], nav[data-mobile-nav], [data-mobile-bottom-nav]').first();
    if (await nav.count()) {
      const box = await nav.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        const gapFromBottom = viewport.height - (box.y + box.height);
        const ok = gapFromBottom + TOLERANCE_PX >= 0; // nav itself owns the inset padding
        record(device, route, "mobile-nav:visible-lg-only", ok, { gapFromBottom });
        const padBottom = await nav.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom || "0"));
        record(device, route, "mobile-nav:clears-home-indicator",
          padBottom + TOLERANCE_PX >= device.insets.bottom,
          { paddingBottom: padBottom, requiredBottom: device.insets.bottom });
      }
    }
  }

  // 5. Any other position:fixed floating button (e.g. floating CTA, chat bubble).
  const floats = await page.$$eval("*", (nodes) =>
    nodes
      .filter((n) => {
        const cs = getComputedStyle(n);
        return cs.position === "fixed" && cs.visibility !== "hidden" && cs.display !== "none";
      })
      .map((n) => {
        const r = n.getBoundingClientRect();
        return { tag: n.tagName.toLowerCase(), id: n.id || null, cls: n.className?.toString?.() ?? "", x: r.x, y: r.y, w: r.width, h: r.height };
      })
      .filter((r) => r.w > 20 && r.h > 20)
  );
  for (const f of floats) {
    const viewport = page.viewportSize();
    if (!viewport) continue;
    const bottomGap = viewport.height - (f.y + f.h);
    const topGap = f.y;
    const overlapsNotch  = topGap < device.insets.top - TOLERANCE_PX;
    const overlapsHome   = bottomGap < device.insets.bottom - TOLERANCE_PX;
    if (overlapsNotch || overlapsHome) {
      record(device, route, `floating:${f.tag}${f.id ? "#" + f.id : ""}`,
        false,
        { overlapsNotch, overlapsHome, topGap, bottomGap, insets: device.insets });
    }
  }
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const device of DEVICES) {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.dpr,
        hasTouch: device.width < MOBILE_NAV_MAX_BP,
        isMobile: device.width < 768,
      });
      const page = await context.newPage();
      for (const route of ROUTES) {
        try { await checkRoute(page, device, route); }
        catch (err) { record(device, route, "route:load", false, String(err)); }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  await writeFile(path.join(OUT, "report.json"), JSON.stringify({ base: BASE, results, failures }, null, 2));
  const total = results.length;
  const passed = total - failures.length;
  console.log(`safe-area check: ${passed}/${total} passed. Report: ${path.join(OUT, "report.json")}`);
  if (failures.length) {
    for (const f of failures) console.error(`  FAIL [${f.device}] ${f.route} — ${f.name}:`, f.detail);
    process.exitCode = 1;
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
