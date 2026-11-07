import { Language } from '../i18n/translations';
import { AuditAlert, AuditReport, CanvasNode, CanvasSnapshot, Case } from '../types/api.types';

// Curated exact translations for all standard workspace mock data (bidirectional)
const EXACT_TRANSLATIONS_EN_TO_ES: Record<string, string> = {
  // Case Titles
  'State v. Sterling Industries': 'Estado c. Industrias Sterling',
  'Vance Corp v. Apex Logistics': 'Vance Corp c. Apex Logística',
  'In re Horizon BioTech Patent Litigation': 'En el asunto del litigio de patentes de Horizon BioTech',
  'Commonwealth v. Miller': 'Mancomunidad c. Miller',

  // Case Descriptions
  'Federal antitrust & corporate environmental liability proceeding regarding alleged toxic byproduct dumping in the 9th Judicial Circuit.':
    'Procedimiento federal antimonopolio y de responsabilidad ambiental corporativa por presunto vertido de subproductos tóxicos en el 9.º Circuito Judicial.',
  'Commercial contract breach and cross-border supply chain tort claims involving expedited freight deliveries.':
    'Incumplimiento de contrato comercial y demandas extracontractuales de cadena de suministro transfronteriza relativas a entregas de carga urgente.',
  'Patent infringement defense under 35 U.S.C. § 271 concerning CRISPR gene sequence extraction algorithms.':
    'Defensa por infracción de patente conforme al 35 U.S.C. § 271 relativa a algoritmos de extracción de secuencias genéticas CRISPR.',
  'Criminal defense proceeding concerning chain of custody discrepancies on digital cellular telemetry.':
    'Procedimiento de defensa penal relativo a discrepancias en la cadena de custodia de telemetría celular digital.',

  // Canvas Nodes - Titles & Contents
  'Exhibit D — Cell Tower Telemetry': 'Prueba D — Telemetría de torre celular',
  'Antenna telemetry places executive device within 400m of Pier 4 at 11:42 PM, admissible under FRE 803(6).':
    'La telemetría de la antena sitúa el dispositivo del ejecutivo a menos de 400 m del Muelle 4 a las 23:42, admisible según FRE 803(6).',
  'Pier 4 Unscheduled Vessel Docking': 'Atraque no programado de buque en el Muelle 4',
  'Security logs indicate an unregistered freighter berthed at Pier 4 during the late-night maintenance window.':
    'Los registros de seguridad indican que un carguero no registrado atracó en el Muelle 4 durante la ventana de mantenimiento nocturno.',
  'FRE 803(6) Records of Regularly Conducted Activity': 'FRE 803(6) Registros de actividad periódica',
  'Exception to the rule against hearsay for certified memorandum, report, or data compilation made in the regular course of business.':
    'Excepción a la regla contra el testimonio de oídas para memorandos, informes o compilaciones certificadas realizadas en el curso ordinario de los negocios.',
  'United States v. Carpenter (2018)': 'Estados Unidos c. Carpenter (2018)',
  'Expectation of privacy in historical cell-site location information (CSLI) requires a Fourth Amendment warrant exception analysis.':
    'La expectativa de privacidad en la información histórica de ubicación celular (CSLI) requiere un análisis de excepción de orden judicial bajo la Cuarta Enmienda.',
  'Notice of Default Served': 'Notificación formal de incumplimiento entregada',
  'Formal notice served via certified international courier on August 14, 2026.':
    'Notificación formal entregada mediante mensajería internacional certificada el 14 de agosto de 2026.',
  'B/L #9098-C Bill of Lading': 'Conocimiento de embarque B/L #9098-C',
  'Manifest records clean on-board endorsement despite transit temperature excursions.':
    'El manifiesto registra un endoso limpio a bordo a pesar de las desviaciones térmicas durante el tránsito.',

  // Audit Alerts - Titles, Descriptions & Recommendations
  'Unreconciled 48-Hour Telemetry Gap': 'Brecha de telemetría de 48 horas sin conciliar',
  'Deposition timeline of Exhibit D contains a 48-hour gap unreconciled with the defendant cellular tower records between Oct 10 and Oct 12.':
    'La cronología de la declaración sobre la Prueba D contiene una brecha de 48 horas no conciliada con los registros de la torre celular del demandado entre el 10 y el 12 de octubre.',
  'Subpoena supplemental CDR records from telecom carrier for tower node #09B or move for an in camera evidentiary review.':
    'Solicitar mediante citación judicial los registros CDR complementarios del operador para el nodo de torre #09B o presentar moción de revisión probatoria a puerta cerrada.',

  'Contradiction in Witness Statements': 'Contradicción en declaraciones de testigos',
  'Cross-statement divergence between Harbor Master deposition and Exhibit D timestamp regarding docking clearances at Pier 4.':
    'Divergencia entre declaraciones entre la comparecencia del Capitán de Puerto y la marca de tiempo de la Prueba D sobre las autorizaciones de atraque en el Muelle 4.',
  'Conduct mock cross-examination to isolate perceptual conflict before evidentiary motion deadline.':
    'Realizar un simulacro de contrainterrogatorio para aislar el conflicto de percepción antes del plazo límite de mociones probatorias.',

  'Hearsay Foundation Advisory': 'Aviso sobre fundamento de testimonio de oídas',
  'Witness custodian affidavit requires formal 14-day pre-trial declaration notice under FRE 902(11) self-authentication rules.':
    'La declaración jurada del custodio de testigos requiere una notificación formal de declaración prejudicial de 14 días bajo las reglas de autenticación automática FRE 902(11).',
  'File notice of intent to offer certified domestic records of a regularly conducted activity before pre-trial docket call.':
    'Presentar notificación de intención de ofrecer registros nacionales certificados de actividad periódica antes de la vista previa al juicio.',
};

