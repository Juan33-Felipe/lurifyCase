/**
 * Gemini AI Service for Iurify Case Mobile.
 * Connects directly to Google Generative Language API (Gemini 3.5 Flash)
 * for AI diagnostics, on-device fallback analysis, and legal reasoning.
 */

import { CanvasSnapshot } from '../types/api.types';

const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

const GEMINI_MODEL =
  process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.8-flash';

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
    const systemPrompt = `Eres un Auditor Jurídico Procesal Adversarial Senior para Iurify Case.
Realiza una auditoría procesal exhaustiva del caso analizando hechos, medios probatorios y fundamentos de derecho.
REGLA ESTRICTA: NUNCA utilices términos técnicos de grafos como "nodo", "nodos", "node", "nodes", "grafo", "arista", "edge".
Utiliza siempre lenguaje forense procesal: "hecho alegado", "medios probatorios", "fundamentos de derecho", "teoría del caso", "vulnerabilidad procesal".

Return JSON with:
{
  "solidityScore": 0-100,
  "summary": "...",
  "alerts": [
    {
      "type": "EVIDENCE_CONFLICT|PROCEDURAL_GAP|UNSUPPORTED_FACT|MISSING_LEGAL_BASIS|CASE_THEORY_WEAKNESS",
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
    const parsed = JSON.parse(rawText) as GeminiAuditResult;

    const sanitize = (s: string) =>
      s
        .replace(/\bnodos?\s+de\s+hechos?\b/gi, 'hechos alegados')
        .replace(/\bnodos?\s+probatorios?\b/gi, 'elementos probatorios')
        .replace(/\bnodos?\s+de\s+pruebas?\b/gi, 'medios probatorios')
        .replace(/\bnodos?\s+de\s+ley\b/gi, 'fundamentos de derecho')
        .replace(/\bnodos?\s+aislados?\b/gi, 'elementos desvinculados')
        .replace(/\bnodos\b/gi, 'elementos del expediente')
        .replace(/\bnodo\b/gi, 'elemento procesal')
        .replace(/\baristas\b/gi, 'vinculaciones procesales')
        .replace(/\barista\b/gi, 'vínculo procesal')
        .replace(/\bgrafos?\b/gi, 'expediente')
        .replace(/\blienzo\b/gi, 'expediente')
        .replace(/\bnodes\b/gi, 'case elements')
        .replace(/\bnode\b/gi, 'case element');

    return {
      solidityScore: parsed.solidityScore ?? 75,
      summary: sanitize(parsed.summary || ''),
      alerts: Array.isArray(parsed.alerts)
        ? parsed.alerts.map((a) => ({
            type: a.type || 'PROCEDURAL_GAP',
            severity: a.severity || 'MEDIUM',
            title: sanitize(a.title || ''),
            description: sanitize(a.description || ''),
            recommendation: sanitize(a.recommendation || ''),
          }))
        : [],
    };
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

  /**
   * Deterministic instant legal analysis so each docket card immediately displays rich legal valuation.
   */
  getInstantNodeAnalysis(
    node: { type: string; title: string; content?: string },
    language: 'es' | 'en' = 'es'
  ) {
    const isSpanish = language === 'es';
    const type = (node.type || 'FACT').toUpperCase();

    switch (type) {
      case 'EVIDENCE':
        return {
          relevanceLabel: isSpanish ? 'Alta Pertinencia Probatoria' : 'High Evidentiary Relevance',
          probativeWeight: isSpanish ? 'Medio probatorio conducente y útil' : 'Material and probative exhibit',
          strategicInsight: isSpanish
            ? 'Acredita directamente los supuestos fácticos de la teoría del caso. Fortalece la verosimilitud de la pretensión y previene alegatos de falta de sustento probatorio por la contraparte.'
            : 'Directly corroborates factual claims of the case theory, enhancing credibility and forestalling lack-of-evidence objections.',
          recommendation: isSpanish
            ? 'Verificar autenticidad, integridad y disponibilidad del testigo o documento para resistir eventuales objeciones o tachas procesales.'
            : 'Verify authenticity, integrity, and witness availability to withstand evidentiary challenges.',
          admissibility: isSpanish
            ? 'Conducente y pertinente para la fijación probatoria'
            : 'Admissible and material for trial presentation',
        };
      case 'FACT':
        return {
          relevanceLabel: isSpanish ? 'Premisa Fáctica Determinante' : 'Material Factual Assertion',
          probativeWeight: isSpanish ? 'Objeto principal del debate probatorio' : 'Core matter of evidentiary proof',
          strategicInsight: isSpanish
            ? 'Delimita la relación de causalidad y el marco fáctico del litigio. Esencial para la subsunción jurídica en la norma aplicable.'
            : 'Establishes causal nexus and factual boundary. Critical for statutory legal subsumption.',
          recommendation: isSpanish
            ? 'Asegurar respaldo con al menos un medio probatorio directo para superar con solvencia la carga de la prueba.'
            : 'Corroborate with at least one direct exhibit or testimony to satisfy burden of proof.',
          admissibility: isSpanish
            ? 'Hecho controvertido sustancial'
            : 'Substantial contested fact',
        };
      case 'LAW':
        return {
          relevanceLabel: isSpanish ? 'Anclaje Normativo Principal' : 'Controlling Statutory Basis',
          probativeWeight: isSpanish ? 'Fundamento de derecho sustantivo / procesal' : 'Substantive / procedural authority',
          strategicInsight: isSpanish
            ? 'Otorga exigibilidad jurídica a la pretensión. Configura la tutela judicial efectiva y el debido proceso.'
            : 'Provides legal enforceability to the claim, anchoring judicial relief.',
          recommendation: isSpanish
            ? 'Verificar vigencia de la norma, concordancia con normas especiales y ausencia de derogaciones tácitas.'
            : 'Verify statute validity, interplay with specialized regulations, and absence of repeal.',
          admissibility: isSpanish
            ? 'Norma jurídica aplicable al caso'
            : 'Applicable statutory authority',
        };
      case 'JURISPRUDENCE':
      default:
        return {
          relevanceLabel: isSpanish ? 'Precedente Judicial Vinculante' : 'Binding / Persuasive Precedent',
          probativeWeight: isSpanish ? 'Criterio hermenéutico de interpretación' : 'Interpretive jurisprudential authority',
          strategicInsight: isSpanish
            ? 'Orienta el criterio del juzgador hacia la tesis de la defensa o demanda, consolidando la predictibilidad judicial.'
            : 'Guides judicial discretion toward counsel theory, fostering outcome predictability.',
          recommendation: isSpanish
            ? 'Cotejar ratio decidendi con la línea jurisprudencial uniforme de las altas cortes.'
            : 'Align ratio decidendi with prevailing supreme court doctrine.',
          admissibility: isSpanish
            ? 'Doctrina jurisprudencial aplicable'
            : 'Applicable judicial doctrine',
        };
    }
  }

  /**
   * Analyzes an individual case node (fact, evidence, law, jurisprudence)
   * in depth with Gemini to produce a rich strategic valuation.
   */
  async analyzeCaseNode(
    node: { id: string; type: string; title: string; content?: string },
    caseTitle: string = 'Expediente',
    language: 'es' | 'en' = 'es'
  ): Promise<{
    relevanceLabel: string;
    strategicInsight: string;
    probativeWeight: string;
    recommendation: string;
    admissibility: string;
  }> {
    const isSpanish = language === 'es';
    try {
      const prompt = isSpanish
        ? `Eres un Auditor Jurídico Procesal y Estratega Senior de Litigios para Iurify Case.
