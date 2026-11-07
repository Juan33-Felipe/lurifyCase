IURIFY CASE BACKEND - MASTER LOGIC IMPLEMENTATION PLAN

INITIAL AGENT INSTRUCTION:
Before analyzing and modifying the codebase, inspect the existing repository structure, database contracts (database/schema.sql, database/seed.sql), API contracts (openapi.yaml), and JSON validation schemas (schemas/canvas.schema.json) to ensure strict architectural consistency, Domain-Driven Design (DDD), and Hexagonal Architecture compliance[cite: 1].

================================================================================
1. CURRENT BASELINE STATE (DO NOT RECREATE OR OVERWRITE)
================================================================================
- Database Infrastructure: PostgreSQL 15 running in Docker (iurify_case_db) initialized with database/schema.sql and database/seed.sql (prototype dossier LEX-2025-098, "State v. Sterling Industries")[cite: 1].
- Canonical Contracts: openapi.yaml (OpenAPI 3.1.0 specification) and schemas/canvas.schema.json[cite: 1].
- Core Framework & Architecture: Java 17, Spring Boot 3.4.3, Maven, Spring Data JPA (Hibernate 6 with ddl-auto: validate), and Hypersistence Utils (io.hypersistence:hypersistence-utils-hibernate-63:3.9.0)[cite: 1].
- Existing Foundation: Base Hexagonal Architecture structure (domain, application, infrastructure) with initial read endpoints (GET /cases, GET /cases/{id}, GET /cases/{id}/canvas, and GET /health)[cite: 1].

================================================================================
2. TRACEABILITY MATRIX: REQUIREMENTS & DIAGRAMS TO BACKEND MODULES
================================================================================
- FR-008 (Authentication & Access Control) & NFR-004 (Security & Privacy)[cite: 1]:
  * Target Endpoint: POST /api/v1/auth/login[cite: 1]
  * Backend Components: User domain model, UserRepository port, AuthService, JwtService, JwtAuthenticationFilter, SecurityConfig[cite: 1].

- FR-007 (Case / Dossier Management - CRUD)[cite: 1]:
  * Target Endpoints: GET, POST, PATCH, DELETE /api/v1/cases and /api/v1/cases/{caseId}[cite: 1]
  * Backend Components: Case domain model, CaseRepository port, CaseService (create, read, update status/metadata, delete), CaseController[cite: 1].

- FR-001 (Conversational Ingestion) & FR-002 (Automated Canvas Generation) & NFR-001 (NLP Performance)[cite: 1]:
  * Target Endpoint: POST /api/v1/cases/{caseId}/narrative (supports multipart/form-data for audio and application/json for text, plus Idempotency-Key header)[cite: 1, 6]
  * Backend Components: SpeechToTextService port/adapter, IAClient & GeminiAdapter, CanvasPromptService (enforcing schemas/canvas.schema.json structured output), CanvasVersion creation with origin = AI_GENERATED[cite: 1].

- FR-003 (Manual Canvas Editing) & NFR-003 (Concurrency & Versioning)[cite: 1]:
  * Target Endpoint: PATCH /api/v1/cases/{caseId}/canvas[cite: 1]
  * Backend Components: CanvasService (optimistic concurrency control via If-Match / version_number validation, returning 409 Conflict on mismatch), CanvasVersion persistence with origin = USER_MANUAL[cite: 1].

- FR-004 (Real-Time AI Case Theory Audit)[cite: 1]:
  * Target Endpoint: POST /api/v1/cases/{caseId}/audit[cite: 1]
  * Backend Components: CaseAudit and AuditFinding domain models, AuditRepository port, AuditService (evaluates current persisted canvas or in-memory payload, calculates solidity_score, detects PROCEDURAL_GAP, LOGICAL_CONTRADICTION, OPPOSING_VULNERABILITY), AuditController[cite: 1].

- FR-005 (Technical Legal Document Generation) & FR-006 (Document Export)[cite: 1]:
  * Target Endpoints: POST /api/v1/cases/{caseId}/documents and GET /api/v1/cases/{caseId}/documents/{docId}/export?format=PDF|WORD[cite: 1]
  * Backend Components: LegalDocument domain model, LegalDocumentRepository port, DocumentGeneratorService (compiles canvas graph and audit notes into Markdown for MINUTA, ALEGATO, CONCEPTO, and exports to PDF/DOCX), DocumentController[cite: 1].

