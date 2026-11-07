package com.iurify.casebackend.infrastructure.persistence.entity;

public enum DocumentStatusEnum {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED;

    public static DocumentStatusEnum fromDomain(String value) {
        if (value == null || value.isBlank()) {
            return PENDING;
        }
        try {
            return DocumentStatusEnum.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return PENDING;
        }
    }
}
