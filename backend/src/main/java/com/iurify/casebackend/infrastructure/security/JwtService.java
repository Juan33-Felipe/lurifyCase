package com.iurify.casebackend.infrastructure.security;

import com.iurify.casebackend.domain.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationSeconds;

    public JwtService(
            @Value("${app.security.jwt.secret:iurify-case-ultra-secure-secret-key-2026-hs256-compliant-token-signing-key}") String secret,
            @Value("${app.security.jwt.expiration-seconds:3600}") long expirationSeconds
    ) {
        this.signingKey = deriveKey(secret);
        this.expirationSeconds = expirationSeconds;
    }

    private SecretKey deriveKey(String secret) {
        byte[] rawBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (rawBytes.length >= 32) {
            return Keys.hmacShaKeyFor(rawBytes);
        }
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            return Keys.hmacShaKeyFor(sha256.digest(rawBytes));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to initialize JWT signing key", ex);
        }
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(expirationSeconds);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("fullName", user.getFullName())
                .claim("authMethod", user.getAuthMethod())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public AuthenticatedUser parseAndValidate(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        UUID userId = UUID.fromString(claims.getSubject());
        String email = claims.get("email", String.class);
        String fullName = claims.get("fullName", String.class);
        return new AuthenticatedUser(userId, email, fullName);
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }
}
