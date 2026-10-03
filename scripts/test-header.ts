import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/vighn/.gemini/antigravity-ide/brain/101a917f-bb84-421c-81c3-fd978d6eefab';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots_header_update');

async function testHeader() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Go to Admin Dashboard
  await page.goto('http://localhost:5173/#login-admin', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Sunil")').first().click();
  await page.waitForTimeout(1000);

  // Take screenshot of header in Admin Dashboard
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'updated_header_admin.png') });
  console.log('Admin header screenshot taken');

  // Go to Client Dashboard
  await page.goto('http://localhost:5173/#login-client', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Priya")').first().click();
  await page.waitForTimeout(1000);

  // Take screenshot of PM page like user's screenshot
  await page.goto('http://localhost:5173/#pm', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'updated_header_pm_view.png') });
  console.log('Client PM view screenshot taken');

  await browser.close();
}

testHeader();
