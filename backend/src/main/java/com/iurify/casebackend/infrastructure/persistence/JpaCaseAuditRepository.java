package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.infrastructure.persistence.entity.CaseAuditEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaCaseAuditRepository extends JpaRepository<CaseAuditEntity, UUID> {
    List<CaseAuditEntity> findByCaseIdOrderByCreatedAtDesc(UUID caseId);
}