// Inverted dictionary for ES -> EN exact matches
const EXACT_TRANSLATIONS_ES_TO_EN: Record<string, string> = Object.entries(
  EXACT_TRANSLATIONS_EN_TO_ES
).reduce(
  (acc, [en, es]) => {
    acc[es] = en;
    return acc;
  },
  {} as Record<string, string>
);

// High-frequency legal glossary rules (EN -> ES) sorted by length descending
const PHRASE_RULES_EN_TO_ES: [RegExp, string][] = [
  [/\bFederal antitrust & corporate environmental liability proceeding\b/gi, 'Procedimiento federal antimonopolio y de responsabilidad ambiental corporativa'],
  [/\bbreach of commercial contract\b/gi, 'incumplimiento de contrato comercial'],
  [/\bbreach of contract\b/gi, 'incumplimiento de contrato'],
  [/\bbreach of fiduciary duty\b/gi, 'incumplimiento del deber fiduciario'],
  [/\bpatent infringement defense\b/gi, 'defensa por infracción de patente'],
  [/\bpatent infringement\b/gi, 'infracción de patente'],
  [/\btrademark infringement\b/gi, 'infracción de marca registrada'],
  [/\bcopyright infringement\b/gi, 'infracción de derechos de autor'],
  [/\btrade secret misappropriation\b/gi, 'apropiación indebida de secretos comerciales'],
  [/\btrade secret\b/gi, 'secreto comercial'],
  [/\bcriminal defense proceeding\b/gi, 'procedimiento de defensa penal'],
  [/\bcriminal defense\b/gi, 'defensa penal'],
  [/\bchain of custody discrepancies\b/gi, 'discrepancias en la cadena de custodia'],
  [/\bchain of custody\b/gi, 'cadena de custodia'],
  [/\benvironmental liability\b/gi, 'responsabilidad ambiental'],
  [/\bcorporate liability\b/gi, 'responsabilidad corporativa'],
  [/\bproduct liability\b/gi, 'responsabilidad por producto defectuoso'],
  [/\bcivil liability\b/gi, 'responsabilidad civil'],
  [/\bwrongful termination\b/gi, 'despido improcedente'],
  [/\bwrongful death\b/gi, 'homicidio por negligencia'],
  [/\bmedical malpractice\b/gi, 'negligencia médica'],
  [/\bpersonal injury\b/gi, 'lesiones personales'],
  [/\bpreliminary injunction\b/gi, 'medida cautelar preliminar'],
  [/\bmotion for summary judgment\b/gi, 'moción de juicio sumario'],
  [/\bmotion to dismiss\b/gi, 'moción de sobreseimiento'],
  [/\bsummary judgment\b/gi, 'juicio sumario'],
  [/\bsettlement agreement\b/gi, 'acuerdo transaccional'],
  [/\bnon-disclosure agreement\b/gi, 'acuerdo de confidencialidad'],
  [/\bcease and desist\b/gi, 'cese y desistimiento'],
  [/\battorney-client privilege\b/gi, 'secreto profesional abogado-cliente'],
  [/\bdue process\b/gi, 'debido proceso'],
  [/\bburden of proof\b/gi, 'carga de la prueba'],
  [/\breasonable doubt\b/gi, 'duda razonable'],
  [/\bprobable cause\b/gi, 'causa probable'],
  [/\bstatute of limitations\b/gi, 'prescripción de la acción'],
  [/\bexpert witness testimony\b/gi, 'testimonio pericial'],
  [/\bexpert witness\b/gi, 'perito judicial'],
  [/\beyewitness testimony\b/gi, 'testimonio presencial'],
  [/\bwitness statement\b/gi, 'declaración de testigo'],
  [/\bcross-examination\b/gi, 'contrainterrogatorio'],
  [/\bdirect examination\b/gi, 'interrogatorio directo'],
  [/\bjury trial\b/gi, 'juicio con jurado'],
  [/\bbench trial\b/gi, 'juicio sin jurado'],
  [/\bclass action\b/gi, 'demanda colectiva'],
  [/\bwritten notice\b/gi, 'notificación por escrito'],
  [/\bnotice of default\b/gi, 'notificación de incumplimiento'],
  [/\bdeposition timeline\b/gi, 'cronología de la declaración'],
  [/\btelemetry records\b/gi, 'registros de telemetría'],
  [/\bcellular tower\b/gi, 'torre celular'],
  [/\bcell tower\b/gi, 'torre celular'],
  [/\bevidentiary review\b/gi, 'revisión probatoria'],
  [/\bprocedural audit\b/gi, 'auditoría procesal'],
  [/\bprocedural gap\b/gi, 'vacío procesal'],
  [/\blogical contradiction\b/gi, 'contradicción lógica'],
  [/\bcase theory weakness\b/gi, 'debilidad en la teoría del caso'],
  [/\bcase theory\b/gi, 'teoría del caso'],
  [/\bactive litigation file\b/gi, 'expediente de litigio activo'],
  [/\bcommercial dispute\b/gi, 'disputa comercial'],
  [/\bcontract dispute\b/gi, 'disputa contractual'],
  [/\blawsuit filed by\b/gi, 'demanda presentada por'],
  [/\blawsuit filed against\b/gi, 'demanda presentada contra'],
  [/\bexpert report\b/gi, 'informe pericial'],
  [/\bpolice report\b/gi, 'informe policial'],
  [/\bfinancial records\b/gi, 'registros financieros'],
  [/\bbank statements\b/gi, 'estados de cuenta bancarios'],
  [/\bwitness testimony\b/gi, 'testimonio de testigos'],
  [/\bcourt hearing\b/gi, 'audiencia judicial'],
  [/\bpre-trial motion\b/gi, 'moción prejudicial'],
  // Common connective verbs & prepositions in legal summaries
  [/\bregarding alleged\b/gi, 'relativo a presunto'],
  [/\bconcerning alleged\b/gi, 'concerniente a presunto'],
  [/\bregarding the\b/gi, 'relativo a'],
  [/\bconcerning the\b/gi, 'concerniente a'],
  [/\bregarding\b/gi, 'relativo a'],
  [/\bconcerning\b/gi, 'concerniente a'],
  [/\binvolving\b/gi, 'relativo a'],
  [/\balleged\b/gi, 'presunto'],
  [/\bunder\b/gi, 'conforme a'],
  [/\bagainst\b/gi, 'contra'],
  [/\bbetween\b/gi, 'entre'],
  [/\bwith\b/gi, 'con'],
  [/\bwithout\b/gi, 'sin'],
  [/\bdue to\b/gi, 'debido a'],
  [/\bon behalf of\b/gi, 'en nombre de'],
  [/\bon\b/gi, 'sobre'],
  // Common legal terminology single words
  [/\bevidentiary\b/gi, 'probatorio'],
  [/\bevidences?\b/gi, 'pruebas'],
  [/\bhearings?\b/gi, 'audiencia'],
  [/\btrials?\b/gi, 'juicio'],
  [/\bdockets?\b/gi, 'expediente'],
  [/\bdisputes?\b/gi, 'disputa'],
  [/\bclaims?\b/gi, 'demanda'],
  [/\bplaintiffs?\b/gi, 'demandante'],
  [/\bdefendants?\b/gi, 'demandado'],
  [/\blawsuits?\b/gi, 'demanda'],
  [/\bstatutes?\b/gi, 'norma legal'],
  [/\bprecedents?\b/gi, 'precedente'],
  // Legal procedural titles
  [/\bState v\.\s+/gi, 'Estado c. '],
  [/\bCommonwealth v\.\s+/gi, 'Mancomunidad c. '],
  [/\bPeople v\.\s+/gi, 'Pueblo c. '],
  [/\bIn re\s+/gi, 'En el asunto de '],
  [/\bMatter of\s+/gi, 'Asunto de '],
  [/\s+v\.\s+/gi, ' c. '],
  [/\s+vs\.\s+/gi, ' c. '],
  // Common corporate & legal entity words
  [/\bIndustries\b/g, 'Industrias'],
  [/\bLogistics\b/g, 'Logística'],
  [/\bHoldings\b/g, 'Participaciones'],
  [/\bEnterprises\b/g, 'Empresas'],
  [/\bTechnologies\b/g, 'Tecnologías'],
  [/\bPharmaceuticals\b/g, 'Farmacéutica'],
  [/\bCorporation\b/g, 'Corporación'],
];

