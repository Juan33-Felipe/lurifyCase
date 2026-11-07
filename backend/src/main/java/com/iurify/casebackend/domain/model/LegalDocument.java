package com.iurify.casebackend.domain.model;

import java.time.Instant;
import java.util.UUID;

public class LegalDocument {
    private UUID id;
    private UUID caseId;
    private String title;
    private String documentType;
    private String status;
    private String language;
    private Long sourceCanvasVersion;
    private String instructions;
    private String contentFormat;
    private String contentBody;
    private String storagePath;
    private String failureCode;
    private String failureMessage;
    private Instant requestedAt;
    private Instant completedAt;
    private Instant updatedAt;

    public LegalDocument() {}

    public LegalDocument(UUID id, UUID caseId, String title, String documentType,
                         String status, String language, Long sourceCanvasVersion,
                         String instructions, String contentFormat, String contentBody,
                         String storagePath, String failureCode, String failureMessage,
                         Instant requestedAt, Instant completedAt, Instant updatedAt) {
        this.id = id;
        this.caseId = caseId;
        this.title = title;
        this.documentType = documentType;
        this.status = status;
        this.language = language;
        this.sourceCanvasVersion = sourceCanvasVersion;
        this.instructions = instructions;
        this.contentFormat = contentFormat;
        this.contentBody = contentBody;
        this.storagePath = storagePath;
        this.failureCode = failureCode;
        this.failureMessage = failureMessage;
        this.requestedAt = requestedAt;
        this.completedAt = completedAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public Long getSourceCanvasVersion() { return sourceCanvasVersion; }
    public void setSourceCanvasVersion(Long sourceCanvasVersion) { this.sourceCanvasVersion = sourceCanvasVersion; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getContentFormat() { return contentFormat; }
    public void setContentFormat(String contentFormat) { this.contentFormat = contentFormat; }
    public String getContentBody() { return contentBody; }
    public void setContentBody(String contentBody) { this.contentBody = contentBody; }
    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }
    public String getFailureCode() { return failureCode; }
    public void setFailureCode(String failureCode) { this.failureCode = failureCode; }
    public String getFailureMessage() { return failureMessage; }
    public void setFailureMessage(String failureMessage) { this.failureMessage = failureMessage; }
    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
