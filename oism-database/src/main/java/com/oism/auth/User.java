package com.oism.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * User KHÔNG dùng @TenantId vì đăng nhập phải tra email/phone xuyên tenant.
 * Mọi truy vấn danh sách user phải lọc tenantId tường minh trong repository.
 */
@Entity @Table(name = "users")
@Getter @Setter @NoArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
    private String email;
    private String phone;
    @Column(name = "password_hash", nullable = false) private String passwordHash;
    @Column(name = "full_name", nullable = false) private String fullName;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private UserStatus status = UserStatus.ACTIVE;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();

    public boolean isActive() { return status == UserStatus.ACTIVE; }
}
