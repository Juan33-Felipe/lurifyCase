package com.iurify.casebackend.infrastructure.controller.dto;

public class RegisterRequestDto extends RegisterRequest {

    public RegisterRequestDto() {
        super();
    }

    public RegisterRequestDto(String fullName, String email, String password) {
        super(fullName, email, password);
    }
}
