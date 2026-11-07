package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.infrastructure.persistence.entity.CanvasVersionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface JpaCanvasVersionRepository extends JpaRepository<CanvasVersionEntity, UUID> {
    Optional<CanvasVersionEntity> findFirstByCaseIdOrderByVersionNumberDesc(UUID caseId);
    Optional<CanvasVersionEntity> findByCaseIdAndVersionNumber(UUID caseId, Long versionNumber);
}
