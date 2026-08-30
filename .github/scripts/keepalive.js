const { chromium } = require('playwright');

(async () => {
  console.log('Starting keepalive script...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
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
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
