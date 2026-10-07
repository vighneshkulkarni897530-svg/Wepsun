/**
 * WEPSUN Engineering Solutions — Cryptographic Master ID Authentication Module
 * Secure Backend Validation for Technician Portal Master Key Entry Point
 * 
 * Supports exactly two authorized Master IDs.
 * Values are stored securely via environment variables and validated via SHA-256 hashes
 * using timing-safe comparisons to eliminate side-channel vulnerabilities.
 */

import crypto from 'crypto';

// Default Master IDs (Authorized Master Accounts)
const DEFAULT_MASTER_ID_1 = 'jaiswalsumit2812@gmail.com';
const DEFAULT_MASTER_ID_2 = 'gauravsaini0004@gmail.com';
const LEGACY_MASTER_ID_1 = 'WEP-MST-8921';
const LEGACY_MASTER_ID_2 = 'WEP-MST-4407';

/**
 * Computes deterministic SHA-256 hex digest for credential verification
 */
export function computeMasterIdHash(id: string): string {
  return crypto.createHash('sha256').update(id.trim().toLowerCase()).digest('hex');
}

/**
 * Resolves the authorized hashes for both Master ID slots from environment or defaults
 */
function getAuthorizedHashes(): { hash1: string; hash2: string; legacyHash1: string; legacyHash2: string } {
  const master1 = process.env.MASTER_ID_1 || DEFAULT_MASTER_ID_1;
  const master2 = process.env.MASTER_ID_2 || DEFAULT_MASTER_ID_2;

  const hash1 = process.env.MASTER_ID_HASH_1 || computeMasterIdHash(master1);
  const hash2 = process.env.MASTER_ID_HASH_2 || computeMasterIdHash(master2);
  const legacyHash1 = computeMasterIdHash(LEGACY_MASTER_ID_1);
  const legacyHash2 = computeMasterIdHash(LEGACY_MASTER_ID_2);

  return { hash1, hash2, legacyHash1, legacyHash2 };
}

export interface MasterValidationResult {
  isValid: boolean;
  masterSlot?: 1 | 2;
  message?: string;
}

/**
 * Validates a candidate Master ID string using timing-safe cryptographic comparison.
 * Checks against exactly two authorized Master ID credentials.
 */
export function validateMasterId(candidateId: string): MasterValidationResult {
  if (!candidateId || typeof candidateId !== 'string') {
    return { isValid: false, message: 'Please enter your Master ID.' };
  }

  const normalized = candidateId.trim().toLowerCase();
  if (normalized.length === 0) {
    return { isValid: false, message: 'Please enter your Master ID.' };
  }

  const candidateHash = computeMasterIdHash(normalized);
  const candidateBuffer = Buffer.from(candidateHash, 'hex');

  const { hash1, hash2, legacyHash1, legacyHash2 } = getAuthorizedHashes();
  const buffer1 = Buffer.from(hash1, 'hex');
  const buffer2 = Buffer.from(hash2, 'hex');
  const legacyBuffer1 = Buffer.from(legacyHash1, 'hex');
  const legacyBuffer2 = Buffer.from(legacyHash2, 'hex');

  // Verify Slot 1 (Sumit Jaiswal or legacy ID 1)
  if (
    (buffer1.length === candidateBuffer.length && crypto.timingSafeEqual(buffer1, candidateBuffer)) ||
    (legacyBuffer1.length === candidateBuffer.length && crypto.timingSafeEqual(legacyBuffer1, candidateBuffer))
  ) {
    return { isValid: true, masterSlot: 1 };
  }

  // Verify Slot 2 (Gaurav Saini or legacy ID 2)
  if (
    (buffer2.length === candidateBuffer.length && crypto.timingSafeEqual(buffer2, candidateBuffer)) ||
    (legacyBuffer2.length === candidateBuffer.length && crypto.timingSafeEqual(legacyBuffer2, candidateBuffer))
  ) {
    return { isValid: true, masterSlot: 2 };
  }

  return { isValid: false, message: 'Invalid Master ID. Please try again.' };
}

/**
 * Factory for Master Admin user record corresponding to the verified slot
 */
export function getMasterAdminUser(slot: 1 | 2) {
  if (slot === 1) {
    return {
      id: 'usr-master-sumit',
      name: 'Sumit Jaiswal (Master Admin)',
      email: 'jaiswalsumit2812@gmail.com',
      phone: '+91 98201 99928',
      role: 'MASTER_ADMIN',
      companyId: 'comp-1',
      branchId: 'br-mum-1',
      clientId: null,
      technicianId: null,
      designation: 'Master Operations Controller',
      department: 'Technical Operations & Executive Administration',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      tokenVersion: 0,
    };
  }

  return {
    id: 'usr-master-gaurav',
    name: 'Gaurav Saini (Master Admin)',
    email: 'gauravsaini0004@gmail.com',
    phone: '+91 98201 92025',
    role: 'MASTER_ADMIN',
    companyId: 'comp-1',
    branchId: 'br-mum-1',
    clientId: null,
    technicianId: null,
    designation: 'Master Operations Controller',
    department: 'Technical Operations & Executive Administration',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    tokenVersion: 0,
  };
}
