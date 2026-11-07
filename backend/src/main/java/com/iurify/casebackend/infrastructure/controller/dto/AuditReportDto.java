package com.iurify.casebackend.infrastructure.controller.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class AuditReportDto {
    private UUID auditId;
    private UUID id;
    private UUID caseId;
    private UUID canvasVersionId;
    private Long canvasVersion;
    private BigDecimal solidityScore;
    private BigDecimal trialReadinessScore;
    private Instant auditedAt;
    private Instant createdAt;
    private String summary;
    private List<AuditAlertDto> alerts;
    private List<AuditAlertDto> findings;

    public AuditReportDto() {}

    public AuditReportDto(
            UUID auditId,
            UUID caseId,
            UUID canvasVersionId,
            Long canvasVersion,
            BigDecimal solidityScore,
            Instant auditedAt,
            String summary,
            List<AuditAlertDto> alerts
    ) {
        this.auditId = auditId;
        this.id = auditId;
        this.caseId = caseId;
        this.canvasVersionId = canvasVersionId;
        this.canvasVersion = canvasVersion;
        this.solidityScore = solidityScore;
        this.trialReadinessScore = solidityScore;
        this.auditedAt = auditedAt;
        this.createdAt = auditedAt;
        this.summary = summary;
        this.alerts = alerts;
        this.findings = alerts;
    }

    public UUID getAuditId() { return auditId; }
    public void setAuditId(UUID auditId) { this.auditId = auditId; }
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public UUID getCanvasVersionId() { return canvasVersionId; }
    public void setCanvasVersionId(UUID canvasVersionId) { this.canvasVersionId = canvasVersionId; }
    public Long getCanvasVersion() { return canvasVersion; }
    public void setCanvasVersion(Long canvasVersion) { this.canvasVersion = canvasVersion; }
    public BigDecimal getSolidityScore() { return solidityScore; }
    public void setSolidityScore(BigDecimal solidityScore) { this.solidityScore = solidityScore; }
    public BigDecimal getTrialReadinessScore() { return trialReadinessScore; }
    public void setTrialReadinessScore(BigDecimal trialReadinessScore) { this.trialReadinessScore = trialReadinessScore; }
    public Instant getAuditedAt() { return auditedAt; }
    public void setAuditedAt(Instant auditedAt) { this.auditedAt = auditedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public List<AuditAlertDto> getAlerts() { return alerts; }
    public void setAlerts(List<AuditAlertDto> alerts) { this.alerts = alerts; }
    public List<AuditAlertDto> getFindings() { return findings; }
    public void setFindings(List<AuditAlertDto> findings) { this.findings = findings; }
}
