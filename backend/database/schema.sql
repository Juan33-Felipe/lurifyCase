-- Iurify Case - PostgreSQL Database Schema
-- Compatible with PostgreSQL 15+

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ENUMERATIONS (Aligned with OpenAPI 3.1.0 contract)

-- auth_method_enum: Not explicitly in OpenAPI (implied EMAIL, BIOMETRIC).
-- DOCUMENTATION NOTE: REQUIRED ARCHITECTURAL DECISION (RAD-11)
-- The OpenAPI spec relies on EMAIL/PASSWORD for login (LoginRequest), but the 
-- brief mentions biometric. We infer these two methods.
CREATE TYPE auth_method_enum AS ENUM (
    'EMAIL',
    'BIOMETRIC'
);

-- case_status_enum: Matches openapi.yaml (CaseStatus)
CREATE TYPE case_status_enum AS ENUM (
    'ACTIVE', 
    'ARCHIVED'
);

-- canvas_origin_enum: Matches openapi.yaml (Origin)
CREATE TYPE canvas_origin_enum AS ENUM (
    'AI_GENERATED', 
    'USER_CREATED'
);

-- vulnerability_type_enum: Matches openapi.yaml (AlertType)
CREATE TYPE vulnerability_type_enum AS ENUM (
    'PROCEDURAL_GAP',
    'LOGICAL_CONTRADICTION',
    'EVIDENCE_CONFLICT',
    'UNSUPPORTED_FACT',
    'MISSING_LEGAL_BASIS',
    'CASE_THEORY_WEAKNESS',
    'STRUCTURAL_ISSUE'
);

-- severity_level_enum: Matches openapi.yaml (AlertSeverity)
CREATE TYPE severity_level_enum AS ENUM (
    'HIGH', 
    'MEDIUM', 
    'LOW'
);

-- document_type_enum: Matches openapi.yaml (DocumentType)
CREATE TYPE document_type_enum AS ENUM (
    'LEGAL_BRIEF', 
    'CLOSING_ARGUMENT', 
    'LEGAL_OPINION'
);

-- document_status_enum: Matches openapi.yaml (DocumentStatus)
CREATE TYPE document_status_enum AS ENUM (
    'PENDING', 
    'PROCESSING', 
    'COMPLETED', 
    'FAILED'
);

-- 3. TABLES

-- 3.1 users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable if biometrics are used exclusively
    full_name VARCHAR(200) NOT NULL,
    biometric_public_key TEXT,
    auth_method auth_method_enum NOT NULL DEFAULT 'EMAIL',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 cases
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dossier_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    jurisdiction VARCHAR(100), -- RAD-12: Added as requested, not in OpenAPI.
    status case_status_enum NOT NULL DEFAULT 'ACTIVE',
    trial_readiness_score NUMERIC(5, 2) CHECK (trial_readiness_score >= 0 AND trial_readiness_score <= 100),
    is_sealed BOOLEAN NOT NULL DEFAULT FALSE,
    client_reference VARCHAR(100),
    canvas_version BIGINT NOT NULL DEFAULT 0, -- Tracks current active version
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.3 canvas_versions
CREATE TABLE canvas_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    version_number BIGINT NOT NULL,
    parent_version_id UUID REFERENCES canvas_versions(id) ON DELETE SET NULL,
    origin canvas_origin_enum NOT NULL,
    graph_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (case_id, version_number)
);

-- 3.4 case_audits
CREATE TABLE case_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    canvas_version_id UUID NOT NULL REFERENCES canvas_versions(id) ON DELETE CASCADE,
    solidity_score NUMERIC(5, 2) CHECK (solidity_score >= 0 AND solidity_score <= 100), -- RAD-13: Solidity score implied, not in OpenAPI
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.5 audit_findings
CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES case_audits(id) ON DELETE CASCADE,
    vulnerability_type vulnerability_type_enum NOT NULL,
    severity severity_level_enum NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    recommendation VARCHAR(2000),
    affected_node_ids UUID[] NOT NULL DEFAULT '{}',
    affected_edge_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3.6 legal_documents
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    document_type document_type_enum NOT NULL,
    status document_status_enum NOT NULL DEFAULT 'PENDING',
    language VARCHAR(35) NOT NULL DEFAULT 'es-PE',
    source_canvas_version BIGINT NOT NULL,
    instructions VARCHAR(4000),
    content_format VARCHAR(50) DEFAULT 'MARKDOWN',
    content_body TEXT,
    storage_path TEXT, -- External storage location
    failure_code VARCHAR(100),
    failure_message TEXT,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- 4. INDEXES

-- users
CREATE INDEX idx_users_email ON users(email);

-- cases
CREATE INDEX idx_cases_user_id ON cases(user_id);
CREATE INDEX idx_cases_dossier_number ON cases(dossier_number);
CREATE INDEX idx_cases_status ON cases(status);

-- canvas_versions
CREATE INDEX idx_canvas_versions_case_id ON canvas_versions(case_id);
CREATE INDEX idx_canvas_versions_parent_version_id ON canvas_versions(parent_version_id);
CREATE INDEX idx_canvas_versions_graph_data_gin ON canvas_versions USING GIN (graph_data);

-- case_audits
CREATE INDEX idx_case_audits_case_id ON case_audits(case_id);
CREATE INDEX idx_case_audits_canvas_version_id ON case_audits(canvas_version_id);

-- audit_findings
CREATE INDEX idx_audit_findings_audit_id ON audit_findings(audit_id);
CREATE INDEX idx_audit_findings_vuln_type ON audit_findings(vulnerability_type);
CREATE INDEX idx_audit_findings_severity ON audit_findings(severity);

-- legal_documents
CREATE INDEX idx_legal_documents_case_id ON legal_documents(case_id);
CREATE INDEX idx_legal_documents_status ON legal_documents(status);
