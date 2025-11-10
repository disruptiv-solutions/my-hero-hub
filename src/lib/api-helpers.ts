import { auth } from "./firebase";
import { getIdToken } from "firebase/auth";

/**
 * Get authorization headers for API requests
 * Includes Firebase ID token in Bearer format
 * @returns Headers object with Authorization header, or empty object if not authenticated
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const user = auth.currentUser;
  if (!user) {
    return {};
  }
  
  try {
    const token = await getIdToken(user);
    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("Error getting auth token:", error);
    return {};
  }
};






