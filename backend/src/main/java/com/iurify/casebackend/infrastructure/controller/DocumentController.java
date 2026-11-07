package com.iurify.casebackend.infrastructure.controller;

import com.iurify.casebackend.application.service.DocumentGeneratorService;
import com.iurify.casebackend.domain.model.LegalDocument;
import com.iurify.casebackend.infrastructure.controller.dto.DocumentGenerationRequestDto;
import com.iurify.casebackend.infrastructure.controller.dto.LegalDocumentDto;
import com.iurify.casebackend.infrastructure.controller.mapper.DtoMapper;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/documents")
public class DocumentController {

    private final DocumentGeneratorService documentGeneratorService;
    private final DtoMapper dtoMapper;

    public DocumentController(DocumentGeneratorService documentGeneratorService, DtoMapper dtoMapper) {
        this.documentGeneratorService = documentGeneratorService;
        this.dtoMapper = dtoMapper;
    }

    @PostMapping
    public ResponseEntity<LegalDocumentDto> generateDocument(
            @PathVariable UUID caseId,
            @RequestBody DocumentGenerationRequestDto request
    ) {
        LegalDocument generated = documentGeneratorService.generateDocument(
                caseId,
                request != null ? request.getDocumentType() : "LEGAL_BRIEF",
                request != null ? request.getTitle() : null,
                request != null ? request.getLanguage() : "es-PE",
                request != null ? request.getInstructions() : null,
                request != null ? request.getSourceCanvasVersion() : null
        );
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(dtoMapper.toLegalDocumentDto(generated));
    }

    @GetMapping
    public ResponseEntity<List<LegalDocumentDto>> listDocuments(@PathVariable UUID caseId) {
        List<LegalDocumentDto> docs = documentGeneratorService.listDocumentsByCase(caseId).stream()
                .map(dtoMapper::toLegalDocumentDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(docs);
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<LegalDocumentDto> getDocument(
            @PathVariable UUID caseId,
            @PathVariable UUID documentId
    ) {
        LegalDocument doc = documentGeneratorService.getDocument(caseId, documentId);
        return ResponseEntity.ok(dtoMapper.toLegalDocumentDto(doc));
    }

    @GetMapping("/{documentId}/export")
    public ResponseEntity<byte[]> exportDocument(
            @PathVariable UUID caseId,
            @PathVariable UUID documentId,
            @RequestParam(name = "format", defaultValue = "PDF") String format
    ) {
        DocumentGeneratorService.ExportedBinaryDocument exported =
                documentGeneratorService.exportDocument(caseId, documentId, format);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(exported.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + exported.filename() + "\"")
                .body(exported.bytes());
    }
}
