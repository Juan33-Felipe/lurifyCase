package com.iurify.casebackend.infrastructure.controller.dto;

import java.time.Instant;
import java.util.UUID;

public class LegalDocumentDto {
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
    private DocumentContentDto content;
    private Instant requestedAt;
    private Instant completedAt;
    private Instant updatedAt;

    public LegalDocumentDto() {}

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
    public DocumentContentDto getContent() { return content; }
    public void setContent(DocumentContentDto content) { this.content = content; }
    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
