package com.iurify.casebackend.infrastructure.persistence.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "case_audits")
public class CaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "canvas_version_id", nullable = false)
    private UUID canvasVersionId;

    @Column(name = "solidity_score", precision = 5, scale = 2)
    private BigDecimal solidityScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
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
}
