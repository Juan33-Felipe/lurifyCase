package com.iurify.casebackend.infrastructure.controller.dto;

import java.time.Instant;

public class ErrorDto {
    private String type;
    private String title;
    private int status;
    private String detail;
    private String code;
    private String message;
    private String traceId;
    private boolean retryable;
    private Instant timestamp;

    public ErrorDto() {}

    public ErrorDto(String code, String message, String traceId, boolean retryable) {
        this("about:blank", code, 400, message, code, message, traceId, retryable);
    }

    public ErrorDto(
            String type,
            String title,
            int status,
            String detail,
            String code,
            String message,
            String traceId,
            boolean retryable
    ) {
        this.type = type;
        this.title = title;
        this.status = status;
        this.detail = detail;
        this.code = code;
        this.message = message;
        this.traceId = traceId;
        this.retryable = retryable;
        this.timestamp = Instant.now();
    }

    public String getType() { return type; }
    public String getTitle() { return title; }
    public int getStatus() { return status; }
    public String getDetail() { return detail; }
    public String getCode() { return code; }
    public String getMessage() { return message; }
    public String getTraceId() { return traceId; }
    public boolean isRetryable() { return retryable; }
    public Instant getTimestamp() { return timestamp; }
}
