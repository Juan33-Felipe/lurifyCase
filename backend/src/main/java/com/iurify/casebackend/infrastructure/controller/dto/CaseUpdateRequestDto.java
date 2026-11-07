package com.iurify.casebackend.infrastructure.controller.dto;

import java.math.BigDecimal;

public class CaseUpdateRequestDto {
    private String title;
    private String description;
    private String jurisdiction;
    private String status;
    private String clientReference;
    private Boolean isSealed;
    private BigDecimal trialReadinessScore;

    public CaseUpdateRequestDto() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getClientReference() { return clientReference; }
    public void setClientReference(String clientReference) { this.clientReference = clientReference; }
    public Boolean getIsSealed() { return isSealed; }
    public void setIsSealed(Boolean isSealed) { this.isSealed = isSealed; }
    public BigDecimal getTrialReadinessScore() { return trialReadinessScore; }
    public void setTrialReadinessScore(BigDecimal trialReadinessScore) { this.trialReadinessScore = trialReadinessScore; }
}
