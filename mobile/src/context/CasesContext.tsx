import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { caseService } from '../services/caseService';
import {
  AuditReport,
  Case,
  CanvasSnapshot,
  CaseDeadline,
  CreateCaseRequest,
  DeadlinePriority,
} from '../types/api.types';
import { useSettings } from './SettingsContext';
import {
  translateAudit,
  translateCanvas,
  translateCase,
  translateCases,
} from '../services/caseTranslationService';

const DEADLINES_STORAGE_KEY = '@iurifycase/deadlines_v1';

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
  const [cases, setCases] = useState<Remote<Case[]>>({ data: null, loading: true, error: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasState, setCanvasState] = useState<{ caseId: string; snapshot: CanvasSnapshot | null; error: boolean } | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [auditState, setAuditState] = useState<{ caseId: string; report: AuditReport | null; loading: boolean; error: boolean } | null>(null);
  const [allDeadlines, setAllDeadlines] = useState<CaseDeadline[]>([]);

  // Load persisted deadlines on mount
  useEffect(() => {
    let active = true;
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
    try {
      const res = await caseService.getCases();
      setCases({ data: res.items, loading: false, error: false });
      setSelectedId((cur) => (cur && res.items.some((c) => c.id === cur) ? cur : res.items[0]?.id ?? null));
    } catch {
      setCases((p) => ({ ...p, loading: false, error: true }));
    }
  }, []);

  const refreshCases = useCallback(async () => {
    setCases((p) => ({ ...p, loading: true, error: false }));
    await loadCases();
  }, [loadCases]);

  useEffect(() => {
    let active = true;
    caseService
      .getCases()
      .then((res) => {
        if (!active) return;
        setCases({ data: res.items, loading: false, error: false });
        setSelectedId(res.items[0]?.id ?? null);
      })
      .catch(() => active && setCases((p) => ({ ...p, loading: false, error: true })));
    return () => {
      active = false;
    };
  }, []);

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
              prev.snapshot.canvas.nodes.length > snapshot.canvas.nodes.length)
          ) {
            return prev;
          }
          return { caseId: selectedId, snapshot, error: false };
        });
      })
      .catch(() => {
        if (!active) return;
        setCanvasState((prev) =>
          prev && prev.caseId === selectedId && prev.snapshot
            ? prev
            : { caseId: selectedId, snapshot: null, error: true }
        );
      });
    return () => {
      active = false;
    };
  }, [selectedId, reloadTick]);

  const reloadCanvas = useCallback(() => {
    setCanvasState(null);
    setReloadTick((n) => n + 1);
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

  const createCase = useCallback(async (payload: CreateCaseRequest) => {
    const created = await caseService.createCase(payload);
    setCases((p) => ({ ...p, data: [created, ...(p.data ?? [])] }));
    setSelectedId(created.id);
    return created;
  }, []);

  const applyCanvas = useCallback((snapshot: CanvasSnapshot) => {
    setCanvasState({ caseId: snapshot.caseId, snapshot, error: false });
    setAuditState(null);
  }, []);

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
    selectCase: setSelectedId,
    canvas: displayCanvas,
    reloadCanvas,
    applyCanvas,
    audit: displayAudit,
    runAudit,
    deadlines: caseDeadlines,
    addDeadline,
    toggleDeadline,
    removeDeadline,
  };

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases(): CasesContextValue {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error('useCases must be used within CasesProvider');
  return ctx;
}
