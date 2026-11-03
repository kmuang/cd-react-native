/**
 * One-time script to seed Firestore with local directory data.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-firestore.ts
 */

// Inline firebase config for script use (reads from .env directly)
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';
import { COMMUNITY_LEADERS, DIRECTORY_DATA } from '../constants/directory';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Dynamic import to avoid module alias issues in node context
async function main() {
  await signInAnonymously(auth);
  console.log(`Seeding ${DIRECTORY_DATA.length} households and ${COMMUNITY_LEADERS.length} leaders…`);

  // Firestore batch limit is 500 writes
  const batchSize = 490;
  const allWrites = [
    ...DIRECTORY_DATA.map((h) => {
      const { id, ...data } = h;
      return { ref: doc(db, 'households', id), data };
    }),
    ...COMMUNITY_LEADERS.map((l, i) => ({
      ref: doc(db, 'leaders', `leader-${i}`),
      data: { ...l, order: i },
    })),
  ];

  for (let i = 0; i < allWrites.length; i += batchSize) {
    const batch = writeBatch(db);
    for (const { ref, data } of allWrites.slice(i, i + batchSize)) {
      batch.set(ref, data);
    }
    await batch.commit();
    console.log(`  ✓ Committed batch ${Math.floor(i / batchSize) + 1}`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
