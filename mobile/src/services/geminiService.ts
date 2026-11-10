/**
 * Gemini AI Service for Iurify Case Mobile.
 * Connects directly to Google Generative Language API (Gemini 3.5 Flash)
 * for AI diagnostics, on-device fallback analysis, and legal reasoning.
 */

import { CanvasSnapshot } from '../types/api.types';

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const GEMINI_MODEL =
  process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiTestResult {
  success: boolean;
  model: string;
  message: string;
  latencyMs: number;
}

export interface GeminiAuditAlert {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
}

export interface GeminiAuditResult {
  solidityScore: number;
  summary: string;
  alerts: GeminiAuditAlert[];
}

export interface GeminiVoiceExtractionResult {
  title: string;
  transcript: string;
  elementsCount: number;
  tags: string[];
}

class GeminiService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = GEMINI_API_KEY;
    this.model = GEMINI_MODEL;
  }

  /**
   * Updates or overrides the API key at runtime.
   */
  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getModel(): string {
    return this.model;
  }

  /**
   * Tests connectivity with Google Gemini and measures roundtrip latency.
   */
  async testConnection(): Promise<GeminiTestResult> {
    const start = Date.now();
    try {
      const response = await fetch(
        `${BASE_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Responde unicamente en una sola oracion concisa: "Conexion activa con Gemini para Iurify Case."',
                  },
                ],
              },
            ],
          }),
        }
      );

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          model: this.model,
          message: `HTTP ${response.status}: ${errorText}`,
          latencyMs,
        };
      }

      const json = await response.json();
      const reply =
        json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
        'Conexión exitosa';

      return {
        success: true,
        model: this.model,
        message: reply,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        model: this.model,
        message,
        latencyMs,
      };
    }
  }

  /**
   * Executes adversarial legal audit on provided case facts and evidence.
   */
  async runAudit(caseContext: string): Promise<GeminiAuditResult> {
    const systemPrompt = `You are an Adversarial Senior Legal Auditor AI for Iurify Case.
Analyze the legal scenario and return JSON with:
{
  "solidityScore": 0-100,
  "summary": "...",
  "alerts": [
    {
      "type": "EVIDENCE_CONFLICT|PROCEDURAL_GAP|UNSUPPORTED_FACT",
      "severity": "HIGH|MEDIUM|LOW",
      "title": "...",
      "description": "...",
      "recommendation": "..."
    }
  ]
}`;

    const response = await fetch(
      `${BASE_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: caseContext }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini Audit failed: ${response.status}`);
    }

    const json = await response.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(rawText) as GeminiAuditResult;
  }

  /**
   * Transcribes recorded voice audio and extracts structured legal docket metadata.
   */
  async transcribeVoiceCase(
    audioBase64: string,
    mimeType: string = 'audio/mp4',
    language: 'es' | 'en' = 'es'
  ): Promise<GeminiVoiceExtractionResult | null> {
    try {
      const prompt =
        language === 'es'
          ? 'Escucha esta grabación de un abogado relatando un caso jurídico. Transcribe el contenido y extrae los datos iniciales del expediente en formato JSON estricto: { "title": "Título jurídico conciso del caso", "transcript": "Transcripción completa de lo relatado", "elementsCount": numero_de_hechos_o_pruebas_detectados, "tags": ["Hecho: ...", "Prueba: ..."] }'
          : 'Listen to this recording of a lawyer describing a legal matter. Transcribe the content and extract initial docket metadata in strict JSON format: { "title": "Concise legal matter title", "transcript": "Complete transcription of the dictation", "elementsCount": number_of_facts_or_evidence_detected, "tags": ["Fact: ...", "Evidence: ..."] }';

      const response = await fetch(
        `${BASE_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: audioBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return null;
      return JSON.parse(rawText) as GeminiVoiceExtractionResult;
    } catch {
      return null;
    }
  }

  /**
   * Generates a structured CanvasSnapshot (Facts, Evidence, Laws, Jurisprudence)
   * from a narrative text when on-device AI fallback is needed.
   */
  async generateCanvasFromNarrative(
    caseId: string,
    narrativeText: string,
    language: 'es' | 'en' = 'es'
  ): Promise<CanvasSnapshot> {
    try {
      const prompt =
        language === 'es'
          ? `Analiza el siguiente relato jurídico y devuelve un JSON estricto con los nodos del expediente:
{
  "nodes": [
    { "id": "node-1", "type": "FACT|EVIDENCE|LAW|JURISPRUDENCE", "title": "Título corto", "content": "Descripción detallada" }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-2", "target": "node-1", "relationshipType": "SUPPORTS|CONTRADICTS|APPLIES_TO|DERIVES_FROM|INTERPRETS" }
  ]
}
Relato: ${narrativeText}`
          : `Analyze the following legal narrative and return strict JSON with docket nodes:
{
  "nodes": [
    { "id": "node-1", "type": "FACT|EVIDENCE|LAW|JURISPRUDENCE", "title": "Short title", "content": "Detailed description" }
  ],
  "edges": [
    { "id": "edge-1", "source": "node-2", "target": "node-1", "relationshipType": "SUPPORTS|CONTRADICTS|APPLIES_TO|DERIVES_FROM|INTERPRETS" }
  ]
}
Narrative: ${narrativeText}`;

      const response = await fetch(
        `${BASE_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          const nodes = Array.isArray(parsed.nodes)
            ? parsed.nodes.map((n: any, idx: number) => ({
                id: String(n.id || `node-ai-${Date.now()}-${idx}`),
                type: ['FACT', 'EVIDENCE', 'LAW', 'JURISPRUDENCE'].includes(n.type)
                  ? n.type
                  : 'FACT',
                title: String(n.title || 'Elemento del caso'),
                content: String(n.content || narrativeText),
                position: { x: 120 + (idx % 2) * 220, y: 120 + Math.floor(idx / 2) * 160 },
                origin: 'AI_GENERATED' as const,
                userModified: false,
              }))
            : [];
          const edges = Array.isArray(parsed.edges)
            ? parsed.edges.map((e: any, idx: number) => ({
                id: String(e.id || `edge-ai-${Date.now()}-${idx}`),
                source: String(e.source || nodes[0]?.id || 'node-1'),
                target: String(e.target || nodes[1]?.id || nodes[0]?.id || 'node-1'),
                relationshipType: [
                  'SUPPORTS',
                  'CONTRADICTS',
                  'DERIVES_FROM',
                  'APPLIES_TO',
                  'INTERPRETS',
                ].includes(e.relationshipType)
                  ? e.relationshipType
                  : 'SUPPORTS',
                origin: 'AI_GENERATED' as const,
                userModified: false,
              }))
            : [];

          if (nodes.length > 0) {
            return {
              caseId,
              version: 1,
              updatedAt: new Date().toISOString(),
              canvas: { nodes, edges },
            };
          }
        }
      }
    } catch {
      // Fallback to deterministic extraction below
    }

    // Deterministic fallback extraction so the docket is always populated
    const sentences = narrativeText
      .split(/[.\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    const nodes = (sentences.length > 0 ? sentences : [narrativeText]).slice(0, 6).map((sentence, idx) => ({
      id: `node-voice-${Date.now()}-${idx}`,
      type: (idx === 0 ? 'FACT' : idx === 1 ? 'EVIDENCE' : 'LAW') as
        | 'FACT'
        | 'EVIDENCE'
        | 'LAW'
        | 'JURISPRUDENCE',
      title: sentence.length > 42 ? `${sentence.slice(0, 42)}…` : sentence,
      content: sentence,
      position: { x: 120 + (idx % 2) * 200, y: 120 + Math.floor(idx / 2) * 150 },
      origin: 'AI_GENERATED' as const,
      userModified: false,
    }));

    return {
      caseId,
      version: 1,
      updatedAt: new Date().toISOString(),
      canvas: {
        nodes,
        edges:
          nodes.length > 1
            ? [
                {
                  id: `edge-voice-${Date.now()}`,
                  source: nodes[1].id,
                  target: nodes[0].id,
                  relationshipType: 'SUPPORTS',
                  origin: 'AI_GENERATED',
                  userModified: false,
                },
              ]
            : [],
      },
    };
  }
}

export const geminiService = new GeminiService();
