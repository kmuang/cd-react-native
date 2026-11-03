import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  getDirectoryState,
  startDirectorySync,
  subscribeDirectory,
  type DirectoryState,
} from '@/lib/directory-store';

type DirectoryContextValue = DirectoryState & {
  refresh: () => void;
};

const DirectoryContext = createContext<DirectoryContextValue | null>(null);

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DirectoryState>(() => getDirectoryState());

  useEffect(() => {
    startDirectorySync();
    return subscribeDirectory((next) => {
      setState({ ...next });
    });
  }, []);

  const value = useMemo<DirectoryContextValue>(
    () => ({
      ...state,
      refresh: () => setState({ ...getDirectoryState() }),
    }),
    [state],
  );

  return <DirectoryContext.Provider value={value}>{children}</DirectoryContext.Provider>;
}

export function useDirectory() {
  const ctx = useContext(DirectoryContext);
  const [fallback, setFallback] = useState<DirectoryState>(() => getDirectoryState());

  useEffect(() => {
    if (ctx) return;
    startDirectorySync();
    return subscribeDirectory((next) => setFallback({ ...next }));
  }, [ctx]);

  if (ctx) return ctx;
  return {
    ...fallback,
    refresh: () => setFallback({ ...getDirectoryState() }),
  };
}
