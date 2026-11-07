export type Uuid = string;
export type Timestamp = string;
export type CanvasVersion = number;
export type LanguageTag = string;

// -- Cases
export type CaseStatus = 'ACTIVE' | 'ARCHIVED';

export interface Case {
  id: Uuid;
  title: string;
  description?: string;
  clientReference?: string;
  status: CaseStatus;
  canvasVersion: CanvasVersion;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Dynamic translation metadata (FR-Language)
  originalTitle?: string;
  originalDescription?: string;
  isTranslated?: boolean;
}

export interface PageInfo {
  hasMore: boolean;
  nextCursor?: string;
}

export interface CaseList {
  items: Case[];
  page: PageInfo;
}

// -- Canvas
export type NodeType = 'FACT' | 'EVIDENCE' | 'LAW' | 'JURISPRUDENCE';
export type Origin = 'AI_GENERATED' | 'USER_CREATED';

export interface Position {
  x: number;
  y: number;
}

export interface CanvasNode {
  id: Uuid;
  type: NodeType;
  title: string;
  content: string;
  position: Position;
  origin: Origin;
  userModified: boolean;
}

export type RelationshipType = 'SUPPORTS' | 'CONTRADICTS' | 'DERIVES_FROM' | 'APPLIES_TO' | 'INTERPRETS';

export interface CanvasEdge {
  id: Uuid;
  source: Uuid;
  target: Uuid;
  relationshipType: RelationshipType;
  origin: Origin;
  userModified: boolean;
}

export interface CanvasGraph {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface CanvasSnapshot {
  caseId: Uuid;
  version: CanvasVersion;
  updatedAt: Timestamp;
  canvas: CanvasGraph;
}

// -- Narrative
export type NarrativeInputType = 'TEXT' | 'VOICE';

export interface TextNarrativeRequest {
  inputType: 'TEXT';
  text: string;
  language?: LanguageTag;
}

export interface VoiceNarrativeRequest {
  inputType: 'VOICE';
  audio: string;
  language?: LanguageTag;
}

export interface NarrativeProcessingResult {
  narrativeId: Uuid;
  inputType: NarrativeInputType;
  transcript?: string;
  generatedNodeIds?: Uuid[];
  generatedEdgeIds?: Uuid[];
  canvas: CanvasSnapshot;
}

// -- Auth (FR-008)
export interface UserProfile {
  id: Uuid;
  email: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserProfile;
}

// -- Cases (write)
export interface CreateCaseRequest {
  title: string;
  description?: string;
  clientReference?: string;
}

// -- Audit
export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type AlertType =
  | 'PROCEDURAL_GAP'
  | 'LOGICAL_CONTRADICTION'
  | 'EVIDENCE_CONFLICT'
  | 'UNSUPPORTED_FACT'
  | 'MISSING_LEGAL_BASIS'
  | 'CASE_THEORY_WEAKNESS'
  | 'STRUCTURAL_ISSUE';

export interface AuditAlert {
  id: Uuid;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  recommendation?: string;
  relatedNodeIds: Uuid[];
  relatedEdgeIds: Uuid[];
}

export interface AuditReport {
  auditId: Uuid;
  caseId: Uuid;
  canvasVersion: CanvasVersion;
  generatedAt: Timestamp;
  alerts: AuditAlert[];
}
