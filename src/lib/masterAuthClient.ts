/**
 * Client-side Master Authentication Helper for WEPSUN Lift Services
 * 
 * Verifies if active browser session or local storage contains an authorized
 * Master Admin authentication token/flag.
 */

export function isMasterAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const isMasterAuth =
    sessionStorage.getItem('wepsun_master_authenticated') === 'true' ||
    localStorage.getItem('wepsun_master_authenticated') === 'true';
  return Boolean(isMasterAuth);
}
