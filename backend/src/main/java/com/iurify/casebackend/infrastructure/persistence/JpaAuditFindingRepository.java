package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.infrastructure.persistence.entity.AuditFindingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface JpaAuditFindingRepository extends JpaRepository<AuditFindingEntity, UUID> {
    List<AuditFindingEntity> findByAuditIdOrderByCreatedAtAsc(UUID auditId);
}
