package com.iurify.casebackend.infrastructure.controller;

import com.iurify.casebackend.application.service.AuthService;
import com.iurify.casebackend.domain.model.User;
import com.iurify.casebackend.infrastructure.controller.dto.AuthTokenResponse;
import com.iurify.casebackend.infrastructure.controller.dto.AuthTokenResponseDto;
import com.iurify.casebackend.infrastructure.controller.dto.LoginRequestDto;
import com.iurify.casebackend.infrastructure.controller.dto.RegisterRequest;
import com.iurify.casebackend.infrastructure.controller.dto.UserDto;
import com.iurify.casebackend.infrastructure.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final long REGISTRATION_TOKEN_EXPIRATION_SECONDS = 86400L;

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthTokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(
                request.getFullName(),
                request.getEmail(),
                request.getPassword()
        );
        String token = jwtService.generateToken(user, REGISTRATION_TOKEN_EXPIRATION_SECONDS);
        UserDto userDto = new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAuthMethod()
        );
        AuthTokenResponse response = new AuthTokenResponse(
                token,
                "Bearer",
                REGISTRATION_TOKEN_EXPIRATION_SECONDS,
                userDto
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
