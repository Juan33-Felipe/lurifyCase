package com.iurify.casebackend.application.service;

import com.iurify.casebackend.application.exception.ResourceNotFoundException;
import com.iurify.casebackend.application.port.IAClient;
import com.iurify.casebackend.domain.model.AuditFinding;
import com.iurify.casebackend.domain.model.CanvasVersion;
import com.iurify.casebackend.domain.model.Case;
import com.iurify.casebackend.domain.model.CaseAudit;
import com.iurify.casebackend.domain.repository.AuditFindingRepository;
import com.iurify.casebackend.domain.repository.CanvasVersionRepository;
import com.iurify.casebackend.domain.repository.CaseAuditRepository;
import com.iurify.casebackend.domain.repository.CaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    private static final String AUDIT_SYSTEM_PROMPT = """
            You are an Adversarial Senior Legal Auditor AI for Iurify Case.
            Analyze the provided legal strategy canvas (nodes and edges) for:
            - PROCEDURAL_GAP
            - LOGICAL_CONTRADICTION
            - EVIDENCE_CONFLICT
            - UNSUPPORTED_FACT
            - MISSING_LEGAL_BASIS
            - CASE_THEORY_WEAKNESS
            - STRUCTURAL_ISSUE
            Return JSON with:
            {
              "solidityScore": 0-100,
              "summary": "...",
              "alerts": [
                {
                  "type": "UNSUPPORTED_FACT|EVIDENCE_CONFLICT|...",
                  "severity": "HIGH|MEDIUM|LOW",
                  "title": "...",
                  "description": "...",
                  "recommendation": "...",
                  "affectedNodeIds": ["<UUID>"],
                  "affectedEdgeIds": ["<UUID>"]
                }
              ]
            }
            """;

    private final CaseRepository caseRepository;
    private final CanvasVersionRepository canvasVersionRepository;
    private final CaseAuditRepository caseAuditRepository;
    private final AuditFindingRepository auditFindingRepository;
    private final CanvasService canvasService;
    private final IAClient iaClient;

    public record AuditExecutionOutput(
            CaseAudit audit,
            Long canvasVersionNumber,
            String summary,
            List<AuditFinding> findings
    ) {}

    public AuditService(
            CaseRepository caseRepository,
            CanvasVersionRepository canvasVersionRepository,
            CaseAuditRepository caseAuditRepository,
            AuditFindingRepository auditFindingRepository,
            CanvasService canvasService,
            IAClient iaClient
    ) {
        this.caseRepository = caseRepository;
        this.canvasVersionRepository = canvasVersionRepository;
        this.caseAuditRepository = caseAuditRepository;
        this.auditFindingRepository = auditFindingRepository;
        this.canvasService = canvasService;
        this.iaClient = iaClient;
    }

    @Transactional
    public AuditExecutionOutput runCaseAudit(
            UUID caseId,
            Long requestedCanvasVersion,
            Map<String, Object> inMemoryGraphOverride
    ) {
        Case caseModel = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));

        CanvasVersion targetCanvas = (requestedCanvasVersion != null)
                ? canvasVersionRepository.findByCaseIdAndVersionNumber(caseId, requestedCanvasVersion)
                        .orElseGet(() -> canvasService.getLatestCanvasForCase(caseId))
                : canvasService.getLatestCanvasForCase(caseId);

        Map<String, Object> graphToAudit = (inMemoryGraphOverride != null && !inMemoryGraphOverride.isEmpty())
                ? inMemoryGraphOverride
                : targetCanvas.getGraphData();

        IAClient.AuditEvaluationResult aiEvaluation = iaClient.evaluateCanvasAudit(
                AUDIT_SYSTEM_PROMPT,
                caseModel,
                graphToAudit
        );

        Instant now = Instant.now();
        CaseAudit auditToSave = new CaseAudit(
                null,
                caseId,
                targetCanvas.getId(),
                aiEvaluation.solidityScore(),
                now
        );
        CaseAudit savedAudit = caseAuditRepository.save(auditToSave);

        List<AuditFinding> findingsToSave = new ArrayList<>();
        if (aiEvaluation.findings() != null) {
            for (AuditFinding f : aiEvaluation.findings()) {
                f.setId(null);
                f.setAuditId(savedAudit.getId());
                if (f.getCreatedAt() == null) {
                    f.setCreatedAt(now);
                }
                findingsToSave.add(f);
            }
        }
        List<AuditFinding> savedFindings = findingsToSave.isEmpty()
                ? List.of()
                : auditFindingRepository.saveAll(findingsToSave);
        savedAudit.setFindings(savedFindings);

        caseModel.setTrialReadinessScore(aiEvaluation.solidityScore());
        caseModel.setUpdatedAt(now);
        caseRepository.save(caseModel);

        return new AuditExecutionOutput(
                savedAudit,
                targetCanvas.getVersionNumber(),
                aiEvaluation.summary(),
                savedFindings
        );
    }
}
