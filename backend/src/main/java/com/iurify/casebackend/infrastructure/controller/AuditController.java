package com.iurify.casebackend.infrastructure.controller;

import com.iurify.casebackend.application.service.AuditService;
import com.iurify.casebackend.infrastructure.controller.dto.AuditAlertDto;
import com.iurify.casebackend.infrastructure.controller.dto.AuditReportDto;
import com.iurify.casebackend.infrastructure.controller.dto.AuditRequestDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @PostMapping
    public ResponseEntity<AuditReportDto> auditCaseCanvas(
            @PathVariable UUID caseId,
            @RequestBody(required = false) AuditRequestDto request
    ) {
        Long requestedVersion = request != null ? request.getCanvasVersion() : null;
        Map<String, Object> overrideGraph = null;
        if (request != null) {
            overrideGraph = request.getCanvas() != null ? request.getCanvas() : request.getGraphData();
        }

        AuditService.AuditExecutionOutput output = auditService.runCaseAudit(
                caseId,
                requestedVersion,
                overrideGraph
        );

        List<AuditAlertDto> alerts = output.findings().stream()
                .map(f -> new AuditAlertDto(
                        f.getId(),
                        f.getVulnerabilityType(),
                        f.getSeverity(),
                        f.getTitle(),
                        f.getDescription(),
                        f.getRecommendation(),
                        f.getAffectedNodeIds(),
                        f.getAffectedEdgeIds(),
                        f.getCreatedAt()
                ))
                .collect(Collectors.toList());

        AuditReportDto report = new AuditReportDto(
                output.audit().getId(),
                caseId,
                output.audit().getCanvasVersionId(),
                output.canvasVersionNumber(),
                output.audit().getSolidityScore(),
                output.audit().getCreatedAt(),
                output.summary(),
                alerts
        );

        return ResponseEntity.ok(report);
    }
}
