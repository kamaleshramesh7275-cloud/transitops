import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if we should force mock mode
const forceMock = import.meta.env.VITE_USE_MOCK_FIREBASE === 'true';

let auth: Auth | null = null;
let db: Firestore | null = null;
let isFirebaseConfigured = false;

// Only initialize Firebase if we are NOT forcing mock AND we have valid-looking configs
if (!forceMock && firebaseConfig.apiKey && firebaseConfig.projectId) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log('Firebase initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase SDK, falling back to mock mode:', error);
  }
} else {
  console.log('Using local mock database mode.');
}

export { auth, db, isFirebaseConfigured };
