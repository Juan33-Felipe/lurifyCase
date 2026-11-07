package com.iurify.casebackend.domain.repository;

import com.iurify.casebackend.domain.model.User;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    Optional<User> findByEmail(String email);
    Optional<User> findById(UUID id);
    User save(User user);

    default boolean existsByEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return findByEmail(email.trim()).isPresent();
    }
}
