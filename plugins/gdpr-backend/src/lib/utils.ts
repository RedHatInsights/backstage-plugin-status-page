import { Platform, UserData, User } from './types';

/**
 * Formats raw API response data into standardized UserData format
 */
export function formatUserData(platform: Platform, data: unknown): UserData {
  // Type guard to ensure data is an object
  const rawData = data && typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};
  const nestedData = rawData.data && typeof rawData.data === 'object' && rawData.data !== null ? 
    rawData.data as Record<string, unknown> : {};
  
  // Extract user data with proper type handling
  const user: User = (nestedData.user as User) || (nestedData.subscription_user as User) || {};
  
  // Normalize roles array
  if (user.roles) {
    if (Array.isArray(user.roles)) {
      user.roles = user.roles;
    } else if (typeof user.roles === 'object' && user.roles !== null && 'target_id' in user.roles) {
      user.roles = [user.roles];
    } else {
      user.roles = [];
    }
  } else {
    user.roles = [];
  }
  
  return {
    platform,
    user,
    content: Array.isArray(nestedData.content) ? nestedData.content : [],
    code: typeof rawData.code === 'number' ? rawData.code : 200,
    status: typeof rawData.status === 'string' ? rawData.status : 'success',
  };
}
  