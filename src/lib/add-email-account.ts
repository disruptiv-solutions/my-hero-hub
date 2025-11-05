import { getAuthHeaders } from "./api-helpers";

// Google OAuth Client ID - get from environment or use the one from your setup
const getGoogleClientId = (): string => {
  // Try to get from environment variable first
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID) {
    return process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
  }
  
  // Fallback to your OAuth client ID (from your Google Cloud Console)
  // Client ID: 586000007031-f6cgnudusrih2dlou22kigksqs1pkmp7.apps.googleusercontent.com
  return "586000007031-f6cgnudusrih2dlou22kigksqs1pkmp7.apps.googleusercontent.com";
};

/**
 * Load Google Identity Services script
 */
const loadGoogleIdentityServices = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Must be called in browser'));
      return;
    }

    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if ((window as any).google?.accounts?.oauth2) {
        resolve();
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

/**
 * Add a new Google email account using Google Identity Services
 * This allows adding additional accounts without changing the Firebase Auth session
 * @param label - Optional label for the account
 * @returns The new email account information
 */
export const addEmailAccount = async (label?: string): Promise<any> => {
  try {
    // Load Google Identity Services
    await loadGoogleIdentityServices();

    const google = (window as any).google;
    const clientId = getGoogleClientId();

    return new Promise((resolve, reject) => {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        callback: async (response: any) => {
          try {
            if (!response.access_token) {
              reject(new Error('No access token received from Google'));
              return;
            }

            // Get user email from Google
            const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${response.access_token}`,
              },
            });

            if (!userInfoResponse.ok) {
              throw new Error('Failed to get user info from Google');
            }

            const userInfo = await userInfoResponse.json();
            const email = userInfo.email;

            if (!email) {
              throw new Error('Email not found in user info');
            }

            // Calculate expiration (expires_in is in seconds)
            const expiresAt = Date.now() + (response.expires_in * 1000);

            // Add the account via API
            const authHeaders = await getAuthHeaders();
            const apiResponse = await fetch("/api/email-accounts", {
              method: "POST",
              headers: {
                ...authHeaders,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                accessToken: response.access_token,
                expiresAt,
                label: label || email,
              }),
            });

            if (!apiResponse.ok) {
              const error = await apiResponse.json();
              throw new Error(error.error || "Failed to add email account");
            }

            const data = await apiResponse.json();
            resolve(data.account);
          } catch (error: any) {
            console.error("Error in OAuth callback:", error);
            reject(error);
          }
        },
        error_callback: (error: any) => {
          console.error("Google OAuth error:", error);
          
          // Handle specific error types
          if (error.type === 'popup_closed' || error.type === 'popup_blocked') {
            reject(new Error('Popup was closed or blocked by your browser. Please allow popups for this site and try again.'));
          } else if (error.type === 'user_cancelled' || error.type === 'access_denied') {
            reject(new Error('Sign-in was cancelled. Please try again when ready.'));
          } else if (error.type === 'popup_failed_to_open') {
            reject(new Error('Failed to open sign-in popup. Please check your browser\'s popup blocker settings.'));
          } else {
            reject(new Error(error.message || 'Failed to authenticate with Google. Please try again.'));
          }
        },
      });

      // Request access token with consent prompt to allow account selection
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  } catch (error: any) {
    console.error("Error adding email account:", error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('popup') || error.message?.includes('blocked')) {
      throw new Error('Popup was blocked. Please allow popups for this site and try again.');
    } else if (error.message?.includes('cancelled')) {
      throw new Error('Sign-in was cancelled.');
    } else {
      throw error;
    }
  }
};
