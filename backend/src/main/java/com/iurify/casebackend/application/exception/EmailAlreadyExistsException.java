package com.iurify.casebackend.application.exception;

public class EmailAlreadyExistsException extends ConflictException {

    public EmailAlreadyExistsException() {
        this("Email already registered");
    }

    public EmailAlreadyExistsException(String message) {
        super("EMAIL_ALREADY_REGISTERED", message);
    }
}
