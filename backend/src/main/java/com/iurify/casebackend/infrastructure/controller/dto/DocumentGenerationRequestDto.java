package com.iurify.casebackend.infrastructure.controller.dto;

public class DocumentGenerationRequestDto {
    private String documentType;
    private String title;
    private String language;
    private String instructions;
    private Long sourceCanvasVersion;

    public DocumentGenerationRequestDto() {}

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public Long getSourceCanvasVersion() { return sourceCanvasVersion; }
    public void setSourceCanvasVersion(Long sourceCanvasVersion) { this.sourceCanvasVersion = sourceCanvasVersion; }
}
