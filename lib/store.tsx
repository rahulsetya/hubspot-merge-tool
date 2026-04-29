"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NAME_MATCH_GROUPS, PLATFORM_ID_GROUPS, SEED_GROUPS } from "./seed-data";
import type {
  AuditEntry,
  Company,
  CompanyProperties,
  MergeGroup,
  PropertyOverrides,
} from "./types";
import { combinedAssociations } from "./diff";

const STORAGE_KEY = "hs-merge-demo-state-v2";

type StoredState = {
  mergedGroupIds: string[];
  audit: AuditEntry[];
};

type StoreContextValue = {
  loaded: boolean;
  groups: MergeGroup[];
  platformIdGroups: MergeGroup[];
  nameMatchGroups: MergeGroup[];
  pendingPlatformIdGroups: MergeGroup[];
  pendingNameMatchGroups: MergeGroup[];
  pendingGroups: MergeGroup[];
  completedGroupIds: Set<string>;
  audit: AuditEntry[];
  mergeGroup: (
    groupId: string,
    primaryCompanyId: string,
    overrides?: PropertyOverrides
  ) => AuditEntry | null;
  resetAll: () => void;
  resetSelection: (groupId: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function loadState(): StoredState {
  if (typeof window === "undefined")
    return { mergedGroupIds: [], audit: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { mergedGroupIds: [], audit: [] };
    const parsed = JSON.parse(raw) as StoredState;
    return {
      mergedGroupIds: parsed.mergedGroupIds ?? [],
      audit: parsed.audit ?? [],
    };
  } catch {
    return { mergedGroupIds: [], audit: [] };
  }
}

function saveState(state: StoredState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [mergedGroupIds, setMergedGroupIds] = useState<string[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => {
    const s = loadState();
    setMergedGroupIds(s.mergedGroupIds);
    setAudit(s.audit);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveState({ mergedGroupIds, audit });
  }, [loaded, mergedGroupIds, audit]);

  const completedGroupIds = useMemo(
    () => new Set(mergedGroupIds),
    [mergedGroupIds]
  );

  const platformIdGroups = PLATFORM_ID_GROUPS;
  const nameMatchGroups = NAME_MATCH_GROUPS;
  const groups = SEED_GROUPS;

  const pendingPlatformIdGroups = useMemo(
    () => platformIdGroups.filter((g) => !completedGroupIds.has(g.id)),
    [platformIdGroups, completedGroupIds]
  );
  const pendingNameMatchGroups = useMemo(
    () => nameMatchGroups.filter((g) => !completedGroupIds.has(g.id)),
    [nameMatchGroups, completedGroupIds]
  );
  const pendingGroups = useMemo(
    () => groups.filter((g) => !completedGroupIds.has(g.id)),
    [groups, completedGroupIds]
  );

  const mergeGroup = useCallback(
    (
      groupId: string,
      primaryCompanyId: string,
      overrides?: PropertyOverrides
    ): AuditEntry | null => {
      const group = SEED_GROUPS.find((g) => g.id === groupId);
      if (!group) return null;
      const primary = group.companies.find(
        (c: Company) => c.id === primaryCompanyId
      );
      if (!primary) return null;
      const merged = group.companies.filter(
        (c: Company) => c.id !== primaryCompanyId
      );

      // Build the surviving record's properties by applying overrides on top of primary.
      const mergedProperties: CompanyProperties = { ...primary.properties };
      if (overrides) {
        for (const [key, sourceId] of Object.entries(overrides)) {
          if (!sourceId || sourceId === primaryCompanyId) continue;
          const source = group.companies.find((c) => c.id === sourceId);
          if (!source) continue;
          const k = key as keyof CompanyProperties;
          (mergedProperties as Record<string, unknown>)[k] = source.properties[k];
        }
      }

      const cleanedOverrides: PropertyOverrides = {};
      if (overrides) {
        for (const [key, sourceId] of Object.entries(overrides)) {
          if (sourceId && sourceId !== primaryCompanyId) {
            (cleanedOverrides as Record<string, string>)[key] = sourceId;
          }
        }
      }

      const entry: AuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        groupId: group.id,
        platformCompanyId: group.platformCompanyId,
        primaryCompanyId,
        mergedCompanyIds: merged.map((c) => c.id),
        snapshot: group.companies,
        mergedAt: new Date().toISOString(),
        mergedBy: "demo.user@company.com",
        associationsCombined: combinedAssociations(group.companies),
        propertyOverrides: cleanedOverrides,
        mergedProperties,
      };
      setMergedGroupIds((ids) =>
        ids.includes(group.id) ? ids : [...ids, group.id]
      );
      setAudit((prev) => [entry, ...prev]);
      return entry;
    },
    []
  );

  const resetAll = useCallback(() => {
    setMergedGroupIds([]);
    setAudit([]);
  }, []);

  const resetSelection = useCallback((groupId: string) => {
    setMergedGroupIds((ids) => ids.filter((id) => id !== groupId));
    setAudit((prev) => prev.filter((e) => e.groupId !== groupId));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      loaded,
      groups,
      platformIdGroups,
      nameMatchGroups,
      pendingGroups,
      pendingPlatformIdGroups,
      pendingNameMatchGroups,
      completedGroupIds,
      audit,
      mergeGroup,
      resetAll,
      resetSelection,
    }),
    [
      loaded,
      groups,
      platformIdGroups,
      nameMatchGroups,
      pendingGroups,
      pendingPlatformIdGroups,
      pendingNameMatchGroups,
      completedGroupIds,
      audit,
      mergeGroup,
      resetAll,
      resetSelection,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
