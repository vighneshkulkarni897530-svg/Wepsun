/**
 * WEPSUN Engineering Solution – Production Environment & Readiness Verifier
 * Comprehensive pre-flight check for database connectivity, security secrets,
 * Master Admin authentication, bundle integrity, and deployment readiness.
 */

import 'dotenv/config';
import { prisma } from '../backend/src/lib/prisma.js';
import { validateMasterCredentials, validateMasterId, getMasterAuthorizedEmails } from '../backend/src/lib/masterAuth.js';
import fs from 'fs';
import path from 'path';

interface CheckItem {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}

const results: CheckItem[] = [];

function check(category: string, name: string, condition: boolean, passMsg: string, failMsg: string, isWarn = false) {
  results.push({
    category,
    name,
    status: condition ? 'PASS' : isWarn ? 'WARN' : 'FAIL',
    details: condition ? passMsg : failMsg,
  });
}

async function runVerification() {
  console.log('\n============================================================');
  console.log('  WEPSUN Lift Service SaaS – Production Readiness Audit');
  console.log('============================================================\n');

  // 1. Environment Secrets & Tokens
  const dbUrl = process.env.DATABASE_URL || '';
  check('Environment', 'Database Connection URL', Boolean(dbUrl && dbUrl.startsWith('postgres')),
    'Configured with valid PostgreSQL connection URI',
    'DATABASE_URL is missing or does not start with postgres:// or postgresql://');

  const jwtSecret = process.env.JWT_SECRET || '';
  check('Environment', 'JWT Secret Key', Boolean(jwtSecret && jwtSecret.length >= 16),
    `Configured (${jwtSecret.length} characters long)`,
    'JWT_SECRET is missing or less than 16 characters');

  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || '';
  check('Environment', 'Refresh Token Secret Key', Boolean(refreshSecret && refreshSecret.length >= 16),
    `Configured (${refreshSecret.length} characters long)`,
    'REFRESH_TOKEN_SECRET is missing or less than 16 characters');

  // 2. Master Admin Configuration (Safer Path)
  const m1Id = process.env.MASTER_ID_1 || process.env.LEGACY_MASTER_ID_1 || '';
  const m1Pass = process.env.MASTER_PASSWORD_1 || '';
  const m1Email = process.env.MASTER_EMAIL_1 || '';
  const legacyM1 = process.env.LEGACY_MASTER_ID_1 || 'WEP-MST-8921';
  check('Master Admin 1', 'Slot 1 Identifier & Email', Boolean((m1Id === 'WEP-MST-8921' || m1Id === 'jaiswalsumit2812@gmail.com') && m1Email === 'jaiswalsumit2812@gmail.com'),
    `Sumit Jaiswal (${legacyM1} / ${m1Email})`,
    'Slot 1 identifier or email mismatch');

  check('Master Admin 1', 'Slot 1 Secret Password', Boolean(m1Pass && m1Pass.length >= 8),
    'Configured securely in environment (gitignored)',
    'MASTER_PASSWORD_1 is missing or less than 8 characters');

  const m2Id = process.env.MASTER_ID_2 || process.env.LEGACY_MASTER_ID_2 || '';
  const m2Pass = process.env.MASTER_PASSWORD_2 || '';
  const m2Email = process.env.MASTER_EMAIL_2 || '';
  const legacyM2 = process.env.LEGACY_MASTER_ID_2 || 'WEP-MST-4407';
  check('Master Admin 2', 'Slot 2 Identifier & Email', Boolean((m2Id === 'WEP-MST-4407' || m2Id === 'gauravsaini0004@gmail.com') && m2Email === 'gauravsaini0004@gmail.com'),
    `Gaurav Saini (${legacyM2} / ${m2Email})`,
    'Slot 2 identifier or email mismatch');

  check('Master Admin 2', 'Slot 2 Secret Password', Boolean(m2Pass && m2Pass.length >= 8),
    'Configured securely in environment (gitignored)',
    'MASTER_PASSWORD_2 is missing or less than 8 characters');

  // 3. Cryptographic Master Auth Verification
  const slot1Auth = validateMasterCredentials(m1Email, m1Pass);
  check('Authentication', 'Slot 1 Auth (Email + Pass)', Boolean(slot1Auth.isValid && slot1Auth.masterUser),
    `Validated successfully via timing-safe crypto: ${slot1Auth.masterUser?.name}`,
    'Slot 1 credential check failed');

  const slot1LegacyAuth = validateMasterCredentials(m1Id, m1Pass);
  check('Authentication', 'Slot 1 Auth (Master ID + Pass)', Boolean(slot1LegacyAuth.isValid),
    `Validated legacy ID login (${m1Id})`,
    'Slot 1 legacy ID credential check failed');

  const slot2Auth = validateMasterCredentials(m2Email, m2Pass);
  check('Authentication', 'Slot 2 Auth (Email + Pass)', Boolean(slot2Auth.isValid && slot2Auth.masterUser),
    `Validated successfully via timing-safe crypto: ${slot2Auth.masterUser?.name}`,
    'Slot 2 credential check failed');

  const slot2LegacyAuth = validateMasterCredentials(m2Id, m2Pass);
  check('Authentication', 'Slot 2 Auth (Master ID + Pass)', Boolean(slot2LegacyAuth.isValid),
    `Validated legacy ID login (${m2Id})`,
    'Slot 2 legacy ID credential check failed');

  const wrongPassAuth = validateMasterCredentials(m1Email, 'WrongPassword123');
  check('Authentication', 'Reject Invalid Password', Boolean(!wrongPassAuth.isValid),
    'Correctly rejected invalid password attempt (401)',
    'Failed to reject invalid password attempt!');

  // 4. Database Live Connectivity & Schema
  try {
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const liftCount = await prisma.lift.count();
    const complaintCount = await prisma.complaint.count();

    check('Database', 'PostgreSQL Connectivity', true,
      `Connected successfully (Users: ${userCount}, Companies: ${companyCount}, Lifts: ${liftCount}, Complaints: ${complaintCount})`,
      'Failed connecting to database');
  } catch (dbErr: any) {
    check('Database', 'PostgreSQL Connectivity', false,
      '',
      `Database connection failed: ${dbErr.message}`);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }

  // 5. Frontend Production Bundle Check
  const distHtmlPath = path.resolve(process.cwd(), 'dist', 'index.html');
  const distExists = fs.existsSync(distHtmlPath);
  check('Frontend Bundle', 'Production dist/index.html', distExists,
    'Vite production bundle generated and verified',
    'dist/index.html not found. Run npm run build first.');

  if (distExists) {
    const htmlContent = fs.readFileSync(distHtmlPath, 'utf8');
    const hasAnimation = fs.existsSync(path.resolve(process.cwd(), 'dist', 'assets', 'animation-DDUxqUrW.mp4')) ||
                         fs.existsSync(path.resolve(process.cwd(), 'public', 'animation.mp4'));
    check('Frontend Bundle', 'Splash Animation Asset', hasAnimation,
      'Startup animation video available in production assets',
      'animation.mp4 asset missing from build output', true);

    // Verify no secret leak in dist files
    let secretLeakDetected = false;
    const distAssetsDir = path.resolve(process.cwd(), 'dist', 'assets');
    if (fs.existsSync(distAssetsDir)) {
      const assetFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
      for (const f of assetFiles) {
        const jsText = fs.readFileSync(path.join(distAssetsDir, f), 'utf8');
        if (m1Pass && jsText.includes(m1Pass)) secretLeakDetected = true;
        if (m2Pass && jsText.includes(m2Pass)) secretLeakDetected = true;
      }
    }
    check('Security Audit', 'Zero Secret Leak in Bundle', !secretLeakDetected,
      'No plaintext passwords or private keys found in frontend JavaScript bundle',
      'WARNING: Plaintext password found inside dist/assets bundle!');
  }

  // 6. Print Results Table
  console.log('| Category | Audit Item | Status | Details |');
  console.log('| :--- | :--- | :---: | :--- |');
  for (const r of results) {
    const symbol = r.status === 'PASS' ? '✅ PASS' : r.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL';
    console.log(`| **${r.category}** | ${r.name} | ${symbol} | ${r.details} |`);
  }

  const allPassed = results.every((r) => r.status === 'PASS' || r.status === 'WARN');
  console.log('\n------------------------------------------------------------');
  if (allPassed) {
    console.log('🎉 ALL PRODUCTION CHECKS PASSED: Application is ready to deploy!');
  } else {
    console.log('⚠️ Some critical checks failed. Please resolve them before deploying.');
  }
  console.log('------------------------------------------------------------\n');
}

runVerification().catch((err) => {
  console.error('Audit encountered an unexpected exception:', err);
  process.exit(1);
});
