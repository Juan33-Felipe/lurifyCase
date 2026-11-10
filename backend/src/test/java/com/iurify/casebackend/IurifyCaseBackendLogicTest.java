package com.iurify.casebackend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iurify.casebackend.application.exception.CanvasVersionConflictException;
import com.iurify.casebackend.application.exception.EmailAlreadyExistsException;
import com.iurify.casebackend.application.port.IAClient;
import com.iurify.casebackend.application.port.SpeechToTextService;
import com.iurify.casebackend.application.service.*;
import com.iurify.casebackend.domain.model.*;
import com.iurify.casebackend.domain.repository.*;
import com.iurify.casebackend.infrastructure.ai.GeminiAdapter;
import com.iurify.casebackend.infrastructure.ai.GeminiSpeechToTextAdapter;
import com.iurify.casebackend.infrastructure.controller.dto.CanvasPatchOperationDto;
import com.iurify.casebackend.infrastructure.controller.dto.CanvasSyncRequestDto;
import com.iurify.casebackend.infrastructure.security.AuthenticatedUser;
import com.iurify.casebackend.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;

class IurifyCaseBackendLogicTest {

    private UserRepository userRepository;
    private CaseRepository caseRepository;
    private CanvasVersionRepository canvasVersionRepository;
    private CaseAuditRepository caseAuditRepository;
    private AuditFindingRepository auditFindingRepository;
    private LegalDocumentRepository legalDocumentRepository;

    private AuthService authService;
    private JwtService jwtService;
    private CaseService caseService;
    private CanvasService canvasService;
    private CanvasPromptService canvasPromptService;
    private AuditService auditService;
    private DocumentGeneratorService documentGeneratorService;

    private final UUID demoUserId = UUID.fromString("a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d");

