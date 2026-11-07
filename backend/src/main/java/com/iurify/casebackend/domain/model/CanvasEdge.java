package com.iurify.casebackend.domain.model;

import java.util.UUID;

public class CanvasEdge {
    private UUID id;
    private UUID sourceNodeId;
    private UUID targetNodeId;
    private String relationType;
    private String label;
    private Double strength;

    public CanvasEdge() {}

    public CanvasEdge(UUID id, UUID sourceNodeId, UUID targetNodeId,
                      String relationType, String label, Double strength) {
        this.id = id;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.relationType = relationType;
        this.label = label;
        this.strength = strength;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSourceNodeId() { return sourceNodeId; }
    public void setSourceNodeId(UUID sourceNodeId) { this.sourceNodeId = sourceNodeId; }
    public UUID getTargetNodeId() { return targetNodeId; }
    public void setTargetNodeId(UUID targetNodeId) { this.targetNodeId = targetNodeId; }
    public String getRelationType() { return relationType; }
    public void setRelationType(String relationType) { this.relationType = relationType; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public Double getStrength() { return strength; }
    public void setStrength(Double strength) { this.strength = strength; }
}
