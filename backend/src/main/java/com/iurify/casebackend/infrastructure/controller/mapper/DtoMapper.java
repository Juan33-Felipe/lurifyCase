package com.iurify.casebackend.infrastructure.controller.mapper;

import com.iurify.casebackend.domain.model.CanvasVersion;
import com.iurify.casebackend.domain.model.Case;
import com.iurify.casebackend.domain.model.LegalDocument;
import com.iurify.casebackend.infrastructure.controller.dto.CanvasSnapshotDto;
import com.iurify.casebackend.infrastructure.controller.dto.CaseDto;
import com.iurify.casebackend.infrastructure.controller.dto.DocumentContentDto;
import com.iurify.casebackend.infrastructure.controller.dto.LegalDocumentDto;
import org.springframework.stereotype.Component;

@Component
public class DtoMapper {

    public CaseDto toCaseDto(Case caseModel) {
        CaseDto dto = new CaseDto();
        dto.setId(caseModel.getId());
        dto.setUserId(caseModel.getUserId());
        dto.setDossierNumber(caseModel.getDossierNumber());
        dto.setTitle(caseModel.getTitle());
        dto.setDescription(caseModel.getDescription());
        dto.setJurisdiction(caseModel.getJurisdiction());
        dto.setStatus(caseModel.getStatus());
        dto.setTrialReadinessScore(caseModel.getTrialReadinessScore());
        dto.setIsSealed(caseModel.getIsSealed());
        dto.setClientReference(caseModel.getClientReference());
        dto.setCanvasVersion(caseModel.getCanvasVersion());
        dto.setCreatedAt(caseModel.getCreatedAt());
        dto.setUpdatedAt(caseModel.getUpdatedAt());
        return dto;
    }

    public CanvasSnapshotDto toCanvasSnapshotDto(CanvasVersion canvasVersion) {
        if (canvasVersion == null) {
            return null;
        }
        CanvasSnapshotDto dto = new CanvasSnapshotDto();
        dto.setCaseId(canvasVersion.getCaseId());
        dto.setVersion(canvasVersion.getVersionNumber());
        dto.setUpdatedAt(canvasVersion.getCreatedAt());
        dto.setCanvas(canvasVersion.getGraphData());
        return dto;
    }

    public LegalDocumentDto toLegalDocumentDto(LegalDocument doc) {
        LegalDocumentDto dto = new LegalDocumentDto();
        dto.setId(doc.getId());
        dto.setCaseId(doc.getCaseId());
        dto.setTitle(doc.getTitle());
        dto.setDocumentType(doc.getDocumentType());
        dto.setStatus(doc.getStatus());
        dto.setLanguage(doc.getLanguage());
        dto.setSourceCanvasVersion(doc.getSourceCanvasVersion());
        dto.setInstructions(doc.getInstructions());
        dto.setContentFormat(doc.getContentFormat());
        dto.setContentBody(doc.getContentBody());
        if (doc.getContentBody() != null) {
            dto.setContent(new DocumentContentDto(
                    doc.getContentFormat() != null ? doc.getContentFormat() : "MARKDOWN",
                    doc.getContentBody()
            ));
        }
        dto.setRequestedAt(doc.getRequestedAt());
        dto.setCompletedAt(doc.getCompletedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        return dto;
    }
}
