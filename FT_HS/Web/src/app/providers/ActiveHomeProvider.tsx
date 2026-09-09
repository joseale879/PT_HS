import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { homesApi } from '@shared/http/apiClient';

export type ActiveHome = { homeId: string; name: string };

type ActiveHomeContextValue = {
  homes: ActiveHome[];
  homeId: string;
  setHomeId: (homeId: string) => void;
  isLoading: boolean;
};

const ActiveHomeContext = createContext<ActiveHomeContextValue | null>(null);
const ACTIVE_HOME_KEY = 'hidrosmart_active_home_id';

export function ActiveHomeProvider({ children }: { children: ReactNode }) {
  const [homes, setHomes] = useState<ActiveHome[]>([]);
  const [homeId, setHomeIdState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    homesApi
      .list()
      .then(({ data }) => {
        if (!active) return;
        const loaded = (data as Array<{ homeId: string; name: string }>).map((home) => ({
          homeId: String(home.homeId),
          name: String(home.name),
        }));
        const stored = sessionStorage.getItem(ACTIVE_HOME_KEY);
        setHomes(loaded);
        setHomeIdState(
          loaded.some((home) => home.homeId === stored) ? stored || '' : loaded[0]?.homeId || ''
        );
      })
      .catch(() => {
        if (active) {
          setHomes([]);
          setHomeIdState('');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const setHomeId = (nextHomeId: string) => {
    setHomeIdState(nextHomeId);
    if (nextHomeId) sessionStorage.setItem(ACTIVE_HOME_KEY, nextHomeId);
    else sessionStorage.removeItem(ACTIVE_HOME_KEY);
  };

  const value = useMemo(
    () => ({ homes, homeId, setHomeId, isLoading }),
    [homes, homeId, isLoading]
  );
  return <ActiveHomeContext.Provider value={value}>{children}</ActiveHomeContext.Provider>;
}

export function useActiveHome() {
  const context = useContext(ActiveHomeContext);
  if (!context) throw new Error('useActiveHome debe utilizarse dentro de ActiveHomeProvider');
  return context;
}
