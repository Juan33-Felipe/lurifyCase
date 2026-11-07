package com.iurify.casebackend.infrastructure.controller.dto;

public class CanvasConflictErrorDto extends ErrorDto {
    private Long currentVersion;
    private CanvasSnapshotDto latestSnapshot;

    public CanvasConflictErrorDto(String code, String message, String traceId,
                                  boolean retryable, Long currentVersion,
                                  CanvasSnapshotDto latestSnapshot) {
        super(code, message, traceId, retryable);
        this.currentVersion = currentVersion;
        this.latestSnapshot = latestSnapshot;
    }

    public Long getCurrentVersion() { return currentVersion; }
    public CanvasSnapshotDto getLatestSnapshot() { return latestSnapshot; }
}
