/**
 * Mobile / tablet responsive smoke checks against the running Vite app.
 * Run: node scripts/responsive-check.mjs
 */
import { chromium, devices } from 'playwright';

const BASE = process.env.APP_URL || 'http://127.0.0.1:5173';

async function checkViewport(browser, name, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const issues = [];

  page.on('pageerror', (err) => issues.push(`pageerror: ${err.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    };
  });

  if (overflow.scrollWidth > overflow.clientWidth + 2) {
    issues.push(
      `horizontal overflow: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`,
    );
  }

  // Login form should be usable
  const email = page.locator('input[type="email"]');
  if ((await email.count()) > 0) {
    const box = await email.first().boundingBox();
    if (box && box.width < 120) issues.push('email input too narrow');
  }

  // No element wider than viewport (ignore SVGs)
  const wide = await page.evaluate((vw) => {
    const bad = [];
    document.querySelectorAll('body *').forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (['SCRIPT', 'STYLE', 'SVG', 'PATH'].includes(el.tagName)) return;
      const r = el.getBoundingClientRect();
      if (r.width > vw + 8 && r.height > 0) {
        bad.push(`${el.tagName}.${el.className?.toString?.().slice(0, 40)} w=${Math.round(r.width)}`);
      }
    });
    return bad.slice(0, 8);
  }, viewport.width);

  if (wide.length) issues.push(`wide elements: ${wide.join(' | ')}`);

  await context.close();
  return { name, viewport, ok: issues.length === 0, issues };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const views = [
    { name: 'iPhoneSE', ...devices['iPhone SE'] },
    { name: 'Pixel5', ...devices['Pixel 5'] },
    { name: 'iPad', viewport: { width: 768, height: 1024 } },
    { name: 'Desktop', viewport: { width: 1280, height: 800 } },
  ];

  const results = [];
  for (const v of views) {
    const viewport = v.viewport || { width: 375, height: 667 };
    results.push(await checkViewport(browser, v.name, viewport));
  }
  await browser.close();

  let failed = 0;
  for (const r of results) {
    const status = r.ok ? 'PASS' : 'FAIL';
    console.log(`[${status}] ${r.name} ${r.viewport.width}x${r.viewport.height}`);
    r.issues.forEach((i) => console.log(`  - ${i}`));
    if (!r.ok) failed += 1;
  }
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
