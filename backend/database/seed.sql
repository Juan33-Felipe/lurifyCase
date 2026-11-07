-- Iurify Case - PostgreSQL Seed Data
-- 1 Demo user, 1 sealed case, 1 initial canvas, 1 audit record

-- Clear existing data if re-running
TRUNCATE TABLE legal_documents, audit_findings, case_audits, canvas_versions, cases, users RESTART IDENTITY CASCADE;

-- 1. USER
INSERT INTO users (id, email, password_hash, full_name, auth_method)
VALUES (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'demo.lawyer@example.com',
    '$2b$12$KIXe8P7vC1tW5Zz/OqXvXu7O5W.N3L.Z2M9K1T4F8Z/OqXvXu7O5W', -- Dummy hash
    'Jane Doe, Esq.',
    'EMAIL'
);

-- 2. CASE
INSERT INTO cases (id, user_id, dossier_number, title, description, jurisdiction, status, trial_readiness_score, is_sealed, client_reference, canvas_version)
VALUES (
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'LEX-2025-098',
    'State v. Sterling Industries',
    'Environmental compliance violation involving unauthorized discharge into the Sterling River.',
    'Federal Court, 9th Circuit',
    'ACTIVE',
    88.4,
    TRUE,
    'STERLING-ENV-01',
    1
);

-- 3. CANVAS VERSION
-- Graph data conforms to schemas/canvas.schema.json
INSERT INTO canvas_versions (id, case_id, version_number, origin, graph_data)
VALUES (
    'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f',
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
    1,
    'AI_GENERATED',
    '{
        "nodes": [
            {
                "id": "d4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a",
                "type": "FACT",
                "title": "Unauthorized Discharge",
                "content": "Sterling Industries discharged 500 gallons of industrial waste on Oct 12, 2024.",
                "position": {"x": 100.0, "y": 150.0},
                "origin": "AI_GENERATED",
                "userModified": false
            },
            {
                "id": "e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b",
                "type": "EVIDENCE",
                "title": "Water Quality Report",
                "content": "EPA test results showing toxic levels downstream of the facility.",
                "position": {"x": 300.0, "y": 150.0},
                "origin": "AI_GENERATED",
                "userModified": false
            }
        ],
        "edges": [
            {
                "id": "f6a7b8c9-d0e1-4f5a-8b9c-0d1e2f3a4b5c",
                "source": "e5f6a7b8-c9d0-4e5f-8a9b-0c1d2e3f4a5b",
                "target": "d4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a",
                "relationshipType": "SUPPORTS",
                "origin": "AI_GENERATED",
                "userModified": false
            }
        ]
    }'::jsonb
);

-- 4. CASE AUDIT
INSERT INTO case_audits (id, case_id, canvas_version_id, solidity_score)
VALUES (
    '1a2b3c4d-5e6f-4a5b-8c7d-9e0f1a2b3c4d',
    'b2c3d4e5-f6a7-4b5c-8d9e-0f1a2b3c4d5e',
    'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f',
    75.5
);

-- 5. AUDIT FINDING
INSERT INTO audit_findings (id, audit_id, vulnerability_type, severity, title, description, recommendation, affected_node_ids)
VALUES (
    '2b3c4d5e-6f7a-4b5c-8d9e-0f1a2b3c4d5e',
    '1a2b3c4d-5e6f-4a5b-8c7d-9e0f1a2b3c4d',
    'PROCEDURAL_GAP',
    'HIGH',
    'Missing Notice of Violation',
    'No evidence of a formal Notice of Violation being served prior to filing charges.',
    'Upload the signed Notice of Violation document or add a FACT node explaining the exception.',
    '{"d4e5f6a7-b8c9-4d5e-8f9a-0b1c2d3e4f5a"}'
);
