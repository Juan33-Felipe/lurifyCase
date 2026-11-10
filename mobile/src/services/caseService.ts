import { apiClient } from './apiClient';
import {
  AuditReport,
  Case,
  CaseList,
  CanvasSnapshot,
  CreateCaseRequest,
  NarrativeProcessingResult,
  TextNarrativeRequest,
  VoiceNarrativeRequest,
} from '../types/api.types';

// Utilidad para generar el Idempotency-Key
function generateIdempotencyKey(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const caseService = {
  /**
   * Crea un expediente nuevo.
   */
  createCase: async (payload: CreateCaseRequest): Promise<Case> => {
    const response = await apiClient.post<Case>('/cases', payload, {
      headers: { 'Idempotency-Key': generateIdempotencyKey() },
    });
    return response.data;
  },

  /**
   * Ejecuta la auditoria IA sobre una version del canvas.
   */
  auditCase: async (caseId: string, canvasVersion: number): Promise<AuditReport> => {
    const response = await apiClient.post<any>(`/cases/${caseId}/audit`, { canvasVersion });
    const data = response.data;
    const generatedAt =
      data?.generatedAt || data?.auditedAt || data?.createdAt || new Date().toISOString();
    return {
      ...data,
      generatedAt,
    };
  },

  /**
   * Obtiene la lista de expedientes.
   */
  getCases: async (): Promise<CaseList> => {
    const response = await apiClient.get<CaseList>('/cases');
    return response.data;
  },

  /**
   * Obtiene el canvas (grafo) de un expediente especifico.
   */
  getCanvas: async (caseId: string): Promise<CanvasSnapshot> => {
    const response = await apiClient.get<CanvasSnapshot>(`/cases/${caseId}/canvas`);
    return response.data;
  },

  /**
   * Envia una narrativa (texto) para un expediente.
   */
  postNarrativeText: async (
    caseId: string,
    text: string,
    language?: string
  ): Promise<NarrativeProcessingResult> => {
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
        timeout: 120000,
      }
    );
    return response.data;
  },

  postNarrativeVoice: async (
    caseId: string,
    audioBase64: string,
    language?: string,
  ): Promise<NarrativeProcessingResult> => {
    const payload: VoiceNarrativeRequest = {
      inputType: 'VOICE',
      audio: audioBase64,
    };
    if (language) payload.language = language;

    const response = await apiClient.post<NarrativeProcessingResult>(
      `/cases/${caseId}/narrative`,
      payload,
      {
        headers: { 'Idempotency-Key': generateIdempotencyKey() },
        timeout: 120000,
      },
    );
    return response.data;
  },
};
