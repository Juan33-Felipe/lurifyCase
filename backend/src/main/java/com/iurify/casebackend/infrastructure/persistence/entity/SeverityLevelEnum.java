package com.iurify.casebackend.infrastructure.persistence.entity;

public enum SeverityLevelEnum {
    HIGH,
    MEDIUM,
    LOW;

    public static SeverityLevelEnum fromDomain(String value) {
        if (value == null || value.isBlank()) {
            return MEDIUM;
        }
        String normalized = value.trim().toUpperCase();
        if ("CRITICAL".equals(normalized) || "HIGH".equals(normalized)) {
            return HIGH;
        }
        if ("LOW".equals(normalized)) {
            return LOW;
        }
        return MEDIUM;
    }
}
