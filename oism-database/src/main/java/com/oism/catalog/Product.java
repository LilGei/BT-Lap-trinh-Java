package com.oism.catalog;

import com.oism.tenant.TenantAwareEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "products")
@Getter @Setter @NoArgsConstructor
public class Product extends TenantAwareEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "category_id", nullable = false) private UUID categoryId;
    @Column(name = "brand_id") private UUID brandId;
    @Column(nullable = false) private String name;
    private String description;
    @Column(name = "has_variants", nullable = false) private boolean hasVariants;
    @Column(name = "is_active", nullable = false) private boolean active = true;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
