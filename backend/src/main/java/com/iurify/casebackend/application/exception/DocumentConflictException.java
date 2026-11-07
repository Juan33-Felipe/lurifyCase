package com.iurify.casebackend.application.exception;

public class DocumentConflictException extends RuntimeException {
    public DocumentConflictException(String message) {
        super(message);
    }
}
