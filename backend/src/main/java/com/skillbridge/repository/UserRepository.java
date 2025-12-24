package com.skillbridge.repository;

import com.skillbridge.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    java.util.List<User> findByManagerId(UUID managerId);

    java.util.List<User> findAllByManagerId(UUID managerId);

    java.util.List<User> findByRole(com.skillbridge.enums.Role role);
}
