import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { caseService } from '../services/caseService';
import {
  AuditReport,
  Case,
  CanvasSnapshot,
  CaseDeadline,
  CaseNarrativeEntry,
  CreateCaseRequest,
  DeadlinePriority,
} from '../types/api.types';
import { mockNarrativeEntries } from '../domain/mockData';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import {
  translateAudit,
  translateCanvas,
  translateCase,
  translateCases,
} from '../services/caseTranslationService';

const DEADLINES_STORAGE_KEY = '@iurifycase/deadlines_v1';
const NARRATIVES_STORAGE_KEY = '@iurifycase/narratives_v2';
const CASES_STORAGE_KEY = '@iurifycase/cases_cache_v2';

interface Remote<T> {
  data: T | null;
  loading: boolean;
  error: boolean;
}

export interface AddDeadlineInput {
  title: string;
  notes?: string;
  from: string;
  to: string;
  priority?: DeadlinePriority;
}

export type AddNarrativeInput = Omit<CaseNarrativeEntry, 'id' | 'timestamp'>;

interface CasesContextValue {
  cases: Remote<Case[]>;
  refreshCases: () => Promise<void>;
  createCase: (payload: CreateCaseRequest) => Promise<Case>;
  selectedCase: Case | null;
  selectCase: (id: string) => void;
  canvas: Remote<CanvasSnapshot>;
  reloadCanvas: () => void;
  applyCanvas: (snapshot: CanvasSnapshot) => void;
  audit: Remote<AuditReport>;
  runAudit: () => Promise<void>;
  deadlines: CaseDeadline[];
  addDeadline: (input: AddDeadlineInput) => Promise<CaseDeadline | null>;
  toggleDeadline: (deadlineId: string) => Promise<void>;
  removeDeadline: (deadlineId: string) => Promise<void>;
  narratives: CaseNarrativeEntry[];
  addNarrativeEntry: (input: AddNarrativeInput) => Promise<CaseNarrativeEntry>;
}

const CasesContext = createContext<CasesContextValue | null>(null);

/**
 * Mounted only while a session is active (see App.tsx), so all state starts
 * clean on every sign-in and is discarded on sign-out.
 *
 * Canvas/audit results are stored together with the case they belong to and
 * the loading flag is derived, which avoids resetting state inside effects.
 */
