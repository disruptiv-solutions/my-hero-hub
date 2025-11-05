import { NextRequest } from 'next/server';
import { verifyIdToken } from './firebase-admin';

/**
 * Extract and verify Firebase ID token from request headers
 * @param request - Next.js request object
 * @returns Decoded token with user information or null if invalid
 */
export const getFirebaseUser = async (request: NextRequest) => {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extract token
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return null;
    }

    // Verify token
    const decodedToken = await verifyIdToken(idToken);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
    };
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
};


