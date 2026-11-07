package com.iurify.casebackend.application.service;

import com.iurify.casebackend.application.exception.ResourceNotFoundException;
import com.iurify.casebackend.application.exception.UnprocessableEntityException;
import com.iurify.casebackend.domain.model.CanvasVersion;
import com.iurify.casebackend.domain.model.Case;
import com.iurify.casebackend.domain.repository.CanvasVersionRepository;
import com.iurify.casebackend.domain.repository.CaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.Year;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class CaseService {

    private static final UUID DEFAULT_DEMO_USER_ID = UUID.fromString("a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d");

    private final CaseRepository caseRepository;
    private final CanvasVersionRepository canvasVersionRepository;

    public CaseService(CaseRepository caseRepository, CanvasVersionRepository canvasVersionRepository) {
        this.caseRepository = caseRepository;
        this.canvasVersionRepository = canvasVersionRepository;
    }

    public List<Case> listAllCases() {
        return caseRepository.findAll();
    }

    public List<Case> listCases(UUID userId, String statusFilter, Integer limit) {
        List<Case> cases = (userId != null)
                ? caseRepository.findByUserId(userId)
                : caseRepository.findAll();
        if (cases.isEmpty() && userId != null) {
            cases = caseRepository.findAll();
        }
        if (statusFilter != null && !statusFilter.isBlank()) {
            String normalizedStatus = statusFilter.trim().toUpperCase();
            cases = cases.stream()
                    .filter(c -> normalizedStatus.equalsIgnoreCase(c.getStatus()))
                    .collect(Collectors.toList());
        }
        if (limit != null && limit > 0 && cases.size() > limit) {
            return cases.subList(0, limit);
        }
        return cases;
    }

    public Case getCaseById(UUID id) {
        return caseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));
    }

    @Transactional
    public Case createCase(
            UUID userId,
            String title,
            String description,
            String dossierNumber,
            String jurisdiction,
            String clientReference,
            Boolean isSealed
    ) {
        if (title == null || title.isBlank()) {
            throw new UnprocessableEntityException("INVALID_CASE_TITLE", "Case title is required.");
        }

        UUID ownerId = userId != null ? userId : DEFAULT_DEMO_USER_ID;
        String resolvedDossier = resolveUniqueDossierNumber(dossierNumber);
        Instant now = Instant.now();

        Case newCase = new Case(
                null,
                ownerId,
                resolvedDossier,
                title.trim(),
                description,
                jurisdiction != null && !jurisdiction.isBlank() ? jurisdiction.trim() : "General Legal Jurisdiction",
                "ACTIVE",
                new BigDecimal("0.00"),
                isSealed != null ? isSealed : false,
                clientReference,
                1L,
                now,
                now
        );

        Case savedCase = caseRepository.save(newCase);

        Map<String, Object> emptyGraph = new LinkedHashMap<>();
        emptyGraph.put("schemaVersion", "1.0.0");
        emptyGraph.put("nodes", new ArrayList<>());
        emptyGraph.put("edges", new ArrayList<>());

        CanvasVersion initialCanvas = new CanvasVersion(
                null,
                savedCase.getId(),
                1L,
                null,
                "USER_CREATED",
                emptyGraph,
                now
        );
        canvasVersionRepository.save(initialCanvas);

        return savedCase;
    }

    @Transactional
    public Case updateCase(
            UUID id,
            String title,
            String description,
            String jurisdiction,
            String status,
            String clientReference,
            Boolean isSealed,
            BigDecimal trialReadinessScore
    ) {
        Case existing = getCaseById(id);

        if (title != null && !title.isBlank()) {
            existing.setTitle(title.trim());
        }
        if (description != null) {
            existing.setDescription(description);
        }
        if (jurisdiction != null) {
            existing.setJurisdiction(jurisdiction);
        }
        if (status != null && !status.isBlank()) {
            existing.setStatus(status.trim().toUpperCase());
        }
        if (clientReference != null) {
            existing.setClientReference(clientReference);
        }
        if (isSealed != null) {
            existing.setIsSealed(isSealed);
        }
        if (trialReadinessScore != null) {
            existing.setTrialReadinessScore(trialReadinessScore);
        }
        existing.setUpdatedAt(Instant.now());

        return caseRepository.save(existing);
    }

    @Transactional
    public void deleteCase(UUID id) {
        Case existing = getCaseById(id);
        caseRepository.deleteById(existing.getId());
    }

    private String resolveUniqueDossierNumber(String requestedDossier) {
        if (requestedDossier != null && !requestedDossier.isBlank()) {
            String trimmed = requestedDossier.trim();
            if (caseRepository.existsByDossierNumber(trimmed)) {
                throw new UnprocessableEntityException("DUPLICATE_DOSSIER_NUMBER",
                        "A case with dossier number '" + trimmed + "' already exists.");
            }
            return trimmed;
        }
        int year = Year.now().getValue();
        for (int attempt = 0; attempt < 20; attempt++) {
            int randomNum = ThreadLocalRandom.current().nextInt(100, 9999);
            String candidate = String.format("LEX-%d-%03d", year, randomNum);
            if (!caseRepository.existsByDossierNumber(candidate)) {
                return candidate;
            }
        }
        return "LEX-" + year + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
