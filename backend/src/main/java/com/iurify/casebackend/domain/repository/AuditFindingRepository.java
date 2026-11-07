package com.iurify.casebackend.domain.repository;

import com.iurify.casebackend.domain.model.AuditFinding;

import java.util.List;
import java.util.UUID;

public interface AuditFindingRepository {
    List<AuditFinding> saveAll(List<AuditFinding> findings);
    List<AuditFinding> findByAuditId(UUID auditId);
}