    @BeforeEach
    void setUp() {
        Map<UUID, User> users = new ConcurrentHashMap<>();
        Map<UUID, Case> cases = new ConcurrentHashMap<>();
        List<CanvasVersion> versions = Collections.synchronizedList(new ArrayList<>());
        Map<UUID, CaseAudit> audits = new ConcurrentHashMap<>();
        List<AuditFinding> findings = Collections.synchronizedList(new ArrayList<>());
        Map<UUID, LegalDocument> documents = new ConcurrentHashMap<>();

        PasswordEncoder encoder = new BCryptPasswordEncoder();
        User demoUser = new User(
                demoUserId,
                "demo.lawyer@example.com",
                encoder.encode("Password123!"),
                "Jane Doe, Esq.",
                "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890",
                "EMAIL",
                Instant.now(),
                Instant.now()
        );
        users.put(demoUserId, demoUser);

        userRepository = new UserRepository() {
            @Override
            public Optional<User> findByEmail(String email) {
                return users.values().stream()
                        .filter(u -> u.getEmail().equalsIgnoreCase(email))
                        .findFirst();
            }

            @Override
            public Optional<User> findById(UUID id) {
                return Optional.ofNullable(users.get(id));
            }

            @Override
            public User save(User user) {
                if (user.getId() == null) user.setId(UUID.randomUUID());
                users.put(user.getId(), user);
                return user;
            }
        };

        caseRepository = new CaseRepository() {
            @Override
            public List<Case> findAll() {
                return new ArrayList<>(cases.values());
            }

            @Override
            public List<Case> findByUserId(UUID userId) {
                return cases.values().stream().filter(c -> userId.equals(c.getUserId())).toList();
            }

            @Override
            public Optional<Case> findById(UUID id) {
                return Optional.ofNullable(cases.get(id));
            }

            @Override
            public Case save(Case caseModel) {
                if (caseModel.getId() == null) caseModel.setId(UUID.randomUUID());
                cases.put(caseModel.getId(), caseModel);
                return caseModel;
            }

            @Override
            public void deleteById(UUID id) {
                cases.remove(id);
            }

            @Override
            public boolean existsByDossierNumber(String dossierNumber) {
                return cases.values().stream().anyMatch(c -> dossierNumber.equals(c.getDossierNumber()));
            }
        };

        canvasVersionRepository = new CanvasVersionRepository() {
            @Override
            public Optional<CanvasVersion> findLatestByCaseId(UUID caseId) {
                return versions.stream()
                        .filter(v -> caseId.equals(v.getCaseId()))
                        .max(Comparator.comparingLong(CanvasVersion::getVersionNumber));
            }

            @Override
            public Optional<CanvasVersion> findByCaseIdAndVersionNumber(UUID caseId, Long versionNumber) {
                return versions.stream()
                        .filter(v -> caseId.equals(v.getCaseId()) && versionNumber.equals(v.getVersionNumber()))
                        .findFirst();
            }

            @Override
            public CanvasVersion save(CanvasVersion canvasVersion) {
                if (canvasVersion.getId() == null) canvasVersion.setId(UUID.randomUUID());
                versions.add(canvasVersion);
                return canvasVersion;
            }
        };

        caseAuditRepository = new CaseAuditRepository() {
            @Override
            public CaseAudit save(CaseAudit caseAudit) {
                if (caseAudit.getId() == null) caseAudit.setId(UUID.randomUUID());
                audits.put(caseAudit.getId(), caseAudit);
                return caseAudit;
            }

            @Override
            public List<CaseAudit> findByCaseId(UUID caseId) {
                return audits.values().stream().filter(a -> caseId.equals(a.getCaseId())).toList();
            }

            @Override
            public Optional<CaseAudit> findById(UUID id) {
                return Optional.ofNullable(audits.get(id));
            }
        };

        auditFindingRepository = new AuditFindingRepository() {
            @Override
            public List<AuditFinding> saveAll(List<AuditFinding> list) {
                for (AuditFinding f : list) {
                    if (f.getId() == null) f.setId(UUID.randomUUID());
                    findings.add(f);
                }
                return list;
            }

            @Override
            public List<AuditFinding> findByAuditId(UUID auditId) {
                return findings.stream().filter(f -> auditId.equals(f.getAuditId())).toList();
            }
        };

        legalDocumentRepository = new LegalDocumentRepository() {
            @Override
            public LegalDocument save(LegalDocument document) {
                if (document.getId() == null) document.setId(UUID.randomUUID());
                documents.put(document.getId(), document);
                return document;
            }

            @Override
            public Optional<LegalDocument> findById(UUID id) {
                return Optional.ofNullable(documents.get(id));
            }

            @Override
            public Optional<LegalDocument> findByIdAndCaseId(UUID id, UUID caseId) {
                return Optional.ofNullable(documents.get(id))
                        .filter(d -> caseId.equals(d.getCaseId()));
            }

            @Override
            public List<LegalDocument> findByCaseId(UUID caseId) {
                return documents.values().stream().filter(d -> caseId.equals(d.getCaseId())).toList();
            }
        };

        ObjectMapper objectMapper = new ObjectMapper();
        authService = new AuthService(userRepository, encoder);
        jwtService = new JwtService("test-secret-key-for-iurify-case-hs256-jwt-signing-2026", 3600);
        caseService = new CaseService(caseRepository, canvasVersionRepository);
        canvasService = new CanvasService(caseRepository, canvasVersionRepository);

        SpeechToTextService sttService = new GeminiSpeechToTextAdapter("", "gemini-2.0-flash", "https://generativelanguage.googleapis.com/v1beta", objectMapper);
        IAClient iaClient = new GeminiAdapter("", "gemini-2.0-flash", "https://generativelanguage.googleapis.com/v1beta", objectMapper);

        canvasPromptService = new CanvasPromptService(canvasService, sttService, iaClient);
        auditService = new AuditService(caseRepository, canvasVersionRepository, caseAuditRepository, auditFindingRepository, canvasService, iaClient);
        documentGeneratorService = new DocumentGeneratorService(caseRepository, canvasVersionRepository, legalDocumentRepository, canvasService, iaClient);
    }

