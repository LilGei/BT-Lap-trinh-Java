package com.oism.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    @Query("select u from User u where lower(u.email) = lower(:id) or u.phone = :id")
    Optional<User> findByIdentifier(@Param("id") String identifier);

    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);

    /** User không dùng @TenantId nên PHẢI lọc tenant tường minh. */
    List<User> findByTenantIdOrderByFullNameAsc(UUID tenantId);
}
