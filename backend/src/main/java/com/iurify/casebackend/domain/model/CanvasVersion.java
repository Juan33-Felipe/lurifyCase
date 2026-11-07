package com.iurify.casebackend.domain.model;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class CanvasVersion {
    private UUID id;
    private UUID caseId;
    private Long versionNumber;
    private UUID parentVersionId;
    private String origin;
    private Map<String, Object> graphData;
    private Instant createdAt;

    public CanvasVersion() {}

    public CanvasVersion(UUID id, UUID caseId, Long versionNumber, UUID parentVersionId, 
                         String origin, Map<String, Object> graphData, Instant createdAt) {
        this.id = id;
        this.caseId = caseId;
        this.versionNumber = versionNumber;
        this.parentVersionId = parentVersionId;
        this.origin = origin;
        this.graphData = graphData;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public Long getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Long versionNumber) { this.versionNumber = versionNumber; }
    public UUID getParentVersionId() { return parentVersionId; }
    public void setParentVersionId(UUID parentVersionId) { this.parentVersionId = parentVersionId; }
    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }
    public Map<String, Object> getGraphData() { return graphData; }
    public void setGraphData(Map<String, Object> graphData) { this.graphData = graphData; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
