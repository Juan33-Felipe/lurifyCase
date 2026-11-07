package com.iurify.casebackend.infrastructure.controller.dto;

public class LoginRequestDto {
    private String email;
    private String password;
    private String authMethod;
    private String biometricSignature;
    private String biometricPublicKey;

    public LoginRequestDto() {}

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getAuthMethod() { return authMethod; }
    public void setAuthMethod(String authMethod) { this.authMethod = authMethod; }
    public String getBiometricSignature() { return biometricSignature; }
    public void setBiometricSignature(String biometricSignature) { this.biometricSignature = biometricSignature; }
    public String getBiometricPublicKey() { return biometricPublicKey; }
    public void setBiometricPublicKey(String biometricPublicKey) { this.biometricPublicKey = biometricPublicKey; }
}
