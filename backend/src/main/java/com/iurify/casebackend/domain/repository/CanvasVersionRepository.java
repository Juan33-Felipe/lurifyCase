package com.iurify.casebackend.domain.repository;

import com.iurify.casebackend.domain.model.CanvasVersion;

import java.util.Optional;
import java.util.UUID;

public interface CanvasVersionRepository {
    Optional<CanvasVersion> findLatestByCaseId(UUID caseId);
    Optional<CanvasVersion> findByCaseIdAndVersionNumber(UUID caseId, Long versionNumber);
    CanvasVersion save(CanvasVersion canvasVersion);
}
