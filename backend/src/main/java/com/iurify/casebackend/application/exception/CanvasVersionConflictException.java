package com.iurify.casebackend.application.exception;

import com.iurify.casebackend.domain.model.CanvasVersion;

import java.util.UUID;

public class CanvasVersionConflictException extends RuntimeException {
    private final UUID caseId;
    private final Long expectedVersion;
    private final Long currentVersion;
    private final CanvasVersion latestCanvasVersion;

    public CanvasVersionConflictException(String message, UUID caseId, Long expectedVersion,
                                          Long currentVersion, CanvasVersion latestCanvasVersion) {
        super(message);
        this.caseId = caseId;
        this.expectedVersion = expectedVersion;
        this.currentVersion = currentVersion;
        this.latestCanvasVersion = latestCanvasVersion;
    }

    public UUID getCaseId() { return caseId; }
    public Long getExpectedVersion() { return expectedVersion; }
    public Long getCurrentVersion() { return currentVersion; }
    public CanvasVersion getLatestCanvasVersion() { return latestCanvasVersion; }
}
