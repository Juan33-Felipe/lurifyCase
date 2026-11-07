package com.iurify.casebackend.infrastructure.persistence.entity;

public enum CanvasOriginEnum {
    AI_GENERATED,
    USER_CREATED;

    public static CanvasOriginEnum fromDomain(String value) {
        if (value == null || value.isBlank()) {
            return USER_CREATED;
        }
        String normalized = value.trim().toUpperCase();
        if ("AI_GENERATED".equals(normalized)) {
            return AI_GENERATED;
        }
        // Maps USER_MANUAL and USER_CREATED to USER_CREATED
        return USER_CREATED;
    }
}
