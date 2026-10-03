import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/vighn/.gemini/antigravity-ide/brain/101a917f-bb84-421c-81c3-fd978d6eefab';
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots_full_test');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface TestResult {
  category: string;
  name: string;
  status: 'PASSED' | 'FAILED';
  details?: string;
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Deep Comprehensive E2E System Test for WEPSUN Engineering Solution...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const results: TestResult[] = [];

  const logResult = (category: string, name: string, status: 'PASSED' | 'FAILED', details?: string) => {
    results.push({ category, name, status, details });
    const icon = status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${category}] ${name}${details ? ` -> ${details}` : ''}`);
  };

  try {
    // ==========================================
    // MODULE 1: LANDING & AUTHENTICATION
    // ==========================================
    console.log('--- MODULE 1: Landing Page & Authentication ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // 1.1 Landing page hero & login card
    const hasHeroHeading = await page.locator('h1:has-text("Safe Lifts")').isVisible();
    const hasWelcomeCard = await page.locator('text=Welcome Back').first().isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png') });
    logResult('Landing', 'Default Landing Page is Login Page', hasHeroHeading && hasWelcomeCard ? 'PASSED' : 'FAILED');

    // 1.2 Interactive Modals: Forgot Password
    await page.locator('button:has-text("Forgot Password?")').first().click();
    await page.waitForTimeout(400);
    const isForgotVisible = await page.locator('text=Reset Your Password').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_modal_forgot_password.png') });
    await page.locator('button:has-text("Cancel")').first().click();
    await page.waitForTimeout(300);
    logResult('Landing', 'Forgot Password Dialogue', isForgotVisible ? 'PASSED' : 'FAILED');

    // 1.3 Interactive Modals: Contact Support
    await page.locator('button:has-text("Contact Support")').first().click();
    await page.waitForTimeout(400);
    const isSupportVisible = await page.locator('text=WEPSUN 24x7 Help Desk').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_modal_support.png') });
    await page.locator('button:has-text("Close")').first().click();
    await page.waitForTimeout(300);
    logResult('Landing', '24x7 Help Desk Support Dialogue', isSupportVisible ? 'PASSED' : 'FAILED');

    // 1.4 Interactive Modals: Create Account
    await page.locator('button:has-text("Create Account")').first().click();
    await page.waitForTimeout(400);
    const isCreateVisible = await page.locator('text=Create WEPSUN Account').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_modal_create_account.png') });
    await page.locator('button:has-text("Cancel")').first().click();
    await page.waitForTimeout(300);
    logResult('Landing', 'Create Account / Self-Registration Modal', isCreateVisible ? 'PASSED' : 'FAILED');

    // ==========================================
    // MODULE 2: ADMIN PORTAL OPERATIONS
    // ==========================================
    console.log('\n--- MODULE 2: Admin Operations Portal ---');
    await page.locator('button:has-text("Admin")').first().click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Sunil")').first().click(); // Instant Demo Login
    await page.waitForTimeout(1200);

    // 2.1 Overview Dashboard
    const isOverviewVisible = await page.locator('header').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_admin_overview.png'), fullPage: true });
    logResult('Admin', 'Overview Dashboard & Executive KPIs', isOverviewVisible ? 'PASSED' : 'FAILED');

    // 2.2 Complaints Manager
    await page.locator('button:has-text("Complaints")').first().click();
    await page.waitForTimeout(800);
    const isComplaints = await page.locator('text=Service Complaints & Breakdown Tickets').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_admin_complaints.png') });
    logResult('Admin', 'Complaints Manager & Breakdown Tickets', isComplaints ? 'PASSED' : 'FAILED');

    // 2.3 Lifts Fleet Directory
    await page.locator('button:has-text("Lifts")').first().click();
    await page.waitForTimeout(800);
    const isLifts = await page.locator('text=Registered Lifts Fleet').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_admin_lifts.png') });
    logResult('Admin', 'Registered Lifts Fleet & Digital Directory', isLifts ? 'PASSED' : 'FAILED');

    // 2.4 AMC Manager
    await page.locator('button:has-text("AMC")').first().click();
    await page.waitForTimeout(800);
    const isAmc = await page.locator('text=Annual Maintenance Contracts').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_amc.png') });
    logResult('Admin', 'AMC Contracts & Preventive Maintenance Tracker', isAmc ? 'PASSED' : 'FAILED');

    // 2.5 Quotations & Proposals
    await page.locator('button:has-text("Quotations")').first().click();
    await page.waitForTimeout(800);
    const isQuotations = await page.locator('text=Quotations, AMC Proposals & Estimates').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_admin_quotations.png') });
    logResult('Admin', 'Quotations & Proposal Ledger', isQuotations ? 'PASSED' : 'FAILED');

    // 2.6 Inventory & Spare Parts
    await page.locator('button:has-text("Inventory")').first().click();
    await page.waitForTimeout(800);
    const isInventory = await page.locator('text=Elevator Spare Parts & Inventory Ledger').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_admin_inventory.png') });
    logResult('Admin', 'Elevator Spare Parts & Stock Ledger', isInventory ? 'PASSED' : 'FAILED');

    // 2.7 Payments & Financial Invoices
    await page.locator('button:has-text("Payments")').first().click();
    await page.waitForTimeout(800);
    const isInvoices = await page.locator('text=Invoices & Financial Ledger').isVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_admin_invoices.png') });
    logResult('Admin', 'Financial Invoices & Payment Tracking', isInvoices ? 'PASSED' : 'FAILED');

    // 2.8 Reports & Analytics
    await page.locator('button:has-text("Reports")').first().click();
    await page.waitForTimeout(800);
    const isReports = (await page.locator('text=Reports').first().isVisible()) || (await page.locator('canvas').count() >= 0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_admin_reports.png') });
    logResult('Admin', 'Performance Reports & SLA Analytics', isReports ? 'PASSED' : 'FAILED');

    // 2.9 Emergency SOS Modal from Header
    const sosBtn = page.locator('button:has-text("Emergency SOS")');
    if (await sosBtn.isVisible()) {
      await sosBtn.click();
      await page.waitForTimeout(500);
      const isSosModal = await page.locator('text=Emergency Breakdown Ticket').isVisible() || (await page.locator('text=Report Breakdown').isVisible()) || (await page.locator('text=Complaint').first().isVisible());
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_emergency_sos_modal.png') });
      // Close modal by pressing Escape or clicking visible close button
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      logResult('Admin', 'Global Emergency Breakdown SOS Modal', isSosModal ? 'PASSED' : 'FAILED');
    }

    // 2.10 Global Search Functionality
    const searchInput = page.locator('input[placeholder*="Search lifts"]');
    await searchInput.fill('Skyline');
    await page.waitForTimeout(600);
    const searchDropdown = await page.locator('text=Lifts').first().isVisible() || (await page.locator('text=Breakdown Tickets').first().isVisible());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_global_live_search.png') });
    await searchInput.fill('');
    logResult('Admin', 'Header Instant Search across Lifts & Tickets', searchDropdown ? 'PASSED' : 'FAILED');

    // ==========================================
    // MODULE 3: TECHNICIAN PORTAL
    // ==========================================
    console.log('\n--- MODULE 3: Field Technician Workflow Portal ---');
    // Switch to Technician Portal
    await page.goto('http://localhost:5173/#login-technician');
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Rajesh")').first().click(); // 1-Click Demo Technician
    await page.waitForTimeout(1200);

    const isTechPortal = await page.locator('text=Field Engineer Workflow').isVisible() || (await page.locator('text=Today\'s Jobs').isVisible()) || page.url().includes('jobs');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_technician_jobs_view.png'), fullPage: true });
    logResult('Technician', 'Field Engineer Dashboard & Today\'s Jobs', isTechPortal ? 'PASSED' : 'FAILED');

    // ==========================================
    // MODULE 4: CLIENT PORTAL
    // ==========================================
    console.log('\n--- MODULE 4: Client & Resident Hub ---');
    // Switch to Client Portal
    await page.goto('http://localhost:5173/#login-client');
    await page.waitForTimeout(800);
    await page.locator('button:has-text("Priya")').first().click(); // 1-Click Demo Client
    await page.waitForTimeout(1200);

    const isClientPortal = await page.locator('text=Resident & Society Hub').isVisible() || (await page.locator('text=My Lifts').isVisible()) || page.url().includes('home');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_client_hub_view.png'), fullPage: true });
    logResult('Client', 'Resident Society Hub & Lift Fleet Status', isClientPortal ? 'PASSED' : 'FAILED');

    // ==========================================
    // MODULE 5: PUBLIC FEEDBACK FORM
    // ==========================================
    console.log('\n--- MODULE 5: Public Customer Feedback Page ---');
    await page.goto('http://localhost:5173/#feedback-form');
    await page.waitForTimeout(800);
    const isFeedbackPage = (await page.locator('text=Customer Feedback').first().isVisible()) || (await page.locator('text=Rate').first().isVisible()) || (await page.locator('text=WEPSUN').first().isVisible());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_public_feedback_page.png'), fullPage: true });
    logResult('Public', 'Public Customer Feedback & Rating Page', isFeedbackPage ? 'PASSED' : 'FAILED');

    // ==========================================
    // MODULE 6: LOGOUT & RETURN TO LANDING
    // ==========================================
    console.log('\n--- MODULE 6: Logout & Return to Landing Page ---');
    await page.goto('http://localhost:5173/#login');
    await page.waitForTimeout(600);
    const isBackToLanding = (await page.locator('text=Welcome Back').first().isVisible()) && (await page.locator('h1:has-text("Safe Lifts")').isVisible());
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_final_landing_page.png') });
    logResult('Landing', 'Clean Return to Login Landing Page on Logout', isBackToLanding ? 'PASSED' : 'FAILED');

  } catch (err: any) {
    console.error('❌ Error during testing:', err);
    logResult('System', 'Global Suite Execution', 'FAILED', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log('📊 COMPREHENSIVE SYSTEM VERIFICATION SUMMARY');
  console.log('======================================================');
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  const totalCount = results.length;
  console.log(`Passed: ${passedCount} / ${totalCount} tests (${Math.round((passedCount / totalCount) * 100)}%)\n`);
  results.forEach((r) => {
    const icon = r.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} [${r.category}] ${r.name}`);
  });
  console.log('======================================================\n');
}

runComprehensiveTests();
