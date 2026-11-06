package com.oism.catalog;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "categories")
@Getter @Setter @NoArgsConstructor
public class Category extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "parent_id") private UUID parentId;
    @Column(nullable = false) private String name;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
