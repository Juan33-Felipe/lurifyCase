package com.iurify.casebackend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iurify.casebackend.application.port.IAClient;
import com.iurify.casebackend.application.port.SpeechToTextService;
import com.iurify.casebackend.application.service.*;
import com.iurify.casebackend.domain.model.*;
import com.iurify.casebackend.domain.repository.*;
import com.iurify.casebackend.infrastructure.ai.GeminiAdapter;
import com.iurify.casebackend.infrastructure.ai.GeminiSpeechToTextAdapter;
import com.iurify.casebackend.infrastructure.controller.*;
import com.iurify.casebackend.infrastructure.controller.mapper.DtoMapper;
import com.iurify.casebackend.infrastructure.security.JwtAuthenticationFilter;
import com.iurify.casebackend.infrastructure.security.JwtService;
import com.iurify.casebackend.infrastructure.security.SecurityConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class IurifyCaseControllerIntegrationTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private JwtService jwtService;
    private User demoUser;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        Map<UUID, User> users = new ConcurrentHashMap<>();
        Map<UUID, Case> cases = new ConcurrentHashMap<>();
        List<CanvasVersion> versions = Collections.synchronizedList(new ArrayList<>());
        Map<UUID, CaseAudit> audits = new ConcurrentHashMap<>();
        List<AuditFinding> findings = Collections.synchronizedList(new ArrayList<>());
        Map<UUID, LegalDocument> documents = new ConcurrentHashMap<>();

        PasswordEncoder encoder = new BCryptPasswordEncoder();
        UUID demoUserId = UUID.fromString("a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d");
        demoUser = new User(
                demoUserId,
                "demo.lawyer@example.com",
                "$2b$12$KIXe8P7vC1tW5Zz/OqXvXu7O5W.N3L.Z2M9K1T4F8Z/OqXvXu7O5W",
                "Jane Doe, Esq.",
                "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1234567890",
                "EMAIL",
                Instant.now(),
                Instant.now()
        );
        users.put(demoUserId, demoUser);

        UserRepository userRepository = new UserRepository() {
            @Override
            public Optional<User> findByEmail(String email) {
                return users.values().stream().filter(u -> u.getEmail().equalsIgnoreCase(email)).findFirst();
            }
            @Override
            public Optional<User> findById(UUID id) { return Optional.ofNullable(users.get(id)); }
            @Override
            public User save(User user) {
                if (user.getId() == null) user.setId(UUID.randomUUID());
                users.put(user.getId(), user);
                return user;
            }
        };

        CaseRepository caseRepository = new CaseRepository() {
            @Override
            public List<Case> findAll() { return new ArrayList<>(cases.values()); }
            @Override
            public List<Case> findByUserId(UUID userId) {
                return cases.values().stream().filter(c -> userId.equals(c.getUserId())).toList();
            }
            @Override
            public Optional<Case> findById(UUID id) { return Optional.ofNullable(cases.get(id)); }
            @Override
            public Case save(Case caseModel) {
                if (caseModel.getId() == null) caseModel.setId(UUID.randomUUID());
                cases.put(caseModel.getId(), caseModel);
                return caseModel;
            }
            @Override
            public void deleteById(UUID id) { cases.remove(id); }
            @Override
            public boolean existsByDossierNumber(String d) {
                return cases.values().stream().anyMatch(c -> d.equals(c.getDossierNumber()));
            }
        };

        CanvasVersionRepository canvasVersionRepository = new CanvasVersionRepository() {
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
            public CanvasVersion save(CanvasVersion cv) {
                if (cv.getId() == null) cv.setId(UUID.randomUUID());
                versions.add(cv);
                return cv;
            }
        };

        CaseAuditRepository caseAuditRepository = new CaseAuditRepository() {
            @Override
            public CaseAudit save(CaseAudit ca) {
                if (ca.getId() == null) ca.setId(UUID.randomUUID());
                audits.put(ca.getId(), ca);
                return ca;
            }
            @Override
            public List<CaseAudit> findByCaseId(UUID caseId) {
                return audits.values().stream().filter(a -> caseId.equals(a.getCaseId())).toList();
            }
            @Override
            public Optional<CaseAudit> findById(UUID id) { return Optional.ofNullable(audits.get(id)); }
        };

        AuditFindingRepository auditFindingRepository = new AuditFindingRepository() {
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

        LegalDocumentRepository legalDocumentRepository = new LegalDocumentRepository() {
            @Override
            public LegalDocument save(LegalDocument doc) {
                if (doc.getId() == null) doc.setId(UUID.randomUUID());
                documents.put(doc.getId(), doc);
                return doc;
            }
            @Override
            public Optional<LegalDocument> findById(UUID id) { return Optional.ofNullable(documents.get(id)); }
            @Override
            public Optional<LegalDocument> findByIdAndCaseId(UUID id, UUID caseId) {
                return Optional.ofNullable(documents.get(id)).filter(d -> caseId.equals(d.getCaseId()));
            }
            @Override
            public List<LegalDocument> findByCaseId(UUID caseId) {
                return documents.values().stream().filter(d -> caseId.equals(d.getCaseId())).toList();
            }
        };

        jwtService = new JwtService("test-secret-key-for-iurify-case-hs256-jwt-signing-2026", 3600);
        AuthService authService = new AuthService(userRepository, encoder);
        CaseService caseService = new CaseService(caseRepository, canvasVersionRepository);
        CanvasService canvasService = new CanvasService(caseRepository, canvasVersionRepository);
        SpeechToTextService sttService = new GeminiSpeechToTextAdapter("", "gemini-2.0-flash", "https://generativelanguage.googleapis.com/v1beta", objectMapper);
        IAClient iaClient = new GeminiAdapter("", "gemini-2.0-flash", "https://generativelanguage.googleapis.com/v1beta", objectMapper);
        CanvasPromptService canvasPromptService = new CanvasPromptService(canvasService, sttService, iaClient);
        AuditService auditService = new AuditService(caseRepository, canvasVersionRepository, caseAuditRepository, auditFindingRepository, canvasService, iaClient);
        DocumentGeneratorService documentGeneratorService = new DocumentGeneratorService(caseRepository, canvasVersionRepository, legalDocumentRepository, canvasService, iaClient);
        DtoMapper dtoMapper = new DtoMapper();

        AuthController authController = new AuthController(authService, jwtService);
        CaseController caseController = new CaseController(caseService, canvasService, canvasPromptService, dtoMapper);
        AuditController auditController = new AuditController(auditService);
        DocumentController documentController = new DocumentController(documentGeneratorService, dtoMapper);
        SystemController systemController = new SystemController();

        mockMvc = MockMvcBuilders
                .standaloneSetup(authController, caseController, auditController, documentController, systemController)
                .setControllerAdvice(new GlobalExceptionHandler(dtoMapper))
                .addFilters(new JwtAuthenticationFilter(jwtService))
                .build();
    }

    @Test
    void shouldExecuteAllRestEndpointsAcrossPhases() throws Exception {
        // 1. Health check
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));

        // 2. POST /api/v1/auth/login with seed user
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"demo.lawyer@example.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("demo.lawyer@example.com"))
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String bearerToken = "Bearer " + loginJson.get("accessToken").asText();

        // 3. POST /api/v1/cases
        MvcResult createCaseResult = mockMvc.perform(post("/api/v1/cases")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Republic v. Orion Mining\",\"description\":\"Water table dispute\",\"jurisdiction\":\"Supreme Court\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Republic v. Orion Mining"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.canvasVersion").value(1))
                .andReturn();

        String caseId = objectMapper.readTree(createCaseResult.getResponse().getContentAsString()).get("id").asText();

        // 4. POST /api/v1/cases/{id}/narrative (JSON)
        mockMvc.perform(post("/api/v1/cases/" + caseId + "/narrative")
                        .header("Authorization", bearerToken)
                        .header("Idempotency-Key", "idem-json-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"El testigo declaró que hubo derrame el 5 de mayo. El informe pericial confirma contaminación. La Ley General del Ambiente Art. 142 establece responsabilidad.\",\"language\":\"es-PE\",\"baseVersion\":1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(caseId))
                .andExpect(jsonPath("$.snapshot.version").value(2))
                .andExpect(jsonPath("$.extractedNodes").isArray());

        // 5. POST /api/v1/cases/{id}/narrative (Multipart Audio)
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio",
                "dictation.m4a",
                "audio/mp4",
                new byte[]{1, 2, 3, 4, 5, 6, 7, 8}
        );
        mockMvc.perform(multipart("/api/v1/cases/" + caseId + "/narrative")
                        .file(audioFile)
                        .param("language", "es-PE")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snapshot.version").value(3));

        // 6. PATCH /api/v1/cases/{id}/canvas with stale version -> 409 Conflict
        mockMvc.perform(patch("/api/v1/cases/" + caseId + "/canvas")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"baseVersion\":1,\"operations\":[]}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CANVAS_VERSION_CONFLICT"))
                .andExpect(jsonPath("$.currentVersion").value(3))
                .andExpect(jsonPath("$.latestSnapshot.version").value(3));

        // 7. POST /api/v1/cases/{id}/audit
        mockMvc.perform(post("/api/v1/cases/" + caseId + "/audit")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(caseId))
                .andExpect(jsonPath("$.solidityScore").isNumber())
                .andExpect(jsonPath("$.alerts").isArray());

        // 8. POST /api/v1/cases/{id}/documents -> 202 Accepted
        MvcResult docResult = mockMvc.perform(post("/api/v1/cases/" + caseId + "/documents")
                        .header("Authorization", bearerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"documentType\":\"MINUTA\",\"language\":\"es-PE\",\"instructions\":\"Incluir petitorio cautelar\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.documentType").value("LEGAL_BRIEF"))
                .andReturn();

        String docId = objectMapper.readTree(docResult.getResponse().getContentAsString()).get("id").asText();

        // 9. GET /api/v1/cases/{id}/documents/{docId}/export?format=PDF & WORD
        MvcResult pdfExport = mockMvc.perform(get("/api/v1/cases/" + caseId + "/documents/" + docId + "/export")
                        .param("format", "PDF")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andReturn();
        assertTrue(pdfExport.getResponse().getContentAsByteArray().length > 50);

        MvcResult wordExport = mockMvc.perform(get("/api/v1/cases/" + caseId + "/documents/" + docId + "/export")
                        .param("format", "WORD")
                        .header("Authorization", bearerToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .andReturn();
        assertTrue(wordExport.getResponse().getContentAsByteArray().length > 50);
    }
}
