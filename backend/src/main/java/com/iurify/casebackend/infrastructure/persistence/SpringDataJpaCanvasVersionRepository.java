package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.domain.model.CanvasVersion;
import com.iurify.casebackend.domain.repository.CanvasVersionRepository;
import com.iurify.casebackend.infrastructure.persistence.entity.CanvasOriginEnum;
import com.iurify.casebackend.infrastructure.persistence.entity.CanvasVersionEntity;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class SpringDataJpaCanvasVersionRepository implements CanvasVersionRepository {

    private final JpaCanvasVersionRepository jpaRepository;

    public SpringDataJpaCanvasVersionRepository(JpaCanvasVersionRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<CanvasVersion> findLatestByCaseId(UUID caseId) {
        return jpaRepository.findFirstByCaseIdOrderByVersionNumberDesc(caseId)
                .map(this::toDomain);
    }

    @Override
    public Optional<CanvasVersion> findByCaseIdAndVersionNumber(UUID caseId, Long versionNumber) {
        return jpaRepository.findByCaseIdAndVersionNumber(caseId, versionNumber)
                .map(this::toDomain);
    }

    @Override
    public CanvasVersion save(CanvasVersion canvasVersion) {
        CanvasVersionEntity entity = toEntity(canvasVersion);
        CanvasVersionEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    private CanvasVersion toDomain(CanvasVersionEntity entity) {
        return new CanvasVersion(
                entity.getId(),
                entity.getCaseId(),
                entity.getVersionNumber(),
                entity.getParentVersionId(),
                entity.getOrigin() != null ? entity.getOrigin().name() : "USER_CREATED",
                entity.getGraphData(),
                entity.getCreatedAt()
        );
    }

    private CanvasVersionEntity toEntity(CanvasVersion domain) {
        CanvasVersionEntity entity = new CanvasVersionEntity();
        entity.setId(domain.getId());
        entity.setCaseId(domain.getCaseId());
        entity.setVersionNumber(domain.getVersionNumber());
        entity.setParentVersionId(domain.getParentVersionId());
        entity.setOrigin(CanvasOriginEnum.fromDomain(domain.getOrigin()));
        entity.setGraphData(domain.getGraphData());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}
