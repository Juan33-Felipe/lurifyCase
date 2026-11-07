package com.iurify.casebackend.infrastructure.controller.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class CanvasSnapshotDto {
    private UUID caseId;
    private Long version;
    private Instant updatedAt;
    private Map<String, Object> canvas;

    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Map<String, Object> getCanvas() { return canvas; }
    public void setCanvas(Map<String, Object> canvas) { this.canvas = canvas; }
}