Analiza este elemento procesal individual dentro del caso judicial titulado "${caseTitle}":
- Tipo de elemento: ${node.type}
- Título: ${node.title}
- Información / Contenido adjunto: ${node.content || node.title}

Devuelve un JSON estrictamente estructurado:
{
  "relevanceLabel": "Alta Pertinencia | Pertinencia Conducente | Relevancia Estratégica",
  "strategicInsight": "Explicación forense de cómo influye este elemento en la convicción del juez y la teoría del caso.",
  "probativeWeight": "Valoración de su fuerza probatoria o sustento jurídico.",
  "recommendation": "Recomendación táctica para el abogado.",
  "admissibility": "Dictamen de conducencia y pertinencia procesal."
}`
        : `You are a Senior Litigation Strategist AI for Iurify Case.
Analyze this individual case element within docket "${caseTitle}":
- Type: ${node.type}
- Title: ${node.title}
- Content: ${node.content || node.title}

Return strict JSON:
{
  "relevanceLabel": "High Relevance | Direct Materiality | Strategic Relevance",
  "strategicInsight": "Explanation of how this item impacts case theory and judicial persuasion.",
  "probativeWeight": "Assessment of its probative value or statutory weight.",
  "recommendation": "Tactical recommendation for counsel to withstand objections.",
  "admissibility": "Assessment of admissibility and materiality."
}`;

      const response = await fetch(
        `${BASE_URL}/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.25,
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
          return {
            relevanceLabel: parsed.relevanceLabel || (isSpanish ? 'Alta Pertinencia' : 'High Relevance'),
            strategicInsight: parsed.strategicInsight || '',
            probativeWeight: parsed.probativeWeight || (isSpanish ? 'Conducente y pertinente' : 'Material and probative'),
            recommendation: parsed.recommendation || '',
            admissibility: parsed.admissibility || (isSpanish ? 'Admisible procesalmente' : 'Admissible'),
          };
        }
      }
    } catch {
      // Fallback handled below
    }

    return this.getInstantNodeAnalysis(node, language);
  }
}

export const geminiService = new GeminiService();
