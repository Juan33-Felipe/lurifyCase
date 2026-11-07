# Step 2 — PostgreSQL Database Layer Implementation Report

## Database Model

The database schema (`database/schema.sql`) implements the core entities and relationships for Iurify Case:

### Tables Created
*   `users`: Stores user credentials, hashed passwords, biometric keys, and timestamps.
*   `cases`: Links to `users` (1:N), stores case metadata like dossier number, title, jurisdiction, and trial readiness score.
*   `canvas_versions`: Implements optimistic concurrency for case canvases. Links to `cases` (1:N) and uses `JSONB` for the graph data.
*   `case_audits`: Links to `cases` and `canvas_versions` (1:1 per audit run), storing the overall solidity score of an AI evaluation.
*   `audit_findings`: Links to `case_audits` (1:N), detailing specific vulnerabilities (type, severity, affected nodes).
*   `legal_documents`: Links to `cases` (1:N), managing the lifecycle of generated documents (pending, completed) and storing Markdown content.

### Relationships
*   `users` 1 ── * `cases` (ON DELETE CASCADE)
*   `cases` 1 ── * `canvas_versions` (ON DELETE CASCADE)
*   `canvas_versions` 1 ── 1 `canvas_versions` (parent_version_id, ON DELETE SET NULL)
*   `cases` 1 ── * `case_audits` (ON DELETE CASCADE)
*   `canvas_versions` 1 ── * `case_audits` (ON DELETE CASCADE)
*   `case_audits` 1 ── * `audit_findings` (ON DELETE CASCADE)
*   `cases` 1 ── * `legal_documents` (ON DELETE CASCADE)

### Important Constraints
*   `UUID` primary keys for all tables using `gen_random_uuid()` (via `pgcrypto`).
*   `UNIQUE(case_id, version_number)` on `canvas_versions` to enforce optimistic concurrency control.
*   `UNIQUE(email)` on `users`.
*   `UNIQUE(dossier_number)` on `cases`.
*   `CHECK (trial_readiness_score >= 0 AND trial_readiness_score <= 100)` on `cases`.
*   `CHECK (solidity_score >= 0 AND solidity_score <= 100)` on `case_audits`.

### Indexes
Standard B-tree indexes are applied to all foreign keys and frequently queried fields (e.g., `email`, `dossier_number`, `status`). A `GIN` index is applied to the `graph_data` JSONB column in `canvas_versions` to optimize unstructured JSON queries.

---

## Contract Consistency

The database model is strictly mapped to the `openapi.yaml` specifications:

*   **Enums:** PostgreSQL ENUM types explicitly mirror the OpenAPI definitions:
    *   `auth_method_enum` (`EMAIL`, `BIOMETRIC`) - *See RAD-11 below.*
    *   `case_status_enum` (`ACTIVE`, `ARCHIVED`)
    *   `canvas_origin_enum` (`AI_GENERATED`, `USER_CREATED`)
    *   `vulnerability_type_enum` (7 types including `PROCEDURAL_GAP`)
    *   `severity_level_enum` (`HIGH`, `MEDIUM`, `LOW`)
    *   `document_type_enum` (`LEGAL_BRIEF`, `CLOSING_ARGUMENT`, `LEGAL_OPINION`)
    *   `document_status_enum` (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)
*   **JSONB Canvas Mapping:** The `canvas_versions.graph_data` column is designed to directly store the `Canvas` schema defined in `schemas/canvas.schema.json`. The seed data (`database/seed.sql`) demonstrates this with a valid JSON document containing correctly formatted nodes (FACT, EVIDENCE) and edges (SUPPORTS).

---

## Validation

### Checks Successfully Performed
1.  **Static SQL Validation:** The syntax for `schema.sql` and `seed.sql` has been manually verified against PostgreSQL 15+ standards.
2.  **Referential Integrity:** All foreign keys are correctly defined with appropriate `ON DELETE` cascading rules.
3.  **JSON Schema Compliance:** The seeded `graph_data` JSON string manually conforms to `schemas/canvas.schema.json` (includes `nodes` array with types, coordinates, and `edges` array connecting valid UUIDs).
4.  **Enum Matching:** All created ENUMs perfectly match the `openapi.yaml` contract values.

### Limitations
*   **Runtime Validation Skipped:** No local PostgreSQL instance, Docker daemon, or WSL distribution was available in the current environment to execute the `.sql` scripts. Validation is purely static.

### REQUIRED ARCHITECTURAL DECISIONS

The following elements were inferred from the context but were not explicitly defined in the API contracts:

1.  **RAD-11: Authentication Methods:** The `openapi.yaml` contract (`LoginRequest`) defines login via email/password. However, the brief required biometric key support. I created an `auth_method_enum` (`EMAIL`, `BIOMETRIC`) and a `biometric_public_key` column in the `users` table to satisfy both.
2.  **RAD-12: Jurisdiction:** The brief requested a `jurisdiction` field for `cases`. This is missing from the `openapi.yaml` (`Case` schema). I added it as a `VARCHAR(100)` to the database, but the API contract will need updating to expose it.
3.  **RAD-13: Solidity Score:** The brief requested a `solidity/readiness score` for `case_audits`. This metric is not present in the OpenAPI `AuditReport` schema. I added `solidity_score NUMERIC(5, 2)` to the database to fulfill the prompt, but it should be added to the API if the frontend needs it.
