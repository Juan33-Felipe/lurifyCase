package com.iurify.casebackend.application.service;

import com.iurify.casebackend.application.exception.DocumentConflictException;
import com.iurify.casebackend.application.exception.ResourceNotFoundException;
import com.iurify.casebackend.application.exception.UnprocessableEntityException;
import com.iurify.casebackend.application.port.IAClient;
import com.iurify.casebackend.domain.model.CanvasVersion;
import com.iurify.casebackend.domain.model.Case;
import com.iurify.casebackend.domain.model.LegalDocument;
import com.iurify.casebackend.domain.repository.CanvasVersionRepository;
import com.iurify.casebackend.domain.repository.CaseRepository;
import com.iurify.casebackend.domain.repository.LegalDocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class DocumentGeneratorService {

    private static final String DOCUMENT_SYSTEM_PROMPT = """
            You are a Senior Litigation Partner AI for Iurify Case.
            Synthesize a formal, court-ready legal document in structured Markdown based on the provided case metadata and canvas graph (FACT, EVIDENCE, LAW, JURISPRUDENCE).
            Include:
            1. Formal Case Caption & Dossier Reference
            2. Statement of Material Facts
            3. Evidentiary Corroboration
            4. Statutory & Jurisprudential Authorities
            5. Legal Argumentation & Prayer for Relief
            """;

    private final CaseRepository caseRepository;
    private final CanvasVersionRepository canvasVersionRepository;
    private final LegalDocumentRepository legalDocumentRepository;
    private final CanvasService canvasService;
    private final IAClient iaClient;

    public record ExportedBinaryDocument(
            byte[] bytes,
            String contentType,
            String filename
    ) {}

    public DocumentGeneratorService(
            CaseRepository caseRepository,
            CanvasVersionRepository canvasVersionRepository,
            LegalDocumentRepository legalDocumentRepository,
            CanvasService canvasService,
            IAClient iaClient
    ) {
        this.caseRepository = caseRepository;
        this.canvasVersionRepository = canvasVersionRepository;
        this.legalDocumentRepository = legalDocumentRepository;
        this.canvasService = canvasService;
        this.iaClient = iaClient;
    }

    @Transactional
    public LegalDocument generateDocument(
            UUID caseId,
            String rawDocumentType,
            String requestedTitle,
            String language,
            String instructions,
            Long requestedCanvasVersion
    ) {
        Case caseModel = caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));

        String normalizedDocType = normalizeDocumentType(rawDocumentType);
        String resolvedLanguage = (language != null && !language.isBlank()) ? language.trim() : "es-PE";

        CanvasVersion targetCanvas = (requestedCanvasVersion != null)
                ? canvasVersionRepository.findByCaseIdAndVersionNumber(caseId, requestedCanvasVersion)
                        .orElseGet(() -> canvasService.getLatestCanvasForCase(caseId))
                : canvasService.getLatestCanvasForCase(caseId);

        String resolvedTitle = (requestedTitle != null && !requestedTitle.isBlank())
                ? requestedTitle.trim()
                : buildDefaultTitle(normalizedDocType, caseModel.getTitle(), resolvedLanguage);

        String markdownBody = iaClient.generateLegalDocument(
                DOCUMENT_SYSTEM_PROMPT,
                caseModel,
                targetCanvas.getGraphData(),
                normalizedDocType,
                resolvedLanguage,
                instructions
        );

        Instant now = Instant.now();
        LegalDocument doc = new LegalDocument(
                null,
                caseId,
                resolvedTitle,
                normalizedDocType,
                "COMPLETED",
                resolvedLanguage,
                targetCanvas.getVersionNumber(),
                instructions,
                "MARKDOWN",
                markdownBody,
                "/storage/cases/" + caseId + "/documents/" + UUID.randomUUID() + ".md",
                null,
                null,
                now,
                now,
                now
        );

        return legalDocumentRepository.save(doc);
    }

    public List<LegalDocument> listDocumentsByCase(UUID caseId) {
        caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));
        return legalDocumentRepository.findByCaseId(caseId);
    }

    public LegalDocument getDocument(UUID caseId, UUID documentId) {
        caseRepository.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested case does not exist."));
        return legalDocumentRepository.findByIdAndCaseId(documentId, caseId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested legal document does not exist."));
    }

    public ExportedBinaryDocument exportDocument(UUID caseId, UUID documentId, String format) {
        LegalDocument doc = getDocument(caseId, documentId);
        if (!"COMPLETED".equalsIgnoreCase(doc.getStatus())) {
            throw new DocumentConflictException("Document is not in COMPLETED state (current status: " + doc.getStatus() + ").");
        }

        String normalizedFormat = (format != null && !format.isBlank()) ? format.trim().toUpperCase() : "PDF";
        String safeBaseName = sanitizeFilename(doc.getTitle());
        String body = doc.getContentBody() != null ? doc.getContentBody() : "";

        return switch (normalizedFormat) {
            case "PDF" -> new ExportedBinaryDocument(
                    renderPdfBytes(doc.getTitle(), body),
                    "application/pdf",
                    safeBaseName + ".pdf"
            );
            case "WORD", "DOCX" -> new ExportedBinaryDocument(
                    renderDocxBytes(doc.getTitle(), body),
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    safeBaseName + ".docx"
            );
            default -> throw new UnprocessableEntityException(
                    "UNSUPPORTED_EXPORT_FORMAT",
                    "Export format must be PDF or WORD."
            );
        };
    }

    private String normalizeDocumentType(String raw) {
        if (raw == null || raw.isBlank()) {
            return "LEGAL_BRIEF";
        }
        return switch (raw.trim().toUpperCase()) {
            case "MINUTA", "LEGAL_BRIEF" -> "LEGAL_BRIEF";
            case "ALEGATO", "CLOSING_ARGUMENT" -> "CLOSING_ARGUMENT";
            case "CONCEPTO", "LEGAL_OPINION" -> "LEGAL_OPINION";
            default -> throw new UnprocessableEntityException(
                    "INVALID_DOCUMENT_TYPE",
                    "Unsupported documentType '" + raw + "'. Valid values: LEGAL_BRIEF, CLOSING_ARGUMENT, LEGAL_OPINION."
            );
        };
    }

    private String buildDefaultTitle(String docType, String caseTitle, String language) {
        boolean isSpanish = language != null && language.toLowerCase().startsWith("es");
        String prefix = switch (docType) {
            case "CLOSING_ARGUMENT" -> isSpanish ? "Alegato de Clausura - " : "Closing Argument - ";
            case "LEGAL_OPINION" -> isSpanish ? "Concepto Jurídico - " : "Legal Opinion - ";
            default -> isSpanish ? "Minuta Jurídica - " : "Legal Brief - ";
        };
        return prefix + caseTitle;
    }

    private String sanitizeFilename(String title) {
        if (title == null || title.isBlank()) {
            return "legal-document";
        }
        String sanitized = title.replaceAll("[^a-zA-Z0-9._\\- ]", "").trim().replaceAll("\\s+", "_");
        return sanitized.isEmpty() ? "legal-document" : sanitized;
    }

    private byte[] renderPdfBytes(String title, String markdownBody) {
        String plainText = (title + "\n\n" + markdownBody)
                .replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");

        String[] rawLines = plainText.split("\\r?\\n");
        StringBuilder streamContent = new StringBuilder();
        streamContent.append("BT\n/F1 11 Tf\n50 760 Td\n14 TL\n");

        int lineCount = 0;
        for (String line : rawLines) {
            if (lineCount >= 45) {
                break;
            }
            String truncated = line.length() > 90 ? line.substring(0, 90) : line;
            streamContent.append("(").append(truncated).append(") Tj T*\n");
            lineCount++;
        }
        streamContent.append("ET\n");
        byte[] streamBytes = streamContent.toString().getBytes(StandardCharsets.ISO_8859_1);

        String pdf = "%PDF-1.4\n"
                + "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
                + "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
                + "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
                + "4 0 obj\n<< /Length " + streamBytes.length + " >>\nstream\n"
                + new String(streamBytes, StandardCharsets.ISO_8859_1)
                + "endstream\nendobj\n"
                + "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
                + "xref\n0 6\n0000000000 65535 f \n"
                + "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF\n";

        return pdf.getBytes(StandardCharsets.ISO_8859_1);
    }

    private byte[] renderDocxBytes(String title, String markdownBody) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
                String contentTypes = """
                        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
                          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
                          <Default Extension="xml" ContentType="application/xml"/>
                          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
                        </Types>
                        """;
                writeZipEntry(zos, "[Content_Types].xml", contentTypes);

                String rels = """
                        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
                        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
                          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
                        </Relationships>
                        """;
                writeZipEntry(zos, "_rels/.rels", rels);

                StringBuilder paragraphs = new StringBuilder();
                paragraphs.append("<w:p><w:r><w:t>").append(escapeXml(title)).append("</w:t></w:r></w:p>");
                for (String line : markdownBody.split("\\r?\\n")) {
                    paragraphs.append("<w:p><w:r><w:t>").append(escapeXml(line)).append("</w:t></w:r></w:p>");
                }

                String documentXml = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
                        + "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">"
                        + "<w:body>" + paragraphs + "</w:body></w:document>";
                writeZipEntry(zos, "word/document.xml", documentXml);
            }
            return baos.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to build WORD (.docx) export stream", ex);
        }
    }

    private void writeZipEntry(ZipOutputStream zos, String name, String content) throws Exception {
        ZipEntry entry = new ZipEntry(name);
        zos.putNextEntry(entry);
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