// High-frequency reverse rules (ES -> EN)
const PHRASE_RULES_ES_TO_EN: [RegExp, string][] = [
  [/\bProcedimiento federal antimonopolio y de responsabilidad ambiental corporativa\b/gi, 'Federal antitrust & corporate environmental liability proceeding'],
  [/\bincumplimiento de contrato comercial\b/gi, 'commercial contract breach'],
  [/\bincumplimiento de contrato\b/gi, 'breach of contract'],
  [/\bdefensa por infracción de patente\b/gi, 'patent infringement defense'],
  [/\binfracción de patente\b/gi, 'patent infringement'],
  [/\bprocedimiento de defensa penal\b/gi, 'criminal defense proceeding'],
  [/\bdefensa penal\b/gi, 'criminal defense'],
  [/\bcadena de custodia\b/gi, 'chain of custody'],
  [/\bresponsabilidad ambiental\b/gi, 'environmental liability'],
  [/\bresponsabilidad corporativa\b/gi, 'corporate liability'],
  [/\bEstado c\.\s+/gi, 'State v. '],
  [/\bMancomunidad c\.\s+/gi, 'Commonwealth v. '],
  [/\bPueblo c\.\s+/gi, 'People v. '],
  [/\bEn el asunto de\s+/gi, 'In re '],
  [/\s+c\.\s+/gi, ' v. '],
  [/\bIndustrias\b/g, 'Industries'],
  [/\bLogística\b/g, 'Logistics'],
];

