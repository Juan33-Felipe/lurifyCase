package com.iurify.casebackend.application.exception;

public class EmailConflictException extends EmailAlreadyExistsException {

    public EmailConflictException() {
        super();
    }

    public EmailConflictException(String message) {
        super(message);
    }
}
