package com.oism.branch;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "branches")
@Getter @Setter @NoArgsConstructor
public class Branch extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false) private String code;
    @Column(nullable = false) private String name;
    private String address;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private BranchType type = BranchType.STORE;
    @Column(name = "is_active", nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
