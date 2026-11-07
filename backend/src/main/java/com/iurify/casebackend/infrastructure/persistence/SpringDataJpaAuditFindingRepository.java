package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.domain.model.AuditFinding;
import com.iurify.casebackend.domain.repository.AuditFindingRepository;
import com.iurify.casebackend.infrastructure.persistence.entity.AuditFindingEntity;
import com.iurify.casebackend.infrastructure.persistence.entity.SeverityLevelEnum;
import com.iurify.casebackend.infrastructure.persistence.entity.VulnerabilityTypeEnum;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class SpringDataJpaAuditFindingRepository implements AuditFindingRepository {

    private final JpaAuditFindingRepository jpaRepository;

    public SpringDataJpaAuditFindingRepository(JpaAuditFindingRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<AuditFinding> saveAll(List<AuditFinding> findings) {
        List<AuditFindingEntity> entities = findings.stream()
                .map(this::toEntity)
                .collect(Collectors.toList());
        return jpaRepository.saveAll(entities).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<AuditFinding> findByAuditId(UUID auditId) {
        return jpaRepository.findByAuditIdOrderByCreatedAtAsc(auditId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private AuditFinding toDomain(AuditFindingEntity entity) {
        List<UUID> nodeIds = entity.getAffectedNodeIds() != null
                ? new ArrayList<>(Arrays.asList(entity.getAffectedNodeIds()))
                : new ArrayList<>();
        List<UUID> edgeIds = entity.getAffectedEdgeIds() != null
                ? new ArrayList<>(Arrays.asList(entity.getAffectedEdgeIds()))
                : new ArrayList<>();
        return new AuditFinding(
                entity.getId(),
                entity.getAuditId(),
                entity.getVulnerabilityType() != null ? entity.getVulnerabilityType().name() : "STRUCTURAL_ISSUE",
                entity.getSeverity() != null ? entity.getSeverity().name() : "MEDIUM",
                entity.getTitle(),
                entity.getDescription(),
                entity.getRecommendation(),
                nodeIds,
                edgeIds,
                entity.getCreatedAt()
        );
    }

    private AuditFindingEntity toEntity(AuditFinding domain) {
        AuditFindingEntity entity = new AuditFindingEntity();
        entity.setId(domain.getId());
        entity.setAuditId(domain.getAuditId());
        entity.setVulnerabilityType(VulnerabilityTypeEnum.fromDomain(domain.getVulnerabilityType()));
        entity.setSeverity(SeverityLevelEnum.fromDomain(domain.getSeverity()));
        entity.setTitle(domain.getTitle());
        entity.setDescription(domain.getDescription());
        entity.setRecommendation(domain.getRecommendation());
        entity.setAffectedNodeIds(domain.getAffectedNodeIds() != null
                ? domain.getAffectedNodeIds().toArray(new UUID[0])
                : new UUID[0]);
        entity.setAffectedEdgeIds(domain.getAffectedEdgeIds() != null
                ? domain.getAffectedEdgeIds().toArray(new UUID[0])
                : new UUID[0]);
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}
