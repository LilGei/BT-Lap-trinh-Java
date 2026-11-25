package com.oism.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** Chỉ lưu SHA-256 của refresh token; token gốc chỉ trả về cho client 1 lần. */
@Entity @Table(name = "refresh_tokens")
@Getter @Setter @NoArgsConstructor
public class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "tenant_id", nullable = false, updatable = false) private UUID tenantId;
    @Column(name = "user_id", nullable = false, updatable = false) private UUID userId;
    @Column(name = "token_hash", nullable = false, unique = true) private String tokenHash;
    @Column(name = "expires_at", nullable = false) private Instant expiresAt;
    @Column(name = "is_revoked", nullable = false) private boolean revoked;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
