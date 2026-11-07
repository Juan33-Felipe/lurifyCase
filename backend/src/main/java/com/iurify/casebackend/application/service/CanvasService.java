package com.iurify.casebackend.application.service;

import com.iurify.casebackend.application.exception.CanvasVersionConflictException;
import com.iurify.casebackend.application.exception.ResourceNotFoundException;
import com.iurify.casebackend.application.exception.UnprocessableEntityException;
import com.iurify.casebackend.domain.model.CanvasVersion;
import com.iurify.casebackend.domain.model.Case;
import com.iurify.casebackend.domain.repository.CanvasVersionRepository;
import com.iurify.casebackend.domain.repository.CaseRepository;
import com.iurify.casebackend.infrastructure.controller.dto.CanvasPatchOperationDto;
import com.iurify.casebackend.infrastructure.controller.dto.CanvasSyncRequestDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class CanvasService {

    private static final Set<String> VALID_NODE_TYPES = Set.of("FACT", "EVIDENCE", "LAW", "JURISPRUDENCE");
    private static final Set<String> VALID_EDGE_RELATIONS = Set.of(
            "SUPPORTS", "CONTRADICTS", "APPLIES_TO", "TEMPORAL_PRECEDES", "CAUSAL_LINK", "CITES"
    );

    private final CaseRepository caseRepository;
    private final CanvasVersionRepository canvasVersionRepository;

    public CanvasService(CaseRepository caseRepository, CanvasVersionRepository canvasVersionRepository) {
        this.caseRepository = caseRepository;
        this.canvasVersionRepository = canvasVersionRepository;
    }

    @Transactional
    public CanvasVersion getLatestCanvasForCase(UUID caseId) {
        Case caseModel = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));

        return canvasVersionRepository.findLatestByCaseId(caseId)
                .orElseGet(() -> {
                    Map<String, Object> emptyGraph = new LinkedHashMap<>();
                    emptyGraph.put("schemaVersion", "1.0.0");
                    emptyGraph.put("nodes", new ArrayList<>());
                    emptyGraph.put("edges", new ArrayList<>());
                    long initialVersion = caseModel.getCanvasVersion() != null && caseModel.getCanvasVersion() > 0
                            ? caseModel.getCanvasVersion()
                            : 1L;
                    CanvasVersion created = new CanvasVersion(
                            null,
                            caseId,
                            initialVersion,
                            null,
                            "USER_CREATED",
                            emptyGraph,
                            Instant.now()
                    );
                    return canvasVersionRepository.save(created);
                });
    }

    @Transactional
    public CanvasVersion synchronizeCanvas(UUID caseId, CanvasSyncRequestDto request, String ifMatchHeader) {
        Case caseModel = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));

        CanvasVersion latestVersion = getLatestCanvasForCase(caseId);
        Long currentVersion = latestVersion.getVersionNumber();

        Long expectedVersion = request != null ? request.resolveExpectedVersion() : null;
        if (expectedVersion == null && ifMatchHeader != null && !ifMatchHeader.isBlank()) {
            expectedVersion = parseIfMatchVersion(ifMatchHeader);
        }

        if (expectedVersion != null && !expectedVersion.equals(currentVersion)) {
            throw new CanvasVersionConflictException(
                    "Canvas version conflict: client baseVersion (" + expectedVersion
                            + ") does not match current server version (" + currentVersion + ").",
                    caseId,
                    expectedVersion,
                    currentVersion,
                    latestVersion
            );
        }

        Map<String, Object> currentGraph = latestVersion.getGraphData();
        List<Map<String, Object>> nodes = cloneMapList(extractList(currentGraph, "nodes"));
        List<Map<String, Object>> edges = cloneMapList(extractList(currentGraph, "edges"));

        if (request != null) {
            if (request.getOperations() != null && !request.getOperations().isEmpty()) {
                applyPatchOperations(nodes, edges, request.getOperations());
            } else if (request.getGraphData() != null) {
                nodes = cloneMapList(extractList(request.getGraphData(), "nodes"));
                edges = cloneMapList(extractList(request.getGraphData(), "edges"));
            } else if (request.getCanvas() != null) {
                nodes = cloneMapList(extractList(request.getCanvas(), "nodes"));
                edges = cloneMapList(extractList(request.getCanvas(), "edges"));
            } else if (request.getNodes() != null || request.getEdges() != null) {
                if (request.getNodes() != null) {
                    nodes = cloneMapList(request.getNodes());
                }
                if (request.getEdges() != null) {
                    edges = cloneMapList(request.getEdges());
                }
            }
        }

        normalizeAndValidateGraph(nodes, edges);

        Map<String, Object> nextGraph = new LinkedHashMap<>();
        nextGraph.put("schemaVersion", "1.0.0");
        nextGraph.put("nodes", nodes);
        nextGraph.put("edges", edges);

        Long nextVersionNumber = currentVersion + 1;
        Instant now = Instant.now();

        CanvasVersion nextVersion = new CanvasVersion(
                null,
                caseId,
                nextVersionNumber,
                latestVersion.getId(),
                "USER_CREATED",
                nextGraph,
                now
        );
        CanvasVersion savedVersion = canvasVersionRepository.save(nextVersion);

        caseModel.setCanvasVersion(nextVersionNumber);
        caseModel.setUpdatedAt(now);
        caseRepository.save(caseModel);

        return savedVersion;
    }

    @Transactional
    public CanvasVersion saveAiGeneratedCanvasVersion(
            UUID caseId,
            List<Map<String, Object>> mergedNodes,
            List<Map<String, Object>> mergedEdges
    ) {
        Case caseModel = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));

        CanvasVersion latestVersion = getLatestCanvasForCase(caseId);
        Long nextVersionNumber = latestVersion.getVersionNumber() + 1;

        normalizeAndValidateGraph(mergedNodes, mergedEdges);

        Map<String, Object> nextGraph = new LinkedHashMap<>();
        nextGraph.put("schemaVersion", "1.0.0");
        nextGraph.put("nodes", mergedNodes);
        nextGraph.put("edges", mergedEdges);

        Instant now = Instant.now();
        CanvasVersion nextVersion = new CanvasVersion(
                null,
                caseId,
                nextVersionNumber,
                latestVersion.getId(),
                "AI_GENERATED",
                nextGraph,
                now
        );
        CanvasVersion savedVersion = canvasVersionRepository.save(nextVersion);

        caseModel.setCanvasVersion(nextVersionNumber);
        caseModel.setUpdatedAt(now);
        caseRepository.save(caseModel);

        return savedVersion;
    }

    private void applyPatchOperations(
            List<Map<String, Object>> nodes,
            List<Map<String, Object>> edges,
            List<CanvasPatchOperationDto> operations
    ) {
        for (CanvasPatchOperationDto opDto : operations) {
            if (opDto == null || opDto.getOp() == null) {
                continue;
            }
            String op = opDto.getOp().trim().toUpperCase();
            switch (op) {
                case "ADD_NODE" -> {
                    if (opDto.getNode() == null) {
                        throw new UnprocessableEntityException("INVALID_PATCH_OPERATION", "ADD_NODE requires a 'node' object.");
                    }
                    Map<String, Object> newNode = new LinkedHashMap<>(opDto.getNode());
                    String id = Objects.toString(newNode.get("id"), UUID.randomUUID().toString());
                    newNode.put("id", id);
                    nodes.removeIf(n -> id.equals(Objects.toString(n.get("id"), null)));
                    nodes.add(newNode);
                }
                case "UPDATE_NODE" -> {
                    String nodeId = opDto.getNodeId() != null ? opDto.getNodeId().toString() : null;
                    if (nodeId == null || opDto.getPatch() == null) {
                        throw new UnprocessableEntityException("INVALID_PATCH_OPERATION", "UPDATE_NODE requires 'nodeId' and 'patch'.");
                    }
                    Map<String, Object> target = findById(nodes, nodeId)
                            .orElseThrow(() -> new UnprocessableEntityException("NODE_NOT_FOUND", "Node not found: " + nodeId));
                    target.putAll(opDto.getPatch());
                    target.put("id", nodeId);
                }
                case "MOVE_NODE" -> {
                    String nodeId = opDto.getNodeId() != null ? opDto.getNodeId().toString() : null;
                    if (nodeId == null || opDto.getPosition() == null) {
                        throw new UnprocessableEntityException("INVALID_PATCH_OPERATION", "MOVE_NODE requires 'nodeId' and 'position'.");
                    }
                    Map<String, Object> target = findById(nodes, nodeId)
                            .orElseThrow(() -> new UnprocessableEntityException("NODE_NOT_FOUND", "Node not found: " + nodeId));
                    target.put("position", new LinkedHashMap<>(opDto.getPosition()));
                }
                case "DELETE_NODE" -> {
                    String nodeId = opDto.getNodeId() != null ? opDto.getNodeId().toString() : null;
                    if (nodeId == null) {
                        throw new UnprocessableEntityException("INVALID_PATCH_OPERATION", "DELETE_NODE requires 'nodeId'.");
                    }
                    nodes.removeIf(n -> nodeId.equals(Objects.toString(n.get("id"), null)));
                    edges.removeIf(e -> nodeId.equals(Objects.toString(e.get("sourceNodeId"), null))
                            || nodeId.equals(Objects.toString(e.get("targetNodeId"), null)));
                }
                case "ADD_EDGE" -> {
                    if (opDto.getEdge() == null) {
                        throw new UnprocessableEntityException("INVALID_PATCH_OPERATION", "ADD_EDGE requires an 'edge' object.");
                    }
                    Map<String, Object> newEdge = new LinkedHashMap<>(opDto.getEdge());
                    String id = Objects.toString(newEdge.get("id"), UUID.randomUUID().toString());
                    newEdge.put("id", id);
                    edges.removeIf(e -> id.equals(Objects.toString(e.get("id"), null)));
                    edges.add(newEdge);
                }
                case "UPDATE_EDGE" -> {
                    String edgeId = opDto.getEdgeId() != null ? opDto.getEdgeId().toString() : null;
                    if (edgeId == null || opDto.getPatch() == null) {
                        throw new UnprocessableEntityException("INVALID_PATCH_OPERATION", "UPDATE_EDGE requires 'edgeId' and 'patch'.");
                    }
                    Map<String, Object> target = findById(edges, edgeId)
                            .orElseThrow(() -> new UnprocessableEntityException("EDGE_NOT_FOUND", "Edge not found: " + edgeId));
                    target.putAll(opDto.getPatch());
                    target.put("id", edgeId);
                }
                case "DELETE_EDGE" -> {
                    String edgeId = opDto.getEdgeId() != null ? opDto.getEdgeId().toString() : null;
                    if (edgeId == null) {
                        throw new UnprocessableEntityException("INVALID_PATCH_OPERATION", "DELETE_EDGE requires 'edgeId'.");
                    }
                    edges.removeIf(e -> edgeId.equals(Objects.toString(e.get("id"), null)));
                }
                default -> throw new UnprocessableEntityException("UNSUPPORTED_OPERATION", "Unsupported patch op: " + op);
            }
        }
    }

    public void normalizeAndValidateGraph(List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
        Set<String> nodeIds = new HashSet<>();
        int index = 0;
        for (Map<String, Object> node : nodes) {
            String id = Objects.toString(node.get("id"), null);
            if (id == null || id.isBlank()) {
                id = UUID.randomUUID().toString();
                node.put("id", id);
            }
            nodeIds.add(id);

            String rawType = Objects.toString(node.get("type"), "FACT").trim().toUpperCase();
            String normalizedType = switch (rawType) {
                case "STATUTE", "LAW" -> "LAW";
                case "PRECEDENT", "JURISPRUDENCE" -> "JURISPRUDENCE";
                case "EVIDENCE" -> "EVIDENCE";
                default -> "FACT";
            };
            if (!VALID_NODE_TYPES.contains(normalizedType)) {
                normalizedType = "FACT";
            }
            node.put("type", normalizedType);

            if (!node.containsKey("title") || Objects.toString(node.get("title"), "").isBlank()) {
                String labelFallback = Objects.toString(node.get("label"), "Legal Node " + (index + 1));
                node.put("title", labelFallback);
            }
            if (!node.containsKey("summary")) {
                String contentFallback = Objects.toString(node.get("content"), "");
                node.put("summary", contentFallback);
            }
            if (!(node.get("position") instanceof Map<?, ?>)) {
                Map<String, Object> pos = new LinkedHashMap<>();
                pos.put("x", 150.0 + (index % 3) * 260.0);
                pos.put("y", 140.0 + (index / 3) * 180.0);
                node.put("position", pos);
            }
            index++;
        }

        for (Map<String, Object> edge : edges) {
            String id = Objects.toString(edge.get("id"), null);
            if (id == null || id.isBlank()) {
                id = UUID.randomUUID().toString();
                edge.put("id", id);
            }

            String sourceId = Objects.toString(edge.get("sourceNodeId"),
                    Objects.toString(edge.get("source"), null));
            String targetId = Objects.toString(edge.get("targetNodeId"),
                    Objects.toString(edge.get("target"), null));

            if (sourceId == null || targetId == null) {
                throw new UnprocessableEntityException(
                        "INVALID_GRAPH_TOPOLOGY",
                        "Every edge must define both 'sourceNodeId' and 'targetNodeId'."
                );
            }
            if (sourceId.equals(targetId)) {
                throw new UnprocessableEntityException(
                        "SELF_LOOP_NOT_ALLOWED",
                        "Self-loops are not permitted on the legal canvas (node: " + sourceId + ")."
                );
            }
            if (!nodeIds.contains(sourceId) || !nodeIds.contains(targetId)) {
                throw new UnprocessableEntityException(
                        "DANGLING_EDGE_REFERENCE",
                        "Edge '" + id + "' references non-existent node IDs (" + sourceId + " -> " + targetId + ")."
                );
            }

            edge.put("sourceNodeId", sourceId);
            edge.put("targetNodeId", targetId);

            String rawRel = Objects.toString(edge.get("relationType"), "SUPPORTS").trim().toUpperCase();
            if (!VALID_EDGE_RELATIONS.contains(rawRel)) {
                rawRel = "SUPPORTS";
            }
            edge.put("relationType", rawRel);
        }
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> extractList(Map<String, Object> graphData, String key) {
        if (graphData == null) {
            return new ArrayList<>();
        }
        Object raw = graphData.get(key);
        if (raw instanceof List<?> list) {
            List<Map<String, Object>> result = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> mapItem) {
                    result.add((Map<String, Object>) mapItem);
                }
            }
            return result;
        }
        return new ArrayList<>();
    }

    public List<Map<String, Object>> cloneMapList(List<Map<String, Object>> source) {
        List<Map<String, Object>> cloned = new ArrayList<>();
        if (source == null) {
            return cloned;
        }
        for (Map<String, Object> item : source) {
            if (item != null) {
                cloned.add(new LinkedHashMap<>(item));
            }
        }
        return cloned;
    }

    private Optional<Map<String, Object>> findById(List<Map<String, Object>> list, String id) {
        return list.stream()
                .filter(item -> id.equals(Objects.toString(item.get("id"), null)))
                .findFirst();
    }

    private Long parseIfMatchVersion(String ifMatch) {
        String cleaned = ifMatch.replace("\"", "").replace("W/", "").replace("v", "").trim();
        try {
            return Long.parseLong(cleaned);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
