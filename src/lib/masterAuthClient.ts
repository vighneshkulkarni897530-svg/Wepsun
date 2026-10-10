/**
 * Client-side Master Authentication Helper for WEPSUN Lift Services
 * 
 * Verifies if active session contains a cryptographically authorized,
 * unexpired, unrevoked Master Admin authentication session.
 */

import { isMasterAdminSessionValid, clearMasterAdminFlag } from '../services/sessionManager';

export function isMasterAdminAuthenticated(): boolean {
  return isMasterAdminSessionValid();
}

export function clearMasterAdminAuthentication(): void {
  clearMasterAdminFlag();
}
