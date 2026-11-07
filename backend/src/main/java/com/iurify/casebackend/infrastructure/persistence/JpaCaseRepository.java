package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.infrastructure.persistence.entity.CaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaCaseRepository extends JpaRepository<CaseEntity, UUID> {
    List<CaseEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<CaseEntity> findAllByOrderByCreatedAtDesc();
    boolean existsByDossierNumber(String dossierNumber);
}
