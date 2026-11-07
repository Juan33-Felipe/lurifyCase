package com.iurify.casebackend.application.service;

import com.iurify.casebackend.application.exception.CanvasVersionConflictException;
import com.iurify.casebackend.application.exception.UnprocessableEntityException;
import com.iurify.casebackend.application.port.IAClient;
import com.iurify.casebackend.application.port.SpeechToTextService;
import com.iurify.casebackend.domain.model.CanvasVersion;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CanvasPromptService {

    private static final String EXTRACTION_SYSTEM_PROMPT = """
            You are a Senior Legal Strategist AI for Iurify Case.
            Analyze the lawyer's narrative and extract structured legal graph nodes and edges.
            Return ONLY valid JSON matching schemas/canvas.schema.json with:
            - "nodes": array of { "id": "<UUID>", "type": "FACT|EVIDENCE|LAW|JURISPRUDENCE", "title": "...", "summary": "...", "position": {"x": number, "y": number}, "confidence": 0.0-1.0 }
            - "edges": array of { "id": "<UUID>", "sourceNodeId": "<UUID>", "targetNodeId": "<UUID>", "relationType": "SUPPORTS|CONTRADICTS|APPLIES_TO|TEMPORAL_PRECEDES|CAUSAL_LINK|CITES", "label": "...", "strength": 0.0-1.0 }
            """;

    private final CanvasService canvasService;
    private final SpeechToTextService speechToTextService;
    private final IAClient iaClient;
    private final Map<String, IngestionResult> idempotencyCache = new ConcurrentHashMap<>();

    public record IngestionResult(
            UUID caseId,
            String transcription,
            List<Map<String, Object>> extractedNodes,
            List<Map<String, Object>> extractedEdges,
            CanvasVersion canvasVersion
    ) {}

    public CanvasPromptService(
            CanvasService canvasService,
            SpeechToTextService speechToTextService,
            IAClient iaClient
    ) {
        this.canvasService = canvasService;
        this.speechToTextService = speechToTextService;
        this.iaClient = iaClient;
    }

    @Transactional
    public IngestionResult ingestTextNarrative(
            UUID caseId,
            String narrativeText,
            String language,
            Long baseVersion,
            String idempotencyKey
    ) {
        if (narrativeText == null || narrativeText.isBlank()) {
            throw new UnprocessableEntityException("EMPTY_NARRATIVE", "Narrative text must not be empty.");
        }
        return processNarrativeInternal(caseId, narrativeText.trim(), language, baseVersion, idempotencyKey);
    }

    @Transactional
    public IngestionResult ingestAudioNarrative(
            UUID caseId,
            byte[] audioBytes,
            String originalFilename,
            String contentType,
            String language,
            Long baseVersion,
            String idempotencyKey
    ) {
        if (audioBytes == null || audioBytes.length == 0) {
            throw new UnprocessableEntityException("EMPTY_AUDIO", "Uploaded audio file must not be empty.");
        }
        String resolvedLang = (language != null && !language.isBlank()) ? language : "es-PE";
        String transcription = speechToTextService.transcribeAudio(audioBytes, originalFilename, contentType, resolvedLang);
        return processNarrativeInternal(caseId, transcription, resolvedLang, baseVersion, idempotencyKey);
    }

    private IngestionResult processNarrativeInternal(
            UUID caseId,
            String transcription,
            String language,
            Long baseVersion,
            String idempotencyKey
    ) {
        String cacheKey = (idempotencyKey != null && !idempotencyKey.isBlank())
                ? caseId + ":" + idempotencyKey.trim()
                : null;
        if (cacheKey != null && idempotencyCache.containsKey(cacheKey)) {
            return idempotencyCache.get(cacheKey);
        }

        CanvasVersion latestCanvas = canvasService.getLatestCanvasForCase(caseId);
        if (baseVersion != null && !baseVersion.equals(latestCanvas.getVersionNumber())) {
            throw new CanvasVersionConflictException(
                    "Canvas baseVersion (" + baseVersion + ") does not match current version ("
                            + latestCanvas.getVersionNumber() + ").",
                    caseId,
                    baseVersion,
                    latestCanvas.getVersionNumber(),
                    latestCanvas
            );
        }

        Map<String, Object> existingGraph = latestCanvas.getGraphData();
        String resolvedLang = (language != null && !language.isBlank()) ? language : "es-PE";

        IAClient.GraphExtractionResult extracted = iaClient.extractGraphFromNarrative(
                EXTRACTION_SYSTEM_PROMPT,
                transcription,
                resolvedLang,
                existingGraph
        );

        List<Map<String, Object>> mergedNodes = canvasService.cloneMapList(
                canvasService.extractList(existingGraph, "nodes")
        );
        List<Map<String, Object>> mergedEdges = canvasService.cloneMapList(
                canvasService.extractList(existingGraph, "edges")
        );

        List<Map<String, Object>> extractedNodes = canvasService.cloneMapList(extracted.nodes());
        List<Map<String, Object>> extractedEdges = canvasService.cloneMapList(extracted.edges());

        mergedNodes.addAll(extractedNodes);
        mergedEdges.addAll(extractedEdges);

        CanvasVersion savedVersion = canvasService.saveAiGeneratedCanvasVersion(caseId, mergedNodes, mergedEdges);

        IngestionResult result = new IngestionResult(
                caseId,
                transcription,
                extractedNodes,
                extractedEdges,
                savedVersion
        );
        if (cacheKey != null) {
            idempotencyCache.put(cacheKey, result);
        }
        return result;
    }
}
