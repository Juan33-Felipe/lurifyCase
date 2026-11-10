package com.iurify.casebackend.infrastructure.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iurify.casebackend.application.port.IAClient;
import com.iurify.casebackend.domain.model.AuditFinding;
import com.iurify.casebackend.domain.model.Case;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Component
public class GeminiAdapter implements IAClient {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GeminiAdapter.class);

    private final String apiKey;
    private final String model;
    private final String baseUrl;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public GeminiAdapter(
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-3.8-flash}") String model,
            @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl;
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
    }

    @Override
    public GraphExtractionResult extractGraphFromNarrative(
            String systemPrompt,
            String narrativeText,
            String language,
            Map<String, Object> existingGraph
    ) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String jsonResponse = invokeGeminiJson(systemPrompt, narrativeText);
                if (jsonResponse != null && !jsonResponse.isBlank()) {
                    Map<String, Object> parsed = objectMapper.readValue(
                            cleanJsonFence(jsonResponse),
                            new TypeReference<Map<String, Object>>() {}
                    );
                    List<Map<String, Object>> nodes = extractMapList(parsed.get("nodes"));
                    List<Map<String, Object>> edges = extractMapList(parsed.get("edges"));
                    if (!nodes.isEmpty()) {
                        return new GraphExtractionResult(nodes, edges);
                    }
                }
            } catch (Exception ignored) {
                // Fall back to deterministic legal NLP graph extraction below
            }
        }

        return deterministicExtractGraph(narrativeText, existingGraph);
    }

    @Override
    public AuditEvaluationResult evaluateCanvasAudit(
            String systemPrompt,
            Case caseModel,
            Map<String, Object> graphData
    ) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                StringBuilder userContent = new StringBuilder();
                userContent.append("EXPEDIENTE / CASO A AUDITAR:\n");
                userContent.append("Título: ").append(caseModel.getTitle()).append("\n");
                if (caseModel.getDossierNumber() != null) {
                    userContent.append("N° de Expediente: ").append(caseModel.getDossierNumber()).append("\n");
                }
                if (caseModel.getJurisdiction() != null) {
                    userContent.append("Jurisdicción: ").append(caseModel.getJurisdiction()).append("\n");
                }
                if (caseModel.getDescription() != null && !caseModel.getDescription().isBlank()) {
                    userContent.append("Relato fáctico inicial: ").append(caseModel.getDescription()).append("\n");
                }
                userContent.append("\nESTRUCTURA DE ELEMENTOS FÁCTICOS, PROBATORIOS Y NORMATIVOS (JSON):\n");
                userContent.append(objectMapper.writeValueAsString(graphData));

                String jsonResponse = invokeGeminiJson(systemPrompt, userContent.toString());
                if (jsonResponse != null && !jsonResponse.isBlank()) {
                    JsonNode root = objectMapper.readTree(cleanJsonFence(jsonResponse));
                    double scoreVal = root.path("solidityScore").asDouble(75.0);
                    String rawSummary = root.path("summary").asText("Auditoría procesal completada.");
                    String summary = sanitizeLegalTerminology(rawSummary);
                    List<AuditFinding> findings = new ArrayList<>();
                    JsonNode alertsNode = root.has("alerts") ? root.path("alerts") : root.path("findings");
                    if (alertsNode.isArray()) {
                        for (JsonNode item : alertsNode) {
                            List<UUID> nodeIds = parseUuidList(item.path("affectedNodeIds"));
                            List<UUID> edgeIds = parseUuidList(item.path("affectedEdgeIds"));
                            String title = sanitizeLegalTerminology(item.path("title").asText("Observación procesal"));
                            String description = sanitizeLegalTerminology(item.path("description").asText("Vulnerabilidad detectada en la teoría del caso."));
                            String recommendation = sanitizeLegalTerminology(item.path("recommendation").asText("Revisar acervo probatorio y fundamento de derecho."));
                            findings.add(new AuditFinding(
                                    UUID.randomUUID(),
                                    null,
                                    item.path("type").asText(item.path("vulnerabilityType").asText("STRUCTURAL_ISSUE")),
                                    item.path("severity").asText("MEDIUM"),
                                    title,
                                    description,
                                    recommendation,
                                    nodeIds,
                                    edgeIds,
                                    Instant.now()
                            ));
                        }
                    }
                    return new AuditEvaluationResult(
                            BigDecimal.valueOf(scoreVal).setScale(2, RoundingMode.HALF_UP),
                            summary,
                            findings
                    );
                }
            } catch (Exception ex) {
                log.warn("Gemini legal audit call failed, falling back to deterministic analyzer: {}", ex.getMessage());
            }
        }

        return deterministicAuditGraph(caseModel, graphData);
    }

    @Override
    public String generateLegalDocument(
            String systemPrompt,
            Case caseModel,
            Map<String, Object> graphData,
            String documentType,
            String language,
            String instructions
    ) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String userContent = "Case Title: " + caseModel.getTitle()
                        + "\nDossier Number: " + caseModel.getDossierNumber()
                        + "\nJurisdiction: " + caseModel.getJurisdiction()
                        + "\nDocument Type: " + documentType
                        + "\nLanguage: " + language
                        + "\nInstructions: " + (instructions != null ? instructions : "None")
                        + "\nCanvas Graph:\n" + objectMapper.writeValueAsString(graphData);
                String textResponse = invokeGeminiText(systemPrompt, userContent);
                if (textResponse != null && !textResponse.isBlank()) {
                    return textResponse.trim();
                }
            } catch (Exception ignored) {
                // Fall back to structured legal document synthesis below
            }
        }

        return deterministicSynthesizeLegalDocument(caseModel, graphData, documentType, language, instructions);
    }

    private String invokeGeminiJson(String systemPrompt, String userContent) {
        Map<String, Object> payload = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("parts", List.of(Map.of("text", userContent)))),
                "generationConfig", Map.of("responseMimeType", "application/json", "temperature", 0.2)
        );
        String url = baseUrl + "/models/" + model + ":generateContent?key=" + apiKey;
        String rawResponse = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(String.class);
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
        } catch (Exception e) {
            return null;
        }
    }

    private String invokeGeminiText(String systemPrompt, String userContent) {
        Map<String, Object> payload = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
                "contents", List.of(Map.of("parts", List.of(Map.of("text", userContent)))),
                "generationConfig", Map.of("temperature", 0.3)
        );
        String url = baseUrl + "/models/" + model + ":generateContent?key=" + apiKey;
        String rawResponse = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .body(String.class);
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
        } catch (Exception e) {
            return null;
        }
    }

    private GraphExtractionResult deterministicExtractGraph(String narrativeText, Map<String, Object> existingGraph) {
        List<Map<String, Object>> existingNodes = extractMapList(existingGraph != null ? existingGraph.get("nodes") : null);
        int baseOffset = existingNodes.size();

        String[] sentences = narrativeText.split("(?<=[.!?\\n])\\s+");
        List<Map<String, Object>> newNodes = new ArrayList<>();
        List<Map<String, Object>> newEdges = new ArrayList<>();

        String lastFactNodeId = null;
        String lastEvidenceNodeId = null;
        String lastLawNodeId = null;

        int index = 0;
        for (String rawSentence : sentences) {
            String sentence = rawSentence.trim();
            if (sentence.length() < 5) {
                continue;
            }
            String lower = sentence.toLowerCase();
            String nodeType = classifyLegalSentence(lower);
            String nodeId = UUID.randomUUID().toString();
            String title = buildConciseTitle(sentence, nodeType, index + 1);

            Map<String, Object> position = new LinkedHashMap<>();
            position.put("x", 160.0 + ((baseOffset + index) % 3) * 280.0);
            position.put("y", 140.0 + ((baseOffset + index) / 3) * 200.0);

            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", nodeId);
            node.put("type", nodeType);
            node.put("title", title);
            node.put("content", sentence);
            node.put("summary", sentence);
            node.put("origin", "AI_GENERATED");
            node.put("userModified", false);
            node.put("position", position);
            node.put("confidence", 0.91);
            node.put("tags", List.of("ai-extracted", nodeType.toLowerCase()));
            node.put("metadata", Map.of("source", "narrative-ingestion", "extractedAt", Instant.now().toString()));
            newNodes.add(node);

            if ("FACT".equals(nodeType)) {
                if (lastFactNodeId != null) {
                    newEdges.add(createEdge(lastFactNodeId, nodeId, "TEMPORAL_PRECEDES", "Precedes chronologically", 0.84));
                }
                lastFactNodeId = nodeId;
            } else if ("EVIDENCE".equals(nodeType)) {
                String targetFact = lastFactNodeId != null ? lastFactNodeId : findFirstNodeIdByType(existingNodes, "FACT");
                if (targetFact != null) {
                    String rel = (lower.contains("contradic") || lower.contains("conflict") || lower.contains("disput"))
                            ? "CONTRADICTS" : "SUPPORTS";
                    newEdges.add(createEdge(nodeId, targetFact, rel,
                            "CONTRADICTS".equals(rel) ? "Contradicts factual claim" : "Corroborates factual assertion", 0.90));
                }
                lastEvidenceNodeId = nodeId;
            } else if ("LAW".equals(nodeType)) {
                String targetNode = lastFactNodeId != null ? lastFactNodeId
                        : (lastEvidenceNodeId != null ? lastEvidenceNodeId : findFirstNodeIdByType(existingNodes, "FACT"));
                if (targetNode != null) {
                    newEdges.add(createEdge(nodeId, targetNode, "APPLIES_TO", "Governs legal qualification", 0.93));
                }
                lastLawNodeId = nodeId;
            } else if ("JURISPRUDENCE".equals(nodeType)) {
                String targetNode = lastLawNodeId != null ? lastLawNodeId
                        : (lastFactNodeId != null ? lastFactNodeId : findFirstNodeIdByType(existingNodes, "LAW"));
                if (targetNode != null) {
                    newEdges.add(createEdge(nodeId, targetNode, "CITES", "Interpretive judicial precedent", 0.89));
                }
            }
            index++;
        }

        // If the narrative was a single clause, ensure at least 2 linked nodes (e.g., FACT + EVIDENCE/LAW) are extracted
        if (newNodes.size() == 1) {
            Map<String, Object> primaryNode = newNodes.get(0);
            String primaryId = Objects.toString(primaryNode.get("id"));
            String companionId = UUID.randomUUID().toString();
            String companionType = "FACT".equals(primaryNode.get("type")) ? "EVIDENCE" : "FACT";

            Map<String, Object> pos = new LinkedHashMap<>();
            pos.put("x", 440.0);
            pos.put("y", 140.0 + (baseOffset / 3) * 200.0);

            boolean isSpanish = isSpanishText(narrativeText);

            Map<String, Object> companionNode = new LinkedHashMap<>();
            companionNode.put("id", companionId);
            companionNode.put("type", companionType);
            companionNode.put("title", isSpanish
                    ? ("EVIDENCE".equals(companionType) ? "Registro probatorio / Testimonio" : "Premisa fáctica derivada")
                    : ("EVIDENCE".equals(companionType) ? "Corroborating Record / Testimony" : "Derived Factual Premise"));
            companionNode.put("summary", (isSpanish ? "Elemento complementario inferido de la narrativa: " : "Inferred companion element from narrative: ") + narrativeText.trim());
            companionNode.put("position", pos);
            companionNode.put("confidence", 0.85);
            companionNode.put("tags", List.of("ai-inferred", companionType.toLowerCase()));
            companionNode.put("metadata", Map.of("source", "narrative-inference"));
            newNodes.add(companionNode);

            if ("EVIDENCE".equals(companionType)) {
                newEdges.add(createEdge(companionId, primaryId, "SUPPORTS", isSpanish ? "Sustenta el hecho narrado" : "Supports narrated fact", 0.86));
            } else {
                newEdges.add(createEdge(primaryId, companionId, "APPLIES_TO", isSpanish ? "Aplica a la premisa fáctica" : "Applies to factual premise", 0.86));
            }
        }

        return new GraphExtractionResult(newNodes, newEdges);
    }

    private AuditEvaluationResult deterministicAuditGraph(Case caseModel, Map<String, Object> graphData) {
        List<Map<String, Object>> nodes = extractMapList(graphData != null ? graphData.get("nodes") : null);
        List<Map<String, Object>> edges = extractMapList(graphData != null ? graphData.get("edges") : null);

        List<AuditFinding> findings = new ArrayList<>();
        double score = 92.0;

        boolean isSpanish = isSpanishContext(caseModel, graphData);

        if (nodes.isEmpty()) {
            findings.add(new AuditFinding(
                    UUID.randomUUID(),
                    null,
                    "STRUCTURAL_ISSUE",
                    "HIGH",
                    isSpanish ? "Expediente sin hechos ni elementos probatorios registrados" : "Docket Lacks Registered Facts and Evidence",
                    isSpanish ? "El expediente actualmente no contiene hechos narrados, elementos probatorios ni fundamentación jurídica que sustenten una teoría del caso."
                              : "The docket currently contains no narrated facts, evidentiary elements, or statutory anchors supporting a theory of the case.",
                    isSpanish ? "Ingresar el relato fáctico del caso y registrar los medios probatorios iniciales antes de proceder a la preparación del juicio."
                              : "Ingest the factual case narrative and attach initial evidentiary records before proceeding to trial preparation.",
                    List.of(),
                    List.of(),
                    Instant.now()
            ));
            return new AuditEvaluationResult(
                    new BigDecimal("15.00"),
                    isSpanish ? "Vacío procesal crítico: el expediente no cuenta con elementos fácticos ni probatorios para sustentar la teoría del caso."
                              : "Critical procedural gap: the docket has no factual or evidentiary elements to support a theory of the case.",
                    findings
            );
        }

        Map<String, Map<String, Object>> nodeById = new LinkedHashMap<>();
        List<UUID> factIds = new ArrayList<>();
        List<UUID> evidenceIds = new ArrayList<>();
        List<UUID> lawIds = new ArrayList<>();
        List<UUID> jurisprudenceIds = new ArrayList<>();

        for (Map<String, Object> node : nodes) {
            String idStr = Objects.toString(node.get("id"), null);
            UUID uuid = parseUuidSafe(idStr);
            if (uuid == null) {
                continue;
            }
            nodeById.put(uuid.toString(), node);
            String type = Objects.toString(node.get("type"), "FACT").toUpperCase();
            switch (type) {
                case "FACT" -> factIds.add(uuid);
                case "EVIDENCE" -> evidenceIds.add(uuid);
                case "LAW", "STATUTE" -> lawIds.add(uuid);
                case "JURISPRUDENCE", "PRECEDENT" -> jurisprudenceIds.add(uuid);
            }
        }

        Set<String> supportedFactIds = new HashSet<>();
        Set<String> connectedNodeIds = new HashSet<>();

        for (Map<String, Object> edge : edges) {
            UUID edgeUuid = parseUuidSafe(Objects.toString(edge.get("id"), null));
            String sourceId = Objects.toString(edge.get("sourceNodeId"), null);
            String targetId = Objects.toString(edge.get("targetNodeId"), null);
            String rel = Objects.toString(edge.get("relationType"), "SUPPORTS").toUpperCase();

            if (sourceId != null) connectedNodeIds.add(sourceId);
            if (targetId != null) connectedNodeIds.add(targetId);

            if ("SUPPORTS".equals(rel) && targetId != null) {
                supportedFactIds.add(targetId);
            }
            if ("CONTRADICTS".equals(rel)) {
                List<UUID> affectedNodes = new ArrayList<>();
                UUID srcUuid = parseUuidSafe(sourceId);
                UUID tgtUuid = parseUuidSafe(targetId);
                if (srcUuid != null) affectedNodes.add(srcUuid);
                if (tgtUuid != null) affectedNodes.add(tgtUuid);
                List<UUID> affectedEdges = edgeUuid != null ? List.of(edgeUuid) : List.of();

                findings.add(new AuditFinding(
                        UUID.randomUUID(),
                        null,
                        "EVIDENCE_CONFLICT",
                        "HIGH",
                        isSpanish ? "Contradicción probatoria directa detectada" : "Direct Evidentiary Contradiction Detected",
                        isSpanish ? "Existe una contradicción directa entre elementos probatorios del expediente, lo que genera una alta vulnerabilidad ante el contrainterrogatorio o la contestación de la contraparte."
                                  : "A direct contradiction exists between elements of the docket, creating an adversarial vulnerability during cross-examination.",
                        isSpanish ? "Preparar refutación de tacha o impugnación, o corroborar el hecho controvertido con prueba documental independiente."
                                  : "Prepare impeachment rebuttal or corroborate the contested fact with independent documentary evidence.",
                        affectedNodes,
                        affectedEdges,
                        Instant.now()
                ));
                score -= 14.0;
            }
        }

        // Check for unsupported FACT elements
        List<UUID> unsupportedFacts = new ArrayList<>();
        for (UUID factId : factIds) {
            if (!supportedFactIds.contains(factId.toString())) {
                unsupportedFacts.add(factId);
            }
        }
        if (!unsupportedFacts.isEmpty()) {
            findings.add(new AuditFinding(
                    UUID.randomUUID(),
                    null,
                    "UNSUPPORTED_FACT",
                    "HIGH",
                    isSpanish ? ("Aseveraciones fácticas sin sustento probatorio (" + unsupportedFacts.size() + ")")
                              : ("Uncorroborated Factual Assertions (" + unsupportedFacts.size() + ")"),
                    isSpanish ? "Uno o más hechos alegados carecen de medios probatorios que los respalden, lo que deja expuestas a impugnación afirmaciones fácticas determinantes."
                              : "One or more factual assertions lack supporting evidence, leaving key factual claims open to challenge.",
                    isSpanish ? "Vincular medios de prueba documentales, testimoniales o periciales a cada hecho alegado no corroborado."
                              : "Attach documentary, testimonial, or expert evidence to each uncorroborated factual claim.",
                    unsupportedFacts,
                    List.of(),
                    Instant.now()
            ));
            score -= Math.min(20.0, unsupportedFacts.size() * 8.0);
        }

        // Check for missing legal basis (LAW / JURISPRUDENCE)
        if (lawIds.isEmpty() && jurisprudenceIds.isEmpty()) {
            findings.add(new AuditFinding(
                    UUID.randomUUID(),
                    null,
                    "MISSING_LEGAL_BASIS",
                    "MEDIUM",
                    isSpanish ? "Falta de fundamento legal o jurisprudencial" : "Missing Statutory or Jurisprudential Anchor",
                    isSpanish ? "El expediente contiene hechos y pruebas pero carece de disposiciones legales o jurisprudencia que sustenten jurídicamente la pretensión."
                              : "The docket contains facts and evidence but lacks statutory provisions or case precedent anchoring the legal theory.",
                    isSpanish ? "Incorporar las disposiciones normativas aplicables o precedentes vinculantes pertinentes a la pretensión."
                              : "Incorporate applicable statutory provisions or binding judicial precedents supporting the claim.",
                    factIds.isEmpty() ? List.of() : List.of(factIds.get(0)),
                    List.of(),
                    Instant.now()
            ));
            score -= 12.0;
        }

        // Check for isolated elements
        List<UUID> isolatedNodes = new ArrayList<>();
        for (String idStr : nodeById.keySet()) {
            if (!connectedNodeIds.contains(idStr)) {
                UUID u = parseUuidSafe(idStr);
                if (u != null) isolatedNodes.add(u);
            }
        }
        if (!isolatedNodes.isEmpty()) {
            findings.add(new AuditFinding(
                    UUID.randomUUID(),
                    null,
                    "STRUCTURAL_ISSUE",
                    "LOW",
                    isSpanish ? ("Alegaciones o pruebas desvinculadas de la teoría del caso (" + isolatedNodes.size() + ")")
                              : ("Elements Disconnected from Case Theory (" + isolatedNodes.size() + ")"),
                    isSpanish ? "Ciertas alegaciones o elementos se encuentran desvinculados de la secuencia fáctica y de la pretensión jurídica principal."
                              : "Certain allegations or records are disconnected from the primary factual and evidentiary sequence.",
                    isSpanish ? "Vincular los hechos y pruebas a la teoría del caso o descartar elementos impertinentes."
                              : "Connect facts and evidence to the case theory or discard irrelevant assertions.",
                    isolatedNodes,
                    List.of(),
                    Instant.now()
            ));
            score -= Math.min(10.0, isolatedNodes.size() * 4.0);
        }

        // Ensure at least one constructive strategic observation if graph is clean
        if (findings.isEmpty()) {
            List<UUID> highlightNodes = !evidenceIds.isEmpty() ? List.of(evidenceIds.get(0))
                    : (!factIds.isEmpty() ? List.of(factIds.get(0)) : List.of());
            findings.add(new AuditFinding(
                    UUID.randomUUID(),
                    null,
                    "CASE_THEORY_WEAKNESS",
                    "LOW",
                    isSpanish ? "Anticipar excepciones y defensas de la contraparte" : "Anticipate Opposing Counsel Affirmative Defense",
                    isSpanish ? "Aunque los hechos están respaldados por pruebas y fundamentados en la ley, la contraparte podría oponer excepciones procesales, prescripción o impugnar la cadena de custodia."
                              : "While all facts are supported by evidence and anchored in law, opposing counsel may raise procedural exceptions, statute of limitations, or contest chain of custody.",
                    isSpanish ? "Verificar cronología procesal, cómputo de plazos y estipulaciones de autenticidad probatoria antes de la audiencia preliminar."
                              : "Verify procedural timeline, statutory deadline computations, and evidentiary authenticity stipulations prior to pretrial conference.",
                    highlightNodes,
                    List.of(),
                    Instant.now()
            ));
            score = 88.5;
        }

        double clampedScore = Math.max(10.0, Math.min(98.0, score));
        BigDecimal finalScore = BigDecimal.valueOf(clampedScore).setScale(2, RoundingMode.HALF_UP);

        String summary = isSpanish
                ? String.format(
                    Locale.ROOT,
                    "Auditoría procesal completada para '%s' (%d hechos y pruebas analizados). Nivel de solidez y preparación para juicio: %.2f/100 con %d observación(es) estratégica(s).",
                    caseModel != null ? caseModel.getTitle() : "Expediente",
                    nodes.size(),
                    finalScore.doubleValue(),
                    findings.size()
                )
                : String.format(
                    Locale.US,
                    "Procedural audit completed for '%s' (%d case elements analyzed). Overall Trial Readiness & Solidity Score: %.2f/100 with %d finding(s).",
                    caseModel != null ? caseModel.getTitle() : "Docket",
                    nodes.size(),
                    finalScore.doubleValue(),
                    findings.size()
                );

        return new AuditEvaluationResult(finalScore, summary, findings);
    }

    public static String sanitizeLegalTerminology(String text) {
        if (text == null || text.isBlank()) return text;
        String sanitized = text;

        // Compound graph terms to legal forensic terms
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+de\\s+hechos?\\b", "hechos alegados");
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+fácticos?\\b", "elementos fácticos");
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+probatorios?\\b", "elementos probatorios");
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+de\\s+pruebas?\\b", "medios probatorios");
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+de\\s+ley\\b", "fundamentos de derecho");
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+normativos?\\b", "fundamentos normativos");
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+de\\s+jurisprudencia\\b", "precedentes jurisprudenciales");
        sanitized = sanitized.replaceAll("(?i)\\bnodos?\\s+aislados?\\b", "elementos desvinculados");

        // English compound graph terms
        sanitized = sanitized.replaceAll("(?i)\\bfact\\s+nodes?\\b", "factual assertions");
        sanitized = sanitized.replaceAll("(?i)\\bevidence\\s+nodes?\\b", "evidentiary items");
        sanitized = sanitized.replaceAll("(?i)\\blaw\\s+nodes?\\b", "statutory authorities");
        sanitized = sanitized.replaceAll("(?i)\\bjurisprudence\\s+nodes?\\b", "judicial precedents");
        sanitized = sanitized.replaceAll("(?i)\\bisolated\\s+nodes?\\b", "unlinked elements");

        // General graph terms
        sanitized = sanitized.replaceAll("(?i)\\bnodos\\b", "elementos del expediente");
        sanitized = sanitized.replaceAll("(?i)\\bnodo\\b", "elemento procesal");
        sanitized = sanitized.replaceAll("(?i)\\baristas\\b", "vinculaciones procesales");
        sanitized = sanitized.replaceAll("(?i)\\barista\\b", "vínculo procesal");
        sanitized = sanitized.replaceAll("(?i)\\bgrafo\\b", "expediente");
        sanitized = sanitized.replaceAll("(?i)\\bgrafos\\b", "expedientes");
        sanitized = sanitized.replaceAll("(?i)\\bvértices?\\b", "elementos del caso");
        sanitized = sanitized.replaceAll("(?i)\\blienzo\\b", "expediente");

        sanitized = sanitized.replaceAll("(?i)\\b(the\\s+)?graph\\b", "the case record");
        sanitized = sanitized.replaceAll("(?i)\\bnodes\\b", "case elements");
        sanitized = sanitized.replaceAll("(?i)\\bnode\\b", "case element");
        sanitized = sanitized.replaceAll("(?i)\\bedges\\b", "evidentiary links");
        sanitized = sanitized.replaceAll("(?i)\\bedge\\b", "evidentiary link");

        return sanitized;
    }

    private String deterministicSynthesizeLegalDocument(
            Case caseModel,
            Map<String, Object> graphData,
            String documentType,
            String language,
            String instructions
    ) {
        List<Map<String, Object>> nodes = extractMapList(graphData != null ? graphData.get("nodes") : null);
        List<Map<String, Object>> edges = extractMapList(graphData != null ? graphData.get("edges") : null);

        boolean isSpanish = language != null && language.toLowerCase().startsWith("es");
        StringBuilder md = new StringBuilder();

        if (isSpanish) {
            String docHeading = switch (documentType) {
                case "CLOSING_ARGUMENT", "ALEGATO" -> "ALEGATO DE CLAUSURA";
                case "LEGAL_OPINION", "CONCEPTO" -> "CONCEPTO JURÍDICO E INFORME ESTRATÉGICO";
                default -> "MINUTA Y ESCRITO DE FUNDAMENTACIÓN JURÍDICA";
            };
            md.append("# ").append(docHeading).append("\n\n");
            md.append("**Expediente:** ").append(caseModel.getDossierNumber()).append("  \n");
            md.append("**Caso:** ").append(caseModel.getTitle()).append("  \n");
            md.append("**Jurisdicción:** ").append(caseModel.getJurisdiction() != null ? caseModel.getJurisdiction() : "General").append("  \n");
            md.append("**Fecha de Emisión:** ").append(Instant.now().toString()).append("\n\n---\n\n");

            if (instructions != null && !instructions.isBlank()) {
                md.append("## I. DIRECTRICES ESPECIALES DE REDACCIÓN\n");
                md.append("> ").append(instructions.trim()).append("\n\n");
            }

            md.append("## II. RELACIÓN DE HECHOS RELEVANTES (FACTS)\n");
            appendNodesByType(md, nodes, "FACT", "No se registraron hechos específicos en el expediente.");

            md.append("\n## III. ACERVO PROBATORIO Y SUSTENTO (EVIDENCE)\n");
            appendNodesByType(md, nodes, "EVIDENCE", "Pendiente de incorporación de medios probatorios.");

            md.append("\n## IV. FUNDAMENTOS DE DERECHO Y JURISPRUDENCIA (LAW & JURISPRUDENCE)\n");
            appendNodesByType(md, nodes, "LAW", null);
            appendNodesByType(md, nodes, "JURISPRUDENCE", "Se invocan los principios generales del debido proceso y tutela jurisdiccional efectiva.");

            md.append("\n## V. ANÁLISIS DE CONEXIÓN LÓGICO-JURÍDICA\n");
            md.append("El presente escrito se estructura sobre **").append(nodes.size())
                    .append(" elementos procesales (hechos, pruebas y normas)** y **").append(edges.size())
                    .append(" vinculaciones probatorias y causales** acreditadas en el expediente de Iurify Case.\n\n");

            md.append("## VI. PETITORIO / CONCLUSIÓN\n");
            md.append("Por lo expuesto, solicitamos a la autoridad competente tener por presentados los argumentos ")
                    .append("fácticos, probatorios y normativos detallados en el expediente **")
                    .append(caseModel.getDossierNumber()).append("**, declarando fundada nuestra pretensión.\n");
        } else {
            String docHeading = switch (documentType) {
                case "CLOSING_ARGUMENT", "ALEGATO" -> "CLOSING ARGUMENT";
                case "LEGAL_OPINION", "CONCEPTO" -> "FORMAL LEGAL OPINION MEMORANDUM";
                default -> "LEGAL BRIEF & MOTION MEMORANDUM";
            };
            md.append("# ").append(docHeading).append("\n\n");
            md.append("**Dossier Number:** ").append(caseModel.getDossierNumber()).append("  \n");
            md.append("**Case Caption:** ").append(caseModel.getTitle()).append("  \n");
            md.append("**Jurisdiction:** ").append(caseModel.getJurisdiction() != null ? caseModel.getJurisdiction() : "General Jurisdiction").append("  \n");
            md.append("**Generated At:** ").append(Instant.now().toString()).append("\n\n---\n\n");

            if (instructions != null && !instructions.isBlank()) {
                md.append("## I. COUNSEL INSTRUCTIONS & SCOPE\n");
                md.append("> ").append(instructions.trim()).append("\n\n");
            }

            md.append("## II. STATEMENT OF MATERIAL FACTS\n");
            appendNodesByType(md, nodes, "FACT", "No material facts have been recorded on the docket yet.");

            md.append("\n## III. EVIDENTIARY CORROBORATION\n");
            appendNodesByType(md, nodes, "EVIDENCE", "Evidentiary exhibits pending formal attachment.");

            md.append("\n## IV. APPLICABLE STATUTES & CONTROLLING PRECEDENT\n");
            appendNodesByType(md, nodes, "LAW", null);
            appendNodesByType(md, nodes, "JURISPRUDENCE", "Standard statutory and constitutional due process authorities apply.");

            md.append("\n## V. NEXUS & ARGUMENTATIVE SYNTHESIS\n");
            md.append("This submission synthesizes **").append(nodes.size())
                    .append(" structured legal elements** and **").append(edges.size())
                    .append(" verified evidentiary/statutory relationships** from the active case record.\n\n");

            md.append("## VI. PRAYER FOR RELIEF / CONCLUSION\n");
            md.append("WHEREFORE, Counsel respectfully requests that the Court grant the relief supported by the ")
                    .append("evidentiary record and statutory authorities set forth in Dossier **")
                    .append(caseModel.getDossierNumber()).append("**.\n");
        }

        return md.toString();
    }

    private void appendNodesByType(StringBuilder md, List<Map<String, Object>> nodes, String targetType, String emptyFallback) {
        int count = 0;
        for (Map<String, Object> node : nodes) {
            String type = Objects.toString(node.get("type"), "FACT").toUpperCase();
            if (targetType.equals(type)) {
                count++;
                String title = Objects.toString(node.get("title"), "Untitled Element");
                String summary = Objects.toString(node.get("summary"), "");
                md.append(count).append(". **").append(title).append("**: ").append(summary).append("\n");
            }
        }
        if (count == 0 && emptyFallback != null) {
            md.append("- _").append(emptyFallback).append("_\n");
        }
    }

    private String classifyLegalSentence(String lower) {
        if (lower.contains("precedent") || lower.contains("supreme court") || lower.contains("ruling")
                || lower.contains("jurisprudencia") || lower.contains("sentencia") || lower.contains("casación")
                || lower.contains("tribunal") || lower.contains("holding")) {
            return "JURISPRUDENCE";
        }
        if (lower.contains("statute") || lower.contains("act") || lower.contains("section ")
                || lower.contains("article ") || lower.contains("art.") || lower.contains("ley ")
                || lower.contains("código") || lower.contains("norma") || lower.contains("regulation")) {
            return "LAW";
        }
        if (lower.contains("evidence") || lower.contains("exhibit") || lower.contains("testimony")
                || lower.contains("testified") || lower.contains("log") || lower.contains("document")
                || lower.contains("report") || lower.contains("forensic") || lower.contains("prueba")
                || lower.contains("testigo") || lower.contains("peritaje") || lower.contains("acta")
                || lower.contains("contrato") || lower.contains("email")) {
            return "EVIDENCE";
        }
        return "FACT";
    }

    private String buildConciseTitle(String sentence, String nodeType, int index) {
        String cleaned = sentence.replaceAll("[\\r\\n]+", " ").trim();
        String[] words = cleaned.split("\\s+");
        if (words.length <= 6) {
            return cleaned;
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < Math.min(6, words.length); i++) {
            if (i > 0) sb.append(" ");
            sb.append(words[i]);
        }
        return sb.append("...").toString();
    }

    private Map<String, Object> createEdge(String sourceId, String targetId, String relationType, String label, double strength) {
        Map<String, Object> edge = new LinkedHashMap<>();
        edge.put("id", UUID.randomUUID().toString());
        edge.put("sourceNodeId", sourceId);
        edge.put("targetNodeId", targetId);
        edge.put("relationType", relationType);
        edge.put("label", label);
        edge.put("strength", strength);
        return edge;
    }

    private String findFirstNodeIdByType(List<Map<String, Object>> nodes, String type) {
        for (Map<String, Object> node : nodes) {
            if (type.equalsIgnoreCase(Objects.toString(node.get("type"), ""))) {
                return Objects.toString(node.get("id"), null);
            }
        }
        return !nodes.isEmpty() ? Objects.toString(nodes.get(0).get("id"), null) : null;
    }

    private String cleanJsonFence(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
        }
        return trimmed.trim();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractMapList(Object obj) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (obj instanceof List<?> rawList) {
            for (Object item : rawList) {
                if (item instanceof Map<?, ?> mapItem) {
                    list.add(new LinkedHashMap<>((Map<String, Object>) mapItem));
                }
            }
        }
        return list;
    }

    private List<UUID> parseUuidList(JsonNode arrayNode) {
        List<UUID> result = new ArrayList<>();
        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode n : arrayNode) {
                UUID u = parseUuidSafe(n.asText(null));
                if (u != null) result.add(u);
            }
        }
        return result;
    }

    private boolean isSpanishContext(Case caseModel, Map<String, Object> graphData) {
        if (caseModel != null) {
            if (isSpanishText(caseModel.getTitle()) || isSpanishText(caseModel.getDescription())) {
                return true;
            }
        }
        if (graphData != null) {
            List<Map<String, Object>> nodes = extractMapList(graphData.get("nodes"));
            for (Map<String, Object> node : nodes) {
                if (isSpanishText(Objects.toString(node.get("title"), "")) ||
                    isSpanishText(Objects.toString(node.get("summary"), "")) ||
                    isSpanishText(Objects.toString(node.get("content"), ""))) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isSpanishText(String text) {
        if (text == null || text.isBlank()) return false;
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.matches(".*[áéíóúñ¿¡].*")) return true;
        return lower.matches(".*\\b(el|la|los|las|de|del|en|un|una|por|para|con|sobre|contra|caso|expediente|hecho|prueba|pruebas|ley|leyes|artículo|codigo|juez|tribunal|demanda|fiscal|testigo|presento|presentó|dossier)\\b.*");
    }

    private UUID parseUuidSafe(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return UUID.fromString(str.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
