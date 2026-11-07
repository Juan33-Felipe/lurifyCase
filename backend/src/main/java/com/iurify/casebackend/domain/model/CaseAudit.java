package com.iurify.casebackend.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class CaseAudit {
    private UUID id;
    private UUID caseId;
    private UUID canvasVersionId;
    private BigDecimal solidityScore;
    private Instant createdAt;
    private List<AuditFinding> findings = new ArrayList<>();

    public CaseAudit() {}

    public CaseAudit(UUID id, UUID caseId, UUID canvasVersionId,
                     BigDecimal solidityScore, Instant createdAt) {
        this.id = id;
        this.caseId = caseId;
        this.canvasVersionId = canvasVersionId;
        this.solidityScore = solidityScore;
        this.createdAt = createdAt;
    }

    public CaseAudit(UUID id, UUID caseId, UUID canvasVersionId,
                     BigDecimal solidityScore, Instant createdAt,
                     List<AuditFinding> findings) {
        this(id, caseId, canvasVersionId, solidityScore, createdAt);
        this.findings = findings != null ? findings : new ArrayList<>();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public UUID getCanvasVersionId() { return canvasVersionId; }
    public void setCanvasVersionId(UUID canvasVersionId) { this.canvasVersionId = canvasVersionId; }
    public BigDecimal getSolidityScore() { return solidityScore; }
    public void setSolidityScore(BigDecimal solidityScore) { this.solidityScore = solidityScore; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public List<AuditFinding> getFindings() { return findings; }
    public void setFindings(List<AuditFinding> findings) { this.findings = findings; }
}
