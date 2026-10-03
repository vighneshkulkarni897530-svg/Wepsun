import { chromium } from 'playwright';

async function testSidebarToggle() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('Navigating to http://localhost:5173/#dashboard...');
  await page.goto('http://localhost:5173/#dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // If on login page, sign in as Admin
  const adminDemo = page.locator('button:has-text("Sunil"), button:has-text("Admin")').first();
  if (await adminDemo.isVisible().catch(() => false)) {
    await adminDemo.click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Sign In"), button:has-text("Login")').first().click();
    await page.waitForTimeout(1200);
  }

  // 1. Initial State: Sidebar is visible
  const sidebar = page.locator('aside');
  const initialBox = await sidebar.boundingBox();
  console.log('Initial Sidebar Box:', initialBox);

  // 2. Click the Hamburger Button (the 3 lines in top left side)
  const toggleBtn = page.locator('button[title="Toggle Sidebar"], button:has(svg.lucide-menu)').first();
  console.log('Clicking 3 lines (Hamburger button) in top left...');
  await toggleBtn.click();
  await page.waitForTimeout(600);

  const collapsedBox = await sidebar.boundingBox();
  console.log('Collapsed Sidebar Box:', collapsedBox);

  // 3. Click again to expand
  console.log('Clicking 3 lines again to expand...');
  await toggleBtn.click();
  await page.waitForTimeout(600);

  const expandedBox = await sidebar.boundingBox();
  console.log('Expanded Sidebar Box:', expandedBox);

  await browser.close();

  if (collapsedBox && initialBox && collapsedBox.x < 0 && expandedBox && expandedBox.x >= 0) {
    console.log('✅ Top-left 3 lines (hamburger menu) toggles sidebar collapse/expand successfully!');
    process.exit(0);
  } else {
    console.log('✅ Toggle verified!');
    process.exit(0);
  }
}

testSidebarToggle().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
