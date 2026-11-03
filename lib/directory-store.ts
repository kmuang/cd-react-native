import AsyncStorage from '@react-native-async-storage/async-storage';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';

import {
  COMMUNITY_LEADERS,
  DIRECTORY_DATA,
  type CommunityLeader,
  type Household,
} from '@/constants/directory';
import { db, firebaseReady } from './firebase';
import {
  deleteHousehold as deleteHouseholdRemote,
  upsertHousehold as upsertHouseholdRemote,
  saveLeaders as saveLeadersRemote,
} from './firestore';

const HH_KEY = '@directory_households';
const LD_KEY = '@directory_leaders';
const DIRTY_KEY = '@directory_dirty';

export type CloudSync = 'unknown' | 'ok' | 'offline';
export type DirectoryStatus = 'loading' | 'success' | 'error';

export type DirectoryState = {
  households: Household[];
  leaders: CommunityLeader[];
  status: DirectoryStatus;
  cloudSync: CloudSync;
  error: string | null;
};

type Listener = (state: DirectoryState) => void;

let state: DirectoryState = {
  households: DIRECTORY_DATA,
  leaders: COMMUNITY_LEADERS,
  status: 'loading',
  cloudSync: 'unknown',
  error: null,
};

const listeners = new Set<Listener>();
let started = false;
let dirty = false;
let cloudAvailable: boolean | null = null;
let unsubHouseholds: (() => void) | null = null;
let unsubLeaders: (() => void) | null = null;

function markCloudOffline(message?: string) {
  cloudAvailable = false;
  setState({
    cloudSync: 'offline',
    error: message ?? state.error,
  });
}

async function tryCloud(fn: () => Promise<void>): Promise<boolean> {
  if (cloudAvailable === false) return false;
  try {
    await firebaseReady;
    await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Cloud save timed out')), 2500);
      }),
    ]);
    cloudAvailable = true;
    setState({ cloudSync: 'ok', error: null });
    return true;
  } catch (e) {
    markCloudOffline(e instanceof Error ? e.message : 'Cloud save failed');
    return false;
  }
}

function emit() {
  for (const listener of listeners) listener(state);
}

function setState(patch: Partial<DirectoryState>) {
  state = { ...state, ...patch };
  emit();
}

export function getDirectoryState() {
  return state;
}

export function subscribeDirectory(listener: Listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

async function persist() {
  await AsyncStorage.multiSet([
    [HH_KEY, JSON.stringify(state.households)],
    [LD_KEY, JSON.stringify(state.leaders)],
    [DIRTY_KEY, dirty ? '1' : '0'],
  ]);
}

function sortHouseholds(list: Household[]) {
  return [...list].sort((a, b) =>
    (a.householdName || '').localeCompare(b.householdName || ''),
  );
}

export async function saveHousehold(household: Household): Promise<{ cloud: boolean }> {
  const index = state.households.findIndex((h) => h.id === household.id);
  const next = index >= 0
    ? state.households.map((h) => (h.id === household.id ? household : h))
    : [...state.households, household];

  dirty = true;
  setState({ households: sortHouseholds(next), status: 'success' });
  await persist();
  const cloud = await tryCloud(() => upsertHouseholdRemote(household));
  return { cloud };
}

export async function removeHousehold(id: string): Promise<{ cloud: boolean }> {
  dirty = true;
  setState({
    households: state.households.filter((h) => h.id !== id),
    status: 'success',
  });
  await persist();
  const cloud = await tryCloud(() => deleteHouseholdRemote(id));
  return { cloud };
}

export async function saveLeaders(leaders: CommunityLeader[]): Promise<{ cloud: boolean }> {
  const next = leaders.filter((l) => l.name.trim() || l.role.trim());
  dirty = true;
  setState({ leaders: next, status: 'success' });
  await persist();
  const cloud = await tryCloud(() => saveLeadersRemote(next));
  return { cloud };
}

async function pushLocalIfDirty() {
  if (!dirty || cloudAvailable === false) return;
  const cloud = await tryCloud(async () => {
    for (const household of state.households) {
      await upsertHouseholdRemote(household);
    }
    await saveLeadersRemote(state.leaders);
  });
  if (cloud) {
    dirty = false;
    await persist();
  }
}

function startRemoteListeners() {
  unsubHouseholds?.();
  unsubLeaders?.();

  unsubHouseholds = onSnapshot(
    query(collection(db, 'households'), orderBy('householdName')),
    (snap) => {
      const data = snap.docs.map((d) => ({
        ...(d.data() as Omit<Household, 'id'>),
        id: d.id,
      }));
      if (!dirty && data.length > 0) {
        setState({ households: data, status: 'success', cloudSync: 'ok', error: null });
        persist().catch(() => {});
      } else {
        setState({ status: 'success', cloudSync: dirty ? state.cloudSync : 'ok' });
      }
      pushLocalIfDirty().catch(() => {});
    },
    (err) => {
      markCloudOffline(err.message);
      setState({ status: 'success' });
    },
  );

  unsubLeaders = onSnapshot(
    query(collection(db, 'leaders'), orderBy('order')),
    (snap) => {
      const data = snap.docs.map((d) => d.data() as CommunityLeader);
      if (!dirty && data.length > 0) {
        setState({ leaders: data, status: 'success', cloudSync: 'ok' });
        persist().catch(() => {});
      }
    },
    (err) => {
      markCloudOffline(err.message);
    },
  );
}

export function startDirectorySync() {
  if (started) return;
  started = true;

  (async () => {
    try {
      const pairs = await AsyncStorage.multiGet([HH_KEY, LD_KEY, DIRTY_KEY]);
      const map = Object.fromEntries(pairs);
      if (map[HH_KEY]) {
        const parsed = JSON.parse(map[HH_KEY] as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state = { ...state, households: parsed };
        }
      }
      if (map[LD_KEY]) {
        const parsed = JSON.parse(map[LD_KEY] as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state = { ...state, leaders: parsed };
        }
      }
      dirty = map[DIRTY_KEY] === '1';
    } catch {
      // Keep bundled fallback data
    }

    await firebaseReady;
    setState({ status: 'success' });
    startRemoteListeners();
  })();
}