================================================================================
3. STEP-BY-STEP IMPLEMENTATION PHASES (HEXAGONAL ARCHITECTURE)
================================================================================

PHASE 1: COMPLETE DOMAIN LAYER & PERSISTENCE ADAPTERS
Goal: Map all remaining PostgreSQL tables from database/schema.sql while keeping the domain layer strictly decoupled from Spring/JPA/Hibernate[cite: 1].
1. Domain Models (com.iurify.casebackend.domain.model)[cite: 1]:
   - User: id, email, passwordHash, biometricPublicKey, authMethod (PASSWORD, BIOMETRIC), createdAt, updatedAt[cite: 1].
   - Case: Ensure full support for id, userId, dossierNumber, title, jurisdiction, status (ACTIVE, SEALED, ARCHIVED), trialReadinessScore, isSealed, createdAt, updatedAt[cite: 1].
   - CanvasVersion: id, caseId, versionNumber, parentVersion, origin (AI_GENERATED, USER_MANUAL), graphData (structured representation matching schemas/canvas.schema.json: nodes with id, origin, type [FACT, EVIDENCE, STATUTE, PRECEDENT], title, content, position {x, y}, metadata; and edges with id, sourceNodeId, targetNodeId, relationType [SUPPORTS, CONTRADICTS, etc.], weight), createdAt[cite: 1].
   - CaseAudit: id, caseId, canvasVersionId, solidityScore, executedAt[cite: 1].
   - AuditFinding: id, auditId, type (PROCEDURAL_GAP, LOGICAL_CONTRADICTION, OPPOSING_VULNERABILITY), severity (LOW, MEDIUM, HIGH, CRITICAL), title, description, affectedNodeIds (UUID[]), actionPrompt, createdAt[cite: 1].
   - LegalDocument: id, caseId, canvasVersionId, documentType (MINUTA, ALEGATO, CONCEPTO), title, status (PENDING, PROCESSING, COMPLETED, FAILED), contentMarkdown, pdfStoragePath, docxStoragePath, createdAt, updatedAt[cite: 1].
2. Outbound Repository Ports (com.iurify.casebackend.domain.repository)[cite: 1]:
   - Pure Java interfaces for UserRepository, CaseRepository, CanvasVersionRepository, CaseAuditRepository, AuditFindingRepository, and LegalDocumentRepository[cite: 1].
3. Persistence Entities & Adapters (com.iurify.casebackend.infrastructure.persistence)[cite: 1]:
   - Create JPA entities and Spring Data JPA repositories for all tables, handling PostgreSQL native enums (@JdbcTypeCode(SqlTypes.NAMED_ENUM)), UUID arrays (UUID[]), and JSONB (@Type(JsonType.class) / JsonBinaryType)[cite: 1].
   - Keep spring.jpa.hibernate.ddl-auto: validate intact[cite: 1].

PHASE 2: AUTHENTICATION & SECURITY MIDDLEWARE (FR-008, NFR-004)
Goal: Implement stateless JWT authentication and route protection as specified in openapi.yaml[cite: 1].
1. Application Service:
   - Implement AuthService supporting credential login (email + password verification) and biometric public key validation[cite: 1].
