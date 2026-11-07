package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.domain.model.LegalDocument;
import com.iurify.casebackend.domain.repository.LegalDocumentRepository;
import com.iurify.casebackend.infrastructure.persistence.entity.DocumentStatusEnum;
import com.iurify.casebackend.infrastructure.persistence.entity.DocumentTypeEnum;
import com.iurify.casebackend.infrastructure.persistence.entity.LegalDocumentEntity;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class SpringDataJpaLegalDocumentRepository implements LegalDocumentRepository {

    private final JpaLegalDocumentRepository jpaRepository;

    public SpringDataJpaLegalDocumentRepository(JpaLegalDocumentRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public LegalDocument save(LegalDocument document) {
        LegalDocumentEntity entity = toEntity(document);
        LegalDocumentEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<LegalDocument> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<LegalDocument> findByIdAndCaseId(UUID id, UUID caseId) {
        return jpaRepository.findByIdAndCaseId(id, caseId).map(this::toDomain);
    }

    @Override
    public List<LegalDocument> findByCaseId(UUID caseId) {
        return jpaRepository.findByCaseIdOrderByRequestedAtDesc(caseId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private LegalDocument toDomain(LegalDocumentEntity entity) {
        return new LegalDocument(
                entity.getId(),
                entity.getCaseId(),
                entity.getTitle(),
                entity.getDocumentType() != null ? entity.getDocumentType().name() : "LEGAL_BRIEF",
                entity.getStatus() != null ? entity.getStatus().name() : "PENDING",
                entity.getLanguage(),
                entity.getSourceCanvasVersion(),
                entity.getInstructions(),
                entity.getContentFormat(),
                entity.getContentBody(),
                entity.getStoragePath(),
                entity.getFailureCode(),
                entity.getFailureMessage(),
                entity.getRequestedAt(),
                entity.getCompletedAt(),
                entity.getUpdatedAt()
        );
    }

    private LegalDocumentEntity toEntity(LegalDocument domain) {
        LegalDocumentEntity entity = new LegalDocumentEntity();
        entity.setId(domain.getId());
        entity.setCaseId(domain.getCaseId());
        entity.setTitle(domain.getTitle());
        entity.setDocumentType(DocumentTypeEnum.fromDomain(domain.getDocumentType()));
        entity.setStatus(DocumentStatusEnum.fromDomain(domain.getStatus()));
        entity.setLanguage(domain.getLanguage() != null ? domain.getLanguage() : "es-PE");
        entity.setSourceCanvasVersion(domain.getSourceCanvasVersion() != null ? domain.getSourceCanvasVersion() : 1L);
        entity.setInstructions(domain.getInstructions());
        entity.setContentFormat(domain.getContentFormat() != null ? domain.getContentFormat() : "MARKDOWN");
        entity.setContentBody(domain.getContentBody());
        entity.setStoragePath(domain.getStoragePath());
        entity.setFailureCode(domain.getFailureCode());
        entity.setFailureMessage(domain.getFailureMessage());
        entity.setRequestedAt(domain.getRequestedAt());
        entity.setCompletedAt(domain.getCompletedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        return entity;
    }
}
