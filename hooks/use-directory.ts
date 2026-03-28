import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

import {
  COMMUNITY_LEADERS,
  DIRECTORY_DATA,
  type CommunityLeader,
  type Household,
} from '@/constants/directory';
import { db } from '@/lib/firebase';

type Status = 'loading' | 'success' | 'error';

export function useDirectory() {
  const [households, setHouseholds] = useState<Household[]>(DIRECTORY_DATA);
  const [leaders, setLeaders] = useState<CommunityLeader[]>(COMMUNITY_LEADERS);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let householdsReady = false;
    let leadersReady = false;

    const checkReady = () => {
      if (householdsReady && leadersReady) setStatus('success');
    };

    // Real-time listener for households
    const unsubHouseholds = onSnapshot(
      query(collection(db, 'households'), orderBy('householdName')),
      (snap) => {
        const data = snap.docs.map((d) => ({ ...(d.data() as Omit<Household, 'id'>), id: d.id }));
        if (data.length > 0) setHouseholds(data);
        householdsReady = true;
        checkReady();
      },
      (err) => {
        setError(err.message);
        setStatus('error');
      },
    );

    // Real-time listener for leaders
    const unsubLeaders = onSnapshot(
      query(collection(db, 'leaders'), orderBy('order')),
      (snap) => {
        const data = snap.docs.map((d) => d.data() as CommunityLeader);
        if (data.length > 0) setLeaders(data);
        leadersReady = true;
        checkReady();
      },
      (err) => {
        setError(err.message);
        setStatus('error');
      },
    );

    return () => {
      unsubHouseholds();
      unsubLeaders();
    };
  }, []);

  // refresh is a no-op now — onSnapshot keeps data live automatically
  const refresh = () => {};

  return { households, leaders, status, error, refresh };
}
