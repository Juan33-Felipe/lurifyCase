package com.iurify.casebackend.infrastructure.controller.dto;

import java.util.Map;

public class AuditRequestDto {
    private Long canvasVersion;
    private Map<String, Object> canvas;
    private Map<String, Object> graphData;

    public AuditRequestDto() {}

    public Long getCanvasVersion() { return canvasVersion; }
    public void setCanvasVersion(Long canvasVersion) { this.canvasVersion = canvasVersion; }
    public Map<String, Object> getCanvas() { return canvas; }
    public void setCanvas(Map<String, Object> canvas) { this.canvas = canvas; }
    public Map<String, Object> getGraphData() { return graphData; }
    public void setGraphData(Map<String, Object> graphData) { this.graphData = graphData; }
}
