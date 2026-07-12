import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const mockUsers = [
  { email: 'admin@transitops.com', role: 'admin', fullName: 'Chief Operations Officer (Admin)', phoneNumber: '+1 (555) 019-2831' },
  { email: 'manager@transitops.com', role: 'manager', fullName: 'Fleet Operations Manager', phoneNumber: '+1 (555) 014-9988' },
  { email: 'operator@transitops.com', role: 'operator', fullName: 'Lead Dispatcher / Operator', phoneNumber: '+1 (555) 012-3456' },
  { email: 'driver@transitops.com', role: 'driver', fullName: 'John Doe (Driver)', phoneNumber: '+1 (555) 019-8765' }
];

async function seed() {
  console.log('Starting Firebase Seeding...');
  
  for (const mockUser of mockUsers) {
    let uid;
    try {
      console.log(`Creating user: ${mockUser.email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, mockUser.email, 'password123');
      uid = userCredential.user.uid;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${mockUser.email} already exists, signing in to get UID...`);
        const userCredential = await signInWithEmailAndPassword(auth, mockUser.email, 'password123');
        uid = userCredential.user.uid;
      } else {
        console.error(`Error with ${mockUser.email}:`, error);
        continue;
      }
    }
    
    try {
      console.log(`Writing UserDoc to Firestore for: ${mockUser.email} (UID: ${uid})`);
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        phoneNumber: mockUser.phoneNumber,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log(`Successfully seeded ${mockUser.email}`);
    } catch (error: any) {
      console.error(`Error writing UserDoc for ${mockUser.email}:`, error);
      console.error('Have you deployed the firestore.rules to the Firebase Console?');
    }
  }

  console.log('Seeding Complete! You can now log in with the seeded accounts (password: password123).');
  process.exit(0);
}

seed().catch(console.error);
