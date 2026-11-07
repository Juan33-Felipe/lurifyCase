package com.iurify.casebackend.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cases")
public class CaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "dossier_number", nullable = false, unique = true, length = 100)
    private String dossierNumber;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(length = 100)
    private String jurisdiction;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", columnDefinition = "case_status_enum", nullable = false)
    private CaseStatusEnum status = CaseStatusEnum.ACTIVE;

    @Column(name = "trial_readiness_score", precision = 5, scale = 2)
    private BigDecimal trialReadinessScore;

    @Column(name = "is_sealed", nullable = false)
    private Boolean isSealed = false;

    @Column(name = "client_reference", length = 100)
    private String clientReference;

    @Column(name = "canvas_version", nullable = false)
    private Long canvasVersion = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = CaseStatusEnum.ACTIVE;
        }
        if (this.isSealed == null) {
            this.isSealed = false;
        }
        if (this.canvasVersion == null) {
            this.canvasVersion = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
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
    public CaseStatusEnum getStatus() { return status; }
    public void setStatus(CaseStatusEnum status) { this.status = status; }
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
