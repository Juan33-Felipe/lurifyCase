package com.iurify.casebackend.infrastructure.controller.dto;

public class NarrativeTextRequestDto {
    private String text;
    private String narrativeText;
    private String language;
    private Long baseVersion;

    public NarrativeTextRequestDto() {}

    public String resolveNarrativeText() {
        if (text != null && !text.isBlank()) {
            return text.trim();
        }
        if (narrativeText != null && !narrativeText.isBlank()) {
            return narrativeText.trim();
        }
        return null;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getNarrativeText() { return narrativeText; }
    public void setNarrativeText(String narrativeText) { this.narrativeText = narrativeText; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public Long getBaseVersion() { return baseVersion; }
    public void setBaseVersion(Long baseVersion) { this.baseVersion = baseVersion; }
}
