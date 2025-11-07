import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Lazy initialization - only initialize when actually needed at runtime
let adminApp: App | null = null;

// Check if we're in a build/static generation context
const isBuildTime = (): boolean => {
  // During Next.js build phase, environment variables may not be available
  // Check for indicators that we're in build context
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return true;
  }
  
  // If we're in production build but don't have the required env vars, assume build time
  // (Vercel sets these during build, but they might not be available during static analysis)
  if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_PROJECT_ID) {
    // Check if we're actually in Vercel build (not runtime)
    // Vercel sets VERCEL=1 during both build and runtime, so we need another check
    // During build, NEXT_RUNTIME might not be set
    if (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production') {
      // This is likely build time if we don't have the env vars
      return true;
    }
  }
  
  return false;
};

const getAdminApp = (): App => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const hasCredentials = process.env.FIREBASE_PROJECT_ID && 
                         process.env.FIREBASE_CLIENT_EMAIL && 
                         privateKey;

  // If we have credentials and no app yet, or if we have a placeholder app and now have credentials
  // Initialize/reinitialize with proper credentials
  if (hasCredentials) {
    if (adminApp) {
      // Check if current app is a placeholder (has projectId 'build-placeholder')
      // If so, we should reinitialize with proper credentials
      // But Firebase Admin doesn't allow reinitialization, so we use the existing app
      // which should work if credentials are now available
      return adminApp;
    }
    
    if (getApps().length > 0) {
      adminApp = getApps()[0];
      return adminApp;
    }
    
    // Normal initialization with proper credentials
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    return adminApp;
  }

  // No credentials available
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // During build time without credentials, initialize a minimal app to allow build to complete
  if (isBuildTime()) {
    // During build, create a minimal app instance that satisfies the type system
    // This prevents build errors while ensuring runtime errors if credentials aren't set
    try {
      adminApp = initializeApp({
        projectId: 'build-placeholder',
      }, '[DEFAULT]');
    } catch (error) {
      // If that fails, try to get any existing app
      if (getApps().length > 0) {
        adminApp = getApps()[0];
      } else {
        // Last resort: create app without credentials (will fail at runtime)
        adminApp = initializeApp({
          projectId: 'build-placeholder',
        });
      }
    }
    return adminApp;
  }

  // At runtime, throw if credentials are missing
  throw new Error(
    'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment variables.'
  );
};

// Lazy getters for services - only initialize when accessed
export const getAdminAuth = (): Auth => {
  return getAuth(getAdminApp());
};

export const getAdminDb = (): Firestore => {
  return getFirestore(getAdminApp());
};

// Lazy cached instances - only initialize when accessed at runtime
let _adminAuth: Auth | null = null;
let _adminDb: Firestore | null = null;

// Export as lazy getters - only initialize when actually accessed at runtime
// This prevents initialization during Next.js build phase
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    // During build time, return a no-op function to prevent initialization errors
    if (isBuildTime() && !process.env.FIREBASE_PROJECT_ID) {
      if (prop !== 'then' && prop !== Symbol.toPrimitive) {
        return () => {
          throw new Error(
            'Firebase Admin is not initialized. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your Vercel environment variables.'
          );
        };
      }
      return undefined;
    }
    
    if (!_adminAuth) {
      _adminAuth = getAdminAuth();
    }
    const value = _adminAuth[prop as keyof Auth];
    return typeof value === 'function' ? value.bind(_adminAuth) : value;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    // During build time, return a no-op function to prevent initialization errors
    if (isBuildTime() && !process.env.FIREBASE_PROJECT_ID) {
      if (prop !== 'then' && prop !== Symbol.toPrimitive) {
        return () => {
          throw new Error(
            'Firebase Admin is not initialized. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your Vercel environment variables.'
          );
        };
      }
      return undefined;
    }
    
    if (!_adminDb) {
      _adminDb = getAdminDb();
    }
    const value = _adminDb[prop as keyof Firestore];
    return typeof value === 'function' ? value.bind(_adminDb) : value;
  },
});

/**
 * Verify a Firebase ID token and return the decoded token
 * @param idToken - The Firebase ID token to verify
 * @returns Decoded token with user information
 */
export const verifyIdToken = async (idToken: string) => {
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
};

/**
 * Get user by email address
 * @param email - User's email address
 * @returns User record or null if not found
 */
export const getUserByEmail = async (email: string) => {
  try {
    const user = await getAdminAuth().getUserByEmail(email);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
};

/**
 * Get user by UID
 * @param uid - User's Firebase UID
 * @returns User record or null if not found
 */
export const getUserById = async (uid: string) => {
  try {
    const user = await getAdminAuth().getUser(uid);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
};

export default getAdminApp;


