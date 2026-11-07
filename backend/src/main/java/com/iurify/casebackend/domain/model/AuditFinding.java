package com.iurify.casebackend.domain.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AuditFinding {
    private UUID id;
    private UUID auditId;
    private String vulnerabilityType;
    private String severity;
    private String title;
    private String description;
    private String recommendation;
    private List<UUID> affectedNodeIds = new ArrayList<>();
    private List<UUID> affectedEdgeIds = new ArrayList<>();
    private Instant createdAt;

    public AuditFinding() {}

    public AuditFinding(UUID id, UUID auditId, String vulnerabilityType,
                        String severity, String title, String description,
                        String recommendation, List<UUID> affectedNodeIds,
                        List<UUID> affectedEdgeIds, Instant createdAt) {
        this.id = id;
        this.auditId = auditId;
        this.vulnerabilityType = vulnerabilityType;
        this.severity = severity;
        this.title = title;
        this.description = description;
        this.recommendation = recommendation;
        this.affectedNodeIds = affectedNodeIds != null ? affectedNodeIds : new ArrayList<>();
        this.affectedEdgeIds = affectedEdgeIds != null ? affectedEdgeIds : new ArrayList<>();
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuditId() { return auditId; }
    public void setAuditId(UUID auditId) { this.auditId = auditId; }
    public String getVulnerabilityType() { return vulnerabilityType; }
    public void setVulnerabilityType(String vulnerabilityType) { this.vulnerabilityType = vulnerabilityType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public List<UUID> getAffectedNodeIds() { return affectedNodeIds; }
    public void setAffectedNodeIds(List<UUID> affectedNodeIds) { this.affectedNodeIds = affectedNodeIds; }
    public List<UUID> getAffectedEdgeIds() { return affectedEdgeIds; }
    public void setAffectedEdgeIds(List<UUID> affectedEdgeIds) { this.affectedEdgeIds = affectedEdgeIds; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
