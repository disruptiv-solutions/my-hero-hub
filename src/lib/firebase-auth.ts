import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User,
  onAuthStateChanged,
  getIdToken
} from "firebase/auth";
import { auth } from "./firebase";
import { storeGoogleTokens } from "./google-tokens-client";

const googleProvider = new GoogleAuthProvider();
// Add scopes for Google Calendar and Gmail access
googleProvider.addScope("https://www.googleapis.com/auth/calendar.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/gmail.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/tasks.readonly");
// Request offline access to get refresh token
googleProvider.setCustomParameters({
  access_type: 'offline',
  prompt: 'consent'
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // The signed-in user info
    const user = result.user;
    
    // Get the Google access token for API calls
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    // Store Google OAuth tokens in Firestore for server-side API access
    if (accessToken && user.uid) {
      try {
        // Calculate expiration (Google tokens typically expire in 1 hour)
        const expiresAt = Date.now() + (60 * 60 * 1000);
        console.log(`Storing Google tokens for user ${user.uid}...`);
        await storeGoogleTokens(
          user.uid,
          accessToken,
          undefined, // Refresh token not available from popup flow
          expiresAt,
          user.email || undefined // Store email for primary account lookup
        );
        console.log(`Successfully stored Google tokens for user ${user.uid}`);
      } catch (tokenError) {
        console.error("Error storing Google tokens:", tokenError);
        // Show error to user but don't fail the sign-in
        throw new Error(`Failed to store Google tokens: ${tokenError instanceof Error ? tokenError.message : 'Unknown error'}. Please check Firestore security rules.`);
      }
    } else {
      console.warn("No access token received from Google sign-in. Google Calendar/Gmail features will not work.");
    }
    
    return { user, accessToken };
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getAccessToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const token = await getIdToken(user);
    return token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
};

