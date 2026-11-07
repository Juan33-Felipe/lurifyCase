package com.iurify.casebackend.infrastructure.controller.dto;

import java.util.List;
import java.util.Map;

public class CanvasSyncRequestDto {
    private Long baseVersion;
    private Long parentVersion;
    private List<CanvasPatchOperationDto> operations;
    private Map<String, Object> graphData;
    private Map<String, Object> canvas;
    private List<Map<String, Object>> nodes;
    private List<Map<String, Object>> edges;

    public CanvasSyncRequestDto() {}

    public Long resolveExpectedVersion() {
        return baseVersion != null ? baseVersion : parentVersion;
    }

    public Long getBaseVersion() { return baseVersion; }
    public void setBaseVersion(Long baseVersion) { this.baseVersion = baseVersion; }
    public Long getParentVersion() { return parentVersion; }
    public void setParentVersion(Long parentVersion) { this.parentVersion = parentVersion; }
    public List<CanvasPatchOperationDto> getOperations() { return operations; }
    public void setOperations(List<CanvasPatchOperationDto> operations) { this.operations = operations; }
    public Map<String, Object> getGraphData() { return graphData; }
    public void setGraphData(Map<String, Object> graphData) { this.graphData = graphData; }
    public Map<String, Object> getCanvas() { return canvas; }
    public void setCanvas(Map<String, Object> canvas) { this.canvas = canvas; }
    public List<Map<String, Object>> getNodes() { return nodes; }
    public void setNodes(List<Map<String, Object>> nodes) { this.nodes = nodes; }
    public List<Map<String, Object>> getEdges() { return edges; }
    public void setEdges(List<Map<String, Object>> edges) { this.edges = edges; }
}
