package com.iurify.casebackend.infrastructure.controller.dto;

public class AuthTokenResponseDto {
    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;
    private UserDto user;

    public AuthTokenResponseDto() {}

    public AuthTokenResponseDto(String accessToken, String tokenType, long expiresIn, UserDto user) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(long expiresIn) { this.expiresIn = expiresIn; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
}
