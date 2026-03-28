import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import type { CommunityLeader, Household } from '@/constants/directory';
import { db } from './firebase';

// ─── Read ────────────────────────────────────────────────────────────────────

export async function fetchHouseholds(): Promise<Household[]> {
  const q = query(collection(db, 'households'), orderBy('householdName'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ ...(d.data() as Omit<Household, 'id'>), id: d.id }));
}

export async function fetchLeaders(): Promise<CommunityLeader[]> {
  const q = query(collection(db, 'leaders'), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as CommunityLeader);
}

// ─── Write ───────────────────────────────────────────────────────────────────

export async function upsertHousehold(household: Household): Promise<void> {
  const { id, ...data } = household;
  await setDoc(doc(db, 'households', id), data, { merge: true });
}

export async function deleteHousehold(id: string): Promise<void> {
  await deleteDoc(doc(db, 'households', id));
}

// ─── Seed (run once to migrate local data → Firestore) ───────────────────────

export async function seedDatabase(
  households: Household[],
  leaders: CommunityLeader[],
): Promise<void> {
  const batch = writeBatch(db);

  for (const household of households) {
    const { id, ...data } = household;
    batch.set(doc(db, 'households', id), data);
  }

  for (const [i, leader] of leaders.entries()) {
    batch.set(doc(db, 'leaders', `leader-${i}`), { ...leader, order: i });
  }

  await batch.commit();
}
