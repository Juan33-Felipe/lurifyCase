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

  // AI Audit Engine Findings & Canonical Alerts
  'Missing Statutory or Jurisprudential Anchor': 'Falta de fundamento legal o jurisprudencial',
  'The docket contains facts and evidence but lacks statutory provisions or case precedent anchoring the legal theory.':
    'El expediente contiene hechos y pruebas pero carece de disposiciones legales o jurisprudencia que sustenten jurídicamente la pretensión.',
  'The canvas contains factual/evidentiary elements but no LAW or JURISPRUDENCE nodes anchoring the legal theory.':
    'El expediente contiene elementos fácticos y probatorios pero carece de disposiciones legales o jurisprudencia que sustenten la teoría del caso.',
  'Incorporate applicable statutory provisions or binding judicial precedents supporting the claim.':
    'Incorporar las disposiciones normativas aplicables o precedentes vinculantes pertinentes a la pretensión.',
  'Add applicable statutory provisions (LAW) or binding case precedent (JURISPRUDENCE) connected via APPLIES_TO or CITES edges.':
    'Agregar disposiciones normativas aplicables o precedentes vinculantes pertinentes para fundamentar la pretensión.',

  'Direct Evidentiary Contradiction Detected': 'Contradicción probatoria directa detectada',
  'A direct contradiction exists between elements of the docket, creating an adversarial vulnerability during cross-examination.':
    'Existe una contradicción directa entre elementos probatorios del expediente, lo que genera una alta vulnerabilidad ante el contrainterrogatorio o la contestación de la contraparte.',
  'A CONTRADICTS relationship exists between nodes on the canvas, creating an adversarial vulnerability during cross-examination.':
    'Existe una contradicción directa entre elementos probatorios del expediente, lo que genera una alta vulnerabilidad ante el contrainterrogatorio o la contestación de la contraparte.',
  'Prepare impeachment rebuttal or corroborate the contested fact with independent documentary evidence.':
    'Preparar refutación de tacha o impugnación, o corroborar el hecho controvertido con prueba documental independiente.',
  'Prepare impeachment rebuttal or corroborate the contested node with independent documentary evidence.':
    'Preparar refutación de tacha o impugnación, o corroborar el hecho controvertido con prueba documental independiente.',

  'Docket Lacks Registered Facts and Evidence': 'Expediente sin hechos ni elementos probatorios registrados',
  'Empty Case Strategy Canvas': 'Expediente sin hechos ni elementos probatorios registrados',
  'The docket currently contains no narrated facts, evidentiary elements, or statutory anchors supporting a theory of the case.':
    'El expediente actualmente no contiene hechos narrados, elementos probatorios ni fundamentación jurídica que sustenten una teoría del caso.',
  'The legal canvas currently contains no factual, evidentiary, or statutory nodes.':
    'El expediente actualmente no contiene hechos narrados, elementos probatorios ni fundamentación jurídica que sustenten una teoría del caso.',
  'Ingest the factual case narrative and attach initial evidentiary records before proceeding to trial preparation.':
    'Ingresar el relato fáctico del caso y registrar los medios probatorios iniciales antes de proceder a la preparación del juicio.',
  'Ingest a case narrative or add initial FACT and EVIDENCE nodes before proceeding to trial preparation.':
    'Ingresar el relato fáctico del caso y registrar los medios probatorios iniciales antes de proceder a la preparación del juicio.',

  'Strategically Grounded Case Architecture': 'Arquitectura del caso estratégicamente sustentada',
  'All factual claims are corroborated by evidentiary nodes and anchored to governing legal authority.':
    'Todas las afirmaciones fácticas están corroboradas por medios probatorios y ancladas a la normativa legal aplicable.',
  'Proceed to generate trial briefs or evidentiary disclosure documents with high strategic confidence.':
    'Proceder a generar escritos procesales o documentos de revelación probatoria con alta confianza estratégica.',

  'Legal Vulnerability': 'Vulnerabilidad jurídica procesal',
  'Detected potential issue in case graph.': 'Se detectó una potencial vulnerabilidad procesal en el expediente.',
  'Review supporting evidence and statutory basis.': 'Revisar el sustento probatorio y el fundamento de derecho.',
  'Critical structural gap: the canvas has no nodes to support a legal theory.':
    'Vacío procesal crítico: el expediente no cuenta con elementos fácticos ni probatorios para sustentar la teoría del caso.',
  'Critical procedural gap: the docket has no factual or evidentiary elements to support a theory of the case.':
    'Vacío procesal crítico: el expediente no cuenta con elementos fácticos ni probatorios para sustentar la teoría del caso.',

  // Canvas Nodes & Inferred Premises
  'Derived Factual Premise': 'Premisa fáctica derivada',
  'Corroborating Record / Testimony': 'Registro probatorio / Testimonio',
  'Inferred companion element from narrative': 'Elemento complementario inferido de la narrativa',
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
  // AI Audit Engine Findings & Vulnerabilities
  [/\bUncorroborated Factual Assertions\s*(\(\d+\))?/gi, 'Aseveraciones fácticas sin sustento probatorio $1'],
  [/\bUncorroborated Factual Assertion\b/gi, 'Aseveración fáctica sin sustento probatorio'],
  [/\bOne or more factual assertions lack supporting evidence, leaving key factual claims open to challenge\.?/gi,
    'Uno o más hechos alegados carecen de medios probatorios que los respalden, lo que deja expuestas a impugnación afirmaciones fácticas determinantes.'],
  [/\bOne or more FACT nodes lack an incoming SUPPORTS link from an? (?:EVIDENCE|pruebas) node, leaving key factual assertions open to challenge\.?/gi,
    'Uno o más hechos alegados carecen de medios probatorios que los respalden, lo que deja expuestas a impugnación afirmaciones fácticas determinantes.'],
  [/\bAttach documentary, testimonial, or expert evidence to each uncorroborated factual claim\.?/gi,
    'Vincular medios de prueba documentales, testimoniales o periciales a cada hecho alegado no corroborado.'],
  [/\bLink documentary, testimonial, or expert (?:EVIDENCE|pruebas) nodes to each uncorroborated FACT node\.?/gi,
    'Vincular medios de prueba documentales, testimoniales o periciales a cada hecho alegado no corroborado.'],
  [/\bMissing Statutory or Jurisprudential Anchor\b/gi, 'Falta de fundamento legal o jurisprudencial'],
  [/\bMissing Statutory or Jurisprudentia\.\.\./gi, 'Falta de fundamento legal o jurisprudencial...'],
  [/\bThe docket contains facts and evidence but lacks statutory provisions or case precedent anchoring the legal theory\.?/gi,
    'El expediente contiene hechos y pruebas pero carece de disposiciones legales o jurisprudencia que sustenten jurídicamente la pretensión.'],
  [/\bThe canvas contains (?:factual\/evidentiary|factual\/probatorio) elements but no LAW or JURISPRUDENCE nodes anchoring the legal theory\.?/gi,
    'El expediente contiene elementos fácticos y probatorios pero carece de disposiciones legales o jurisprudencia que sustenten la teoría del caso.'],
  [/\bIncorporate applicable statutory provisions or binding judicial precedents supporting the claim\.?/gi,
    'Incorporar las disposiciones normativas aplicables o precedentes vinculantes pertinentes a la pretensión.'],
  [/\bAdd applicable statutory provisions \(LAW\) or binding case precedent \(JURISPRUDENCE\) connected via APPLIES_TO or CITES edges\.?/gi,
    'Agregar disposiciones normativas aplicables o precedentes vinculantes pertinentes para fundamentar la pretensión.'],
  [/\bElements Disconnected from Case Theory\s*(\(\d+\))?/gi, 'Alegaciones o pruebas desvinculadas de la teoría del caso $1'],
  [/\bIsolated Canvas Elements\s*(\(\d+\))?/gi, 'Alegaciones o pruebas desvinculadas de la teoría del caso $1'],
  [/\bCertain allegations or records are disconnected from the primary factual and evidentiary sequence\.?/gi,
    'Ciertas alegaciones o elementos se encuentran desvinculados de la secuencia fáctica y de la pretensión jurídica principal.'],
  [/\bCertain nodes are disconnected from the primary causal and evidentiary chain\.?/gi,
    'Ciertas alegaciones o elementos se encuentran desvinculados de la secuencia fáctica y de la pretensión jurídica principal.'],
  [/\bConnect facts and evidence to the case theory or discard irrelevant assertions\.?/gi,
    'Vincular los hechos y pruebas a la teoría del caso o descartar elementos impertinentes.'],
  [/\bConnect isolated nodes using SUPPORTS, APPLIES_TO, or TEMPORAL_PRECEDES edges, or remove redundant nodes\.?/gi,
    'Vincular los hechos y pruebas a la teoría del caso o descartar elementos impertinentes.'],
  [/\bDirect Evidentiary Contradiction Detected\b/gi, 'Contradicción probatoria directa detectada'],
  [/\bA direct contradiction exists between elements of the docket, creating an adversarial vulnerability during cross-examination\.?/gi,
    'Existe una contradicción directa entre elementos probatorios del expediente, lo que genera una alta vulnerabilidad ante el contrainterrogatorio o la contestación de la contraparte.'],
  [/\bA CONTRADICTS relationship exists between nodes on the canvas, creating an adversarial vulnerability during cross-examination\.?/gi,
    'Existe una contradicción directa entre elementos probatorios del expediente, lo que genera una alta vulnerabilidad ante el contrainterrogatorio o la contestación de la contraparte.'],
  [/\bPrepare impeachment rebuttal or corroborate the contested fact with independent documentary evidence\.?/gi,
    'Preparar refutación de tacha o impugnación, o corroborar el hecho controvertido con prueba documental independiente.'],
  [/\bPrepare impeachment rebuttal or corroborate the contested node with independent documentary evidence\.?/gi,
    'Preparar refutación de tacha o impugnación, o corroborar el hecho controvertido con prueba documental independiente.'],
  [/\bDocket Lacks Registered Facts and Evidence\b/gi, 'Expediente sin hechos ni elementos probatorios registrados'],
  [/\bEmpty Case Strategy Canvas\b/gi, 'Expediente sin hechos ni elementos probatorios registrados'],
  [/\bThe docket currently contains no narrated facts, evidentiary elements, or statutory anchors supporting a theory of the case\.?/gi,
    'El expediente actualmente no contiene hechos narrados, elementos probatorios ni fundamentación jurídica que sustenten una teoría del caso.'],
  [/\bThe legal canvas currently contains no (?:factual, evidentiary, or statutory|fácticos, probatorios ni normativos) nodes\.?/gi,
    'El expediente actualmente no contiene hechos narrados, elementos probatorios ni fundamentación jurídica que sustenten una teoría del caso.'],
  [/\bIngest the factual case narrative and attach initial evidentiary records before proceeding to trial preparation\.?/gi,
    'Ingresar el relato fáctico del caso y registrar los medios probatorios iniciales antes de proceder a la preparación del juicio.'],
  [/\bIngest a case narrative or add initial FACT and EVIDENCE nodes before proceeding to trial preparation\.?/gi,
    'Ingresar el relato fáctico del caso y registrar los medios probatorios iniciales antes de proceder a la preparación del juicio.'],
  [/\bStrategically Grounded Case Architecture\b/gi, 'Arquitectura del caso estratégicamente sustentada'],
  [/\bAll factual claims are corroborated by evidentiary nodes and anchored to governing legal authority\.?/gi,
    'Todas las afirmaciones fácticas están corroboradas por medios probatorios y ancladas a la normativa legal aplicable.'],
  [/\bProceed to generate trial briefs or evidentiary disclosure documents with high strategic confidence\.?/gi,
    'Proceder a generar escritos procesales o documentos de revelación probatoria con alta confianza estratégica.'],
  [/\bInferred companion element from narrative:\s*/gi, 'Elemento complementario inferido de la narrativa: '],
  [/\bInferred companion element from narrative\b/gi, 'Elemento complementario inferido de la narrativa'],
  [/\bDerived Factual Premise\b/gi, 'Premisa fáctica derivada'],
  [/\bCorroborating Record \/ Testimony\b/gi, 'Registro probatorio / Testimonio'],
  [/\bLegal Vulnerability\b/gi, 'Vulnerabilidad jurídica'],
  [/\bDetected potential issue in case graph\.?/gi, 'Se detectó un problema potencial en el grafo del caso.'],
  [/\bReview supporting evidence and statutory basis\.?/gi, 'Revisar el sustento probatorio y el fundamento legal.'],
  [/\bPrecedes chronologically\b/gi, 'Precede cronológicamente'],
  [/\bContradicts factual claim\b/gi, 'Contradice afirmación fáctica'],
  [/\bCorroborates factual assertion\b/gi, 'Corrobora aseveración fáctica'],
  [/\bGoverns legal qualification\b/gi, 'Rige tipificación jurídica'],
  [/\bInterpretive judicial precedent\b/gi, 'Precedente judicial interpretativo'],
  [/\bSupports narrated fact\b/gi, 'Sustenta el hecho narrado'],
  [/\bApplies to factual premise\b/gi, 'Aplica a la premisa fáctica'],

  // High-frequency legal glossary rules (EN -> ES) sorted by length descending
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
  [/\bAseveraciones fácticas sin sustento probatorio\s*(\(\d+\))?/gi, 'Uncorroborated Factual Assertions $1'],
  [/\bAseveración fáctica sin sustento probatorio\b/gi, 'Uncorroborated Factual Assertion'],
  [/\bAseveraciones fácticas sin corroborar\s*(\(\d+\))?/gi, 'Uncorroborated Factual Assertions $1'],
  [/\bAseveración fáctica sin corroborar\b/gi, 'Uncorroborated Factual Assertion'],
  [/\bUno o más hechos alegados carecen de medios probatorios que los respalden, lo que deja expuestas a impugnación afirmaciones fácticas determinantes\.?/gi,
    'One or more factual assertions lack supporting evidence, leaving key factual claims open to challenge.'],
  [/\bUno o más nodos de HECHO carecen de un enlace de SOPORTE entrante desde un nodo de PRUEBA, lo que deja abiertas a impugnación aseveraciones fácticas clave\.?/gi,
    'One or more factual assertions lack supporting evidence, leaving key factual claims open to challenge.'],
  [/\bVincular medios de prueba documentales, testimoniales o periciales a cada hecho alegado no corroborado\.?/gi,
    'Attach documentary, testimonial, or expert evidence to each uncorroborated factual claim.'],
  [/\bVincular nodos de PRUEBA documentales, testimoniales o periciales a cada nodo de HECHO no corroborado\.?/gi,
    'Attach documentary, testimonial, or expert evidence to each uncorroborated factual claim.'],
  [/\bFalta de fundamento legal o jurisprudencial\b/gi, 'Missing Statutory or Jurisprudential Anchor'],
  [/\bEl expediente contiene hechos y pruebas pero carece de disposiciones legales o jurisprudencia que sustenten jurídicamente la pretensión\.?/gi,
    'The docket contains facts and evidence but lacks statutory provisions or case precedent anchoring the legal theory.'],
  [/\bEl lienzo contiene elementos fácticos\/probatorios pero ningún nodo de LEY o JURISPRUDENCIA que sustente la teoría del caso\.?/gi,
    'The docket contains facts and evidence but lacks statutory provisions or case precedent anchoring the legal theory.'],
  [/\bIncorporar las disposiciones normativas aplicables o precedentes vinculantes pertinentes a la pretensión\.?/gi,
    'Incorporate applicable statutory provisions or binding judicial precedents supporting the claim.'],
  [/\bAgregar disposiciones normativas aplicables \(LEY\) o precedentes vinculantes \(JURISPRUDENCIA\) conectados mediante relaciones APLICA_A o CITA\.?/gi,
    'Incorporate applicable statutory provisions or binding judicial precedents supporting the claim.'],
  [/\bAlegaciones o pruebas desvinculadas de la teoría del caso\s*(\(\d+\))?/gi, 'Elements Disconnected from Case Theory $1'],
  [/\bElementos aislados en el lienzo\s*(\(\d+\))?/gi, 'Elements Disconnected from Case Theory $1'],
  [/\bCiertas alegaciones o elementos se encuentran desvinculados de la secuencia fáctica y de la pretensión jurídica principal\.?/gi,
    'Certain allegations or records are disconnected from the primary factual and evidentiary sequence.'],
  [/\bCiertos nodos se encuentran desconectados de la cadena causal y probatoria principal\.?/gi,
    'Certain allegations or records are disconnected from the primary factual and evidentiary sequence.'],
  [/\bVincular los hechos y pruebas a la teoría del caso o descartar elementos impertinentes\.?/gi,
    'Connect facts and evidence to the case theory or discard irrelevant assertions.'],
  [/\bConectar los nodos aislados usando relaciones de SOPORTE, APLICA_A o SECUENCIA_TEMPORAL, o eliminar nodos redundantes\.?/gi,
    'Connect facts and evidence to the case theory or discard irrelevant assertions.'],
  [/\bContradicción probatoria directa detectada\b/gi, 'Direct Evidentiary Contradiction Detected'],
  [/\bExiste una contradicción directa entre elementos probatorios del expediente, lo que genera una alta vulnerabilidad ante el contrainterrogatorio o la contestación de la contraparte\.?/gi,
    'A direct contradiction exists between elements of the docket, creating an adversarial vulnerability during cross-examination.'],
  [/\bExiste una relación de CONTRADICCIÓN entre nodos del lienzo, lo que genera una vulnerabilidad frente al contrainterrogatorio\.?/gi,
    'A direct contradiction exists between elements of the docket, creating an adversarial vulnerability during cross-examination.'],
  [/\bPreparar refutación de tacha o impugnación, o corroborar el hecho controvertido con prueba documental independiente\.?/gi,
    'Prepare impeachment rebuttal or corroborate the contested fact with independent documentary evidence.'],
  [/\bPreparar refutación de impugnación o corroborar el nodo controvertido con prueba documental independiente\.?/gi,
    'Prepare impeachment rebuttal or corroborate the contested fact with independent documentary evidence.'],
  [/\bExpediente sin hechos ni elementos probatorios registrados\b/gi, 'Docket Lacks Registered Facts and Evidence'],
  [/\bLienzo de estrategia del caso vacío\b/gi, 'Docket Lacks Registered Facts and Evidence'],
  [/\bEl expediente actualmente no contiene hechos narrados, elementos probatorios ni fundamentación jurídica que sustenten una teoría del caso\.?/gi,
    'The docket currently contains no narrated facts, evidentiary elements, or statutory anchors supporting a theory of the case.'],
  [/\bEl lienzo jurídico actualmente no contiene nodos fácticos, probatorios ni normativos\.?/gi,
    'The docket currently contains no narrated facts, evidentiary elements, or statutory anchors supporting a theory of the case.'],
  [/\bIngresar el relato fáctico del caso y registrar los medios probatorios iniciales antes de proceder a la preparación del juicio\.?/gi,
    'Ingest the factual case narrative and attach initial evidentiary records before proceeding to trial preparation.'],
  [/\bIngresar una narrativa del caso o agregar nodos iniciales de HECHO y PRUEBA antes de proceder a la preparación del juicio\.?/gi,
    'Ingest the factual case narrative and attach initial evidentiary records before proceeding to trial preparation.'],
  [/\bArquitectura del caso estratégicamente sustentada\b/gi, 'Strategically Grounded Case Architecture'],
  [/\bTodas las afirmaciones fácticas están corroboradas por medios probatorios y ancladas a la normativa legal aplicable\.?/gi,
    'All factual claims are corroborated by evidentiary elements and anchored to governing legal authority.'],
  [/\bTodas las afirmaciones fácticas están corroboradas por nodos probatorios y ancladas a la normativa legal aplicable\.?/gi,
    'All factual claims are corroborated by evidentiary elements and anchored to governing legal authority.'],
  [/\bProceder a generar escritos procesales o documentos de revelación probatoria con alta confianza estratégica\.?/gi,
    'Proceed to generate trial briefs or evidentiary disclosure documents with high strategic confidence.'],
  [/\bElemento complementario inferido de la narrativa:\s*/gi, 'Inferred companion element from narrative: '],
  [/\bElemento complementario inferido de la narrativa\b/gi, 'Inferred companion element from narrative'],
  [/\bPremisa fáctica derivada\b/gi, 'Derived Factual Premise'],
  [/\bRegistro probatorio \/ Testimonio\b/gi, 'Corroborating Record / Testimony'],
  [/\bVulnerabilidad jurídica\b/gi, 'Legal Vulnerability'],
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
  const englishMarkers = /\b(the|is|are|and|or|from|with|lack|nodes|canvas|elements|missing|unsupported|between|exists|leaving|contain|contains|assertions|factual)\b/i;
  if (englishMarkers.test(text)) return false;
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

  const rawNodes = Array.isArray(snapshot.canvas.nodes) ? snapshot.canvas.nodes : [];
  const translatedNodes: CanvasNode[] = rawNodes.map((node) => ({
    ...node,
    content: node.content || (node as any).summary || '',
    title: translateText(node.title, targetLang),
  }));

  return {
    ...snapshot,
    canvas: {
      ...snapshot.canvas,
      nodes: translatedNodes,
      edges: Array.isArray(snapshot.canvas.edges) ? snapshot.canvas.edges : [],
    },
  };
}

