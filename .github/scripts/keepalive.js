const fs = require('node:fs/promises');
const path = require('node:path');

const RUN_MARKER_ID = 'keepalive-run-marker';

async function captureRunScreenshot(page, screenshotPath, runTimestamp) {
  await fs.mkdir(path.dirname(screenshotPath), { recursive: true });

  await page.evaluate(
    ({ markerId, timestamp }) => {
      let marker = document.getElementById(markerId);

      if (!marker) {
        marker = document.createElement('div');
        marker.id = markerId;
        document.body.appendChild(marker);
      }

      marker.textContent = `Keepalive run: ${timestamp}`;
      Object.assign(marker.style, {
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        zIndex: '2147483647',
        padding: '8px 12px',
        borderRadius: '6px',
        background: 'rgba(0, 0, 0, 0.82)',
        color: '#fff',
        font: '12px monospace',
      });
    },
    { markerId: RUN_MARKER_ID, timestamp: runTimestamp },
  );

  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved keepalive screenshot to ${screenshotPath}`);
}

async function runKeepalive() {
  const { chromium } = require('playwright');
  const screenshotPath =
    process.env.KEEPALIVE_SCREENSHOT_PATH ||
    path.join(process.cwd(), 'keepalive.png');
  const runTimestamp = new Date().toISOString();

  console.log('Starting keepalive script...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let keepaliveError;

  try {
    console.log('Navigating to https://fide-calc.truongthings.site/');
    await page.goto('https://fide-calc.truongthings.site/');

    // AuthGuard shows the initial screen if not logged in.
    // It has a button with text "Sign In / Create Account".
    console.log('Waiting for Sign In button...');
    await page.waitForSelector('button:has-text("Sign In / Create Account")');

    console.log('Clicking Sign In button...');
    await page.click('button:has-text("Sign In / Create Account")');

    console.log('Waiting for Auth Modal...');
    // AuthModal shows email and password fields
    await page.waitForSelector('input[type="email"]');

    console.log('Filling out dummy credentials...');
    await page.fill('input[type="email"]', 'keepalive@truongthings.dev');
    await page.fill('input[type="password"]', 'keepalive123!');

    console.log('Submitting form...');
    // The submit button has text "Sign In"
    await page.click('button[type="submit"]');

    // Wait a little bit for the API request to hit Supabase
    await page.waitForTimeout(3000);
    console.log('Keepalive script finished successfully. Supabase should now register active traffic.');
  } catch (error) {
    console.error('Error in keepalive script:', error);
    keepaliveError = error;
  } finally {
    try {
      await captureRunScreenshot(page, screenshotPath, runTimestamp);
    } catch (screenshotError) {
      console.error('Failed to capture keepalive screenshot:', screenshotError);
      keepaliveError ||= screenshotError;
    }

    await browser.close();
  }

  if (keepaliveError) {
    throw keepaliveError;
  }
}

if (require.main === module) {
  runKeepalive().catch(() => {
    process.exitCode = 1;
  });
}

module.exports = { captureRunScreenshot, runKeepalive };
