package com.iurify.casebackend.infrastructure.persistence.entity;

public enum CaseStatusEnum {
    ACTIVE,
    ARCHIVED;

    public static CaseStatusEnum fromDomain(String value) {
        if (value == null || value.isBlank()) {
            return ACTIVE;
        }
        String normalized = value.trim().toUpperCase();
        if ("ARCHIVED".equals(normalized)) {
            return ARCHIVED;
        }
        return ACTIVE;
    }
}
