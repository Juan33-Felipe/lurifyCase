package com.iurify.casebackend.infrastructure.controller.dto;

import java.util.UUID;

public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String authMethod;

    public UserDto() {}

    public UserDto(UUID id, String email, String fullName, String authMethod) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.authMethod = authMethod;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getAuthMethod() { return authMethod; }
    public void setAuthMethod(String authMethod) { this.authMethod = authMethod; }
}
