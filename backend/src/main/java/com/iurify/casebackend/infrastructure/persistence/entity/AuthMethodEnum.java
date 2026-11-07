package com.iurify.casebackend.infrastructure.persistence.entity;

public enum AuthMethodEnum {
    EMAIL,
    BIOMETRIC;

    public static AuthMethodEnum fromDomain(String value) {
        if (value == null || value.isBlank()) {
            return EMAIL;
        }
        String normalized = value.trim().toUpperCase();
        if ("PASSWORD".equals(normalized) || "EMAIL".equals(normalized)) {
            return EMAIL;
        }
        if ("BIOMETRIC".equals(normalized)) {
            return BIOMETRIC;
        }
        return EMAIL;
    }
}
