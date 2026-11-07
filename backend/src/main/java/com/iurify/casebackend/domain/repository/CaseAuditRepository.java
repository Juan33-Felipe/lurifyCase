package com.iurify.casebackend.domain.repository;

import com.iurify.casebackend.domain.model.CaseAudit;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CaseAuditRepository {
    CaseAudit save(CaseAudit caseAudit);
    List<CaseAudit> findByCaseId(UUID caseId);
    Optional<CaseAudit> findById(UUID id);
}