export function CasesProvider({ children }: { children: React.ReactNode }) {
  const { language, autoTranslate } = useSettings();
  const { user } = useAuth();
  const userId = user?.id;
  const [cases, setCases] = useState<Remote<Case[]>>({ data: null, loading: true, error: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasState, setCanvasState] = useState<{ caseId: string; snapshot: CanvasSnapshot | null; error: boolean } | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [auditState, setAuditState] = useState<{ caseId: string; report: AuditReport | null; loading: boolean; error: boolean } | null>(null);
  const [allDeadlines, setAllDeadlines] = useState<CaseDeadline[]>([]);
  const [allNarratives, setAllNarratives] = useState<Record<string, CaseNarrativeEntry[]>>(mockNarrativeEntries);

  // Load persisted deadlines, narratives, and cached cases on mount
  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(CASES_STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCases((prev) => (prev.data ? prev : { data: parsed, loading: false, error: false }));
            setSelectedId((prev) => prev ?? parsed[0]?.id ?? null);
          }
        } catch {
          // ignore malformed storage
        }
      })
      .catch(() => {});

    AsyncStorage.getItem(DEADLINES_STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setAllDeadlines(parsed);
          }
        } catch {
          // ignore malformed storage
        }
      })
      .catch(() => {});

    AsyncStorage.getItem(NARRATIVES_STORAGE_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setAllNarratives((prev) => ({ ...mockNarrativeEntries, ...parsed }));
          }
        } catch {
          // ignore malformed storage
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const persistDeadlines = useCallback(async (next: CaseDeadline[]) => {
    setAllDeadlines(next);
    try {
      await AsyncStorage.setItem(DEADLINES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const persistNarratives = useCallback(
    async (next: Record<string, CaseNarrativeEntry[]>) => {
      setAllNarratives(next);
      try {
        await AsyncStorage.setItem(NARRATIVES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
    },
    []
  );

  const addNarrativeEntry = useCallback(
    async (input: AddNarrativeInput): Promise<CaseNarrativeEntry> => {
      const entry: CaseNarrativeEntry = {
        ...input,
        id: `narrative-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      const caseId = input.caseId;
      setAllNarratives((prev) => {
        const currentList = prev[caseId] || [];
        const nextList = [entry, ...currentList];
        const nextMap = { ...prev, [caseId]: nextList };
        persistNarratives(nextMap);
        return nextMap;
      });
      return entry;
    },
    [persistNarratives]
  );

  const selectedNarratives = useMemo(() => {
    if (!selectedId) return [];
    return allNarratives[selectedId] || [];
  }, [allNarratives, selectedId]);

  const addDeadline = useCallback(
    async (input: AddDeadlineInput): Promise<CaseDeadline | null> => {
      if (!selectedId) return null;
      const newDeadline: CaseDeadline = {
        id: `dl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        caseId: selectedId,
        title: input.title.trim(),
        notes: input.notes?.trim() || undefined,
        from: input.from,
        to: input.to,
        priority: input.priority ?? 'MEDIUM',
        completed: false,
        createdAt: new Date().toISOString(),
      };
      const next = [newDeadline, ...allDeadlines];
      await persistDeadlines(next);
      return newDeadline;
    },
    [allDeadlines, persistDeadlines, selectedId]
  );

  const toggleDeadline = useCallback(
    async (deadlineId: string) => {
      const next = allDeadlines.map((d) =>
        d.id === deadlineId ? { ...d, completed: !d.completed } : d
      );
      await persistDeadlines(next);
    },
    [allDeadlines, persistDeadlines]
  );

  const removeDeadline = useCallback(
    async (deadlineId: string) => {
      const next = allDeadlines.filter((d) => d.id !== deadlineId);
      await persistDeadlines(next);
    },
    [allDeadlines, persistDeadlines]
  );

  const caseDeadlines = useMemo(
    () => allDeadlines.filter((d) => d.caseId === selectedId),
    [allDeadlines, selectedId]
  );

  const loadCases = useCallback(async () => {
    let attempts = 0;
    while (attempts <= 2) {
      try {
        const res = await caseService.getCases();
        // Garantizar que cuentas nuevas solo vean sus propios expedientes, respetando expedientes existentes
        const userCases =
          userId && res.items.some((c) => c.userId)
            ? res.items.filter(
                (c) =>
                  !c.userId ||
                  c.userId.toString().toLowerCase() === userId.toString().toLowerCase()
              )
            : res.items;

        setCases({ data: userCases, loading: false, error: false });
        if (userCases.length > 0) {
          AsyncStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(userCases)).catch(() => {});
        }
        setSelectedId((cur) => (cur && userCases.some((c) => c.id === cur) ? cur : userCases[0]?.id ?? null));
        return;
      } catch {
        attempts += 1;
        if (attempts <= 2) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }
    setCases((p) =>
      p.data && p.data.length > 0
        ? { ...p, loading: false, error: false }
        : { ...p, loading: false, error: true }
    );
  }, [userId]);

  const refreshCases = useCallback(async () => {
    setCases((p) => ({ ...p, loading: true, error: false }));
    await loadCases();
  }, [loadCases]);

  useEffect(() => {
    let active = true;
    (async () => {
      let attempts = 0;
      while (attempts <= 2 && active) {
        try {
          const res = await caseService.getCases();
          if (!active) return;
          const userCases =
            userId && res.items.some((c) => c.userId)
              ? res.items.filter(
                  (c) =>
                    !c.userId ||
                    c.userId.toString().toLowerCase() === userId.toString().toLowerCase()
                )
              : res.items;

          setCases({ data: userCases, loading: false, error: false });
          if (userCases.length > 0) {
            AsyncStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(userCases)).catch(() => {});
          }
          setSelectedId((cur) => (cur && userCases.some((c) => c.id === cur) ? cur : userCases[0]?.id ?? null));
          return;
        } catch {
          attempts += 1;
          if (attempts <= 2 && active) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }
      if (active) {
        setCases((p) =>
          p.data && p.data.length > 0
            ? { ...p, loading: false, error: false }
            : { ...p, loading: false, error: true }
        );
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  // Fetch the canvas of the selected case.
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    caseService
      .getCanvas(selectedId)
      .then((snapshot) => {
        if (!active) return;
        setCanvasState((prev) => {
          if (
            prev &&
            prev.caseId === selectedId &&
            prev.snapshot &&
            (prev.snapshot.version > snapshot.version ||
              (prev.snapshot.canvas?.nodes?.length ?? 0) > (snapshot.canvas?.nodes?.length ?? 0))
          ) {
            return prev;
          }
          return { caseId: selectedId, snapshot, error: false };
        });
      })
      .catch(() => {
        if (!active) return;
        // Fallback a un canvas seguro para que el usuario nunca quede atrapado en el spinner de carga
        setCanvasState((prev) =>
          prev && prev.caseId === selectedId && prev.snapshot
            ? prev
            : {
                caseId: selectedId,
                snapshot: {
                  caseId: selectedId,
                  version: 1,
                  updatedAt: new Date().toISOString(),
                  canvas: { nodes: [], edges: [] },
                },
                error: false,
              }
        );
      });
    return () => {
      active = false;
    };
  }, [selectedId, reloadTick]);

  const reloadCanvas = useCallback(() => {
    setReloadTick((n) => n + 1);
  }, []);

  const selectCase = useCallback((id: string) => {
    setSelectedId(id);
    setReloadTick((t) => t + 1);
  }, []);

  const canvasCurrent = canvasState && canvasState.caseId === selectedId ? canvasState : null;
  const canvas: Remote<CanvasSnapshot> = useMemo(
    () => ({
      data: canvasCurrent?.snapshot ?? null,
      loading: !!selectedId && !canvasCurrent,
      error: canvasCurrent?.error ?? false,
    }),
    [canvasCurrent, selectedId]
  );

  const createCase = useCallback(
    async (payload: CreateCaseRequest) => {
      const created = await caseService.createCase(payload);
      const withUser: Case = userId && !created.userId ? { ...created, userId } : created;
      const initialSnapshot: CanvasSnapshot = {
        caseId: withUser.id,
        version: 1,
        updatedAt: withUser.createdAt || new Date().toISOString(),
        canvas: { nodes: [], edges: [] },
      };
      setCases((p) => {
        const nextData = [withUser, ...(p.data ?? [])];
        AsyncStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(nextData)).catch(() => {});
        return {
          ...p,
          data: nextData,
          loading: false,
          error: false,
        };
      });
      setCanvasState({ caseId: withUser.id, snapshot: initialSnapshot, error: false });
      setSelectedId(withUser.id);
      return withUser;
    },
    [userId]
  );

  const applyCanvas = useCallback((payload: any) => {
    if (!payload) return;
    const targetCaseId =
      payload.caseId ||
      payload.snapshot?.caseId ||
      selectedId;

    if (!targetCaseId) return;

    let snapshot: CanvasSnapshot;
    if (payload.snapshot && payload.snapshot.canvas) {
      snapshot = {
        caseId: targetCaseId,
        version: payload.snapshot.version ?? payload.version ?? 2,
        updatedAt: payload.snapshot.updatedAt || new Date().toISOString(),
        canvas: {
          nodes: Array.isArray(payload.snapshot.canvas.nodes) ? payload.snapshot.canvas.nodes : [],
          edges: Array.isArray(payload.snapshot.canvas.edges) ? payload.snapshot.canvas.edges : [],
        },
      };
    } else if (payload.canvas && Array.isArray(payload.canvas.nodes)) {
      snapshot = {
        caseId: targetCaseId,
        version: payload.version ?? 2,
        updatedAt: payload.updatedAt || new Date().toISOString(),
        canvas: {
          nodes: payload.canvas.nodes,
          edges: Array.isArray(payload.canvas.edges) ? payload.canvas.edges : [],
        },
      };
    } else if (Array.isArray(payload.nodes)) {
      snapshot = {
        caseId: targetCaseId,
        version: payload.version ?? 2,
        updatedAt: payload.updatedAt || new Date().toISOString(),
        canvas: {
          nodes: payload.nodes,
          edges: Array.isArray(payload.edges) ? payload.edges : [],
        },
      };
    } else {
      snapshot = {
        ...(payload as CanvasSnapshot),
        caseId: targetCaseId,
      };
      if (!snapshot.canvas) {
        snapshot.canvas = { nodes: [], edges: [] };
      }
    }

    setCanvasState({ caseId: targetCaseId, snapshot, error: false });
    setAuditState(null);
  }, [selectedId]);

  const runAudit = useCallback(async () => {
    if (!selectedId || !canvas.data) return;
    const caseId = selectedId;
    setAuditState({ caseId, report: null, loading: true, error: false });
    try {
      const report = await caseService.auditCase(caseId, canvas.data.version);
      setAuditState({ caseId, report, loading: false, error: false });
    } catch {
      setAuditState({ caseId, report: null, loading: false, error: true });
    }
  }, [selectedId, canvas.data]);

  const auditCurrent = auditState && auditState.caseId === selectedId ? auditState : null;
  const audit: Remote<AuditReport> = useMemo(
    () => ({
      data: auditCurrent?.report ?? null,
      loading: auditCurrent?.loading ?? false,
      error: auditCurrent?.error ?? false,
    }),
    [auditCurrent]
  );

  // Dynamically translated projections for UI presentation.
  // The raw underlying data remains in pristine format ("sin tener que traducir el caso agregado").
  const displayCases = useMemo<Remote<Case[]>>(() => {
    if (!cases.data) return cases;
    if (!autoTranslate) return cases;
    return {
      ...cases,
      data: translateCases(cases.data, language),
    };
  }, [cases, language, autoTranslate]);

  const displaySelectedCase = useMemo<Case | null>(() => {
    const raw = cases.data?.find((c) => c.id === selectedId) ?? null;
    if (!raw) return null;
    if (!autoTranslate) return raw;
    return translateCase(raw, language);
  }, [cases.data, selectedId, language, autoTranslate]);

  const displayCanvas = useMemo<Remote<CanvasSnapshot>>(() => {
    if (!canvas.data) return canvas;
    if (!autoTranslate) return canvas;
    return {
      ...canvas,
      data: translateCanvas(canvas.data, language),
    };
  }, [canvas, language, autoTranslate]);

  const displayAudit = useMemo<Remote<AuditReport>>(() => {
    if (!audit.data) return audit;
    if (!autoTranslate) return audit;
    return {
      ...audit,
      data: translateAudit(audit.data, language),
    };
  }, [audit, language, autoTranslate]);

  const value: CasesContextValue = {
    cases: displayCases,
    refreshCases,
    createCase,
    selectedCase: displaySelectedCase,
    selectCase,
    canvas: displayCanvas,
    reloadCanvas,
    applyCanvas,
    audit: displayAudit,
    runAudit,
    deadlines: caseDeadlines,
    addDeadline,
    toggleDeadline,
    removeDeadline,
    narratives: selectedNarratives,
    addNarrativeEntry,
  };

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases(): CasesContextValue {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error('useCases must be used within CasesProvider');
  return ctx;
}
