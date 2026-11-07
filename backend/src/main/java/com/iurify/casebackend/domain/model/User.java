package com.iurify.casebackend.domain.model;

import java.time.Instant;
import java.util.UUID;

public class User {
    private UUID id;
    private String email;
    private String passwordHash;
    private String fullName;
    private String biometricPublicKey;
    private String authMethod;
    private Instant createdAt;
    private Instant updatedAt;

    public User() {}

    public User(UUID id, String email, String passwordHash, String fullName,
                String biometricPublicKey, String authMethod, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.biometricPublicKey = biometricPublicKey;
        this.authMethod = authMethod;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getBiometricPublicKey() { return biometricPublicKey; }
    public void setBiometricPublicKey(String biometricPublicKey) { this.biometricPublicKey = biometricPublicKey; }
    public String getAuthMethod() { return authMethod; }
    public void setAuthMethod(String authMethod) { this.authMethod = authMethod; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
