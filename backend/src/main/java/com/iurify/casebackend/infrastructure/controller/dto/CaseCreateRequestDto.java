package com.iurify.casebackend.infrastructure.controller.dto;

public class CaseCreateRequestDto {
    private String title;
    private String description;
    private String dossierNumber;
    private String jurisdiction;
    private String clientReference;
    private Boolean isSealed;

    public CaseCreateRequestDto() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDossierNumber() { return dossierNumber; }
    public void setDossierNumber(String dossierNumber) { this.dossierNumber = dossierNumber; }
    public String getJurisdiction() { return jurisdiction; }
    public void setJurisdiction(String jurisdiction) { this.jurisdiction = jurisdiction; }
    public String getClientReference() { return clientReference; }
    public void setClientReference(String clientReference) { this.clientReference = clientReference; }
    public Boolean getIsSealed() { return isSealed; }
    public void setIsSealed(Boolean isSealed) { this.isSealed = isSealed; }
}
