package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.infrastructure.persistence.entity.LegalDocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JpaLegalDocumentRepository extends JpaRepository<LegalDocumentEntity, UUID> {
    List<LegalDocumentEntity> findByCaseIdOrderByRequestedAtDesc(UUID caseId);
    Optional<LegalDocumentEntity> findByIdAndCaseId(UUID id, UUID caseId);
}
