/**
 * WEPSUN Engineering Solution — Unified Avatar & Profile Photo Utilities
 * Provides a single shared source of truth for user profile photos,
 * dummy/placeholder detection, and reactive cross-view synchronization.
 */

/**
 * Checks if a given avatar string is an auto-generated or stock placeholder image
 * (such as Unsplash images or legacy seeded mock avatars).
 */
export const isDummyAvatar = (avatar?: string | null): boolean => {
  if (!avatar) return true;
  const a = avatar.trim();
  if (!a) return true;

  // Any unsplash image is a mock/placeholder asset
  if (a.includes('images.unsplash.com')) return true;

  // Known legacy mock image IDs from initial mock datasets
  const dummyFragments = [
    '534528741775',
    '541888946425',
    '486406146926',
    '519494026892',
    '545324418',
    '500648767791',
    '472099645785',
    '507003211169',
    '506794778202',
    '535713875002',
    '580489944761',
    '573496359142',
    '560250097',
    '522075469751',
    'photo-1581092160607',
    'photo-1581092335397',
  ];

  return dummyFragments.some((fragment) => a.includes(fragment));
};

/**
 * Validates whether an avatar string is a legitimate custom user profile picture
 * (e.g., base64 data URL, blob URL, or persistent server storage URL).
 */
export const isValidCustomAvatar = (avatar?: string | null): boolean => {
  if (!avatar) return false;
  const a = avatar.trim();
  if (!a) return false;

  // Base64 Data URLs and Blob URLs are definitely genuine user uploads
  if (a.startsWith('data:image/') || a.startsWith('blob:')) {
    return true;
  }

  // Any non-dummy URL is valid
  return !isDummyAvatar(a);
};

/**
 * Resolves the active user's effective profile photo from all synchronized sources:
 * 1. Active User avatar state
 * 2. Client profile logo state (for client accounts)
 * 3. Persistent local storage cache for the user ID
 */
export const getEffectiveProfilePhoto = (
  userAvatar?: string | null,
  clientLogo?: string | null,
  userId?: string | null
): string => {
  // 1. Direct custom user avatar
  if (isValidCustomAvatar(userAvatar)) {
    return userAvatar!.trim();
  }

  // 2. Client profile logo
  if (isValidCustomAvatar(clientLogo)) {
    return clientLogo!.trim();
  }

  // 3. Persistent local storage cache for this user
  if (typeof window !== 'undefined' && userId) {
    try {
      const cached = localStorage.getItem('wepsun_user_avatar_' + userId);
      if (isValidCustomAvatar(cached)) {
        return cached!.trim();
      }
    } catch {
      // Non-blocking
    }
  }

  return '';
};
