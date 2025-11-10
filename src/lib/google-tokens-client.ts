import { doc, setDoc } from "firebase/firestore";
import { getClientDb } from "./firebase";

/**
 * Store Google OAuth tokens in Firestore for a user (client-side only)
 * @param userId - Firebase user UID
 * @param accessToken - Google OAuth access token
 * @param refreshToken - Google OAuth refresh token (optional)
 * @param expiresAt - Token expiration timestamp (optional)
 * @param email - User's email address (optional, but recommended)
 */
export const storeGoogleTokens = async (
  userId: string,
  accessToken: string,
  refreshToken?: string,
  expiresAt?: number,
  email?: string
) => {
  try {
    const db = getClientDb();
    if (!db) {
      throw new Error("Firebase is not configured for the current environment.");
    }
    const userRef = doc(db, "users", userId);
    
    const data: Record<string, unknown> = {
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken || null,
      googleTokenExpiresAt: expiresAt || null,
      updatedAt: new Date().toISOString(),
    };
    
    // Store email if provided
    if (email) {
      data.email = email;
    }
    
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.error('Error storing Google tokens:', error);
    throw error;
  }
};

