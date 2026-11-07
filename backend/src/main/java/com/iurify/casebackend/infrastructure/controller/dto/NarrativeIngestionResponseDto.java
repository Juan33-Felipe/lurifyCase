package com.iurify.casebackend.infrastructure.controller.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class NarrativeIngestionResponseDto {
    private UUID caseId;
    private String transcription;
    private List<Map<String, Object>> extractedNodes;
    private List<Map<String, Object>> extractedEdges;
    private CanvasSnapshotDto snapshot;
    private Long version;
    private Map<String, Object> canvas;

    public NarrativeIngestionResponseDto() {}

    public NarrativeIngestionResponseDto(
            UUID caseId,
            String transcription,
            List<Map<String, Object>> extractedNodes,
            List<Map<String, Object>> extractedEdges,
            CanvasSnapshotDto snapshot
    ) {
        this.caseId = caseId;
        this.transcription = transcription;
        this.extractedNodes = extractedNodes;
        this.extractedEdges = extractedEdges;
        this.snapshot = snapshot;
        if (snapshot != null) {
            this.version = snapshot.getVersion();
            this.canvas = snapshot.getCanvas();
        }
    }

    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public String getTranscription() { return transcription; }
    public void setTranscription(String transcription) { this.transcription = transcription; }
    public List<Map<String, Object>> getExtractedNodes() { return extractedNodes; }
    public void setExtractedNodes(List<Map<String, Object>> extractedNodes) { this.extractedNodes = extractedNodes; }
    public List<Map<String, Object>> getExtractedEdges() { return extractedEdges; }
    public void setExtractedEdges(List<Map<String, Object>> extractedEdges) { this.extractedEdges = extractedEdges; }
    public CanvasSnapshotDto getSnapshot() { return snapshot; }
    public void setSnapshot(CanvasSnapshotDto snapshot) { this.snapshot = snapshot; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
    public Map<String, Object> getCanvas() { return canvas; }
    public void setCanvas(Map<String, Object> canvas) { this.canvas = canvas; }
}
