package com.iurify.casebackend.infrastructure.persistence.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_findings")
public class AuditFindingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "audit_id", nullable = false)
    private UUID auditId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "vulnerability_type", columnDefinition = "vulnerability_type_enum", nullable = false)
    private VulnerabilityTypeEnum vulnerabilityType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "severity", columnDefinition = "severity_level_enum", nullable = false)
    private SeverityLevelEnum severity;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(length = 2000)
    private String recommendation;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "affected_node_ids", columnDefinition = "uuid[]", nullable = false)
    private UUID[] affectedNodeIds = new UUID[0];

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "affected_edge_ids", columnDefinition = "uuid[]", nullable = false)
    private UUID[] affectedEdgeIds = new UUID[0];

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.affectedNodeIds == null) {
            this.affectedNodeIds = new UUID[0];
        }
        if (this.affectedEdgeIds == null) {
            this.affectedEdgeIds = new UUID[0];
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAuditId() { return auditId; }
    public void setAuditId(UUID auditId) { this.auditId = auditId; }
    public VulnerabilityTypeEnum getVulnerabilityType() { return vulnerabilityType; }
    public void setVulnerabilityType(VulnerabilityTypeEnum vulnerabilityType) { this.vulnerabilityType = vulnerabilityType; }
    public SeverityLevelEnum getSeverity() { return severity; }
    public void setSeverity(SeverityLevelEnum severity) { this.severity = severity; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    public UUID[] getAffectedNodeIds() { return affectedNodeIds; }
    public void setAffectedNodeIds(UUID[] affectedNodeIds) { this.affectedNodeIds = affectedNodeIds; }
    public UUID[] getAffectedEdgeIds() { return affectedEdgeIds; }
    public void setAffectedEdgeIds(UUID[] affectedEdgeIds) { this.affectedEdgeIds = affectedEdgeIds; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
