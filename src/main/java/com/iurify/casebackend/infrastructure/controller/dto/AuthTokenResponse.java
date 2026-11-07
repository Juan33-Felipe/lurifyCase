package com.iurify.casebackend.infrastructure.controller.dto;

public class AuthTokenResponse extends AuthTokenResponseDto {

    public AuthTokenResponse() {
        super();
    }

    public AuthTokenResponse(String accessToken, String tokenType, long expiresIn) {
        super(accessToken, tokenType, expiresIn);
    }

    public AuthTokenResponse(String accessToken, String tokenType, long expiresIn, UserDto user) {
        super(accessToken, tokenType, expiresIn, user);
    }
}
