package com.iurify.casebackend.infrastructure.controller;

import com.iurify.casebackend.application.exception.UnprocessableEntityException;
import com.iurify.casebackend.application.service.CanvasPromptService;
import com.iurify.casebackend.application.service.CanvasService;
import com.iurify.casebackend.application.service.CaseService;
import com.iurify.casebackend.domain.model.CanvasVersion;
import com.iurify.casebackend.domain.model.Case;
import com.iurify.casebackend.infrastructure.controller.dto.*;
import com.iurify.casebackend.infrastructure.controller.mapper.DtoMapper;
import com.iurify.casebackend.infrastructure.security.AuthenticatedUser;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/cases")
public class CaseController {

    private final CaseService caseService;
    private final CanvasService canvasService;
    private final CanvasPromptService canvasPromptService;
    private final DtoMapper dtoMapper;

    public CaseController(
            CaseService caseService,
            CanvasService canvasService,
            CanvasPromptService canvasPromptService,
            DtoMapper dtoMapper
    ) {
        this.caseService = caseService;
        this.canvasService = canvasService;
        this.canvasPromptService = canvasPromptService;
        this.dtoMapper = dtoMapper;
    }

    @GetMapping
    public CaseListDto listCases(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "limit", required = false) Integer limit
    ) {
        UUID userId = resolveCurrentUserId();
        List<Case> cases = caseService.listCases(userId, status, limit);
        List<CaseDto> caseDtos = cases.stream()
                .map(dtoMapper::toCaseDto)
                .collect(Collectors.toList());
        return new CaseListDto(caseDtos, new PageInfoDto(false, null));
    }

    @PostMapping
    public ResponseEntity<CaseDto> createCase(@RequestBody CaseCreateRequestDto request) {
        UUID userId = resolveCurrentUserId();
        Case created = caseService.createCase(
                userId,
                request != null ? request.getTitle() : null,
                request != null ? request.getDescription() : null,
                request != null ? request.getDossierNumber() : null,
                request != null ? request.getJurisdiction() : null,
                request != null ? request.getClientReference() : null,
                request != null ? request.getIsSealed() : null
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(dtoMapper.toCaseDto(created));
    }

    @GetMapping("/{id}")
    public CaseDto getCase(@PathVariable UUID id) {
        Case caseModel = caseService.getCaseById(id);
        return dtoMapper.toCaseDto(caseModel);
    }

    @PatchMapping("/{id}")
    public CaseDto updateCase(
            @PathVariable UUID id,
            @RequestBody CaseUpdateRequestDto request
    ) {
        Case updated = caseService.updateCase(
                id,
                request != null ? request.getTitle() : null,
                request != null ? request.getDescription() : null,
                request != null ? request.getJurisdiction() : null,
                request != null ? request.getStatus() : null,
                request != null ? request.getClientReference() : null,
                request != null ? request.getIsSealed() : null,
                request != null ? request.getTrialReadinessScore() : null
        );
        return dtoMapper.toCaseDto(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCase(@PathVariable UUID id) {
        caseService.deleteCase(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/canvas")
    public ResponseEntity<CanvasSnapshotDto> getCanvas(@PathVariable UUID id) {
        CanvasVersion canvasVersion = canvasService.getLatestCanvasForCase(id);
        CanvasSnapshotDto dto = dtoMapper.toCanvasSnapshotDto(canvasVersion);
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"v" + canvasVersion.getVersionNumber() + "\"")
                .body(dto);
    }

    @PatchMapping("/{id}/canvas")
    public ResponseEntity<CanvasSnapshotDto> syncCanvas(
            @PathVariable UUID id,
            @RequestHeader(name = HttpHeaders.IF_MATCH, required = false) String ifMatch,
            @RequestBody CanvasSyncRequestDto request
    ) {
        CanvasVersion synced = canvasService.synchronizeCanvas(id, request, ifMatch);
        CanvasSnapshotDto dto = dtoMapper.toCanvasSnapshotDto(synced);
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"v" + synced.getVersionNumber() + "\"")
                .body(dto);
    }

    @PostMapping(value = "/{id}/narrative", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<NarrativeIngestionResponseDto> ingestTextNarrative(
            @PathVariable UUID id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestBody NarrativeTextRequestDto request
    ) {
        String narrativeText = request != null ? request.resolveNarrativeText() : null;
        String language = request != null ? request.getLanguage() : "es-PE";
        Long baseVersion = request != null ? request.getBaseVersion() : null;

        CanvasPromptService.IngestionResult result = canvasPromptService.ingestTextNarrative(
                id,
                narrativeText,
                language,
                baseVersion,
                idempotencyKey
        );

        return buildNarrativeResponse(result);
    }

    @PostMapping(value = "/{id}/narrative", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NarrativeIngestionResponseDto> ingestMultipartNarrative(
            @PathVariable UUID id,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestPart(name = "audio", required = false) MultipartFile audio,
            @RequestParam(name = "text", required = false) String text,
            @RequestParam(name = "narrativeText", required = false) String narrativeText,
            @RequestParam(name = "language", required = false) String language,
            @RequestParam(name = "baseVersion", required = false) Long baseVersion
    ) throws IOException {
        CanvasPromptService.IngestionResult result;
        if (audio != null && !audio.isEmpty()) {
            result = canvasPromptService.ingestAudioNarrative(
                    id,
                    audio.getBytes(),
                    audio.getOriginalFilename(),
                    audio.getContentType(),
                    language,
                    baseVersion,
                    idempotencyKey
            );
        } else {
            String resolvedText = (text != null && !text.isBlank()) ? text : narrativeText;
            if (resolvedText == null || resolvedText.isBlank()) {
                throw new UnprocessableEntityException(
                        "MISSING_NARRATIVE_INPUT",
                        "Multipart narrative request must include either an 'audio' file part or a 'text' parameter."
                );
            }
            result = canvasPromptService.ingestTextNarrative(
                    id,
                    resolvedText,
                    language,
                    baseVersion,
                    idempotencyKey
            );
        }

        return buildNarrativeResponse(result);
    }

    private ResponseEntity<NarrativeIngestionResponseDto> buildNarrativeResponse(
            CanvasPromptService.IngestionResult result
    ) {
        CanvasSnapshotDto snapshotDto = dtoMapper.toCanvasSnapshotDto(result.canvasVersion());
        NarrativeIngestionResponseDto responseDto = new NarrativeIngestionResponseDto(
                result.caseId(),
                result.transcription(),
                result.extractedNodes(),
                result.extractedEdges(),
                snapshotDto
        );
        return ResponseEntity.ok(responseDto);
    }

    private UUID resolveCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedUser user) {
            return user.id();
        }
        return null;
    }
}
