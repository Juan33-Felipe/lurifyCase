package com.iurify.casebackend.application.port;

import com.iurify.casebackend.domain.model.AuditFinding;
import com.iurify.casebackend.domain.model.Case;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface IAClient {

    record GraphExtractionResult(
            List<Map<String, Object>> nodes,
            List<Map<String, Object>> edges
    ) {}

    record AuditEvaluationResult(
            BigDecimal solidityScore,
            String summary,
            List<AuditFinding> findings
    ) {}

    GraphExtractionResult extractGraphFromNarrative(
            String systemPrompt,
            String narrativeText,
            String language,
            Map<String, Object> existingGraph
    );

    AuditEvaluationResult evaluateCanvasAudit(
            String systemPrompt,
            Case caseModel,
            Map<String, Object> graphData
    );

    String generateLegalDocument(
            String systemPrompt,
            Case caseModel,
            Map<String, Object> graphData,
            String documentType,
            String language,
            String instructions
    );
}