/**
 * Sanitizes any residual graph terminology into proper procedural legal terms.
 */
export function sanitizeLegalText(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\bnodos?\s+de\s+hechos?\b/gi, 'hechos alegados')
    .replace(/\bnodos?\s+fácticos?\b/gi, 'elementos fácticos')
    .replace(/\bnodos?\s+probatorios?\b/gi, 'elementos probatorios')
    .replace(/\bnodos?\s+de\s+pruebas?\b/gi, 'medios probatorios')
    .replace(/\bnodos?\s+de\s+ley\b/gi, 'fundamentos de derecho')
    .replace(/\bnodos?\s+normativos?\b/gi, 'fundamentos normativos')
    .replace(/\bnodos?\s+de\s+jurisprudencia\b/gi, 'precedentes jurisprudenciales')
    .replace(/\bnodos?\s+aislados?\b/gi, 'elementos desvinculados')
    .replace(/\bfact\s+nodes?\b/gi, 'factual assertions')
    .replace(/\bevidence\s+nodes?\b/gi, 'evidentiary items')
    .replace(/\blaw\s+nodes?\b/gi, 'statutory authorities')
    .replace(/\bjurisprudence\s+nodes?\b/gi, 'judicial precedents')
    .replace(/\bisolated\s+nodes?\b/gi, 'unlinked elements')
    .replace(/\bnodos\b/gi, 'elementos del expediente')
    .replace(/\bnodo\b/gi, 'elemento procesal')
    .replace(/\baristas\b/gi, 'vinculaciones procesales')
    .replace(/\barista\b/gi, 'vínculo procesal')
    .replace(/\bgrafos?\b/gi, 'expediente')
    .replace(/\bvértices?\b/gi, 'elementos del caso')
    .replace(/\blienzo\b/gi, 'expediente')
    .replace(/\bnodes\b/gi, 'case elements')
    .replace(/\bnode\b/gi, 'case element')
    .replace(/\bedges\b/gi, 'evidentiary links')
    .replace(/\bedge\b/gi, 'evidentiary link');
}

/**
 * Returns a translated AuditReport for UI presentation.
 */
export function translateAudit(report: AuditReport, targetLang: Language): AuditReport {
  if (!report || !Array.isArray(report.alerts)) return report;

  const translatedAlerts: AuditAlert[] = report.alerts.map((alert) => ({
    ...alert,
    title: sanitizeLegalText(translateText(alert.title, targetLang)),
    description: sanitizeLegalText(translateText(alert.description, targetLang)),
    recommendation: alert.recommendation
      ? sanitizeLegalText(translateText(alert.recommendation, targetLang))
      : undefined,
  }));

  return {
    ...report,
    alerts: translatedAlerts,
  };
}
