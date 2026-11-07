package com.iurify.casebackend.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class Case {
    private UUID id;
    private UUID userId;
    private String dossierNumber;
    private String title;
    private String description;
    private String jurisdiction;
    private String status;
    private BigDecimal trialReadinessScore;
    private Boolean isSealed;
    private String clientReference;
    private Long canvasVersion;
    private Instant createdAt;
    private Instant updatedAt;

    public Case() {}

    public Case(UUID id, UUID userId, String dossierNumber, String title,
                String jurisdiction, String status, BigDecimal trialReadinessScore,
                Boolean isSealed, Instant createdAt) {
        this(id, userId, dossierNumber, title, null, jurisdiction, status,
             trialReadinessScore, isSealed, null, 0L, createdAt, createdAt);
    }

    public Case(UUID id, UUID userId, String dossierNumber, String title,
                String description, String jurisdiction, String status,
                BigDecimal trialReadinessScore, Boolean isSealed,
                String clientReference, Long canvasVersion,
                Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.dossierNumber = dossierNumber;
        this.title = title;
        this.description = description;
        this.jurisdiction = jurisdiction;
        this.status = status;
        this.trialReadinessScore = trialReadinessScore;
        this.isSealed = isSealed;
        this.clientReference = clientReference;
        this.canvasVersion = canvasVersion != null ? canvasVersion : 0L;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getDossierNumber() { return dossierNumber; }
    public void setDossierNumber(String dossierNumber) { this.dossierNumber = dossierNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getTrialReadinessScore() { return trialReadinessScore; }
    public void setTrialReadinessScore(BigDecimal trialReadinessScore) { this.trialReadinessScore = trialReadinessScore; }
    public Boolean getIsSealed() { return isSealed; }
    public void setIsSealed(Boolean isSealed) { this.isSealed = isSealed; }
    public String getClientReference() { return clientReference; }
    public void setClientReference(String clientReference) { this.clientReference = clientReference; }
    public Long getCanvasVersion() { return canvasVersion; }
    public void setCanvasVersion(Long canvasVersion) { this.canvasVersion = canvasVersion; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
