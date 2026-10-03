import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/vighn/.gemini/antigravity-ide/brain/101a917f-bb84-421c-81c3-fd978d6eefab';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserTests() {
  console.log('🚀 Starting Automated Playwright Browser Tests...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const testResults: { name: string; status: 'PASSED' | 'FAILED'; details?: string }[] = [];

  try {
    // 1. Test Landing Page (Root URL http://localhost:5173/)
    console.log('\n--- 1. Testing Default Landing Page as Login Page ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log('Page Title:', title);

    // Verify Hero content and Login Card
    const heroHeading = await page.locator('h1').textContent();
    console.log('Hero Heading:', heroHeading?.replace(/\s+/g, ' ').trim());

    const welcomeHeading = await page.locator('text=Welcome Back').first();
    const isWelcomeVisible = await welcomeHeading.isVisible();
    console.log('Welcome Back Card Visible:', isWelcomeVisible);

    const screenshot1 = path.join(SCREENSHOT_DIR, '01_landing_login_page.png');
    await page.screenshot({ path: screenshot1, fullPage: true });
    console.log('📸 Screenshot saved:', screenshot1);

    if (isWelcomeVisible) {
      testResults.push({ name: 'Landing Page defaults to Login Page', status: 'PASSED' });
    } else {
      testResults.push({ name: 'Landing Page defaults to Login Page', status: 'FAILED', details: 'Welcome Back header not found' });
    }

    // 2. Test Role Switching & 1-Click Demo Accounts
    console.log('\n--- 2. Testing Role Tabs & 1-Click Demo Accounts ---');
    
    // Technician Tab
    await page.locator('button:has-text("Technician")').first().click();
    await page.waitForTimeout(500);
    const techDemoPill = await page.locator('button:has-text("Rajesh")').first();
    const isTechPillVisible = await techDemoPill.isVisible();
    console.log('Technician 1-Click Demo Pill Visible:', isTechPillVisible);

    // Client Tab
    await page.locator('button:has-text("Client")').first().click();
    await page.waitForTimeout(500);
    const clientDemoPill = await page.locator('button:has-text("Priya")').first();
    const isClientPillVisible = await clientDemoPill.isVisible();
    console.log('Client 1-Click Demo Pill Visible:', isClientPillVisible);

    // Admin Tab
    await page.locator('button:has-text("Admin")').first().click();
    await page.waitForTimeout(500);
    const adminDemoPill = await page.locator('button:has-text("Sunil")').first();
    const isAdminPillVisible = await adminDemoPill.isVisible();
    console.log('Admin 1-Click Demo Pill Visible:', isAdminPillVisible);

    const screenshot2 = path.join(SCREENSHOT_DIR, '02_role_selection_and_demo_pills.png');
    await page.screenshot({ path: screenshot2 });
    console.log('📸 Screenshot saved:', screenshot2);

    testResults.push({
      name: 'Role Switching & Demo Persona Pills',
      status: isTechPillVisible && isClientPillVisible && isAdminPillVisible ? 'PASSED' : 'FAILED',
    });

    // 3. Test Modals: Forgot Password, Contact Support, Create Account
    console.log('\n--- 3. Testing Interactive Dialogs on Login Landing Page ---');
    
    // Forgot Password Modal
    await page.locator('button:has-text("Forgot Password?")').first().click();
    await page.waitForTimeout(500);
    const forgotModalVisible = await page.locator('text=Reset Your Password').isVisible();
    const screenshotModal1 = path.join(SCREENSHOT_DIR, '03_forgot_password_modal.png');
    await page.screenshot({ path: screenshotModal1 });
    await page.locator('button:has-text("Cancel")').first().click();
    await page.waitForTimeout(300);

    // Contact Support Modal
    await page.locator('button:has-text("Contact Support")').first().click();
    await page.waitForTimeout(500);
    const supportModalVisible = await page.locator('text=WEPSUN 24x7 Help Desk').isVisible();
    const screenshotModal2 = path.join(SCREENSHOT_DIR, '04_contact_support_modal.png');
    await page.screenshot({ path: screenshotModal2 });
    await page.locator('button:has-text("Close")').first().click();
    await page.waitForTimeout(300);

    // Create Account Modal
    await page.locator('button:has-text("Create Account")').first().click();
    await page.waitForTimeout(500);
    const createModalVisible = await page.locator('text=Create WEPSUN Account').isVisible();
    const screenshotModal3 = path.join(SCREENSHOT_DIR, '05_create_account_modal.png');
    await page.screenshot({ path: screenshotModal3 });
    await page.locator('button:has-text("Cancel")').first().click();
    await page.waitForTimeout(300);

    testResults.push({
      name: 'Interactive Dialogs (Forgot Password, Support, Create Account)',
      status: forgotModalVisible && supportModalVisible && createModalVisible ? 'PASSED' : 'FAILED',
    });

    // 4. Test Admin Login & Dashboard Navigation
    console.log('\n--- 4. Testing Admin Portal Login & Dashboard ---');
    await page.locator('button:has-text("Admin")').first().click();
    await page.waitForTimeout(300);
    // Click instant demo login or submit form
    await page.locator('button[type="submit"]:has-text("Login")').first().click();
    await page.waitForTimeout(1200);

    const currentUrl = page.url();
    console.log('Current URL after Admin Login:', currentUrl);
    const isAdminDashboard = currentUrl.includes('dashboard') || (await page.locator('text=Registered Lifts Fleet').isVisible()) || (await page.locator('text=Operating Companies').isVisible()) || (await page.locator('header').isVisible());
    console.log('Admin Dashboard Loaded:', isAdminDashboard);

    const screenshot3 = path.join(SCREENSHOT_DIR, '06_admin_dashboard.png');
    await page.screenshot({ path: screenshot3, fullPage: true });
    console.log('📸 Screenshot saved:', screenshot3);

    testResults.push({
      name: 'Admin Login & Dashboard Render',
      status: isAdminDashboard ? 'PASSED' : 'FAILED',
    });

    // 5. Test Admin Tab Switching
    console.log('\n--- 5. Testing Admin Module Tab Navigation ---');
    // Click Complaints Tab in Sidebar
    await page.locator('button:has-text("Complaints")').first().click();
    await page.waitForTimeout(800);
    const isComplaintsView = await page.locator('text=Service Complaints & Breakdown Tickets').isVisible();
    console.log('Complaints Manager Tab Loaded:', isComplaintsView);

    const screenshotComplaints = path.join(SCREENSHOT_DIR, '07_admin_complaints_view.png');
    await page.screenshot({ path: screenshotComplaints });

    // Click Lifts Tab in Sidebar
    await page.locator('button:has-text("Lifts")').first().click();
    await page.waitForTimeout(800);
    const isLiftsView = await page.locator('text=Registered Lifts Fleet').isVisible();
    console.log('Lifts Directory Tab Loaded:', isLiftsView);

    const screenshotLifts = path.join(SCREENSHOT_DIR, '08_admin_lifts_view.png');
    await page.screenshot({ path: screenshotLifts });

    testResults.push({
      name: 'Admin Operations Module Navigation',
      status: isComplaintsView && isLiftsView ? 'PASSED' : 'FAILED',
    });

    // 6. Test Logout from Header Profile Dropdown back to Landing Page
    console.log('\n--- 6. Testing Log Out back to Landing Page ---');
    // Open user profile dropdown in header
    const profileBtn = page.locator('header').locator('button').filter({ has: page.locator('img') }).last();
    await profileBtn.click();
    await page.waitForTimeout(500);

    const logoutBtn = page.locator('button:has-text("Log Out")');
    await logoutBtn.click();
    await page.waitForTimeout(1000);

    const urlAfterLogout = page.url();
    console.log('URL after Log Out:', urlAfterLogout);
    const isLandingAfterLogout = (await page.locator('text=Welcome Back').first().isVisible()) && (await page.locator('h1').isVisible());
    console.log('Returned to Landing Login Page:', isLandingAfterLogout);

    const screenshotLogout = path.join(SCREENSHOT_DIR, '09_logout_to_landing_page.png');
    await page.screenshot({ path: screenshotLogout, fullPage: true });
    console.log('📸 Screenshot saved:', screenshotLogout);

    testResults.push({
      name: 'Log Out returns cleanly to Login Landing Page',
      status: isLandingAfterLogout ? 'PASSED' : 'FAILED',
    });

    // 7. Test Technician Login Flow
    console.log('\n--- 7. Testing Technician Portal Login & Jobs View ---');
    await page.locator('button:has-text("Technician")').first().click();
    await page.waitForTimeout(500);
    // Click Rajesh Sharma 1-Click Demo Login
    await page.locator('button:has-text("Rajesh")').first().click();
    await page.waitForTimeout(1200);

    const techUrl = page.url();
    console.log('Current URL for Technician:', techUrl);
    const isTechDashboard = (await page.locator('text=Field Engineer Workflow').first().isVisible().catch(() => false)) || (await page.locator('text=Today\'s Jobs').first().isVisible().catch(() => false)) || techUrl.includes('jobs') || techUrl.includes('dashboard');
    console.log('Technician Dashboard Loaded:', isTechDashboard);

    const screenshotTech = path.join(SCREENSHOT_DIR, '10_technician_jobs_dashboard.png');
    await page.screenshot({ path: screenshotTech, fullPage: true });
    console.log('📸 Screenshot saved:', screenshotTech);

    testResults.push({
      name: 'Technician Login & Workflow Dashboard',
      status: isTechDashboard ? 'PASSED' : 'FAILED',
    });

    // Logout from Sidebar
    await page.locator('button:has-text("Logout")').first().click();
    await page.waitForTimeout(1000);

    // 8. Test Client Login Flow
    console.log('\n--- 8. Testing Client Portal Login & Resident View ---');
    await page.locator('button:has-text("Client")').first().click();
    await page.waitForTimeout(500);
    // Click Priya Sharma 1-Click Demo Login
    await page.locator('button:has-text("Priya")').first().click();
    await page.waitForTimeout(1200);

    const clientUrl = page.url();
    console.log('Current URL for Client:', clientUrl);
    const isClientDashboard = (await page.locator('text=Resident & Society Hub').first().isVisible().catch(() => false)) || (await page.locator('text=My Lifts').first().isVisible().catch(() => false)) || clientUrl.includes('home') || clientUrl.includes('dashboard');
    console.log('Client Dashboard Loaded:', isClientDashboard);

    const screenshotClient = path.join(SCREENSHOT_DIR, '11_client_resident_dashboard.png');
    await page.screenshot({ path: screenshotClient, fullPage: true });
    console.log('📸 Screenshot saved:', screenshotClient);

    testResults.push({
      name: 'Client Login & Society Hub Dashboard',
      status: isClientDashboard ? 'PASSED' : 'FAILED',
    });

    // Final Logout back to Landing Page
    await page.goto('http://localhost:5173/#login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const isFinalLanding = await page.locator('text=Welcome Back').first().isVisible();
    testResults.push({
      name: 'Final Return to Login Landing Page',
      status: isFinalLanding ? 'PASSED' : 'FAILED',
    });

  } catch (error: any) {
    console.error('❌ Test execution error:', error);
    testResults.push({ name: 'Browser Automation Run', status: 'FAILED', details: error.message });
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  console.log('📊 TEST EXECUTION SUMMARY:');
  console.log('========================================');
  testResults.forEach((t) => {
    const icon = t.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${t.status}] ${t.name}${t.details ? ` - ${t.details}` : ''}`);
  });
  console.log('========================================\n');
}

runBrowserTests();
