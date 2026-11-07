package com.iurify.casebackend.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "legal_documents")
public class LegalDocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(nullable = false, length = 300)
    private String title;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "document_type", columnDefinition = "document_type_enum", nullable = false)
    private DocumentTypeEnum documentType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "status", columnDefinition = "document_status_enum", nullable = false)
    private DocumentStatusEnum status = DocumentStatusEnum.PENDING;

    @Column(nullable = false, length = 35)
    private String language = "es-PE";

    @Column(name = "source_canvas_version", nullable = false)
    private Long sourceCanvasVersion;

    @Column(length = 4000)
    private String instructions;

    @Column(name = "content_format", length = 50)
    private String contentFormat = "MARKDOWN";

    @Column(name = "content_body", columnDefinition = "text")
    private String contentBody;

    @Column(name = "storage_path", columnDefinition = "text")
    private String storagePath;

    @Column(name = "failure_code", length = 100)
    private String failureCode;

    @Column(name = "failure_message", columnDefinition = "text")
    private String failureMessage;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.requestedAt == null) {
            this.requestedAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = DocumentStatusEnum.PENDING;
        }
        if (this.language == null || this.language.isBlank()) {
            this.language = "es-PE";
        }
        if (this.contentFormat == null || this.contentFormat.isBlank()) {
            this.contentFormat = "MARKDOWN";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public DocumentTypeEnum getDocumentType() { return documentType; }
    public void setDocumentType(DocumentTypeEnum documentType) { this.documentType = documentType; }
    public DocumentStatusEnum getStatus() { return status; }
    public void setStatus(DocumentStatusEnum status) { this.status = status; }
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
