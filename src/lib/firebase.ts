import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== "undefined";
const hasFirebaseConfig = Object.values(firebaseConfig).every((value) => Boolean(value));

let cachedApp: FirebaseApp | null = null;

const initializeFirebaseApp = (): FirebaseApp | null => {
  if (!isBrowser || !hasFirebaseConfig) {
    return null;
  }

  if (cachedApp) {
    return cachedApp;
  }

  const existingApps = getApps();
  cachedApp = existingApps.length ? existingApps[0] : initializeApp(firebaseConfig);
  return cachedApp;
};

export const getClientFirebaseApp = (): FirebaseApp | null => {
  return initializeFirebaseApp();
};

export const getClientAuth = (): Auth | null => {
  const app = initializeFirebaseApp();
  if (!app) {
    return null;
  }
  return getAuth(app);
};

export const getClientDb = (): Firestore | null => {
  const app = initializeFirebaseApp();
  if (!app) {
    return null;
  }
  return getFirestore(app);
};