    @Test
    void shouldAuthenticateAndVerifyJwtAndExecuteFullCaseLifecycle() {
        // Phase 2: Auth & JWT
        User authenticated = authService.authenticate("demo.lawyer@example.com", "Password123!", null, null);
        assertEquals(demoUserId, authenticated.getId());
        String token = jwtService.generateToken(authenticated);
        assertNotNull(token);
        AuthenticatedUser principal = jwtService.parseAndValidate(token);
        assertEquals(demoUserId, principal.id());
        assertEquals("demo.lawyer@example.com", principal.email());

        // Phase 3: Create Case & Initial Canvas
        Case createdCase = caseService.createCase(
                demoUserId,
                "State v. Sterling Industries",
                "Environmental contamination litigation",
                "LEX-2026-900",
                "Federal District Court",
                "CLIENT-01",
                false
        );
        assertNotNull(createdCase.getId());
        assertEquals(1L, createdCase.getCanvasVersion());

        // Phase 4: Conversational Narrative Ingestion
        CanvasPromptService.IngestionResult ingestion = canvasPromptService.ingestTextNarrative(
                createdCase.getId(),
                "On October 12, chemical drums were found near the river. The forensic report Exhibit A confirms contamination. Environmental Act Section 42 applies.",
                "en-US",
                1L,
                "idem-key-1"
        );
        assertEquals(2L, ingestion.canvasVersion().getVersionNumber());
        assertFalse(ingestion.extractedNodes().isEmpty());

        // Phase 3: Manual Canvas Synchronization & Optimistic Concurrency Control
        CanvasPatchOperationDto addNodeOp = new CanvasPatchOperationDto();
        addNodeOp.setOp("ADD_NODE");
        addNodeOp.setNode(Map.of(
                "id", UUID.randomUUID().toString(),
                "type", "JURISPRUDENCE",
                "title", "Supreme Court Precedent 2022",
                "summary", "Strict liability standard for hazardous materials",
                "position", Map.of("x", 300.0, "y", 300.0)
        ));
        CanvasSyncRequestDto syncReq = new CanvasSyncRequestDto();
        syncReq.setBaseVersion(2L);
        syncReq.setOperations(List.of(addNodeOp));

        CanvasVersion synced = canvasService.synchronizeCanvas(createdCase.getId(), syncReq, null);
        assertEquals(3L, synced.getVersionNumber());

        // Stale baseVersion (2L instead of 3L) must throw CanvasVersionConflictException (409 Conflict)
        assertThrows(CanvasVersionConflictException.class, () ->
                canvasService.synchronizeCanvas(createdCase.getId(), syncReq, null)
        );

        // Phase 5: Real-Time AI Case Audit
        AuditService.AuditExecutionOutput auditOutput = auditService.runCaseAudit(createdCase.getId(), null, null);
        assertNotNull(auditOutput.audit().getId());
        assertNotNull(auditOutput.audit().getSolidityScore());
        assertFalse(auditOutput.findings().isEmpty());
        Case updatedCaseAfterAudit = caseService.getCaseById(createdCase.getId());
        assertEquals(auditOutput.audit().getSolidityScore(), updatedCaseAfterAudit.getTrialReadinessScore());

        // Phase 6: Legal Document Generation & PDF/WORD Export
        LegalDocument generatedDoc = documentGeneratorService.generateDocument(
                createdCase.getId(),
                "LEGAL_BRIEF",
                "Motion for Summary Judgment",
                "en-US",
                "Emphasize strict liability under Section 42",
                null
        );
        assertEquals("COMPLETED", generatedDoc.getStatus());
        assertNotNull(generatedDoc.getContentBody());

        DocumentGeneratorService.ExportedBinaryDocument pdfExport =
                documentGeneratorService.exportDocument(createdCase.getId(), generatedDoc.getId(), "PDF");
        assertEquals("application/pdf", pdfExport.contentType());
        assertTrue(pdfExport.bytes().length > 50);

        DocumentGeneratorService.ExportedBinaryDocument wordExport =
                documentGeneratorService.exportDocument(createdCase.getId(), generatedDoc.getId(), "WORD");
        assertEquals("application/vnd.openxmlformats-officedocument.wordprocessingml.document", wordExport.contentType());
        assertTrue(wordExport.bytes().length > 50);
    }