/**
 * Checks if a string has strong Spanish linguistic markers (characters or common words).
 */
function isProbablySpanish(text: string): boolean {
  if (/[áéíóúÁÉÍÓÚñÑ¿¡]/.test(text)) return true;
  const spanishMarkers = /\b(el|la|los|las|de|del|en|un|una|por|para|con|sobre|contra|caso|expediente|hecho|prueba|ley|artículo)\b/i;
  return spanishMarkers.test(text);
}

/**
 * Translates arbitrary text into the target language.
 * Uses exact curated legal dictionary first, then falls back to intelligent phrase replacement.
 */
export function translateText(text?: string | null, targetLang: Language = 'es'): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  if (targetLang === 'es') {
    // 1. Exact match from curated legal dictionary
    if (EXACT_TRANSLATIONS_EN_TO_ES[trimmed]) {
      return EXACT_TRANSLATIONS_EN_TO_ES[trimmed];
    }

    // 2. Already Spanish? Preserve pristine text.
    if (isProbablySpanish(trimmed)) {
      return trimmed;
    }

    // 3. Dynamic rule-based legal translation
    let translated = trimmed;
    for (const [pattern, replacement] of PHRASE_RULES_EN_TO_ES) {
      translated = translated.replace(pattern, replacement);
    }
    return translated;
  } else {
    // Target is 'en'
    // 1. Exact match
    if (EXACT_TRANSLATIONS_ES_TO_EN[trimmed]) {
      return EXACT_TRANSLATIONS_ES_TO_EN[trimmed];
    }

    // 2. If not Spanish, preserve text
    if (!isProbablySpanish(trimmed)) {
      return trimmed;
    }

    // 3. Dynamic reverse translation
    let translated = trimmed;
    for (const [pattern, replacement] of PHRASE_RULES_ES_TO_EN) {
      translated = translated.replace(pattern, replacement);
    }
    return translated;
  }
}

