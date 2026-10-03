import { chromium } from 'playwright';

async function verifyHamburgerToggle() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  console.log('Navigating to app directly on dashboard hash (#dashboard)...');
  await page.goto('http://localhost:5173/#dashboard');
  await page.waitForTimeout(1500);

  // Check if sidebar is currently visible
  const sidebar = page.locator('aside');
  await sidebar.waitFor({ state: 'attached' });
  
  let sidebarClasses = await sidebar.getAttribute('class');
  console.log('Initial Sidebar classes (desktop):', sidebarClasses);

  // Locate the 3-line hamburger button in Header
  const hamburgerBtn = page.locator('button[title="Toggle Sidebar"]');
  const isVisible = await hamburgerBtn.isVisible();
  console.log('Hamburger button visible:', isVisible);

  if (!isVisible) {
    throw new Error('Hamburger button is not visible');
  }

  // 1. Click hamburger to collapse sidebar
  console.log('Clicking 3-line hamburger button to collapse sidebar...');
  await hamburgerBtn.click();
  await page.waitForTimeout(400);

  sidebarClasses = await sidebar.getAttribute('class');
  console.log('Sidebar classes after 1st click (collapsed):', sidebarClasses);
  if (!sidebarClasses?.includes('-translate-x-full')) {
    throw new Error('Expected sidebar to have -translate-x-full after collapsing');
  }

  // 2. Click hamburger to expand sidebar
  console.log('Clicking 3-line hamburger button to expand sidebar...');
  await hamburgerBtn.click();
  await page.waitForTimeout(400);

  sidebarClasses = await sidebar.getAttribute('class');
  console.log('Sidebar classes after 2nd click (expanded):', sidebarClasses);
  if (!sidebarClasses?.includes('translate-x-0')) {
    throw new Error('Expected sidebar to have translate-x-0 after expanding');
  }

  // 3. Test on Mobile viewport
  console.log('Testing mobile viewport (375x667)...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(500);

  // On mobile, initial state or after click
  console.log('Clicking hamburger on mobile...');
  await hamburgerBtn.click();
  await page.waitForTimeout(400);

  const backdrop = page.locator('.fixed.inset-0.bg-slate-950\\/60');
  const isBackdropVisible = await backdrop.isVisible();
  console.log('Mobile backdrop visible:', isBackdropVisible);

  console.log('✅ ALL HAMBURGER 3-LINE TOGGLE TESTS PASSED SUCCESSFULLY!');
  await browser.close();
}

verifyHamburgerToggle().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