    @Test
    void registerShouldLetPersistenceAssignTheIdOfANewUser() {
        // Spring Data hace merge (no insert) cuando la entidad ya trae id, y con Hibernate 6.6
        // eso falla con "Row was updated or deleted by another transaction". Un usuario nuevo
        // debe llegar al repositorio sin id para que JPA lo inserte y la base genere el UUID.
        List<User> saved = new ArrayList<>();
        UserRepository capturing = new UserRepository() {
            public Optional<User> findByEmail(String email) { return Optional.empty(); }
            public Optional<User> findById(UUID id) { return Optional.empty(); }
            public User save(User user) {
                saved.add(new User(user.getId(), user.getEmail(), user.getPasswordHash(), user.getFullName(),
                        user.getBiometricPublicKey(), user.getAuthMethod(), user.getCreatedAt(), user.getUpdatedAt()));
                if (user.getId() == null) user.setId(UUID.randomUUID());
                return user;
            }
        };
        AuthService service = new AuthService(capturing, new BCryptPasswordEncoder());

        User registered = service.register("Ana Pérez", "ana.perez@lawfirm.example", "secreto123");

        assertEquals(1, saved.size());
        assertNull(saved.get(0).getId(), "register no debe asignar el id; lo genera la base de datos");
        assertNotNull(registered.getId());
    }

    @Test
    void shouldRegisterNewUserSuccessfullyAndAuthenticate() {
        String fullName = "Carlos Santander, Esq.";
        String email = "carlos.santander@lawfirm.example";
        String password = "SecurePassword2026!";

        User registered = authService.register(fullName, email, password);

        assertNotNull(registered.getId());
        assertEquals("carlos.santander@lawfirm.example", registered.getEmail());
        assertEquals(fullName, registered.getFullName());
        assertEquals("EMAIL", registered.getAuthMethod());
        assertNotNull(registered.getPasswordHash());
        assertNotNull(registered.getCreatedAt());

        // Verify newly registered user can be authenticated with original password
        User authenticated = authService.authenticate(email, password, null, null);
        assertEquals(registered.getId(), authenticated.getId());

        // Verify signed JWT token generation with 86400s
        String token = jwtService.generateToken(registered, 86400L);
        assertNotNull(token);
        AuthenticatedUser principal = jwtService.parseAndValidate(token);
        assertEquals(registered.getId(), principal.id());
        assertEquals(registered.getEmail(), principal.email());
    }

    @Test
    void shouldThrowConflictExceptionWhenRegisteringExistingEmail() {
        // demo.lawyer@example.com already exists in the repository
        EmailAlreadyExistsException ex = assertThrows(EmailAlreadyExistsException.class, () ->
                authService.register("Clone Lawyer", "demo.lawyer@example.com", "anyPassword123")
        );

        assertEquals("Email already registered", ex.getMessage());
        assertEquals("EMAIL_ALREADY_REGISTERED", ex.getCode());
    }

    @Test
    void shouldValidateRegistrationParameters() {
        assertThrows(IllegalArgumentException.class, () ->
                authService.register(null, "valid@example.com", "pass123")
        );
        assertThrows(IllegalArgumentException.class, () ->
                authService.register("Valid Name", null, "pass123")
        );
        assertThrows(IllegalArgumentException.class, () ->
                authService.register("Valid Name", "valid@example.com", "")
        );
    }

    @Test
    void shouldReturnEmptyCasesListForNewlyCreatedAccount() {
        User newUser = authService.register("New Attorney", "new.attorney@example.com", "Secret123!");
        assertNotNull(newUser.getId());

        List<Case> userCases = caseService.listCases(newUser.getId(), null, null);
        assertNotNull(userCases);
        assertTrue(userCases.isEmpty(), "Newly created account should have no cases");
    }
}
