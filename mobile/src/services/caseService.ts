import { apiClient } from './apiClient';
import {
  AuditReport,
  Case,
  CaseList,
  CanvasSnapshot,
  CreateCaseRequest,
  NarrativeProcessingResult,
  TextNarrativeRequest,
} from '../types/api.types';
import {
  mockAuditReports,
  mockCanvasSnapshots,
  mockCaseList,
  mockCases,
} from '../domain/mockData';

// Utilidad para generar el Idempotency-Key
function generateIdempotencyKey(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const caseService = {
  /**
   * Crea un expediente nuevo.
   */
  createCase: async (payload: CreateCaseRequest): Promise<Case> => {
    try {
      const response = await apiClient.post<Case>('/cases', payload, {
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
      });
      return response.data;
    } catch {
      // Simula creación instantánea
      const newMockCase: Case = {
        id: `case-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        clientReference: payload.clientReference || `#${Math.floor(1000 + Math.random() * 9000)}-REF`,
        status: 'ACTIVE',
        canvasVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCases.unshift(newMockCase);
      return newMockCase;
    }
  },

  /**
   * Ejecuta la auditoria IA sobre una version del canvas.
   */
  auditCase: async (caseId: string, canvasVersion: number): Promise<AuditReport> => {
    try {
      const response = await apiClient.post<AuditReport>(`/cases/${caseId}/audit`, { canvasVersion });
      return response.data;
    } catch {
      // Fallback a informe de auditoría simulado
      return mockAuditReports[caseId] || mockAuditReports['case-001'];
    }
  },

  /**
   * Obtiene la lista de expedientes.
   */
  getCases: async (): Promise<CaseList> => {
    try {
      const response = await apiClient.get<CaseList>('/cases');
      return response.data;
    } catch {
      // Fallback a datos simulados para previsualización inmediata de la interfaz
      return mockCaseList;
    }
  },

  /**
   * Obtiene el canvas (grafo) de un expediente especifico.
   */
  getCanvas: async (caseId: string): Promise<CanvasSnapshot> => {
    try {
      const response = await apiClient.get<CanvasSnapshot>(`/cases/${caseId}/canvas`);
      return response.data;
    } catch {
      // Fallback a datos simulados del canvas
      const fallback = mockCanvasSnapshots[caseId] || mockCanvasSnapshots['case-001'];
      return fallback;
    }
  },

  /**
   * Envia una narrativa (texto) para un expediente.
   */
  postNarrativeText: async (
    caseId: string,
    text: string,
    language?: string
  ): Promise<NarrativeProcessingResult> => {
    try {
      const payload: TextNarrativeRequest = {
        inputType: 'TEXT',
        text,
      };

      if (language) {
        payload.language = language;
      }

      const response = await apiClient.post<NarrativeProcessingResult>(
        `/cases/${caseId}/narrative`,
        payload,
        {
          headers: {
            'Idempotency-Key': generateIdempotencyKey(),
          },
        }
      );
      return response.data;
    } catch {
      // Fallback a generación simulada de hechos/pruebas en el canvas
      const current = mockCanvasSnapshots[caseId] || mockCanvasSnapshots['case-001'];
      const newVersion = current.version + 1;
      const newNodeId = `node-sim-${Date.now()}`;
      const updatedSnapshot: CanvasSnapshot = {
        caseId,
        version: newVersion,
        updatedAt: new Date().toISOString(),
        canvas: {
          nodes: [
            ...current.canvas.nodes,
            {
              id: newNodeId,
              type: 'FACT',
              title: text.length > 35 ? `${text.slice(0, 35)}…` : text,
              content: text,
              position: { x: 150, y: 350 },
              origin: 'USER_CREATED',
              userModified: true,
            },
          ],
          edges: current.canvas.edges,
        },
      };
      mockCanvasSnapshots[caseId] = updatedSnapshot;
      return {
        narrativeId: `narrative-${Date.now()}`,
        inputType: 'TEXT',
        transcript: text,
        generatedNodeIds: [newNodeId],
        generatedEdgeIds: [],
        canvas: updatedSnapshot,
      };
    }
  },
};
