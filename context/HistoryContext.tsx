import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readJSON, writeJSON } from "../lib/storage";
import type { Verdict } from "../lib/api";

export interface HistoryEntry {
  id: string;
  verdict: Verdict;
  reason: string;
  action: string;
  snippet: string;
  inputType: "text" | "photo";
  timestamp: number;
}

interface HistoryContextValue {
  entries: HistoryEntry[];
  loading: boolean;
  addEntry: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

const STORAGE_KEY = "history/v1";
const MAX_ENTRIES = 100;

const HistoryContext = createContext<HistoryContextValue | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    readJSON<HistoryEntry[]>(STORAGE_KEY, []).then((stored) => {
      if (mounted) {
        setEntries(stored);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  function persist(next: HistoryEntry[]) {
    setEntries(next);
    writeJSON(STORAGE_KEY, next);
  }

  const value = useMemo<HistoryContextValue>(
    () => ({
      entries,
      loading,
      addEntry: (entry) => {
        const withMeta: HistoryEntry = {
          ...entry,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
        };
        persist([withMeta, ...entries].slice(0, MAX_ENTRIES));
      },
      removeEntry: (id) => persist(entries.filter((entry) => entry.id !== id)),
      clearAll: () => persist([]),
    }),
    [entries, loading]
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("useHistory must be used within a HistoryProvider");
  return ctx;
}
