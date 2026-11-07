package com.iurify.casebackend.domain.model;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public class CanvasNode {
    private UUID id;
    private String type;
    private String title;
    private String summary;
    private Position position;
    private Double confidence;
    private List<String> tags;
    private Map<String, Object> metadata;

    public CanvasNode() {}

    public CanvasNode(UUID id, String type, String title, String summary,
                      Position position, Double confidence, List<String> tags,
                      Map<String, Object> metadata) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.summary = summary;
        this.position = position;
        this.confidence = confidence;
        this.tags = tags;
        this.metadata = metadata;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public Position getPosition() { return position; }
    public void setPosition(Position position) { this.position = position; }
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
