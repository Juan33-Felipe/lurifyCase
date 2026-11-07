package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.domain.model.CaseAudit;
import com.iurify.casebackend.domain.repository.CaseAuditRepository;
import com.iurify.casebackend.infrastructure.persistence.entity.CaseAuditEntity;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class SpringDataJpaCaseAuditRepository implements CaseAuditRepository {

    private final JpaCaseAuditRepository jpaRepository;

    public SpringDataJpaCaseAuditRepository(JpaCaseAuditRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public CaseAudit save(CaseAudit caseAudit) {
        CaseAuditEntity entity = toEntity(caseAudit);
        CaseAuditEntity saved = jpaRepository.save(entity);
        CaseAudit result = toDomain(saved);
        result.setFindings(caseAudit.getFindings());
        return result;
    }

    @Override
    public List<CaseAudit> findByCaseId(UUID caseId) {
        return jpaRepository.findByCaseIdOrderByCreatedAtDesc(caseId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<CaseAudit> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    private CaseAudit toDomain(CaseAuditEntity entity) {
        return new CaseAudit(
                entity.getId(),
                entity.getCaseId(),
                entity.getCanvasVersionId(),
                entity.getSolidityScore(),
                entity.getCreatedAt()
        );
    }

    private CaseAuditEntity toEntity(CaseAudit domain) {
        CaseAuditEntity entity = new CaseAuditEntity();
        entity.setId(domain.getId());
        entity.setCaseId(domain.getCaseId());
        entity.setCanvasVersionId(domain.getCanvasVersionId());
        entity.setSolidityScore(domain.getSolidityScore());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}
