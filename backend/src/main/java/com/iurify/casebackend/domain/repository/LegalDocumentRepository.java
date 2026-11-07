package com.iurify.casebackend.domain.repository;

import com.iurify.casebackend.domain.model.LegalDocument;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LegalDocumentRepository {
    LegalDocument save(LegalDocument document);
    Optional<LegalDocument> findById(UUID id);
    Optional<LegalDocument> findByIdAndCaseId(UUID id, UUID caseId);
    List<LegalDocument> findByCaseId(UUID caseId);
}
