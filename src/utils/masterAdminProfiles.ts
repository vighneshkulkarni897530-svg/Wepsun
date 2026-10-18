/**
 * Master Admin Profiles & Identity Metadata Utility
 * Provides dedicated executive profiling, badges, and workspace defaults for:
 * Slot 1: Sumit Jaiswal (WEP-MST-8921 / jaiswalsumit2812@gmail.com)
 * Slot 2: Gaurav Saini (WEP-MST-4407 / gauravsaini0004@gmail.com)
 */

export interface MasterAdminProfile {
  slot: 1 | 2;
  id: string;
  masterId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  badgeLabel: string;
  badgeTag: string;
  badgeGradient: string;
  executiveFocus: string;
  defaultAvatar: string;
  bio: string;
  defaultNotes: { id: string; text: string; completed: boolean }[];
}

export const MASTER_ADMIN_PROFILES: Record<1 | 2, MasterAdminProfile> = {
  1: {
    slot: 1,
    id: 'usr-master-sumit',
    masterId: 'WEP-MST-8921',
    name: 'Sumit Jaiswal',
    email: 'jaiswalsumit2812@gmail.com',
    phone: '+91 98201 99928',
    designation: 'Managing Director & CEO',
    department: 'Executive Directorate & Strategic Operations',
    badgeLabel: 'Managing Director & CEO',
    badgeTag: 'Managing Director & CEO',
    badgeGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    executiveFocus: 'Enterprise Strategy, AMC Growth, Client SLA Governance & High-Value Approvals',
    defaultAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Co-Managing Director & CEO directing WEPSUN Engineering Solution enterprise growth, annual maintenance contracts, strategic client partnerships, and corporate governance.',
    defaultNotes: [
      { id: 'sumit-1', text: 'Review quarterly AMC renewal proposals for Apex Heights & Grand Horizon', completed: false },
      { id: 'sumit-2', text: 'Approve vendor spare traction ropes & drive belt replenishment batch', completed: true },
      { id: 'sumit-3', text: 'Conduct executive SLA compliance audit across Mumbai & Thane buildings', completed: false },
    ],
  },
  2: {
    slot: 2,
    id: 'usr-master-gaurav',
    masterId: 'WEP-MST-4407',
    name: 'Gaurav Saini',
    email: 'gauravsaini0004@gmail.com',
    phone: '+91 98201 92025',
    designation: 'Managing Director & CEO',
    department: 'Executive Directorate & Technical Operations',
    badgeLabel: 'Managing Director & CEO',
    badgeTag: 'Managing Director & CEO',
    badgeGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    executiveFocus: 'Technical Engineering, Field Diagnostic Operations & Smart IoT Elevator Telemetry',
    defaultAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Co-Managing Director & CEO directing WEPSUN Engineering Solution technical engineering, breakdown resolution SLA, technician standards, and smart IoT telemetry.',
    defaultNotes: [
      { id: 'gaurav-1', text: 'Inspect hydraulic pressure sensor calibration on Lift #L-SUN-02 (Empire Tower)', completed: false },
      { id: 'gaurav-2', text: 'Review field technician emergency breakdown logs and GPS response times', completed: true },
      { id: 'gaurav-3', text: 'Audit IoT lift telemetry alerts and predictive door cycle reports', completed: false },
    ],
  },
};

/**
 * Detects whether the current user is Master Admin Slot 1 or Slot 2
 */
export function detectMasterAdminSlot(user: { id?: string; email?: string } | null | undefined): 1 | 2 | null {
  if (!user) return null;
  const email = (user.email || '').toLowerCase().trim();
  const id = (user.id || '').toLowerCase().trim();

  if (email.includes('jaiswalsumit') || email.includes('sumit') || id === 'usr-master-sumit' || id.includes('8921')) {
    return 1;
  }
  if (email.includes('gauravsaini') || email.includes('gaurav') || id === 'usr-master-gaurav' || id.includes('4407')) {
    return 2;
  }
  return null;
}

/**
 * Returns the Master Admin Profile for the given slot or active user
 */
export function getMasterAdminProfile(slot: 1 | 2): MasterAdminProfile {
  return MASTER_ADMIN_PROFILES[slot];
}

/**
 * Resolves the active master admin profile, or null if not an executive master admin
 */
export function getActiveMasterAdminProfile(user: { id?: string; email?: string } | null | undefined): MasterAdminProfile | null {
  const slot = detectMasterAdminSlot(user);
  if (!slot) return null;
  return MASTER_ADMIN_PROFILES[slot];
}
