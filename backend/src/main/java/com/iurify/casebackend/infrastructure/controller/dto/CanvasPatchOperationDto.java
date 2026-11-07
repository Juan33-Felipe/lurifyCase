package com.iurify.casebackend.infrastructure.controller.dto;

import java.util.Map;
import java.util.UUID;

public class CanvasPatchOperationDto {
    private String op;
    private Map<String, Object> node;
    private UUID nodeId;
    private Map<String, Object> patch;
    private Map<String, Object> position;
    private Map<String, Object> edge;
    private UUID edgeId;

    public CanvasPatchOperationDto() {}

    public String getOp() { return op; }
    public void setOp(String op) { this.op = op; }
    public Map<String, Object> getNode() { return node; }
    public void setNode(Map<String, Object> node) { this.node = node; }
    public UUID getNodeId() { return nodeId; }
    public void setNodeId(UUID nodeId) { this.nodeId = nodeId; }
    public Map<String, Object> getPatch() { return patch; }
    public void setPatch(Map<String, Object> patch) { this.patch = patch; }
    public Map<String, Object> getPosition() { return position; }
    public void setPosition(Map<String, Object> position) { this.position = position; }
    public Map<String, Object> getEdge() { return edge; }
    public void setEdge(Map<String, Object> edge) { this.edge = edge; }
    public UUID getEdgeId() { return edgeId; }
    public void setEdgeId(UUID edgeId) { this.edgeId = edgeId; }
}
