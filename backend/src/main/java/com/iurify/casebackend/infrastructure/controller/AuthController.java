package com.iurify.casebackend.infrastructure.controller;

import com.iurify.casebackend.application.service.AuthService;
import com.iurify.casebackend.domain.model.User;
import com.iurify.casebackend.infrastructure.controller.dto.AuthTokenResponseDto;
import com.iurify.casebackend.infrastructure.controller.dto.LoginRequestDto;
import com.iurify.casebackend.infrastructure.controller.dto.UserDto;
import com.iurify.casebackend.infrastructure.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthTokenResponseDto> login(@RequestBody LoginRequestDto request) {
        User user = authService.authenticate(
                request.getEmail(),
                request.getPassword(),
                request.getBiometricSignature(),
                request.getBiometricPublicKey()
        );
        String token = jwtService.generateToken(user);
        UserDto userDto = new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAuthMethod()
        );
        AuthTokenResponseDto response = new AuthTokenResponseDto(
                token,
                "Bearer",
                jwtService.getExpirationSeconds(),
                userDto
        );
        return ResponseEntity.ok(response);
    }
}
