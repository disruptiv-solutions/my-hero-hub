import { adminDb } from './firebase-admin';

/**
 * Get Google OAuth tokens from Firestore (server-side only)
 * @param userId - Firebase user UID
 * @param accountEmail - Optional email address to get tokens for a specific account
 * @returns Tokens object or null if not found
 */
export const getGoogleTokens = async (userId: string, accountEmail?: string) => {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const data = userDoc.data();
    
    // If accountEmail is specified, try to find it in emailAccounts array
    if (accountEmail && data?.emailAccounts) {
      const account = data.emailAccounts.find((acc: any) => acc.email === accountEmail);
      if (account) {
        return {
          accessToken: account.accessToken || null,
          refreshToken: account.refreshToken || null,
          expiresAt: account.expiresAt || null,
        };
      }
    }
    
    // Fall back to primary account (backwards compatibility)
    return {
      accessToken: data?.googleAccessToken || null,
      refreshToken: data?.googleRefreshToken || null,
      expiresAt: data?.googleTokenExpiresAt || null,
    };
  } catch (error) {
    console.error('Error getting Google tokens:', error);
    return null;
  }
};

/**
 * Get all email accounts for a user
 * @param userId - Firebase user UID
 * @returns Array of email account objects
 */
export const getAllEmailAccounts = async (userId: string) => {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return [];
    }
    
    const data = userDoc.data();
    const accounts = data?.emailAccounts || [];
    
    // Also include primary account if it exists (for backwards compatibility)
    if (data?.googleAccessToken) {
      // Try to get email from stored data, or we'll need to fetch it from Gmail API
      const primaryEmail = data.email || null;
      const hasPrimary = accounts.some((acc: any) => acc.email === primaryEmail);
      
      // If we have a token but no email in the doc, try to get it from Gmail API
      // But for now, if we have the token, we'll create an account entry
      // The email will be fetched when we actually use the account
      if (!hasPrimary && data.googleAccessToken) {
        // If we don't have email stored, we'll use a placeholder that will be resolved when accessing Gmail
        const primaryAccount: any = {
          id: 'primary',
          email: primaryEmail || 'loading...', // Will be resolved when accessing Gmail
          accessToken: data.googleAccessToken,
          isPrimary: true,
          addedAt: data.createdAt || data.updatedAt || new Date().toISOString(),
          label: 'Primary Account',
        };
        
        // Only add optional fields if they exist (Firestore doesn't allow undefined)
        if (data.googleRefreshToken) {
          primaryAccount.refreshToken = data.googleRefreshToken;
        }
        if (data.googleTokenExpiresAt) {
          primaryAccount.expiresAt = data.googleTokenExpiresAt;
        }
        
        accounts.unshift(primaryAccount);
      }
    }
    
    return accounts;
  } catch (error) {
    console.error('Error getting all email accounts:', error);
    return [];
  }
};

/**
 * Update Google access token (for token refresh) - server-side only
 * @param userId - Firebase user UID
 * @param accessToken - New Google OAuth access token
 * @param expiresAt - New token expiration timestamp
 */
export const updateGoogleAccessToken = async (
  userId: string,
  accessToken: string,
  expiresAt?: number
) => {
  try {
    const userRef = adminDb.collection('users').doc(userId);
    
    await userRef.update({
      googleAccessToken: accessToken,
      googleTokenExpiresAt: expiresAt || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating Google access token:', error);
    throw error;
  }
};

