package com.iurify.casebackend.domain.repository;

import com.iurify.casebackend.domain.model.Case;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CaseRepository {
    List<Case> findAll();
    List<Case> findByUserId(UUID userId);
    Optional<Case> findById(UUID id);
    Case save(Case caseModel);
    void deleteById(UUID id);
    boolean existsByDossierNumber(String dossierNumber);
}