2. Infrastructure Security (com.iurify.casebackend.infrastructure.security)[cite: 1]:
   - Implement JwtService for token generation and validation.
   - Implement JwtAuthenticationFilter to intercept requests and validate Bearer tokens[cite: 1, 6].
   - Configure SecurityConfig: permit POST /api/v1/auth/login and GET /health; require authentication on all /api/v1/cases/** routes[cite: 1].
3. REST Controller:
   - Expose AuthController (POST /api/v1/auth/login)[cite: 1].

PHASE 3: CASE MANAGEMENT CRUD & MANUAL CANVAS SYNCHRONIZATION (FR-007, FR-003, NFR-003)
Goal: Complete dossier lifecycle operations and manual canvas updates with optimistic concurrency control[cite: 1].
1. Case Management:
   - Expand CaseService and CaseController under the canonical prefix /api/v1/cases to support creating dossiers (POST), listing user dossiers (GET), fetching details (GET /{caseId}), updating status/readiness score/sealing (PATCH /{caseId}), and deleting/archiving (DELETE /{caseId})[cite: 1].
2. Manual Canvas Synchronization:
   - Implement PATCH /api/v1/cases/{caseId}/canvas in CanvasService and CanvasController[cite: 1].
   - Validate parent version / ETag (If-Match). If the client version is stale compared to the latest version_number in PostgreSQL, throw a conflict exception mapped to HTTP 409 Conflict[cite: 1].
   - Persist the new graph state as version_number = latest + 1 with origin = USER_MANUAL[cite: 1].

PHASE 4: AI ORCHESTRATION & CONVERSATIONAL INGESTION (FR-001, FR-002, NFR-001)
Goal: Process voice dictation or text narrative and automatically generate/update the visual case canvas[cite: 1].
1. AI Ports & Adapters (com.iurify.casebackend.application.service.ia)[cite: 1]:
   - SpeechToTextService: Port and adapter to transcribe audio payloads (multipart/form-data) into legal text[cite: 1].
   - CanvasPromptService & GeminiAdapter (implementing IAClient): Build prompts combining existing canvas state and new narrative input, enforcing strict JSON schema output matching schemas/canvas.schema.json[cite: 1].
2. Narrative Ingestion Use Case:
   - Implement POST /api/v1/cases/{caseId}/narrative supporting Idempotency-Key header[cite: 1, 6].
   - Extract entities (FACT, EVIDENCE, STATUTE, PRECEDENT), calculate spatial coordinates (x, y), establish edges (SUPPORTS, CONTRADICTS), persist a new CanvasVersion with origin = AI_GENERATED, and return the updated graph[cite: 1].

PHASE 5: REAL-TIME AI CASE AUDIT (FR-004)
Goal: Evaluate graph topology to detect procedural gaps and logical contradictions[cite: 1].
1. Audit Use Case (AuditService)[cite: 1]:
   - Implement POST /api/v1/cases/{caseId}/audit[cite: 1].
   - If the request body is empty, audit the latest saved CanvasVersion in PostgreSQL; if a canvas payload is provided in the body, audit the in-memory graph[cite: 1].
   - Invoke the AI adapter to compute solidityScore (0.0 to 100.0) and generate vulnerabilities (type, severity, title, description, affectedNodeIds, actionPrompt)[cite: 1].
   - Persist results in case_audits and audit_findings, update trial_readiness_score on the Case entity, and return the structured audit response (200 OK)[cite: 1].

PHASE 6: LEGAL DOCUMENT GENERATION & EXPORT (FR-005, FR-006)
Goal: Compile the structured canvas and audit findings into formal legal documents[cite: 1].
1. Document Generation Use Case (DocumentService)[cite: 1]:
   - Implement POST /api/v1/cases/{caseId}/documents receiving documentType (MINUTA, ALEGATO, CONCEPTO), title, and includeAuditNotes[cite: 1].
   - Generate formal legal Markdown (generatedContentMarkdown) via AI orchestration based on the canvas nodes/edges and persist the record in legal_documents with status = COMPLETED (returning 201 Created with downloadEndpoints)[cite: 1].
2. Document Export Endpoint:
   - Implement GET /api/v1/cases/{caseId}/documents/{documentId}/export?format=PDF|WORD to stream the compiled document in PDF or DOCX format[cite: 1].

PHASE 7: GLOBAL ERROR HANDLING (RFC 7807) & VALIDATION
Goal: Ensure unified error responses and full end-to-end verification[cite: 1].
1. Global Exception Handler:
   - Implement @RestControllerAdvice returning standard RFC 7807 ProblemDetails payloads for 400 (Bad Request), 401 (Unauthorized), 404 (ResourceNotFoundException), 409 (Canvas Version Conflict), and 422 (Validation Error)[cite: 1].
2. Verification:
   - Run mvn clean verify and confirm Hibernate schema validation (ddl-auto: validate) passes against PostgreSQL 15 without modifying existing tables[cite: 1].
   - Verify all endpoints match openapi.yaml paths, HTTP status codes, and payload contracts[cite: 1].