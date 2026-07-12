import { auth, isFirebaseConfigured } from './firebase';
import {
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged
} from 'firebase/auth';
import { getDocById, setDocData, initializeMockData } from './db';
import type { UserDoc } from '../types';

export interface AuthSession {
  uid: string;
  email: string;
  displayName: string;
  role: 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst' | 'driver';
  status: 'active' | 'suspended';
}

// Global active session for mock authentication
let currentMockSession: AuthSession | null = null;
const authStateSubscribers = new Set<(user: AuthSession | null) => void>();

function notifyAuthStateSubscribers() {
  const session = getSession();
  authStateSubscribers.forEach(cb => cb(session));
}

function getSession(): AuthSession | null {
  if (currentMockSession) return currentMockSession;
  const stored = localStorage.getItem('transitops_auth_session');
  if (stored) {
    try {
      currentMockSession = JSON.parse(stored);
      return currentMockSession;
    } catch {
      return null;
    }
  }
  return null;
}

export async function loginUser(email: string, password?: string): Promise<AuthSession> {
  if (isFirebaseConfigured && auth) {
    if (!password) throw new Error('Password is required for Firebase Authentication');
    const credentials = await firebaseSignIn(auth, email, password);
    const user = credentials.user;

    // Retrieve user profile from DB to get the role
    const profile = await getDocById<UserDoc>('users', user.uid);
    if (!profile) {
      // Create a default profile if it doesn't exist
      const defaultProfile: UserDoc = {
        uid: user.uid,
        email: user.email || email,
        fullName: user.displayName || email.split('@')[0],
        role: 'driver', // fallback default
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await setDocData('users', user.uid, defaultProfile);
      return {
        uid: user.uid,
        email: defaultProfile.email,
        displayName: defaultProfile.fullName,
        role: defaultProfile.role,
        status: defaultProfile.status
      };
    }

    if (profile.status === 'suspended') {
      throw new Error('Your user account has been suspended. Contact support.');
    }

    return {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.fullName,
      role: profile.role,
      status: profile.status
    };
  } else {
    // Local mock login
    initializeMockData();
    const mockUsers = JSON.parse(localStorage.getItem('transitops_mock_users') || '[]');
    const matchedUser = mockUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

    if (!matchedUser) {
      throw new Error('Invalid email credentials in mock mode. Use preset demo accounts.');
    }

    if (matchedUser.status === 'suspended') {
      throw new Error('Your user account has been suspended. Contact support.');
    }

    const session: AuthSession = {
      uid: matchedUser.uid,
      email: matchedUser.email,
      displayName: matchedUser.fullName,
      role: matchedUser.role,
      status: matchedUser.status
    };

    currentMockSession = session;
    localStorage.setItem('transitops_auth_session', JSON.stringify(session));
    notifyAuthStateSubscribers();
    return session;
  }
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await firebaseSignOut(auth);
  } else {
    currentMockSession = null;
    localStorage.removeItem('transitops_auth_session');
    notifyAuthStateSubscribers();
  }
}

// Hook directly into the Auth state change callbacks
export function subscribeToAuthState(callback: (user: AuthSession | null) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getDocById<UserDoc>('users', firebaseUser.uid);
          if (profile) {
            callback({
              uid: firebaseUser.uid,
              email: profile.email,
              displayName: profile.fullName,
              role: profile.role,
              status: profile.status
            });
          } else {
            callback(null);
          }
        } catch {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  } else {
    // Mock subscription
    initializeMockData();
    callback(getSession());
    authStateSubscribers.add(callback);
    return () => {
      authStateSubscribers.delete(callback);
    };
  }
}
