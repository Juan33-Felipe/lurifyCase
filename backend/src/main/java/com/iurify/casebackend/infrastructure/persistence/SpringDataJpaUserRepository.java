package com.iurify.casebackend.infrastructure.persistence;

import com.iurify.casebackend.domain.model.User;
import com.iurify.casebackend.domain.repository.UserRepository;
import com.iurify.casebackend.infrastructure.persistence.entity.AuthMethodEnum;
import com.iurify.casebackend.infrastructure.persistence.entity.UserEntity;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public class SpringDataJpaUserRepository implements UserRepository {

    private final JpaUserRepository jpaRepository;

    public SpringDataJpaUserRepository(JpaUserRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<User> findByEmail(String email) {
        if (email == null) {
            return Optional.empty();
        }
        return jpaRepository.findByEmailIgnoreCase(email.trim()).map(this::toDomain);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public User save(User user) {
        UserEntity entity = toEntity(user);
        UserEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    private User toDomain(UserEntity entity) {
        return new User(
                entity.getId(),
                entity.getEmail(),
                entity.getPasswordHash(),
                entity.getFullName(),
                entity.getBiometricPublicKey(),
                entity.getAuthMethod() != null ? entity.getAuthMethod().name() : "EMAIL",
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private UserEntity toEntity(User user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setEmail(user.getEmail());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setFullName(user.getFullName());
        entity.setBiometricPublicKey(user.getBiometricPublicKey());
        entity.setAuthMethod(AuthMethodEnum.fromDomain(user.getAuthMethod()));
        entity.setCreatedAt(user.getCreatedAt());
        entity.setUpdatedAt(user.getUpdatedAt());
        return entity;
    }
}
