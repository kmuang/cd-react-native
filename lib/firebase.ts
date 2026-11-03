import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  console.error('[Firebase] Missing env vars — check your .env.local file');
} else {
  console.log('[Firebase] Initialized with project:', firebaseConfig.projectId);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);

export const firebaseReady = signInAnonymously(auth)
  .then(() => {
    console.log('[Firebase] Signed in anonymously');
  })
  .catch((err) => {
    console.error('[Firebase] Anonymous sign-in failed:', err);
  });
