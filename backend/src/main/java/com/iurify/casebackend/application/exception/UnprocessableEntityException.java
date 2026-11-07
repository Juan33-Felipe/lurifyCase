package com.iurify.casebackend.application.exception;

public class UnprocessableEntityException extends RuntimeException {
    private final String code;

    public UnprocessableEntityException(String message) {
        this("UNPROCESSABLE_ENTITY", message);
    }

    public UnprocessableEntityException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() { return code; }
}
