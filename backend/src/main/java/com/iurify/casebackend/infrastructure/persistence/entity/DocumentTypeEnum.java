package com.iurify.casebackend.infrastructure.persistence.entity;

public enum DocumentTypeEnum {
    LEGAL_BRIEF,
    CLOSING_ARGUMENT,
    LEGAL_OPINION;

    public static DocumentTypeEnum fromDomain(String value) {
        if (value == null || value.isBlank()) {
            return LEGAL_BRIEF;
        }
        String normalized = value.trim().toUpperCase();
        return switch (normalized) {
            case "MINUTA", "LEGAL_BRIEF" -> LEGAL_BRIEF;
            case "ALEGATO", "CLOSING_ARGUMENT" -> CLOSING_ARGUMENT;
            case "CONCEPTO", "LEGAL_OPINION" -> LEGAL_OPINION;
            default -> LEGAL_BRIEF;
        };
    }
}