/**
 * Returns a translated Case object for UI presentation while preserving the original raw data.
 */
export function translateCase(c: Case, targetLang: Language): Case {
  const originalTitle = c.originalTitle ?? c.title;
  const originalDescription = c.originalDescription ?? c.description;

  const translatedTitle = translateText(originalTitle, targetLang);
  const translatedDescription = originalDescription
    ? translateText(originalDescription, targetLang)
    : undefined;

  const isTranslated =
    translatedTitle !== originalTitle ||
    (translatedDescription !== undefined && translatedDescription !== originalDescription);

  return {
    ...c,
    title: translatedTitle,
    description: translatedDescription,
    originalTitle,
    originalDescription,
    isTranslated,
  };
}

/**
 * Translates a list of cases.
 */
export function translateCases(cases: Case[], targetLang: Language): Case[] {
  return cases.map((c) => translateCase(c, targetLang));
}

/**
 * Returns a translated CanvasSnapshot for UI presentation.
 */
export function translateCanvas(snapshot: CanvasSnapshot, targetLang: Language): CanvasSnapshot {
  if (!snapshot || !snapshot.canvas) return snapshot;

  const translatedNodes: CanvasNode[] = snapshot.canvas.nodes.map((node) => ({
    ...node,
    title: translateText(node.title, targetLang),
    content: translateText(node.content, targetLang),
  }));

  return {
    ...snapshot,
    canvas: {
      ...snapshot.canvas,
      nodes: translatedNodes,
    },
  };
}

/**
 * Returns a translated AuditReport for UI presentation.
 */
export function translateAudit(report: AuditReport, targetLang: Language): AuditReport {
  if (!report || !report.alerts) return report;

  const translatedAlerts: AuditAlert[] = report.alerts.map((alert) => ({
    ...alert,
    title: translateText(alert.title, targetLang),
    description: translateText(alert.description, targetLang),
    recommendation: alert.recommendation
      ? translateText(alert.recommendation, targetLang)
      : undefined,
  }));

  return {
    ...report,
    alerts: translatedAlerts,
  };
}
