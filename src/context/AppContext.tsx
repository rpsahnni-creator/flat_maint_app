import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Role, Unit, SocietySettings } from '@/types';
import { dataApi } from '@/lib/dataApi';
import { useAuth } from '@/context/AuthContext';

type AppState = {
  role: Role;
  setRole: (r: Role) => void;
  currentUnit: Unit | null;
  setCurrentUnit: (u: Unit | null) => void;
  units: Unit[];
  settings: SocietySettings | null;
  setSettings: (s: SocietySettings | null) => void;
  loading: boolean;
  refreshUnits: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(user?.app_role ?? 'resident');
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [settings, setSettings] = useState<SocietySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.app_role) setRole(user.app_role);
  }, [user?.app_role]);

  const refreshUnits = useCallback(async () => {
    const list = await dataApi.listUnits(true);
    setUnits(list);
    setCurrentUnit((prev) => {
      if (list.length === 0) return null;
      const stillActive = prev ? list.find((u) => u.id === prev.id) : undefined;
      return stillActive ?? list[0];
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [unitsData, settingsData] = await Promise.all([
          dataApi.listUnits(true),
          dataApi.getSettings(),
        ]);
        setUnits(unitsData);
        setSettings(settingsData);
        if (unitsData.length > 0) setCurrentUnit(unitsData[0]);
      } catch (err) {
        console.error('Failed to load society data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppContext.Provider
      value={{ role, setRole, currentUnit, setCurrentUnit, units, settings, setSettings, loading, refreshUnits }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
