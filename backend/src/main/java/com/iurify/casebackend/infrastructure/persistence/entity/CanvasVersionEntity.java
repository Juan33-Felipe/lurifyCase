package com.iurify.casebackend.infrastructure.persistence.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Type;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "canvas_versions")
public class CanvasVersionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "version_number", nullable = false)
    private Long versionNumber;

    @Column(name = "parent_version_id")
    private UUID parentVersionId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "origin", columnDefinition = "canvas_origin_enum", nullable = false)
    private CanvasOriginEnum origin = CanvasOriginEnum.USER_CREATED;

    @Type(JsonType.class)
    @Column(name = "graph_data", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> graphData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.origin == null) {
            this.origin = CanvasOriginEnum.USER_CREATED;
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public Long getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Long versionNumber) { this.versionNumber = versionNumber; }
    public UUID getParentVersionId() { return parentVersionId; }
    public void setParentVersionId(UUID parentVersionId) { this.parentVersionId = parentVersionId; }
    public CanvasOriginEnum getOrigin() { return origin; }
    public void setOrigin(CanvasOriginEnum origin) { this.origin = origin; }
    public Map<String, Object> getGraphData() { return graphData; }
    public void setGraphData(Map<String, Object> graphData) { this.graphData = graphData; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
