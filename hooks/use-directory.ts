import { useCallback, useEffect, useState } from 'react';

import {
  COMMUNITY_LEADERS,
  DIRECTORY_DATA,
  type CommunityLeader,
  type Household,
} from '@/constants/directory';
import { fetchHouseholds, fetchLeaders } from '@/lib/firestore';

type Status = 'loading' | 'success' | 'error';

export function useDirectory() {
  // Start with local static data so the UI renders immediately
  const [households, setHouseholds] = useState<Household[]>(DIRECTORY_DATA);
  const [leaders, setLeaders] = useState<CommunityLeader[]>(COMMUNITY_LEADERS);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setStatus('loading');

    Promise.all([fetchHouseholds(), fetchLeaders()])
      .then(([remoteHouseholds, remoteLeaders]) => {
        if (cancelled) return;
        if (remoteHouseholds.length > 0) setHouseholds(remoteHouseholds);
        if (remoteLeaders.length > 0) setLeaders(remoteLeaders);
        setStatus('success');
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => load(), [load]);

  return { households, leaders, status, error, refresh: load };
}
