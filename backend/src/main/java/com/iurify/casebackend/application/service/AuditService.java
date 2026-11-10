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
            Eres un Auditor Jurídico Procesal Adversarial Senior para Iurify Case.
            Tu misión es realizar una auditoría legal profunda, rigurosa y realista de la teoría del caso, evaluando la coherencia entre hechos fácticos alegados, los medios probatorios que los sustentan, el fundamento jurídico normativo y los precedentes jurisprudenciales.

            REGLA DE ORO OBLIGATORIA (TERMINOLOGÍA):
            NUNCA utilices en ningún texto dirigido al abogado o usuario (resumen ejecutivo, títulos de alertas, descripciones o recomendaciones) términos técnicos de programación o teoría de grafos, tales como:
            "nodo", "nodos", "node", "nodes", "grafo", "graph", "vértice", "vértices", "arista", "aristas", "edge", "edges".
            En su lugar, emplea SIEMPRE lenguaje procesal forense riguroso y natural para juristas:
            - "hecho alegado", "aseveración fáctica", "elemento fáctico", "relato de los hechos"
            - "medio probatorio", "prueba documental", "declaración testimonial", "dictamen pericial", "indicio", "acervo probatorio"
            - "fundamento de derecho", "disposición legal", "artículo de ley", "jurisprudencia vinculante", "doctrina aplicable"
            - "pretensión", "teoría del caso", "vulnerabilidad procesal", "contrainterrogatorio", "cadena de custodia", "plazo procesal"

            Ejes de vulnerabilidad procesal a auditar:
            1. UNSUPPORTED_FACT: Hechos determinantes alegados que carecen de medios probatorios o soporte documental/testimonial directo.
            2. EVIDENCE_CONFLICT: Contradicciones sustanciales entre medios de prueba, testimonios discordantes o inconsistencias de tiempo/lugar.
            3. LOGICAL_CONTRADICTION: Incoherencias internas en el relato o la secuencia cronológica de los hechos.
            4. MISSING_LEGAL_BASIS: Hechos o pretensiones sin sustento normativo legal ni precedentes jurisprudenciales vinculados.
            5. PROCEDURAL_GAP: Brechas procesales (autenticidad probatoria, notificaciones, formalidades o plazos procesales perentorios).
            6. CASE_THEORY_WEAKNESS: Puntos débiles estratégicos que la contraparte o el fiscal pueden explotar en juicio o audiencia preliminar.
            7. STRUCTURAL_ISSUE: Expediente vacío o afirmaciones desvinculadas de la pretensión jurídica principal.

            Idioma:
            Analiza el idioma predominante del título y narrativa del caso. Si está en español, redacta todo el contenido en español jurídico formal impecable. Si está en inglés, redacta en inglés legal formal.

            Formato de salida estricto JSON:
            {
              "solidityScore": 0-100,
              "summary": "Resumen ejecutivo procesal sobre la solidez probatoria y nivel de preparación del expediente para juicio...",
              "alerts": [
                {
                  "type": "UNSUPPORTED_FACT|EVIDENCE_CONFLICT|LOGICAL_CONTRADICTION|MISSING_LEGAL_BASIS|PROCEDURAL_GAP|CASE_THEORY_WEAKNESS|STRUCTURAL_ISSUE",
                  "severity": "HIGH|MEDIUM|LOW",
                  "title": "Título forense conciso (sin mencionar nodos)",
                  "description": "Explicación procesal clara de la vulnerabilidad o inconsistencia (sin mencionar nodos)",
                  "recommendation": "Acción procesal concreta y estratégica sugerida al abogado (sin mencionar nodos)",
                  "affectedNodeIds": ["<UUID del elemento fáctico o probatorio afectado si aplica>"],
                  "affectedEdgeIds": ["<UUID del vínculo si aplica>"]
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
