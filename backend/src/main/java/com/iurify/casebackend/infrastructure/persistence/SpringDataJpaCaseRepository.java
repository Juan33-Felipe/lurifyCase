package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.domain.model.Case;
import com.iurify.casebackend.domain.repository.CaseRepository;
import com.iurify.casebackend.infrastructure.persistence.entity.CaseEntity;
import com.iurify.casebackend.infrastructure.persistence.entity.CaseStatusEnum;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class SpringDataJpaCaseRepository implements CaseRepository {

    private final JpaCaseRepository jpaRepository;

    public SpringDataJpaCaseRepository(JpaCaseRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public List<Case> findAll() {
        return jpaRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Case> findByUserId(UUID userId) {
        return jpaRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Case> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Case save(Case caseModel) {
        CaseEntity entity = toEntity(caseModel);
        CaseEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByDossierNumber(String dossierNumber) {
        return jpaRepository.existsByDossierNumber(dossierNumber);
    }

    private Case toDomain(CaseEntity entity) {
        return new Case(
                entity.getId(),
                entity.getUserId(),
                entity.getDossierNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getJurisdiction(),
                entity.getStatus() != null ? entity.getStatus().name() : "ACTIVE",
                entity.getTrialReadinessScore(),
                entity.getIsSealed(),
                entity.getClientReference(),
                entity.getCanvasVersion(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private CaseEntity toEntity(Case domain) {
        CaseEntity entity = new CaseEntity();
        entity.setId(domain.getId());
        entity.setUserId(domain.getUserId());
        entity.setDossierNumber(domain.getDossierNumber());
        entity.setTitle(domain.getTitle());
        entity.setDescription(domain.getDescription());
        entity.setJurisdiction(domain.getJurisdiction());
        entity.setStatus(CaseStatusEnum.fromDomain(domain.getStatus()));
        entity.setTrialReadinessScore(domain.getTrialReadinessScore());
        entity.setIsSealed(domain.getIsSealed() != null ? domain.getIsSealed() : false);
        entity.setClientReference(domain.getClientReference());
        entity.setCanvasVersion(domain.getCanvasVersion() != null ? domain.getCanvasVersion() : 0L);
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        return entity;
    }
}
