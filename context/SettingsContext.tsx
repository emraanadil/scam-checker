import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readJSON, writeJSON } from "../lib/storage";

export type TextSize = "normal" | "large" | "extraLarge";
export type AppearanceSetting = "light" | "dark" | "system";

interface SettingsState {
  textSize: TextSize;
  appearance: AppearanceSetting;
  historyEnabled: boolean;
  hasOnboarded: boolean;
}

interface SettingsContextValue extends SettingsState {
  loading: boolean;
  setTextSize: (value: TextSize) => void;
  setAppearance: (value: AppearanceSetting) => void;
  setHistoryEnabled: (value: boolean) => void;
  completeOnboarding: () => void;
}

const STORAGE_KEY = "settings/v1";

const DEFAULT_STATE: SettingsState = {
  textSize: "normal",
  appearance: "system",
  historyEnabled: true,
  hasOnboarded: false,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    readJSON(STORAGE_KEY, DEFAULT_STATE).then((stored) => {
      if (mounted) {
        setState({ ...DEFAULT_STATE, ...stored });
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  function update(partial: Partial<SettingsState>) {
    setState((prev) => {
      const next = { ...prev, ...partial };
      writeJSON(STORAGE_KEY, next);
      return next;
    });
  }

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      loading,
      setTextSize: (textSize) => update({ textSize }),
      setAppearance: (appearance) => update({ appearance }),
      setHistoryEnabled: (historyEnabled) => update({ historyEnabled }),
      completeOnboarding: () => update({ hasOnboarded: true }),
    }),
    [state, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within a SettingsProvider");
  return ctx;
}
